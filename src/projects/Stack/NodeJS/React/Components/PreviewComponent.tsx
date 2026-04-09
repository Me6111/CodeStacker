import React, { useState, useEffect, useRef } from "react";
import PropsEditor, { InputField } from "./PropsEditor";
import CodeEditor from "./CodeEditor";
import Dropdown, { DropdownItem } from "../../../../../components/Dropdown/Dropdown/Dropdown";
import ResponsiveContainer, { ResponsiveStyle } from "./../../../../../components/ResponsiveContainer/ResponsiveContainer";
import ToggleField from "../../../../../components/ToggleField/ToggleField";

interface PreviewComponentProps {
  element: React.ReactElement;
}

interface Rename {
  oldName: string;
  newName: string;
}

interface PropWarning {
  message: string;
  type: string;
  meta?: any;
  fix: () => Record<string, any>;
}

type ColumnDataType = "string" | "number" | "boolean" | "date";

const DATA_TYPES: ColumnDataType[] = ["string", "number", "boolean", "date"];

const outerStyles: ResponsiveStyle[] = [
  { Reference: "Screen", MinSize: { width: "phone" }, Style: { width: "100%", height: "100vh", display: "flex", flexDirection: "column", position: "relative", overflow: "hidden" } },
  { Reference: "Screen", MinSize: { width: "desktop" }, Style: { width: "100%", height: "100vh", display: "flex", flexDirection: "row", position: "relative", overflow: "hidden" } },
];

const previewStyles: ResponsiveStyle[] = [
  { Reference: "Screen", MinSize: { width: "phone" }, Style: { width: "100%", height: "100vh", flex: "none", display: "flex", alignItems: "center", justifyContent: "center", boxSizing: "border-box", overflow: "hidden" } },
  { Reference: "Screen", MinSize: { width: "desktop" }, Style: { flex: 1, minWidth: 0, height: "100vh", display: "flex", alignItems: "center", justifyContent: "center", boxSizing: "border-box", overflow: "hidden" } },
];

const setupStyles: ResponsiveStyle[] = [
  { Reference: "Screen", MinSize: { width: "phone" }, Style: { display: "none" } },
  { Reference: "Screen", MinSize: { width: 480 }, Style: { width: "260px", flexShrink: 0, height: "100vh", display: "flex", flexDirection: "column", boxSizing: "border-box", borderLeft: "1px solid #222", overflow: "hidden" } },
  { Reference: "Screen", MinSize: { width: "desktop" }, Style: { flex: 1, minWidth: 0, maxWidth: "50%", height: "100vh", display: "flex", flexDirection: "column", boxSizing: "border-box", borderLeft: "1px solid #222", overflow: "hidden" } },
];

const mobileOverlayStyles: ResponsiveStyle[] = [
  { Reference: "Screen", MinSize: { width: "phone" }, Style: { position: "fixed", top: 0, left: 0, width: "100%", height: "100vh", backgroundColor: "#0a0a0a", zIndex: 200, display: "flex", flexDirection: "column" } },
  { Reference: "Screen", MinSize: { width: "desktop" }, Style: { display: "none" } },
];

const detectColumnRenames = (oldCols: any[], newCols: any[]): Rename[] => {
  const renames: Rename[] = [];
  const minLen = Math.min(oldCols.length, newCols.length);
  for (let i = 0; i < minLen; i++) {
    const oldName = oldCols[i]?.columnName;
    const newName = newCols[i]?.columnName;
    if (oldName && newName && oldName !== newName) renames.push({ oldName, newName });
  }
  return renames;
};

const applyRowRenames = (rows: any[], renames: Rename[]): any[] =>
  rows.map(row => Object.fromEntries(
    Object.entries(row).map(([k, v]) => {
      const rename = renames.find(r => r.oldName === k);
      return rename ? [rename.newName, v] : [k, v];
    })
  ));

const modalStyle: React.CSSProperties = {
  position: "fixed", top: "50%", left: "50%", transform: "translate(-50%, -50%)",
  zIndex: 9999, width: "min(420px, 92vw)", backgroundColor: "#0f0f0f",
  border: "1px solid #333", borderRadius: "8px", padding: "20px 24px",
  boxShadow: "0 8px 40px rgba(0,0,0,0.7)", fontFamily: "monospace",
};

const backdropStyle: React.CSSProperties = {
  position: "fixed", inset: 0, zIndex: 9998, backgroundColor: "rgba(0,0,0,0.5)",
};

