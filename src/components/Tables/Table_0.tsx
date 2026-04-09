import React, { useState } from "react";

export type TableVariant = "minimal" | "striped" | "bordered" | "ghost";
export type TableSize = "sm" | "md" | "lg";
export type SortDirection = "asc" | "desc" | null;

export interface TableColumn {
  key: string;
  label: string;
  sortable?: boolean;
  width?: string;
  align?: "left" | "center" | "right";
}

export interface TableRow {
  [key: string]: any;
}

export interface Props {
  variant?: TableVariant;
  size?: TableSize;
  sortable?: boolean;
  hoverable?: boolean;
  stickyHeader?: boolean;
  showIndex?: boolean;
  caption?: string;
}

export const tablePropKeys: (keyof Props)[] = [
  "variant",
  "size",
  "sortable",
  "hoverable",
  "stickyHeader",
  "showIndex",
  "caption",
];

export const tableDefaultProps: Props = {
  variant: "minimal",
  size: "md",
  sortable: true,
  hoverable: true,
  stickyHeader: false,
  showIndex: false,
  caption: "",
};

export const tablePropOptions: Partial<Record<keyof Props, any[]>> = {
  variant: ["minimal", "striped", "bordered", "ghost"],
  size: ["sm", "md", "lg"],
};

const defaultColumns: TableColumn[] = [
  { key: "name", label: "Name", sortable: true },
  { key: "role", label: "Role", sortable: true },
  { key: "status", label: "Status", sortable: true, align: "center" },
  { key: "joined", label: "Joined", sortable: true, align: "right" },
];

const defaultRows: TableRow[] = [
  { name: "Alice Mercer", role: "Engineer", status: "Active", joined: "2021-03" },
  { name: "Bruno Hale", role: "Designer", status: "Active", joined: "2022-07" },
  { name: "Clara Song", role: "Product", status: "Away", joined: "2020-11" },
  { name: "David Park", role: "Engineer", status: "Inactive", joined: "2023-01" },
  { name: "Elena Voss", role: "Marketing", status: "Active", joined: "2021-09" },
];

const statusColors: Record<string, string> = {
  Active: "#4caf50",
  Away: "#ff9800",
  Inactive: "#f44336",
};

type TableProps = Props & {
  columns?: TableColumn[];
  rows?: TableRow[];
};

const sizeMap = {
  sm: { padding: "6px 12px", fontSize: "12px", headerSize: "11px" },
  md: { padding: "10px 16px", fontSize: "14px", headerSize: "12px" },
  lg: { padding: "14px 20px", fontSize: "15px", headerSize: "13px" },
};

