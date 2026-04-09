import React, { useState } from "react";

export type TableVariant = "minimal" | "striped" | "bordered" | "ghost";
export type TableSize = "sm" | "md" | "lg";
export type SortDirection = "asc" | "desc" | null;
export type ColumnDataType = "string" | "number" | "boolean" | "date";

export interface TableColumn {
  columnName: string;
  dataType?: ColumnDataType;
  sortable?: boolean;
  width?: string;
  align?: "left" | "center" | "right";
}

export interface TableRow {
  [columnName: string]: any;
}

export interface Props {
  variant?: TableVariant;
  size?: TableSize;
  sortable?: boolean;
  hoverable?: boolean;
  stickyHeader?: boolean;
  showIndex?: boolean;
  addRowButton?: boolean;
  addColumnButton?: boolean;
  caption?: string;
  columns?: TableColumn[];
  rows?: TableRow[];
}

export interface PropWarning {
  message: string;
  type: "orphan_row_fields" | "orphan_col_names" | "other";
  meta?: any;
  fix: () => Record<string, any>;
}

export const tablePropKeys: (keyof Props)[] = [
  "variant", "size", "sortable", "hoverable", "stickyHeader",
  "showIndex", "addRowButton", "addColumnButton", "caption", "columns", "rows",
];

export const tableCodeProps: (keyof Props)[] = ["columns", "rows"];

export const tableDefaultProps: Props = {
  variant: "minimal",
  size: "md",
  sortable: true,
  hoverable: true,
  stickyHeader: false,
  showIndex: false,
  addRowButton: false,
  addColumnButton: false,
  caption: "",
  columns: [
    { columnName: "name", dataType: "string", sortable: true },
    { columnName: "role", dataType: "string", sortable: true },
    { columnName: "status", dataType: "string", sortable: true, align: "center" },
    { columnName: "joined", dataType: "string", sortable: true, align: "right" },
  ],
  rows: [
    { name: "Alice Mercer", role: "Engineer", status: "Active", joined: "2021-03" },
    { name: "Bruno Hale", role: "Designer", status: "Active", joined: "2022-07" },
    { name: "Clara Song", role: "Product", status: "Away", joined: "2020-11" },
    { name: "David Park", role: "Engineer", status: "Inactive", joined: "2023-01" },
    { name: "Elena Voss", role: "Marketing", status: "Active", joined: "2021-09" },
  ],
};

export const tablePropOptions: Partial<Record<keyof Props, any[]>> = {
  variant: ["minimal", "striped", "bordered", "ghost"],
  size: ["sm", "md", "lg"],
};

export const tableValidateProps = (props: Props): PropWarning[] => {
  const warnings: PropWarning[] = [];
  const columns = props.columns ?? [];
  const rows = props.rows ?? [];

  const colNames = new Set(columns.map(c => c.columnName));
  const rowKeys = new Set(rows.flatMap(r => Object.keys(r)));

  const orphanRowFields = [...rowKeys].filter(k => !colNames.has(k));
  if (orphanRowFields.length > 0) {
    warnings.push({
      message: `Rows have fields not defined in columns: ${orphanRowFields.map(k => `"${k}"`).join(", ")}`,
      type: "orphan_row_fields",
      meta: { orphanFields: orphanRowFields },
      fix: () => ({
        columns: [
          ...columns,
          ...orphanRowFields.map(k => ({ columnName: k, dataType: "string" as ColumnDataType, sortable: true })),
        ],
      }),
    });
  }

  const orphanColNames = [...colNames].filter(k => !rowKeys.has(k));
  if (orphanColNames.length > 0) {
    warnings.push({
      message: `Columns reference names not found in any row: ${orphanColNames.map(k => `"${k}"`).join(", ")}`,
      type: "orphan_col_names",
      meta: { orphanCols: orphanColNames },
      fix: () => ({
        rows: rows.map(row => {
          const updated = { ...row };
          for (const k of orphanColNames) {
            if (!(k in updated)) updated[k] = "";
          }
          return updated;
        }),
      }),
    });
  }

  return warnings;
};