const inputStyle: React.CSSProperties = {
  width: "100%", padding: "7px 10px", backgroundColor: "#111",
  border: "1px solid #333", borderRadius: "4px", color: "#fff",
  fontFamily: "monospace", fontSize: "13px", boxSizing: "border-box", outline: "none",
};

const btnPrimary: React.CSSProperties = {
  flex: 1, padding: "7px", backgroundColor: "#1e3a1e", color: "#4caf50",
  border: "1px solid #2e5a2e", borderRadius: "4px", cursor: "pointer",
  fontSize: "12px", fontFamily: "monospace", fontWeight: 600,
};

const btnSecondary: React.CSSProperties = {
  flex: 1, padding: "7px", backgroundColor: "#1a1a1a", color: "#aaa",
  border: "1px solid #333", borderRadius: "4px", cursor: "pointer",
  fontSize: "12px", fontFamily: "monospace",
};

const btnDanger: React.CSSProperties = {
  flex: 1, padding: "7px", backgroundColor: "#3a1e1e", color: "#f44336",
  border: "1px solid #5a2e2e", borderRadius: "4px", cursor: "pointer",
  fontSize: "12px", fontFamily: "monospace",
};

const PreviewComponent: React.FC<PreviewComponentProps> = ({ element }) => {
  const compTypeRef = useRef<React.ComponentType<any> | null>(null);
  const validateRef = useRef<((props: any) => PropWarning[]) | null>(null);
  const propsValuesRef = useRef<Record<string, any> | null>(null);

  const [compReady, setCompReady] = useState(false);
  const [propsValues, setPropsValues] = useState<Record<string, any> | null>(null);
  const [meta, setMeta] = useState<{ options: Record<string, any[]>; numbers: string[]; codeProps: string[] }>({ options: {}, numbers: [], codeProps: [] });
  const [compName, setCompName] = useState<string>("");
  const [showCode, setShowCode] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [renderKey, setRenderKey] = useState(0);

  const [pendingRenames, setPendingRenames] = useState<Rename[]>([]);
  const [pendingNewCols, setPendingNewCols] = useState<any[] | null>(null);

  const [orphanFields, setOrphanFields] = useState<string[]>([]);
  const [addColumnDialog, setAddColumnDialog] = useState<{ name: string; dataType: ColumnDataType } | null>(null);
  const [addRowDialog, setAddRowDialog] = useState(false);
  const [newRowData, setNewRowData] = useState<Record<string, string>>({});

  const [propWarnings, setPropWarnings] = useState<PropWarning[]>([]);

  useEffect(() => {
    compTypeRef.current = null;
    validateRef.current = null;
    propsValuesRef.current = null;
    setCompReady(false);
    setPropsValues(null);
    setMeta({ options: {}, numbers: [], codeProps: [] });
    setCompName("");
    setRenderKey(0);
    setPropWarnings([]);

    const type = element.type as any;
    const tryLoad = () => {
      const mod = type?._payload?._result;
      if (!mod) { setTimeout(tryLoad, 50); return; }

      const name = mod.default?.name ?? "";
      const lower = name.toLowerCase();
      const defaults: Record<string, any> = mod[`${lower}DefaultProps`] ?? {};
      const propKeys: string[] = mod[`${lower}PropKeys`] ?? Object.keys(defaults);
      const options: Record<string, any[]> = mod[`${lower}PropOptions`] ?? {};
      const numbers: string[] = (mod[`${lower}NumberProps`] ?? []).map(String);
      const codeProps: string[] = (mod[`${lower}CodeProps`] ?? []).map(String);
      const validateProps = mod[`${lower}ValidateProps`] ?? null;

      const allProps: Record<string, any> = {};
      for (const key of propKeys) allProps[key] = key in defaults ? defaults[key] : undefined;

      compTypeRef.current = mod.default;
      validateRef.current = validateProps;
      propsValuesRef.current = allProps;
      setCompName(name);
      setPropsValues(allProps);
      setMeta({ options, numbers, codeProps });
      setCompReady(true);
    };
    tryLoad();
  }, [element.type]);

  const applyProps = (updates: Record<string, any>) => {
    setPropsValues(prev => {
      const next = { ...prev, ...updates };
      propsValuesRef.current = next;
      if (validateRef.current) {
        const warnings = validateRef.current(next);
        setPropWarnings(warnings);
        const orphanWarning = warnings.find(w => w.type === "orphan_row_fields");
        if (orphanWarning?.meta?.orphanFields?.length > 0) setOrphanFields(orphanWarning.meta.orphanFields);
      }
      return next;
    });
    setRenderKey(k => k + 1);
  };

  const makeSetter = (name: string) => (v: any) => {
    if (name === "columns" && Array.isArray(v)) {
      const current = propsValuesRef.current;
      if (current) {
        const oldCols = current.columns;
        const rows = current.rows;
        if (Array.isArray(oldCols) && Array.isArray(rows)) {
          const renames = detectColumnRenames(oldCols, v);
          const affectedRenames = renames.filter(({ oldName }) => rows.some((row: any) => oldName in row));
          if (affectedRenames.length > 0) {
            setPendingRenames(affectedRenames);
            setPendingNewCols(v);
            return;
          }
        }
      }
    }
    applyProps({ [name]: v });
  };

  const confirmRenameRows = () => {
    const current = propsValuesRef.current;
    if (!current || !pendingNewCols) return;
    const updatedRows = applyRowRenames(current.rows, pendingRenames);
    applyProps({ columns: pendingNewCols, rows: updatedRows });
    setPendingRenames([]);
    setPendingNewCols(null);
  };

  const dismissRename = () => { setPendingRenames([]); setPendingNewCols(null); };

  const handleOrphanYes = () => {
    if (orphanFields.length === 0) return;
    setAddColumnDialog({ name: orphanFields[0], dataType: "string" });
    setOrphanFields([]);
  };

  const handleOrphanNo = () => {
    const current = propsValuesRef.current;
    if (!current) return;
    const fields = orphanFields;
    const updatedRows = current.rows.map((row: any) => {
      const updated = { ...row };
      for (const f of fields) delete updated[f];
      return updated;
    });
    applyProps({ rows: updatedRows });
    setOrphanFields([]);
  };

  const confirmAddColumn = () => {
    if (!addColumnDialog) return;
    const current = propsValuesRef.current;
    if (!current) return;
    const newCol = { columnName: addColumnDialog.name, dataType: addColumnDialog.dataType, sortable: true };
    applyProps({ columns: [...(current.columns ?? []), newCol] });
    setAddColumnDialog(null);
  };

  const openAddRowDialog = () => {
    const current = propsValuesRef.current;
    if (!current) return;
    const empty: Record<string, string> = {};
    for (const col of (current.columns ?? [])) empty[col.columnName] = "";
    setNewRowData(empty);
    setAddRowDialog(true);
  };

  const confirmAddRow = () => {
    const current = propsValuesRef.current;
    if (!current) return;
    applyProps({ rows: [...(current.rows ?? []), newRowData] });
    setAddRowDialog(false);
  };

  const openAddColumnDialog = () => setAddColumnDialog({ name: "", dataType: "string" });

  const setPropsFromCode = (parsed: Record<string, any>) => applyProps(parsed);

  const fields: InputField<any>[] = propsValues
    ? Object.entries(propsValues).map(([name, value]) => ({
        name, value,
        setter: makeSetter(name),
        options: meta.options[name],
        isNumber: meta.numbers.includes(name),
        isCode: meta.codeProps.includes(name),
      }))
    : [];

  const toolbar = (onClose?: () => void) => (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 16px", borderBottom: "1px solid #222", flexShrink: 0 }}>
      <button onClick={() => setShowCode(v => !v)} style={{ padding: "4px 14px", backgroundColor: showCode ? "#fff" : "#1a1a1a", color: showCode ? "#000" : "#aaa", border: "1px solid #333", borderRadius: "4px", cursor: "pointer", fontSize: "12px", fontFamily: "monospace", userSelect: "none" }}>
        {showCode ? "Props" : "Code"}
      </button>
      {onClose && (
        <button onClick={onClose} style={{ width: 28, height: 28, backgroundColor: "transparent", border: "1px solid #333", borderRadius: "4px", cursor: "pointer", color: "#aaa", fontSize: 18, lineHeight: 1, display: "flex", alignItems: "center", justifyContent: "center" }}>×</button>
      )}
    </div>
  );

  const makeDataTypeDropdown = (value: ColumnDataType, onChange: (v: ColumnDataType) => void) => {
    const triggerItem: DropdownItem = {
      label: value,
      element: (
        <div style={{ ...inputStyle, cursor: "pointer", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span>{value}</span>
          <span style={{ color: "#555", fontSize: "10px" }}>▾</span>
        </div>
      ),
      children: DATA_TYPES.map(t => ({
        label: t,
        onClick: () => onChange(t),
      })),
    };

    return (
      <Dropdown
        triggerItem={triggerItem}
        optionsListPosition="inside"
        OpenMenu={["click"]}
        CloseMenu={["click_option_again"]}
        AllowMultipleMenusOpened={false}
        RememberOpenedMenus={false}
      />
    );
  };

  const renameDialog = pendingRenames.length > 0 && (
    <>
      <div onClick={dismissRename} style={backdropStyle} />
      <div style={modalStyle}>
        <div style={{ fontSize: "13px", color: "#aaa", marginBottom: "12px", lineHeight: 1.6 }}>
          Column name{pendingRenames.length > 1 ? "s" : ""} changed:
          {pendingRenames.map(({ oldName, newName }) => (
            <div key={oldName} style={{ marginTop: "6px" }}>
              <span style={{ color: "#f44336" }}>{oldName}</span>
              <span style={{ color: "#555", margin: "0 8px" }}>→</span>
              <span style={{ color: "#4caf50" }}>{newName}</span>
            </div>
          ))}
        </div>
        <div style={{ fontSize: "12px", color: "#666", marginBottom: "20px" }}>Update <span style={{ color: "#fff" }}>rows</span> field names to match?</div>
        <div style={{ display: "flex", gap: "10px" }}>
          <button onClick={confirmRenameRows} style={btnPrimary}>yes, update rows</button>
          <button onClick={dismissRename} style={btnSecondary}>no, keep as is</button>
        </div>
      </div>
    </>
  );

  const orphanDialog = orphanFields.length > 0 && (
    <>
      <div onClick={handleOrphanNo} style={backdropStyle} />
      <div style={modalStyle}>
        <div style={{ fontSize: "13px", color: "#aaa", marginBottom: "12px", lineHeight: 1.6 }}>
          Row field{orphanFields.length > 1 ? "s" : ""} not defined in columns:
          {orphanFields.map(f => <div key={f} style={{ marginTop: "6px", color: "#ff9800" }}>"{f}"</div>)}
        </div>
        <div style={{ fontSize: "12px", color: "#666", marginBottom: "20px" }}>Create new column{orphanFields.length > 1 ? "s" : ""} for these fields?</div>
        <div style={{ display: "flex", gap: "10px" }}>
          <button onClick={handleOrphanYes} style={btnPrimary}>yes, add column</button>
          <button onClick={handleOrphanNo} style={btnDanger}>no, remove from rows</button>
        </div>
      </div>
    </>
  );

  const addColumnDialogEl = addColumnDialog && (
    <>
      <div onClick={() => setAddColumnDialog(null)} style={backdropStyle} />
      <div style={modalStyle}>
        <div style={{ fontSize: "13px", color: "#aaa", marginBottom: "16px", fontWeight: 600 }}>add new column</div>
        <div style={{ display: "flex", flexDirection: "column", gap: "12px", marginBottom: "20px" }}>
          <div>
            <div style={{ fontSize: "11px", color: "#555", marginBottom: "5px" }}>column name</div>
            <input
              style={inputStyle}
              value={addColumnDialog.name}
              onChange={e => setAddColumnDialog(d => d ? { ...d, name: e.target.value } : d)}
              placeholder="column name"
              autoFocus
            />
          </div>
          <div>
            <div style={{ fontSize: "11px", color: "#555", marginBottom: "5px" }}>data type</div>
            {makeDataTypeDropdown(addColumnDialog.dataType, v => setAddColumnDialog(d => d ? { ...d, dataType: v } : d))}
          </div>
        </div>
        <div style={{ display: "flex", gap: "10px" }}>
          <button onClick={confirmAddColumn} style={btnPrimary} disabled={!addColumnDialog.name.trim()}>add column</button>
          <button onClick={() => setAddColumnDialog(null)} style={btnSecondary}>cancel</button>
        </div>
      </div>
    </>
  );

  const addRowDialogEl = addRowDialog && (
    <>
      <div onClick={() => setAddRowDialog(false)} style={backdropStyle} />
      <div style={{ ...modalStyle, width: "min(500px, 92vw)" }}>
        <div style={{ fontSize: "13px", color: "#aaa", marginBottom: "16px", fontWeight: 600 }}>add new row</div>
        <div style={{ display: "flex", flexDirection: "column", gap: "10px", marginBottom: "20px", maxHeight: "50vh", overflowY: "auto" }}>
          {Object.keys(newRowData).map(col => (
            <div key={col}>
              <div style={{ fontSize: "11px", color: "#555", marginBottom: "4px" }}>{col}</div>
              <input
                style={inputStyle}
                value={newRowData[col]}
                onChange={e => setNewRowData(d => ({ ...d, [col]: e.target.value }))}
                placeholder={col}
              />
            </div>
          ))}
        </div>
        <div style={{ display: "flex", gap: "10px" }}>
          <button onClick={confirmAddRow} style={btnPrimary}>add row</button>
          <button onClick={() => setAddRowDialog(false)} style={btnSecondary}>cancel</button>
        </div>
      </div>
    </>
  );

  const actionButtons = compReady && (
    <div style={{
      position: "absolute", top: 0, right: 0, zIndex: 100,
      display: "flex", gap: "8px", padding: "8px 12px",
    }}>
      <button onClick={openAddColumnDialog} style={{ padding: "4px 12px", backgroundColor: "#1a1a1a", color: "#aaa", border: "1px solid #333", borderRadius: "4px", cursor: "pointer", fontSize: "11px", fontFamily: "monospace" }}>
        + column
      </button>
      <button onClick={openAddRowDialog} style={{ padding: "4px 12px", backgroundColor: "#1a1a1a", color: "#aaa", border: "1px solid #333", borderRadius: "4px", cursor: "pointer", fontSize: "11px", fontFamily: "monospace" }}>
        + row
      </button>
    </div>
  );

  const warningsBar = propWarnings.filter(w => w.type !== "orphan_row_fields" || orphanFields.length === 0).length > 0 && (
    <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, zIndex: 100, display: "flex", flexDirection: "column", gap: "6px", padding: "10px 16px", background: "#0a0a0a", borderTop: "1px solid #2a1a00" }}>
      {propWarnings.filter(w => w.type !== "orphan_row_fields" || orphanFields.length === 0).map((w, i) => (
        <div key={i} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "12px" }}>
          <span style={{ fontFamily: "monospace", fontSize: "11px", color: "#ff9800" }}>⚠ {w.message}</span>
          <button onClick={() => applyProps(w.fix())} style={{ padding: "2px 10px", backgroundColor: "#1a1200", color: "#ff9800", border: "1px solid #3a2800", borderRadius: "4px", cursor: "pointer", fontSize: "11px", fontFamily: "monospace", whiteSpace: "nowrap", flexShrink: 0 }}>fix</button>
        </div>
      ))}
    </div>
  );

  const editorContent = (
    <div style={{ flex: 1, overflowY: "auto", display: "flex", alignItems: "flex-start", justifyContent: "center", padding: "20px 16px", boxSizing: "border-box" }}>
      {showCode
        ? <CodeEditor componentName={compName} props={propsValues ?? {}} setProps={setPropsFromCode} propOptions={meta.options} />
        : <PropsEditor fields={fields} />
      }
    </div>
  );

  const CompType = compTypeRef.current;

  return (
    <div className="PreviewComponent" style={{ width: "100%", height: "100vh", position: "relative" }}>
      {renameDialog}
      {orphanDialog}
      {addColumnDialogEl}
      {addRowDialogEl}
      <ResponsiveContainer className="PreviewComponentOuter" ResponsiveStyles={outerStyles}>
        <ResponsiveContainer className="RenderedComponentPreview" ResponsiveStyles={previewStyles} style={{ position: "relative" }}>
          {compReady && CompType && propsValues
            ? <CompType key={renderKey} {...propsValues} />
            : element}
          {actionButtons}
          {warningsBar}
        </ResponsiveContainer>

        {fields.length > 0 && (
          <ResponsiveContainer className="ComponentSetup" ResponsiveStyles={setupStyles}>
            {toolbar()}
            {editorContent}
          </ResponsiveContainer>
        )}
      </ResponsiveContainer>

      {fields.length > 0 && (
        <ToggleField
          hideOnDesktop
          isOpen={mobileOpen}
          onOpen={() => setMobileOpen(true)}
          onClose={() => setMobileOpen(false)}
          closeOnBlur={false}
          buttonStyle={{
            position: "fixed", bottom: 20, right: 20, width: "auto", height: "auto",
            padding: "8px 16px", borderRadius: "6px", backgroundColor: "#1a1a1a",
            color: "#fff", border: "1px solid #444", fontSize: "13px", fontFamily: "monospace", zIndex: 100,
          }}
          FieldContent={
            <ResponsiveContainer ResponsiveStyles={mobileOverlayStyles}>
              {toolbar(() => setMobileOpen(false))}
              {editorContent}
            </ResponsiveContainer>
          }
        />
      )}
    </div>
  );
};

export default PreviewComponent;