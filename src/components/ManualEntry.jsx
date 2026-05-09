import React, { useState } from 'react';
import { Plus, Trash2, ArrowRight, ArrowLeft, Save, Table as TableIcon, Info } from 'lucide-react';
import DataTable from './DataTable';
import { supabase } from '../lib/supabase';

const ManualEntry = ({ onComplete }) => {
  const [step, setStep] = useState(1);
  const [tableName, setTableName] = useState('');
  const [columns, setColumns] = useState([{ name: '', type: 'text' }]);
  const [rows, setRows] = useState([]);
  const [isSaving, setIsSaving] = useState(false);

  const addColumn = () => setColumns([...columns, { name: '', type: 'text' }]);
  const removeColumn = (index) => setColumns(columns.filter((_, i) => i !== index));
  const updateColumn = (index, field, value) => {
    const newColumns = [...columns];
    newColumns[index][field] = value;
    setColumns(newColumns);
  };
  const addRow = () => {
    const newRow = {};
    columns.forEach(col => newRow[col.name || 'unnamed'] = '');
    setRows([...rows, newRow]);
  };
  const updateRow = (rowIndex, colName, value) => {
    const newRows = [...rows];
    newRows[rowIndex][colName] = value;
    setRows(newRows);
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const payload = rows.map(row => ({
        source_name: tableName,
        data: row,
        user_id: user.id
      }));
      const { error } = await supabase.from('dynamic_data').insert(payload);
      if (error) throw error;
      alert('Data Recorded Successfully!');
      onComplete();
    } catch (err) {
      alert('Sync Error: ' + err.message);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-10 animate-byte-slide">
      <header className="flex justify-between items-end">
        <div>
          <p className="text-indigo-600 font-bold text-xs uppercase tracking-[0.3em] mb-3">Data Acquisition</p>
          <h2 className="text-4xl font-black text-slate-900 tracking-tighter">Manual Assessment Entry</h2>
        </div>
        <div className="flex gap-2">
          {[1, 2, 3, 4].map(s => (
            <div key={s} className={`w-8 h-1.5 rounded-full transition-all duration-500 ${s <= step ? 'bg-indigo-500 shadow-lg shadow-indigo-500/20' : 'bg-slate-200'}`} />
          ))}
        </div>
      </header>

      <div className="byte-card">
        <div className="byte-card-header">
           <div className="flex items-center gap-3">
             <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white font-black text-xs">
               {step}
             </div>
             <span className="text-[10px] font-black uppercase tracking-widest">
                {step === 1 && "Initialization"}
                {step === 2 && "Structure Definition"}
                {step === 3 && "Record Acquisition"}
                {step === 4 && "Final Synchronization"}
             </span>
           </div>
           <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Phase {step} of 4</span>
        </div>
        
        <div className="byte-card-content p-8">
          {step === 1 && (
            <div className="space-y-6 max-w-lg">
              <div className="space-y-3">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Assessment Identifier</label>
                <input 
                  type="text" 
                  placeholder="e.g. Grade 5 Mathematics Quiz" 
                  className="byte-input text-sm py-4"
                  value={tableName}
                  onChange={(e) => setTableName(e.target.value)}
                />
              </div>
              <div className="p-4 bg-indigo-50 border border-indigo-100 rounded-xl flex gap-3 text-indigo-700">
                <Info size={18} className="shrink-0 mt-0.5" />
                <p className="text-xs font-medium leading-relaxed">
                  Provide a unique name for this dataset. This will be used to organize your reports in the intelligence hub.
                </p>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-6">
              <div className="space-y-4">
                {columns.map((col, idx) => (
                  <div key={idx} className="flex gap-4 items-center animate-byte-slide" style={{ animationDelay: `${idx * 0.1}s` }}>
                    <div className="text-[10px] font-black text-slate-300 w-4">{idx + 1}</div>
                    <input 
                      type="text" 
                      placeholder="Column Identifier" 
                      className="byte-input flex-1 text-xs"
                      value={col.name}
                      onChange={(e) => updateColumn(idx, 'name', e.target.value)}
                    />
                    <select 
                      className="byte-input w-40 text-xs"
                      value={col.type}
                      onChange={(e) => updateColumn(idx, 'type', e.target.value)}
                    >
                      <option value="text">STRING</option>
                      <option value="number">NUMERIC</option>
                      <option value="date">TIMESTAMP</option>
                      <option value="boolean">BOOLEAN</option>
                    </select>
                    <button onClick={() => removeColumn(idx)} className="p-3 text-slate-300 hover:text-red-500 transition-colors">
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))}
              </div>
              <button onClick={addColumn} className="flex items-center gap-2 text-[10px] font-black text-indigo-600 hover:text-indigo-700 uppercase tracking-widest mt-4">
                <Plus size={14} /> Add Definition
              </button>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-6">
              <div className="rounded-xl border border-slate-100 overflow-hidden">
                <div className="overflow-x-auto max-h-[500px]">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-100">
                        {columns.map((col, idx) => (
                          <th key={idx} className="p-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">{col.name || `Col ${idx + 1}`}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {rows.map((row, rIdx) => (
                        <tr key={rIdx} className="border-b border-slate-50">
                          {columns.map((col, cIdx) => (
                            <td key={cIdx} className="p-2">
                              <input 
                                type={col.type === 'number' ? 'number' : 'text'}
                                className="w-full bg-transparent border-none outline-none p-2 text-xs font-bold text-slate-700"
                                value={row[col.name] || ''}
                                onChange={(e) => updateRow(rIdx, col.name, e.target.value)}
                                placeholder="..."
                              />
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
              <button onClick={addRow} className="flex items-center gap-2 text-[10px] font-black text-indigo-600 hover:text-indigo-700 uppercase tracking-widest">
                <Plus size={14} /> New Record
              </button>
            </div>
          )}

          {step === 4 && (
            <div className="space-y-8 animate-byte-slide">
              <div className="flex items-center justify-between p-6 bg-slate-50 border border-slate-200 rounded-2xl text-slate-900">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center text-indigo-600 shadow-sm border border-slate-100">
                    <TableIcon size={24} />
                  </div>
                  <div>
                    <h4 className="text-lg font-black tracking-tight">{tableName}</h4>
                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{rows.length} Total Records Ready</p>
                  </div>
                </div>
                <span className="status-tag status-stable">Validation Passed</span>
              </div>
              <div className="rounded-xl border border-slate-100 overflow-hidden">
                <DataTable 
                  columns={columns.map(c => ({ key: c.name, label: c.name }))} 
                  data={rows} 
                />
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="flex justify-between items-center pt-6">
        <button 
          onClick={() => setStep(step - 1)}
          disabled={step === 1}
          className={`byte-button-secondary text-xs px-8 ${step === 1 ? 'opacity-0 pointer-events-none' : ''}`}
        >
          <ArrowLeft size={16} /> Previous
        </button>
        
        {step < 4 ? (
          <button 
            onClick={() => setStep(step + 1)}
            disabled={step === 1 && !tableName}
            className="byte-button-primary text-xs px-8"
          >
            Next Phase <ArrowRight size={16} />
          </button>
        ) : (
          <button 
            onClick={handleSave}
            disabled={isSaving || rows.length === 0}
            className="byte-button-primary bg-green-600 hover:bg-green-700 text-xs px-10 shadow-green-500/20"
          >
            {isSaving ? <Loader2 className="animate-spin" /> : <Save size={16} />} 
            {isSaving ? 'SYNCHRONIZING...' : 'COMMIT TO DATABASE'}
          </button>
        )}
      </div>
    </div>
  );
};

const Loader2 = ({ className }) => (
  <svg className={className} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 12a9 9 0 1 1-6.219-8.56" />
  </svg>
);

export default ManualEntry;
