import React from "react";

export interface Props {
  value?: number;
  min?: number;
  max?: number;
  step?: number;
}

export const adjuster_numberPropKeys: (keyof Props)[] = ["value", "min", "max", "step"];

export const adjuster_numberDefaultProps: Props = {
  value: 0,
  step: 1,
};

export const adjuster_numberNumberProps: (keyof Props)[] = ["value", "min", "max", "step"];

const baseInputStyle: React.CSSProperties = {
  width: "100%",
  minWidth: 0,
  padding: "6px 8px",
  borderRadius: "4px",
  border: "1px solid #333",
  backgroundColor: "#111",
  color: "#fff",
  fontSize: "14px",
  boxSizing: "border-box",
  textAlign: "center",
};

const btnStyle: React.CSSProperties = {
  flexShrink: 0,
  width: "24px",
  height: "28px",
  backgroundColor: "#222",
  border: "1px solid #333",
  color: "#fff",
  borderRadius: "4px",
  cursor: "pointer",
  fontSize: "14px",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
};

const Adjuster_Number: React.FC<Props & { setter?: (v: number) => void }> = ({
  value = 0,
  setter,
  min,
  max,
  step = 1,
}) => {
  const [internal, setInternal] = React.useState<number>(value);

  React.useEffect(() => {
    setInternal(value);
  }, [value]);

  const update = (v: number) => {
    setInternal(v);
    setter?.(v);
  };

  return (
    <div style={{ display: "flex", alignItems: "center", gap: "4px", width: "100%" }}>
      <button onClick={() => update(Number(((internal ?? 0) - step).toFixed(10)))} style={btnStyle}>−</button>
      <input
        type="number"
        value={internal ?? ""}
        min={min}
        max={max}
        step={step}
        onChange={(e) => update(e.target.value === "" ? 0 : Number(e.target.value))}
        style={baseInputStyle}
      />
      <button onClick={() => update(Number(((internal ?? 0) + step).toFixed(10)))} style={btnStyle}>+</button>
    </div>
  );
};

export default Adjuster_Number;