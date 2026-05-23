
import React, { ReactNode } from 'react';

interface TableProps<T> {
  columns: {
    header: string;
    accessor: keyof T | ((item: T) => ReactNode);
  }[];
  data: T[];
}

const Table = <T extends { id: string | number }>(
    { columns, data }: TableProps<T>
) => {
  return (
    <div className="overflow-x-auto bg-white rounded-2xl shadow-[0_2px_12px_-4px_rgba(148,163,184,0.1)] border border-slate-100/80">
      <table className="w-full text-sm text-left text-slate-600">
        <thead className="text-xs text-slate-500 uppercase bg-slate-50/80 font-bold tracking-wider">
          <tr>
            {columns.map((col) => (
              <th key={String(col.header)} scope="col" className="px-6 py-4">
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100/80">
          {data.map((item) => (
            <tr key={item.id} className="bg-white hover:bg-slate-50/50 hover:shadow-[0_4px_12px_-4px_rgba(0,0,0,0.05)] transition-all duration-200">
              {columns.map((col) => (
                <td key={String(col.header)} className="px-6 py-4 whitespace-normal">
                  {typeof col.accessor === 'function'
                    ? col.accessor(item)
                    : (item[col.accessor] as ReactNode)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      {data.length === 0 && <p className="text-center py-12 text-slate-400 font-medium">Không có dữ liệu</p>}
    </div>
  );
};

export default Table;