const DATA_TYPES: ColumnDataType[] = ["string", "number", "boolean", "date"];

const statusColors: Record<string, string> = {
  Active: "#4caf50",
  Away: "#ff9800",
  Inactive: "#f44336",
};

const sizeMap = {
  sm: { padding: "6px 12px", fontSize: "12px", headerSize: "11px" },
  md: { padding: "10px 16px", fontSize: "14px", headerSize: "12px" },
  lg: { padding: "14px 20px", fontSize: "15px", headerSize: "13px" },
};

const inputStyle: React.CSSProperties = {
  width: "100%", padding: "7px 10px", backgroundColor: "#111",
  border: "1px solid #333", borderRadius: "4px", color: "#fff",
  fontFamily: "monospace", fontSize: "13px", boxSizing: "border-box", outline: "none",
};

const modalStyle: React.CSSProperties = {
  position: "fixed", top: "50%", left: "50%", transform: "translate(-50%, -50%)",
  zIndex: 9999, width: "min(420px, 92vw)", backgroundColor: "#0f0f0f",
  border: "1px solid #333", borderRadius: "8px", padding: "20px 24px",
  boxShadow: "0 8px 40px rgba(0,0,0,0.7)", fontFamily: "monospace",
};

const backdropStyle: React.CSSProperties = {
  position: "fixed", inset: 0, zIndex: 9998, backgroundColor: "rgba(0,0,0,0.5)",
};

