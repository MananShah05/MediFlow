import React from "react";

export interface Column<T> {
  header: string;
  accessor: keyof T | ((row: T) => React.ReactNode);
  className?: string;
}

interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  emptyMessage?: string;
  onRowClick?: (row: T) => void;
  isLoading?: boolean;
}

export function DataTable<T>({
  columns,
  data,
  emptyMessage = "No records found.",
  onRowClick,
  isLoading = false,
}: DataTableProps<T>) {
  if (isLoading) {
    return (
      <div className="w-full space-y-3">
        <div className="h-10 w-full bg-bg-subtle rounded-lg animate-pulse" />
        <div className="h-16 w-full bg-bg-subtle/50 rounded-lg animate-pulse" />
        <div className="h-16 w-full bg-bg-subtle/50 rounded-lg animate-pulse" />
        <div className="h-16 w-full bg-bg-subtle/50 rounded-lg animate-pulse" />
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center bg-bg-surface border border-border border-dashed rounded-xl">
        <p className="text-text-secondary text-sm font-medium">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className="w-full overflow-x-auto rounded-xl border border-border bg-bg-surface shadow-md">
      <table className="w-full border-collapse text-left text-sm">
        <thead>
          <tr className="border-b border-border bg-bg-subtle/40 text-text-secondary font-medium">
            {columns.map((col, idx) => (
              <th key={idx} className={`px-6 py-4 font-semibold tracking-wide ${col.className || ""}`}>
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-border/60">
          {data.map((row, rowIdx) => (
            <tr
              key={rowIdx}
              onClick={() => onRowClick?.(row)}
              className={`text-text-primary transition-colors ${
                onRowClick ? "cursor-pointer hover:bg-bg-subtle/40" : "hover:bg-bg-subtle/20"
              }`}
            >
              {columns.map((col, colIdx) => {
                let cellContent: React.ReactNode;
                if (typeof col.accessor === "function") {
                  cellContent = col.accessor(row);
                } else {
                  const val = row[col.accessor];
                  cellContent = val !== null && val !== undefined ? String(val) : "—";
                }
                return (
                  <td key={colIdx} className={`px-6 py-4 ${col.className || ""}`}>
                    {cellContent}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
