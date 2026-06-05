import type { ReactNode } from 'react';

interface TableProps {
  headers: string[];
  children: ReactNode;
}

export function Table({ headers, children }: TableProps) {
  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-[var(--border-color)]">
        <thead className="bg-[var(--bg-secondary)]">
          <tr>
            {headers.map((header, index) => (
              <th
                key={index}
                className="px-6 py-3 text-left text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider"
              >
                {header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="bg-[var(--card-bg)] divide-y divide-[var(--border-color)]">{children}</tbody>
      </table>
    </div>
  );
}

export function TableRow({ children }: { children: ReactNode }) {
  return <tr className="hover:bg-[var(--hover-bg)] transition-colors">{children}</tr>;
}

export function TableCell({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <td className={`px-6 py-4 whitespace-nowrap text-sm text-[var(--text-primary)] ${className}`}>{children}</td>;
}
