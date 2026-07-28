/* eslint-disable @typescript-eslint/no-explicit-any */
import type { ReactNode } from 'react';

export type TableHeader = ReactNode | { label: ReactNode; align?: 'left' | 'center' | 'right'; className?: string };

interface TableProps {
  headers: TableHeader[];
  children: ReactNode;
  fixedLayout?: boolean;
  className?: string;
}

export function Table({ headers, children, fixedLayout = false, className = '' }: TableProps) {
  return (
    <div className="overflow-x-auto w-full bg-[var(--bg-card)]">
      <table className={`min-w-full divide-y divide-[var(--border-color)] ${fixedLayout ? 'table-fixed' : ''} ${className}`}>
        <thead className="bg-[var(--bg-tertiary)] sticky top-0 z-10 border-b border-[var(--border-color)] shadow-2xs">
          <tr>
            {headers.map((header, index) => {
              const isObj = typeof header === 'object' && header !== null && !('type' in header || 'props' in header) && 'label' in header;
              const align = isObj ? (header as any).align || 'left' : 'left';
              const customClass = isObj ? (header as any).className || '' : '';
              const content = isObj ? (header as any).label : header;
              
              const alignClass = align === 'right' ? 'text-right' : align === 'center' ? 'text-center' : 'text-left';

              return (
                <th
                  key={index}
                  className={`px-4 py-3 ${alignClass} text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider ${customClass}`}
                >
                  {content as ReactNode}
                </th>
              );
            })}
          </tr>
        </thead>
        <tbody className="bg-[var(--bg-card)] divide-y divide-[var(--border-color)]">{children}</tbody>
      </table>
    </div>
  );
}

export function TableRow({ children, onClick, className = '' }: { children: ReactNode; onClick?: () => void; className?: string }) {
  return (
    <tr
      onClick={onClick}
      className={`hover:bg-[var(--bg-hover)] transition-colors duration-150 ${onClick ? 'cursor-pointer' : ''} ${className}`}
    >
      {children}
    </tr>
  );
}

export function TableCell({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <td className={`px-4 py-3.5 whitespace-nowrap text-sm text-[var(--text-primary)] ${className}`}>{children}</td>;
}
