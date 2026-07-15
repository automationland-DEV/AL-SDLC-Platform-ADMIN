/* eslint-disable @typescript-eslint/no-explicit-any */
import type { ReactNode } from 'react';

export type TableHeader = ReactNode | { label: ReactNode; align?: 'left' | 'center' | 'right'; className?: string };

interface TableProps {
  headers: TableHeader[];
  children: ReactNode;
}

export function Table({ headers, children }: TableProps) {
  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-[var(--border-color)]">
        <thead className="bg-[var(--bg-secondary)]">
          <tr>
            {headers.map((header, index) => {
              const isObj = typeof header === 'object' && header !== null && !('type' in header || 'props' in header) && 'label' in header;
              const align = isObj ? (header as any).align || 'left' : 'left';
              const customClass = isObj ? (header as any).className || '' : '';
              const content = isObj ? (header as any).label : header;
              
              return (
                <th
                  key={index}
                  className={`px-6 py-3 text-${align} text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider ${customClass}`}
                >
                  {content as ReactNode}
                </th>
              );
            })}
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
