import React from 'react';

const DataTable = ({ columns, data, className = "" }) => {
  if (!data || data.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-slate-400 bg-slate-50/50">
        <p className="font-black text-[10px] uppercase tracking-widest italic">No record data available</p>
      </div>
    );
  }

  const keys = Array.from(new Set(data.flatMap(row => Object.keys(row))));
  const tableColumns = columns || keys.map(key => ({
    key,
    label: key.charAt(0).toUpperCase() + key.slice(1).replace(/_/g, ' ')
  }));

  return (
    <div className={`overflow-auto max-h-[600px] border border-slate-200 rounded-xl ${className}`}>
      <table className="w-full text-left border-collapse table-fixed min-w-[max-content]">
        <thead className="sticky top-0 z-10">
          <tr className="bg-slate-100 border-b border-slate-200">
            <th className="w-12 p-3 bg-slate-100 border-r border-slate-200 text-center text-[10px] font-black text-slate-400">#</th>
            {tableColumns.map((col) => (
              <th 
                key={col.key} 
                className="p-3 border-r border-slate-200 text-[10px] font-black text-slate-500 uppercase tracking-widest min-w-[150px] bg-slate-100"
              >
                {col.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((row, idx) => (
            <tr 
              key={idx} 
              className="group border-b border-slate-100 hover:bg-indigo-50/50 transition-all"
            >
              <td className="p-3 border-r border-slate-100 text-center text-[10px] font-bold text-slate-300 bg-slate-50/50 group-hover:bg-indigo-100/50 group-hover:text-indigo-400">
                {idx + 1}
              </td>
              {tableColumns.map((col) => (
                <td 
                  key={col.key} 
                  className="p-3 border-r border-slate-100 text-xs font-medium text-slate-600 group-hover:text-slate-900 transition-colors truncate"
                  title={row[col.key]?.toString() || ''}
                >
                  {row[col.key]?.toString() || ''}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default DataTable;