const Table: React.FC<Props> = ({
  variant = "minimal",
  size = "md",
  sortable = true,
  hoverable = true,
  stickyHeader = false,
  showIndex = false,
  addRowButton = false,
  addColumnButton = false,
  caption = "",
  columns = tableDefaultProps.columns!,
  rows = tableDefaultProps.rows!,
}) => {
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortDir, setSortDir] = useState<SortDirection>(null);
  const [hovered, setHovered] = useState<number | null>(null);
  const [localColumns, setLocalColumns] = useState<TableColumn[]>(columns);
  const [localRows, setLocalRows] = useState<TableRow[]>(rows);
  const [showAddRow, setShowAddRow] = useState(false);
  const [showAddColumn, setShowAddColumn] = useState(false);
  const [newRowData, setNewRowData] = useState<Record<string, string>>({});
  const [newColName, setNewColName] = useState("");
  const [newColType, setNewColType] = useState<ColumnDataType>("string");

  const sz = sizeMap[size];

  const handleSort = (columnName: string) => {
    if (!sortable) return;
    if (sortKey === columnName) {
      setSortDir(d => d === "asc" ? "desc" : d === "desc" ? null : "asc");
      if (sortDir === "desc") setSortKey(null);
    } else {
      setSortKey(columnName);
      setSortDir("asc");
    }
  };

  const sortedRows = [...localRows].sort((a, b) => {
    if (!sortKey || !sortDir) return 0;
    const av = String(a[sortKey] ?? "");
    const bv = String(b[sortKey] ?? "");
    return sortDir === "asc" ? av.localeCompare(bv) : bv.localeCompare(av);
  });

  const getBg = (i: number) => variant === "striped" ? (i % 2 === 0 ? "#0f0f0f" : "#161616") : "transparent";
  const getHoverBg = () => hoverable ? "#1e1e1e" : undefined;
  const headerBorder = variant === "bordered" ? "1px solid #2a2a2a" : undefined;
  const cellBorder = variant === "bordered" ? "1px solid #1e1e1e" : undefined;
  const tableOutline = variant === "ghost" ? "none" : "1px solid #1e1e1e";

  const openAddRow = () => {
    const empty: Record<string, string> = {};
    for (const col of localColumns) empty[col.columnName] = "";
    setNewRowData(empty);
    setShowAddRow(true);
  };

  const confirmAddRow = () => {
    setLocalRows(r => [...r, { ...newRowData }]);
    setShowAddRow(false);
  };

  const confirmAddColumn = () => {
    if (!newColName.trim()) return;
    setLocalColumns(c => [...c, { columnName: newColName.trim(), dataType: newColType, sortable: true }]);
    setLocalRows(r => r.map(row => ({ ...row, [newColName.trim()]: "" })));
    setNewColName("");
    setNewColType("string");
    setShowAddColumn(false);
  };

  return (
    <>
      {showAddRow && (
        <>
          <div onClick={() => setShowAddRow(false)} style={backdropStyle} />
          <div style={{ ...modalStyle, width: "min(500px, 92vw)" }}>
            <div style={{ fontSize: "13px", color: "#aaa", marginBottom: "16px", fontWeight: 600 }}>add new row</div>
            <div style={{ display: "flex", flexDirection: "column", gap: "10px", marginBottom: "20px", maxHeight: "50vh", overflowY: "auto" }}>
              {localColumns.map(col => (
                <div key={col.columnName}>
                  <div style={{ fontSize: "11px", color: "#555", marginBottom: "4px" }}>{col.columnName} <span style={{ color: "#333" }}>{col.dataType}</span></div>
                  <input style={inputStyle} value={newRowData[col.columnName] ?? ""} onChange={e => setNewRowData(d => ({ ...d, [col.columnName]: e.target.value }))} placeholder={col.columnName} />
                </div>
              ))}
            </div>
            <div style={{ display: "flex", gap: "10px" }}>
              <button onClick={confirmAddRow} style={{ flex: 1, padding: "7px", backgroundColor: "#1e3a1e", color: "#4caf50", border: "1px solid #2e5a2e", borderRadius: "4px", cursor: "pointer", fontSize: "12px", fontFamily: "monospace", fontWeight: 600 }}>add row</button>
              <button onClick={() => setShowAddRow(false)} style={{ flex: 1, padding: "7px", backgroundColor: "#1a1a1a", color: "#aaa", border: "1px solid #333", borderRadius: "4px", cursor: "pointer", fontSize: "12px", fontFamily: "monospace" }}>cancel</button>
            </div>
          </div>
        </>
      )}

      {showAddColumn && (
        <>
          <div onClick={() => setShowAddColumn(false)} style={backdropStyle} />
          <div style={modalStyle}>
            <div style={{ fontSize: "13px", color: "#aaa", marginBottom: "16px", fontWeight: 600 }}>add new column</div>
            <div style={{ display: "flex", flexDirection: "column", gap: "12px", marginBottom: "20px" }}>
              <div>
                <div style={{ fontSize: "11px", color: "#555", marginBottom: "5px" }}>column name</div>
                <input style={inputStyle} value={newColName} onChange={e => setNewColName(e.target.value)} placeholder="column name" autoFocus />
              </div>
              <div>
                <div style={{ fontSize: "11px", color: "#555", marginBottom: "5px" }}>data type</div>
                <select value={newColType} onChange={e => setNewColType(e.target.value as ColumnDataType)} style={{ ...inputStyle, cursor: "pointer" }}>
                  {DATA_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
            </div>
            <div style={{ display: "flex", gap: "10px" }}>
              <button onClick={confirmAddColumn} disabled={!newColName.trim()} style={{ flex: 1, padding: "7px", backgroundColor: "#1e3a1e", color: "#4caf50", border: "1px solid #2e5a2e", borderRadius: "4px", cursor: "pointer", fontSize: "12px", fontFamily: "monospace", fontWeight: 600 }}>add column</button>
              <button onClick={() => setShowAddColumn(false)} style={{ flex: 1, padding: "7px", backgroundColor: "#1a1a1a", color: "#aaa", border: "1px solid #333", borderRadius: "4px", cursor: "pointer", fontSize: "12px", fontFamily: "monospace" }}>cancel</button>
            </div>
          </div>
        </>
      )}

      <div style={{ width: "100%", border: tableOutline, borderRadius: "8px", overflow: "hidden", fontFamily: "'JetBrains Mono', 'Fira Code', monospace", background: "#0a0a0a" }}>
        {caption && (
          <div style={{ padding: "10px 16px", fontSize: "11px", textTransform: "uppercase", letterSpacing: "0.12em", color: "#555", borderBottom: "1px solid #1a1a1a" }}>
            {caption}
          </div>
        )}

        <div style={{ overflowX: "auto", width: "100%" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", tableLayout: "auto" }}>
            <thead style={{ position: stickyHeader ? "sticky" : undefined, top: stickyHeader ? 0 : undefined, zIndex: stickyHeader ? 10 : undefined, background: "#0a0a0a" }}>
              <tr style={{ borderBottom: "1px solid #222" }}>
                {showIndex && (
                  <th style={{ padding: sz.padding, fontSize: sz.headerSize, fontWeight: 600, textAlign: "center", color: "#444", letterSpacing: "0.08em", textTransform: "uppercase", border: headerBorder, width: "40px", userSelect: "none" }}>#</th>
                )}
                {localColumns.map(col => (
                  <th key={col.columnName} onClick={() => col.sortable !== false && handleSort(col.columnName)} style={{ padding: sz.padding, fontSize: sz.headerSize, fontWeight: 600, textAlign: col.align ?? "left", color: sortKey === col.columnName ? "#fff" : "#555", letterSpacing: "0.08em", textTransform: "uppercase", cursor: sortable && col.sortable !== false ? "pointer" : "default", userSelect: "none", border: headerBorder, width: col.width, whiteSpace: "nowrap", transition: "color 0.15s" }}>
                    <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
                      {col.columnName}
                      {col.dataType && <span style={{ fontSize: "9px", color: "#444", fontWeight: 400 }}>{col.dataType}</span>}
                      {sortable && col.sortable !== false && (
                        <span style={{ color: sortKey === col.columnName ? "#fff" : "#333", fontSize: "10px" }}>
                          {sortKey === col.columnName && sortDir === "asc" ? "↑" : sortKey === col.columnName && sortDir === "desc" ? "↓" : "↕"}
                        </span>
                      )}
                    </span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {sortedRows.map((row, i) => (
                <tr key={i} onMouseEnter={() => setHovered(i)} onMouseLeave={() => setHovered(null)} style={{ background: hovered === i ? getHoverBg() : getBg(i), borderBottom: i < sortedRows.length - 1 ? "1px solid #111" : "none", transition: "background 0.12s" }}>
                  {showIndex && (
                    <td style={{ padding: sz.padding, fontSize: sz.fontSize, textAlign: "center", color: "#333", border: cellBorder }}>{i + 1}</td>
                  )}
                  {localColumns.map(col => {
                    const val = row[col.columnName];
                    const isStatus = col.columnName === "status" && statusColors[val];
                    return (
                      <td key={col.columnName} style={{ padding: sz.padding, fontSize: sz.fontSize, textAlign: col.align ?? "left", color: "#aaa", border: cellBorder, whiteSpace: "nowrap" }}>
                        {isStatus ? (
                          <span style={{ display: "inline-flex", alignItems: "center", gap: 6, color: statusColors[val], fontSize: sz.fontSize }}>
                            <span style={{ width: 6, height: 6, borderRadius: "50%", backgroundColor: statusColors[val], flexShrink: 0 }} />
                            {val}
                          </span>
                        ) : String(val ?? "—")}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div style={{ padding: "8px 16px", fontSize: "11px", color: "#333", borderTop: "1px solid #111", display: "flex", justifyContent: "space-between", alignItems: "center", fontFamily: "monospace" }}>
          <div style={{ display: "flex", gap: "8px" }}>
            {addRowButton && (
              <button onClick={openAddRow} style={{ padding: "2px 10px", backgroundColor: "#1a1a1a", color: "#666", border: "1px solid #2a2a2a", borderRadius: "3px", cursor: "pointer", fontSize: "11px", fontFamily: "monospace" }}>
                + row
              </button>
            )}
            {addColumnButton && (
              <button onClick={() => setShowAddColumn(true)} style={{ padding: "2px 10px", backgroundColor: "#1a1a1a", color: "#666", border: "1px solid #2a2a2a", borderRadius: "3px", cursor: "pointer", fontSize: "11px", fontFamily: "monospace" }}>
                + column
              </button>
            )}
          </div>
          <span>{sortedRows.length} rows</span>
        </div>
      </div>
    </>
  );
};

export default Table;