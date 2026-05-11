import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import * as XLSX from 'xlsx';
import { 
  School, 
  Layers, 
  Users, 
  Upload, 
  CheckCircle2, 
  ArrowRight, 
  ArrowLeft, 
  Save, 
  Plus, 
  Trash2,
  Database,
  Info,
  FileText,
  Loader2
} from 'lucide-react';
import DataTable from './DataTable';

const SchoolSetup = ({ onComplete }) => {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [schoolName, setSchoolName] = useState('');
  const [classes, setClasses] = useState([
    { id: 1, name: 'Grade 1', sections: [{ id: 1, name: 'Section A', data: null, fileName: '' }] }
  ]);

  const addClass = () => {
    const newId = classes.length > 0 ? Math.max(...classes.map(c => c.id)) + 1 : 1;
    setClasses([...classes, { id: newId, name: `Grade ${newId}`, sections: [{ id: 1, name: 'Section A', data: null, fileName: '' }] }]);
  };

  const removeClass = (id) => {
    setClasses(classes.filter(c => c.id !== id));
  };

  const addSection = (classId) => {
    setClasses(classes.map(c => {
      if (c.id === classId) {
        const newSecId = c.sections.length > 0 ? Math.max(...c.sections.map(s => s.id)) + 1 : 1;
        const char = String.fromCharCode(64 + newSecId);
        return { ...c, sections: [...c.sections, { id: newSecId, name: `Section ${char}`, data: null, fileName: '' }] };
      }
      return c;
    }));
  };

  const removeSection = (classId, sectionId) => {
    setClasses(classes.map(c => {
      if (c.id === classId) {
        return { ...c, sections: c.sections.filter(s => s.id !== sectionId) };
      }
      return c;
    }));
  };

  const updateClassName = (id, name) => {
    setClasses(classes.map(c => c.id === id ? { ...c, name } : c));
  };

  const handleFileUpload = (classId, sectionId, file) => {
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (e) => {
      const bstr = e.target.result;
      const wb = XLSX.read(bstr, { type: 'binary' });
      const wsname = wb.SheetNames[0];
      const ws = wb.Sheets[wsname];
      const rawData = XLSX.utils.sheet_to_json(ws);
      
      setClasses(classes.map(c => {
        if (c.id === classId) {
          return {
            ...c,
            sections: c.sections.map(s => {
              if (s.id === sectionId) {
                return { ...s, data: rawData, fileName: file.name };
              }
              return s;
            })
          };
        }
        return c;
      }));
    };
    reader.readAsBinaryString(file);
  };

  const handleFinalSave = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      // 1. Save School Config
      const configPayload = {
        source_name: '_school_config',
        data: {
          schoolName,
          structure: classes.map(c => ({
            name: c.name,
            sections: c.sections.map(s => s.name)
          }))
        },
        user_id: user.id
      };
      
      const { error: configError } = await supabase.from('dynamic_data').insert(configPayload);
      if (configError) throw configError;

      // 2. Save Section Data
      const dataPayload = [];
      classes.forEach(c => {
        c.sections.forEach(s => {
          if (s.data && s.data.length > 0) {
            s.data.forEach(row => {
              dataPayload.push({
                source_name: `${c.name} - ${s.name}`,
                data: row,
                user_id: user.id
              });
            });
          }
        });
      });

      if (dataPayload.length > 0) {
        const { error: dataError } = await supabase.from('dynamic_data').insert(dataPayload);
        if (dataError) throw dataError;
      }

      alert('School setup completed successfully!');
      onComplete();
    } catch (err) {
      alert('Setup Error: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6 lg:p-12">
      <div className="max-w-4xl w-full space-y-8">
        <header className="text-center space-y-4 animate-byte-slide">
          <div className="w-20 h-20 bg-indigo-600 rounded-3xl flex items-center justify-center text-white shadow-2xl shadow-indigo-500/30 mx-auto mb-6 rotate-3">
            <School size={36} />
          </div>
          <h1 className="text-4xl font-black text-slate-900 tracking-tight">Initialize Academy</h1>
          <p className="text-slate-500 font-medium">Configure your school hierarchy and import academic intelligence.</p>
          
          <div className="flex justify-center gap-2 pt-4">
            {[1, 2, 3, 4].map(s => (
              <div key={s} className={`h-1.5 rounded-full transition-all duration-500 ${s === step ? 'w-12 bg-indigo-600 shadow-lg shadow-indigo-500/20' : s < step ? 'w-6 bg-indigo-200' : 'w-6 bg-slate-200'}`} />
            ))}
          </div>
        </header>

        <div className="byte-card animate-scale-in">
          <div className="byte-card-header">
            <div className="flex items-center gap-3">
              <span className="w-8 h-8 bg-indigo-50 text-indigo-600 rounded-lg flex items-center justify-center font-black text-sm">
                {step}
              </span>
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-900">
                {step === 1 && "Identity"}
                {step === 2 && "Hierarchy"}
                {step === 3 && "Granularity"}
                {step === 4 && "Intelligence Acquisition"}
              </span>
            </div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Phase {step} of 4</span>
          </div>

          <div className="byte-card-content p-8">
            {step === 1 && (
              <div className="space-y-8 max-w-lg mx-auto">
                <div className="space-y-4">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Institutional Identifier</label>
                  <div className="relative">
                    <School className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                    <input 
                      type="text" 
                      placeholder="e.g. St. Xavier's International School" 
                      className="byte-input pl-12 py-4 text-lg"
                      value={schoolName}
                      onChange={(e) => setSchoolName(e.target.value)}
                    />
                  </div>
                </div>
                <div className="p-6 bg-indigo-50 border border-indigo-100 rounded-2xl flex gap-4 text-indigo-700">
                  <Info size={24} className="shrink-0" />
                  <p className="text-xs font-medium leading-relaxed">
                    This identifier will be used across all reports, certificates, and forecasting models generated within the Byte ecosystem.
                  </p>
                </div>
              </div>
            )}

            {step === 2 && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {classes.map((cls, idx) => (
                    <div key={cls.id} className="p-4 bg-slate-50 border border-slate-200 rounded-xl flex items-center gap-4 animate-byte-slide" style={{ animationDelay: `${idx * 0.05}s` }}>
                      <div className="w-10 h-10 bg-white border border-slate-200 rounded-lg flex items-center justify-center text-indigo-600 font-black">
                        {idx + 1}
                      </div>
                      <input 
                        type="text" 
                        value={cls.name}
                        onChange={(e) => updateClassName(cls.id, e.target.value)}
                        className="bg-transparent border-none outline-none font-black text-slate-900 text-sm flex-1"
                      />
                      <button onClick={() => removeClass(cls.id)} className="p-2 text-slate-300 hover:text-red-500 transition-colors">
                        <Trash2 size={16} />
                      </button>
                    </div>
                  ))}
                  <button onClick={addClass} className="p-4 border-dashed border-2 border-slate-200 rounded-xl flex items-center justify-center gap-2 text-slate-400 hover:border-indigo-400 hover:text-indigo-600 transition-all group">
                    <Plus size={18} className="group-hover:scale-125 transition-transform" />
                    <span className="text-[10px] font-black uppercase tracking-widest">Append Class</span>
                  </button>
                </div>
              </div>
            )}

            {step === 3 && (
              <div className="space-y-8">
                {classes.map((cls, cIdx) => (
                  <div key={cls.id} className="space-y-4 p-6 bg-slate-50 rounded-2xl border border-slate-100 animate-byte-slide" style={{ animationDelay: `${cIdx * 0.1}s` }}>
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-3">
                        <Layers size={18} className="text-indigo-600" />
                        <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest">{cls.name}</h3>
                      </div>
                      <span className="text-[10px] font-bold text-slate-400">{cls.sections.length} SECTIONS</span>
                    </div>
                    <div className="flex flex-wrap gap-3">
                      {cls.sections.map((sec, sIdx) => (
                        <div key={sec.id} className="flex items-center gap-2 bg-white border border-slate-200 pl-3 pr-1 py-1 rounded-lg">
                          <span className="text-[10px] font-black text-slate-900">{sec.name}</span>
                          <button onClick={() => removeSection(cls.id, sec.id)} className="p-1 text-slate-300 hover:text-red-500">
                            <Trash2 size={12} />
                          </button>
                        </div>
                      ))}
                      <button onClick={() => addSection(cls.id)} className="flex items-center gap-1 px-3 py-1 bg-indigo-50 text-indigo-600 rounded-lg hover:bg-indigo-600 hover:text-white transition-all">
                        <Plus size={12} />
                        <span className="text-[10px] font-black uppercase">Add</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {step === 4 && (
              <div className="space-y-6">
                <div className="max-h-[500px] overflow-y-auto pr-2 space-y-4">
                  {classes.map((cls) => (
                    <div key={cls.id} className="space-y-4">
                      <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest sticky top-0 bg-white py-2 z-10">{cls.name}</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {cls.sections.map((sec) => (
                          <div key={sec.id} className="p-4 border border-slate-200 rounded-xl flex flex-col gap-3 relative group overflow-hidden">
                            <div className="flex justify-between items-center">
                              <span className="text-xs font-black text-slate-900">{sec.name}</span>
                              {sec.data ? (
                                <span className="status-tag status-stable flex items-center gap-1">
                                  <CheckCircle2 size={10} /> {sec.data.length} Records
                                </span>
                              ) : (
                                <span className="status-tag status-attention">Pending Data</span>
                              )}
                            </div>
                            
                            <div className="relative">
                              <input 
                                type="file" 
                                accept=".xlsx, .csv" 
                                className="absolute inset-0 opacity-0 cursor-pointer z-10"
                                onChange={(e) => handleFileUpload(cls.id, sec.id, e.target.files[0])}
                              />
                              <div className={`p-4 border-dashed border border-slate-200 rounded-lg flex items-center justify-center gap-2 transition-all ${sec.data ? 'bg-green-50/30 border-green-200' : 'bg-slate-50 hover:bg-indigo-50'}`}>
                                <Upload size={14} className={sec.data ? 'text-green-600' : 'text-slate-400'} />
                                <span className="text-[10px] font-black uppercase tracking-widest text-slate-500 truncate max-w-[120px]">
                                  {sec.fileName || 'Upload Data'}
                                </span>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="p-8 border-t border-slate-100 flex justify-between items-center bg-slate-50/50">
            <button 
              onClick={() => setStep(step - 1)}
              disabled={step === 1 || loading}
              className={`byte-button-secondary text-[10px] uppercase tracking-[0.2em] px-8 ${step === 1 ? 'opacity-0' : ''}`}
            >
              <ArrowLeft size={16} /> Back
            </button>
            
            {step < 4 ? (
              <button 
                onClick={() => setStep(step + 1)}
                disabled={step === 1 && !schoolName}
                className="byte-button-primary text-[10px] uppercase tracking-[0.2em] px-10"
              >
                Continue <ArrowRight size={16} />
              </button>
            ) : (
              <button 
                onClick={handleFinalSave}
                disabled={loading}
                className="byte-button-primary bg-green-600 hover:bg-green-700 text-[10px] uppercase tracking-[0.2em] px-12 shadow-xl shadow-green-500/20"
              >
                {loading ? <Loader2 className="animate-spin" size={16} /> : <Save size={16} />}
                {loading ? 'Finalizing...' : 'Initialize System'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SchoolSetup;
