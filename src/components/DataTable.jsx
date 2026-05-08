import React from 'react';

const DataTable = ({ columns, data, className = "" }) => {
  if (!data || data.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-slate-400 bg-slate-50/50">
        <p className="font-black text-[10px] uppercase tracking-widest italic">No record data available</p>
      </div>
    );
  }

  const keys = Object.keys(data[0]);
  const tableColumns = columns || keys.map(key => ({
    key,
    label: key.charAt(0).toUpperCase() + key.slice(1).replace(/_/g, ' ')
  }));

  return (
    <div className={`overflow-x-auto ${className}`}>
      <table className="w-full text-left border-collapse min-w-[800px]">
        <thead>
          <tr className="bg-slate-50 border-b border-slate-100">
            {tableColumns.map((col) => (
              <th 
                key={col.key} 
                className="p-5 text-[10px] font-black text-slate-400 uppercase tracking-widest whitespace-nowrap"
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
              className="group border-b border-slate-50 hover:bg-indigo-50/30 transition-all"
            >
              {tableColumns.map((col) => (
                <td 
                  key={col.key} 
                  className="p-5 text-xs font-bold text-slate-600 group-hover:text-slate-900 transition-colors"
                >
                  {row[col.key]?.toString() || '-'}
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
