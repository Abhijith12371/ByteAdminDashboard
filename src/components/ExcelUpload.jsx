import React, { useState } from 'react';
import * as XLSX from 'xlsx';
import { Upload, FileText, CheckCircle2, Save, Loader2, Info, ArrowRight, Database } from 'lucide-react';
import DataTable from './DataTable';
import { supabase } from '../lib/supabase';

const ExcelUpload = ({ onComplete }) => {
  const [file, setFile] = useState(null);
  const [data, setData] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [fileName, setFileName] = useState('');

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      setFile(selectedFile);
      setFileName(selectedFile.name.split('.')[0]);
      processFile(selectedFile);
    }
  };

  const processFile = (file) => {
    setIsProcessing(true);
    const reader = new FileReader();
    reader.onload = (e) => {
      const bstr = e.target.result;
      const wb = XLSX.read(bstr, { type: 'binary' });
      const wsname = wb.SheetNames[0];
      const ws = wb.Sheets[wsname];
      const rawData = XLSX.utils.sheet_to_json(ws, { header: 1 });
      const processedData = smartProcess(rawData);
      setData(processedData);
      setIsProcessing(false);
    };
    reader.readAsBinaryString(file);
  };

  const smartProcess = (rows) => {
    if (rows.length < 2) return rows;
    let headerRowIndex = 0;
    for (let i = 0; i < Math.min(rows.length, 5); i++) {
      if (rows[i].filter(cell => cell).length > 2) {
        headerRowIndex = i;
        break;
      }
    }
    const headers = rows[headerRowIndex].map((h, i) => {
      let label = String(h || '').trim();
      if (!label) {
        const parentHeader = rows[headerRowIndex - 1]?.[i];
        label = parentHeader ? `${parentHeader}_${i}` : `Col_${i}`;
      }
      return label;
    });
    const dataRows = [];
    let lastValues = {};
    for (let i = headerRowIndex + 1; i < rows.length; i++) {
      const row = rows[i];
      if (row.filter(cell => cell).length === 0) continue;
      const obj = {};
      headers.forEach((header, colIdx) => {
        let val = row[colIdx];
        if (val === undefined || val === null || val === '') {
          if (colIdx === 0 || colIdx === 1) val = lastValues[colIdx];
        } else {
          lastValues[colIdx] = val;
        }
        obj[header] = val;
      });
      dataRows.push(obj);
    }
    return dataRows.map(row => {
      const cleanRow = {};
      Object.keys(row).forEach(key => {
        if (!key.startsWith('Col_') && key !== 'undefined') cleanRow[key] = row[key];
        else if (row[key] !== undefined) cleanRow[`Field_${key.split('_')[1]}`] = row[key];
      });
      return cleanRow;
    });
  };

  const handleSave = async () => {
    if (!data) return;
    setIsSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const payload = data.map(row => ({
        source_name: fileName,
        data: row,
        user_id: user.id
      }));
      const { error } = await supabase.from('dynamic_data').insert(payload);
      if (error) throw error;
      alert('Smart Import Successful!');
      onComplete();
    } catch (err) {
      alert('Error: ' + err.message);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-10 animate-byte-slide">
      <header>
        <p className="text-indigo-600 font-bold text-xs uppercase tracking-[0.3em] mb-3">Academic Module</p>
        <h2 className="text-4xl font-black text-slate-900 tracking-tighter">Bulk Assessment Import</h2>
      </header>

      {!data ? (
        <div className="byte-card border-dashed border-2 border-slate-200 bg-slate-50 hover:border-indigo-500/50 transition-all group relative overflow-hidden h-[400px] flex items-center justify-center">
           <div className="text-center space-y-6 relative z-10">
              <div className="w-20 h-20 bg-white border border-slate-200 rounded-2xl flex items-center justify-center text-indigo-600 mx-auto group-hover:scale-110 group-hover:bg-indigo-600 group-hover:text-white transition-all duration-500 shadow-xl">
                <Upload size={32} />
              </div>
              <div>
                <p className="text-xl font-black text-slate-900 tracking-tight">Drop Assessment Spreadsheet</p>
                <p className="text-slate-500 font-bold uppercase tracking-widest text-[10px] mt-2">XLSX, CSV, or XLS Formats Only</p>
              </div>
           </div>
           <input type="file" accept=".xlsx, .xls, .csv" onChange={handleFileChange} className="absolute inset-0 opacity-0 cursor-pointer" />
        </div>
      ) : (
        <div className="space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
             <div className="byte-card">
               <div className="byte-card-header">
                 <span className="text-[10px] font-black uppercase tracking-widest">Import Intelligence</span>
                 <Info size={14} className="text-indigo-400" />
               </div>
               <div className="byte-card-content space-y-4">
                 <div className="flex items-center gap-4">
                   <div className="w-12 h-12 bg-indigo-50 rounded-xl flex items-center justify-center text-indigo-600">
                     <FileText size={24} />
                   </div>
                   <div>
                     <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Active File</p>
                     <p className="text-sm font-black text-slate-900 truncate max-w-[200px]">{file?.name}</p>
                   </div>
                 </div>
                 <p className="text-xs text-slate-500 leading-relaxed font-medium">
                   We've automatically resolved merged headers and academic sub-categories. Review the data structure below before committing to the database.
                 </p>
               </div>
             </div>

             <div className="byte-card">
               <div className="byte-card-header">
                 <span className="text-[10px] font-black uppercase tracking-widest">Configuration</span>
                 <Database size={14} className="text-indigo-400" />
               </div>
               <div className="byte-card-content space-y-5">
                 <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Dataset Identifier</label>
                    <input 
                      type="text" 
                      value={fileName}
                      onChange={(e) => setFileName(e.target.value)}
                      className="byte-input bg-slate-50 text-xs py-3"
                      placeholder="e.g. Mid-Term 2024"
                    />
                 </div>
                 <button onClick={handleSave} disabled={isSaving} className="w-full byte-button-primary text-xs py-4">
                   {isSaving ? <Loader2 className="animate-spin" /> : <Save size={16} />} 
                   {isSaving ? 'SYNCHRONIZING...' : 'COMMIT TO DATABASE'}
                 </button>
               </div>
             </div>
          </div>

          <div className="byte-card">
            <div className="byte-card-header">
              <span className="text-[10px] font-black uppercase tracking-widest">Data Structure Preview</span>
              <span className="status-tag status-active">{data.length} Records Detected</span>
            </div>
            <div className="byte-card-content p-0">
               <DataTable data={data.slice(0, 50)} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ExcelUpload;
