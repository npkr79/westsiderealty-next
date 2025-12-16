"use client";

interface SnapshotItem {
  label: string;
  type?: string;
  size?: string;
  price?: string;
}

interface ProjectPriceTableProps {
  projectSnapshotJson?: SnapshotItem[] | any;
}

export default function ProjectPriceTable({
  projectSnapshotJson,
}: ProjectPriceTableProps) {
  const rows: SnapshotItem[] = Array.isArray(projectSnapshotJson)
    ? projectSnapshotJson
    : [];

  if (!rows.length) return null;

  return (
    <div className="overflow-x-auto rounded-lg border border-border">
      <table className="min-w-full text-sm">
        <thead className="bg-muted">
          <tr>
            <th className="px-4 py-2 text-left font-medium text-muted-foreground">
              Configuration
            </th>
            <th className="px-4 py-2 text-left font-medium text-muted-foreground">
              Size
            </th>
            <th className="px-4 py-2 text-left font-medium text-muted-foreground">
              Price
            </th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row, idx) => (
            <tr key={idx} className="border-t border-border">
              <td className="px-4 py-2">
                {row.label || row.type || "—"}
              </td>
              <td className="px-4 py-2">
                {row.size || "—"}
              </td>
              <td className="px-4 py-2">
                {row.price || "Enquire"}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}