const Table: React.FC<TableProps> = ({
  variant = "minimal",
  size = "md",
  sortable = true,
  hoverable = true,
  stickyHeader = false,
  showIndex = false,
  caption = "",
  columns = defaultColumns,
  rows = defaultRows,
}) => {
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortDir, setSortDir] = useState<SortDirection>(null);
  const [hovered, setHovered] = useState<number | null>(null);

  const sz = sizeMap[size];

  const handleSort = (key: string) => {
    if (!sortable) return;
    if (sortKey === key) {
      setSortDir(d => d === "asc" ? "desc" : d === "desc" ? null : "asc");
      if (sortDir === "desc") setSortKey(null);
    } else {
      setSortKey(key);
      setSortDir("asc");
    }
  };

  const sortedRows = [...rows].sort((a, b) => {
    if (!sortKey || !sortDir) return 0;
    const av = String(a[sortKey] ?? "");
    const bv = String(b[sortKey] ?? "");
    return sortDir === "asc" ? av.localeCompare(bv) : bv.localeCompare(av);
  });

  const getBg = (i: number) => {
    if (variant === "striped") return i % 2 === 0 ? "#0f0f0f" : "#161616";
    return "transparent";
  };

  const getHoverBg = () => {
    if (!hoverable) return undefined;
    return "#1e1e1e";
  };

  const headerBorder = variant === "bordered" ? "1px solid #2a2a2a" : undefined;
  const cellBorder = variant === "bordered" ? "1px solid #1e1e1e" : undefined;
  const tableOutline = variant === "ghost" ? "none" : "1px solid #1e1e1e";

  return (
    <div style={{
      width: "100%",
      border: tableOutline,
      borderRadius: "8px",
      overflow: "hidden",
      fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
      background: "#0a0a0a",
    }}>
      {caption && (
        <div style={{
          padding: "10px 16px",
          fontSize: "11px",
          textTransform: "uppercase",
          letterSpacing: "0.12em",
          color: "#555",
          borderBottom: "1px solid #1a1a1a",
        }}>
          {caption}
        </div>
      )}

      <div style={{ overflowX: "auto", width: "100%" }}>
        <table style={{
          width: "100%",
          borderCollapse: "collapse",
          tableLayout: "auto",
        }}>
          <thead style={{
            position: stickyHeader ? "sticky" : undefined,
            top: stickyHeader ? 0 : undefined,
            zIndex: stickyHeader ? 10 : undefined,
            background: "#0a0a0a",
          }}>
            <tr style={{ borderBottom: "1px solid #222" }}>
              {showIndex && (
                <th style={{
                  padding: sz.padding,
                  fontSize: sz.headerSize,
                  fontWeight: 600,
                  textAlign: "center",
                  color: "#444",
                  letterSpacing: "0.08em",
                  textTransform: "uppercase",
                  border: headerBorder,
                  width: "40px",
                  userSelect: "none",
                }}>
                  #
                </th>
              )}
              {columns.map(col => (
                <th
                  key={col.key}
                  onClick={() => col.sortable !== false && handleSort(col.key)}
                  style={{
                    padding: sz.padding,
                    fontSize: sz.headerSize,
                    fontWeight: 600,
                    textAlign: col.align ?? "left",
                    color: sortKey === col.key ? "#fff" : "#555",
                    letterSpacing: "0.08em",
                    textTransform: "uppercase",
                    cursor: sortable && col.sortable !== false ? "pointer" : "default",
                    userSelect: "none",
                    border: headerBorder,
                    width: col.width,
                    whiteSpace: "nowrap",
                    transition: "color 0.15s",
                  }}
                >
                  <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
                    {col.label}
                    {sortable && col.sortable !== false && (
                      <span style={{ color: sortKey === col.key ? "#fff" : "#333", fontSize: "10px" }}>
                        {sortKey === col.key && sortDir === "asc" ? "↑" : sortKey === col.key && sortDir === "desc" ? "↓" : "↕"}
                      </span>
                    )}
                  </span>
                </th>
              ))}
            </tr>
          </thead>

          <tbody>
            {sortedRows.map((row, i) => (
              <tr
                key={i}
                onMouseEnter={() => setHovered(i)}
                onMouseLeave={() => setHovered(null)}
                style={{
                  background: hovered === i ? getHoverBg() : getBg(i),
                  borderBottom: i < sortedRows.length - 1 ? "1px solid #111" : "none",
                  transition: "background 0.12s",
                }}
              >
                {showIndex && (
                  <td style={{
                    padding: sz.padding,
                    fontSize: sz.fontSize,
                    textAlign: "center",
                    color: "#333",
                    border: cellBorder,
                  }}>
                    {i + 1}
                  </td>
                )}
                {columns.map(col => {
                  const val = row[col.key];
                  const isStatus = col.key === "status" && statusColors[val];
                  return (
                    <td
                      key={col.key}
                      style={{
                        padding: sz.padding,
                        fontSize: sz.fontSize,
                        textAlign: col.align ?? "left",
                        color: "#aaa",
                        border: cellBorder,
                        whiteSpace: "nowrap",
                      }}
                    >
                      {isStatus ? (
                        <span style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: 6,
                          color: statusColors[val],
                          fontSize: sz.fontSize,
                        }}>
                          <span style={{
                            width: 6,
                            height: 6,
                            borderRadius: "50%",
                            backgroundColor: statusColors[val],
                            flexShrink: 0,
                          }} />
                          {val}
                        </span>
                      ) : (
                        String(val ?? "—")
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div style={{
        padding: "8px 16px",
        fontSize: "11px",
        color: "#333",
        borderTop: "1px solid #111",
        display: "flex",
        justifyContent: "flex-end",
        fontFamily: "monospace",
      }}>
        {sortedRows.length} rows
      </div>
    </div>
  );
};

export default Table;