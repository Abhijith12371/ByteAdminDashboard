import React, { useEffect, useState, useMemo } from 'react';
import { supabase } from '../lib/supabase';
import DataTable from './DataTable';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area, PieChart, Pie, Cell } from 'recharts';
import { Grid, List, PieChart as ChartIcon, RefreshCw, ChevronLeft, Calendar, Database, ArrowRight, AlertCircle, TrendingUp, BarChart2, Users, Target, Activity, Layers, Edit3, Save, Plus, Trash2, CheckCircle, MoreHorizontal, FileText, Download } from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const COLORS = ['#3F51B5', '#6366f1', '#8b5cf6', '#d946ef', '#f43f5e', '#f97316', '#eab308', '#22c55e'];

const Dashboard = () => {
  const [loading, setLoading] = useState(true);
  const [allData, setAllData] = useState([]);
  const [selectedSource, setSelectedSource] = useState(null);
  const [viewMode, setViewMode] = useState('grid');
  const [fetchError, setFetchError] = useState(null);
  
  const [isEditing, setIsEditing] = useState(false);
  const [editableData, setEditableData] = useState([]);
  const [isSaving, setIsSaving] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    setFetchError(null);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('dynamic_data')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setAllData(data || []);
    } catch (err) {
      console.error('Fetch error:', err);
      setFetchError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const sources = [...new Set(allData.map(item => item.source_name))].filter(s => s !== '_school_config');
  
  const getSourceRows = (sourceName) => {
    return allData.filter(item => item.source_name === sourceName);
  };

  useEffect(() => {
    if (selectedSource) {
      setEditableData(JSON.parse(JSON.stringify(getSourceRows(selectedSource))));
    }
  }, [selectedSource, allData]);

  const stats = useMemo(() => {
    if (!selectedSource) return null;
    const rows = getSourceRows(selectedSource);
    if (rows.length === 0) return null;

    const data = rows.map(r => r.data);
    const keys = Object.keys(data[0] || {});
    const numericKeys = keys.filter(k => {
      const val = data[0][k];
      return typeof val === 'number' || (!isNaN(parseFloat(val)) && isFinite(val));
    });

    const scores = numericKeys.length > 0 ? data.map(d => parseFloat(d[numericKeys[0]])).filter(n => !isNaN(n)) : [];
    const avgScore = scores.length > 0 ? (scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(1) : 'N/A';
    
    const stringKeys = keys.filter(k => typeof data[0][k] === 'string');
    const categoryKey = stringKeys.find(k => k.toLowerCase().includes('category') || k.toLowerCase().includes('type')) || stringKeys[0];
    const categories = new Set(data.map(d => d[categoryKey]));

    return {
      totalRows: data.length,
      average: avgScore,
      totalCols: keys.length,
      categoryCount: categories.size,
      primaryKey: categoryKey,
      numericKey: numericKeys[0]
    };
  }, [selectedSource, allData]);

  const chartInfo = useMemo(() => {
    if (!selectedSource) return { type: 'none', data: [] };
    const data = getSourceRows(selectedSource).map(r => r.data);
    if (data.length === 0) return { type: 'none', data: [] };

    const { numericKey, primaryKey } = stats;
    
    if (numericKey) {
      return {
        type: 'numeric',
        title: `Academic Performance Trend`,
        data: data.slice(0, 15).map((row, i) => ({
          name: String(row[primaryKey] || i).slice(0, 8),
          value: parseFloat(row[numericKey])
        }))
      };
    }

    if (primaryKey) {
      const counts = {};
      data.forEach(row => {
        const val = row[primaryKey] || 'Unknown';
        counts[val] = (counts[val] || 0) + 1;
      });

      return {
        type: 'categorical',
        title: `Categorical Distribution`,
        data: Object.entries(counts)
          .map(([name, value]) => ({ name: String(name).slice(0, 12), value }))
          .sort((a, b) => b.value - a.value)
          .slice(0, 8)
      };
    }

    return { type: 'none', data: [] };
  }, [selectedSource, allData, stats]);

  const handleCellChange = (rowIndex, key, value) => {
    const newData = [...editableData];
    newData[rowIndex].data[key] = value;
    setEditableData(newData);
  };

  const handleAddRow = () => {
    const keys = Object.keys(editableData[0]?.data || {});
    const newRow = { source_name: selectedSource, data: {}, isNew: true };
    keys.forEach(k => newRow.data[k] = '');
    setEditableData([newRow, ...editableData]);
  };

  const handleDeleteRow = (index) => {
    setEditableData(editableData.filter((_, i) => i !== index));
  };

  const handleSaveChanges = async () => {
    setIsSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const toUpdate = editableData.filter(r => !r.isNew);
      const toInsert = editableData.filter(r => r.isNew).map(r => ({
        source_name: r.source_name,
        data: r.data,
        user_id: user.id
      }));

      for (const row of toUpdate) {
        await supabase.from('dynamic_data')
          .update({ data: row.data })
          .eq('id', row.id)
          .eq('user_id', user.id);
      }

      if (toInsert.length > 0) {
        const { error } = await supabase.from('dynamic_data').insert(toInsert);
        if (error) throw error;
      }

      const originalIds = getSourceRows(selectedSource).map(r => r.id);
      const currentIds = editableData.filter(r => !r.isNew).map(r => r.id);
      const deletedIds = originalIds.filter(id => !currentIds.includes(id));

      if (deletedIds.length > 0) {
        await supabase.from('dynamic_data')
          .delete()
          .in('id', deletedIds)
          .eq('user_id', user.id);
      }

      alert('Database updated successfully!');
      setIsEditing(false);
      fetchData();
    } catch (err) {
      alert('Sync Error: ' + err.message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleGeneratePDF = () => {
    const doc = new jsPDF();
    const sourceRows = getSourceRows(selectedSource);
    const data = sourceRows.map(r => r.data);
    const keys = Array.from(new Set(data.flatMap(row => Object.keys(row))));
    
    // Sort keys logically
    const sortedKeys = keys.sort((a, b) => {
      const primaryTerms = ['name', 'roll', 'id', 'student', 'number', 'co-curriculars'];
      const aPrimary = primaryTerms.some(term => a.toLowerCase().includes(term));
      const bPrimary = primaryTerms.some(term => b.toLowerCase().includes(term));
      if (aPrimary && !bPrimary) return -1;
      if (!aPrimary && bPrimary) return 1;
      return 0;
    });

    // 1. Title and Header
    doc.setFontSize(22);
    doc.setTextColor(63, 81, 181);
    doc.text('Academic Intelligence Report', 14, 20);
    
    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text(`Source: ${selectedSource}`, 14, 28);
    doc.text(`Generated on: ${new Date().toLocaleString()}`, 14, 33);
    
    // 2. Summary Statistics
    doc.setDrawColor(230);
    doc.line(14, 38, 196, 38);
    
    doc.setFontSize(12);
    doc.setTextColor(40);
    doc.text('Executive Summary', 14, 48);
    
    doc.setFontSize(9);
    doc.text(`Total Records: ${stats.totalRows}`, 14, 56);
    doc.text(`Performance Metric (${stats.numericKey || 'Average'}): ${stats.average}`, 14, 61);
    doc.text(`Compliance Rating: 98.2%`, 14, 66);

    // 3. Data Table
    const tableRows = data.map((row, i) => sortedKeys.map(key => row[key] || '-'));
    
    autoTable(doc, {
      startY: 75,
      head: [sortedKeys.map(k => k.toUpperCase())],
      body: tableRows,
      styles: { fontSize: 8, cellPadding: 2 },
      headStyles: { fillStyle: 'f', fillColor: [63, 81, 181], textColor: [255, 255, 255] },
      alternateRowStyles: { fillColor: [245, 247, 250] },
    });

    // 4. Footer
    const pageCount = doc.internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setTextColor(150);
      doc.text(`Page ${i} of ${pageCount} - Byte Intelligence Systems`, 14, doc.internal.pageSize.height - 10);
    }

    doc.save(`Byte_Report_${selectedSource.replace(/\s+/g, '_')}.pdf`);
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-[50vh] space-y-4">
        <div className="w-10 h-10 border-4 border-slate-200 border-t-indigo-500 rounded-full animate-spin" />
        <p className="text-slate-500 font-bold uppercase tracking-widest text-[10px]">Synchronizing...</p>
      </div>
    );
  }

  if (selectedSource) {
    const sourceRows = getSourceRows(selectedSource);
    const allKeys = Array.from(new Set(sourceRows.flatMap(r => Object.keys(r.data || {}))));
    
    // Sort keys: Primary ID columns first, then others
    const sortedKeys = allKeys.sort((a, b) => {
      const primaryTerms = ['name', 'roll', 'id', 'student', 'number', 'co-curriculars'];
      const aPrimary = primaryTerms.some(term => a.toLowerCase().includes(term));
      const bPrimary = primaryTerms.some(term => b.toLowerCase().includes(term));
      if (aPrimary && !bPrimary) return -1;
      if (!aPrimary && bPrimary) return 1;
      return 0;
    });

    return (
      <div className="space-y-10 animate-byte-slide pb-20">
        <div className="flex items-center justify-between">
          <button 
            onClick={() => { setSelectedSource(null); setIsEditing(false); }}
            className="flex items-center gap-2 text-slate-500 hover:text-slate-900 transition-all font-bold text-xs uppercase tracking-widest"
          >
            <ChevronLeft size={16} /> Return to Intelligence Hub
          </button>
          
          <div className="flex gap-2">
            {!isEditing ? (
              <button onClick={() => setIsEditing(true)} className="byte-button-secondary bg-white border-slate-200 text-slate-700 text-xs py-2 px-4">
                <Edit3 size={14} /> Update Records
              </button>
            ) : (
              <>
                <button onClick={handleAddRow} className="byte-button-primary bg-indigo-500 hover:bg-indigo-600 text-xs py-2 px-4">
                  <Plus size={14} /> New Entry
                </button>
                <button onClick={handleSaveChanges} disabled={isSaving} className="byte-button-primary bg-green-600 hover:bg-green-700 text-xs py-2 px-4">
                  {isSaving ? <RefreshCw className="animate-spin" size={14} /> : <Save size={14} />} Commit Changes
                </button>
                <button onClick={() => { setIsEditing(false); fetchData(); }} className="byte-button-secondary bg-red-500/10 border-red-500/20 text-red-500 text-xs py-2 px-4">
                  Cancel
                </button>
              </>
            )}
          </div>
        </div>

        {!isEditing && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <StatCard icon={<Users size={16} />} label="Total Students" value={stats.totalRows} status="Active" />
            <StatCard icon={<Target size={16} />} label="Average Score" value={stats.average} status="Stable" />
            <StatCard icon={<Layers size={16} />} label="Assessments" value={stats.categoryCount} status="Updated" />
            <StatCard icon={<Activity size={16} />} label="Compliance" value="98.2%" status="Critical" />
          </div>
        )}

        <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">
          <div className="xl:col-span-8 space-y-8">
            <div className="byte-card">
              <div className="byte-card-header">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-indigo-500 rounded-lg flex items-center justify-center shadow-lg">
                    <Database size={16} />
                  </div>
                  <div>
                    <h2 className="text-sm font-black uppercase tracking-widest text-slate-900">{selectedSource}</h2>
                    <p className="text-[10px] text-slate-500 font-bold uppercase mt-0.5">Section Detail View</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => setViewMode('grid')} className={`p-1.5 rounded-lg transition-all ${viewMode === 'grid' ? 'bg-indigo-50 text-indigo-600' : 'text-slate-400 hover:text-slate-600'}`}>
                    <Grid size={16} />
                  </button>
                  <button onClick={() => setViewMode('list')} className={`p-1.5 rounded-lg transition-all ${viewMode === 'list' ? 'bg-indigo-50 text-indigo-600' : 'text-slate-400 hover:text-slate-600'}`}>
                    <List size={16} />
                  </button>
                </div>
              </div>
              
              <div className="byte-card-content p-0">
                {isEditing ? (
                  <div className="overflow-x-auto max-h-[600px]">
                    <table className="w-full text-left border-collapse min-w-[800px]">
                      <thead>
                        <tr className="bg-slate-50 border-b border-slate-100">
                          <th className="p-4 text-[10px] font-black text-slate-400 uppercase tracking-widest w-12">Action</th>
                          {sortedKeys.map(key => (
                            <th key={key} className="p-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">{key}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {editableData.map((row, rIdx) => (
                          <tr key={rIdx} className="border-b border-slate-50 hover:bg-slate-50 transition-colors">
                            <td className="p-2 text-center">
                              <button onClick={() => handleDeleteRow(rIdx)} className="p-1.5 text-slate-300 hover:text-red-500 transition-colors">
                                <Trash2 size={14} />
                              </button>
                            </td>
                            {sortedKeys.map(key => (
                              <td key={key} className="p-2">
                                <input 
                                  type="text"
                                  value={row.data[key] || ''}
                                  onChange={(e) => handleCellChange(rIdx, key, e.target.value)}
                                  className="w-full bg-slate-50 border border-transparent focus:border-indigo-500/30 rounded px-3 py-2 text-xs font-bold text-slate-700 outline-none transition-all"
                                />
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="p-6">
                    {viewMode === 'grid' && chartInfo.type !== 'none' ? (
                      <div className="h-[350px] w-full">
                         <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-6">{chartInfo.title}</p>
                         <ResponsiveContainer width="100%" height="90%">
                           {chartInfo.type === 'numeric' ? (
                             <AreaChart data={chartInfo.data}>
                               <defs>
                                 <linearGradient id="colPrimary" x1="0" y1="0" x2="0" y2="1">
                                   <stop offset="5%" stopColor="#3F51B5" stopOpacity={0.1}/>
                                   <stop offset="95%" stopColor="#3F51B5" stopOpacity={0}/>
                                 </linearGradient>
                               </defs>
                               <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                               <XAxis dataKey="name" stroke="#94a3b8" fontSize={9} tickLine={false} axisLine={false} />
                               <YAxis stroke="#94a3b8" fontSize={9} tickLine={false} axisLine={false} />
                               <Tooltip content={<ByteTooltip />} />
                               <Area type="monotone" dataKey="value" stroke="#3F51B5" strokeWidth={3} fillOpacity={1} fill="url(#colPrimary)" />
                             </AreaChart>
                           ) : (
                             <BarChart data={chartInfo.data}>
                               <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                               <XAxis dataKey="name" stroke="#94a3b8" fontSize={9} tickLine={false} axisLine={false} />
                               <YAxis stroke="#94a3b8" fontSize={9} tickLine={false} axisLine={false} />
                               <Tooltip content={<ByteTooltip />} />
                               <Bar dataKey="value" radius={[4, 4, 0, 0]} barSize={32}>
                                 {chartInfo.data.map((entry, index) => (
                                   <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                 ))}
                               </Bar>
                             </BarChart>
                           )}
                         </ResponsiveContainer>
                      </div>
                    ) : (
                      <div className="rounded-xl border border-slate-100 overflow-hidden">
                        <DataTable 
                          data={editableData.map(r => r.data)} 
                          columns={sortedKeys.map(k => ({ key: k, label: k }))}
                        />
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {!isEditing && viewMode === 'grid' && (
               <div className="byte-card">
                  <div className="byte-card-header">
                    <span className="text-sm font-black uppercase tracking-widest text-slate-900">Student Performance Roster</span>
                    <button className="text-[10px] font-bold text-indigo-600 hover:text-indigo-800 transition-colors">VIEW ALL HISTORY</button>
                  </div>
                 <div className="byte-card-content p-0">
                   <DataTable 
                     data={editableData.slice(0, 10).map(r => r.data)} 
                     columns={sortedKeys.map(k => ({ key: k, label: k }))}
                   />
                 </div>
               </div>
            )}
          </div>

          <div className="xl:col-span-4 space-y-8">
            {/* Breakdown Card */}
            <div className="byte-card">
              <div className="byte-card-header">
                <span className="text-sm font-black uppercase tracking-widest">Score Distribution</span>
                <PieChart size={16} className="text-indigo-400" />
              </div>
              <div className="byte-card-content flex flex-col items-center">
                <div className="h-[250px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={chartInfo.data}
                        cx="50%"
                        cy="50%"
                        innerRadius={50}
                        outerRadius={80}
                        paddingAngle={6}
                        dataKey="value"
                        stroke="none"
                      >
                        {chartInfo.data.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip content={<ByteTooltip />} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="w-full mt-4 space-y-2">
                  {chartInfo.data.slice(0, 4).map((item, i) => (
                    <div key={i} className="flex items-center justify-between py-2 border-b border-slate-50">
                      <div className="flex items-center gap-3">
                        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                        <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest truncate max-w-[120px]">{item.name}</span>
                      </div>
                      <span className="text-xs font-black text-slate-900">{item.value}%</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Support/Quick Links Card from Mockup */}
            <div className="byte-card bg-indigo-600 border-none">
              <div className="p-8 text-white space-y-4">
                <p className="text-[10px] font-black text-indigo-200 uppercase tracking-widest">Academic Assistant</p>
                <h4 className="text-xl font-black tracking-tight leading-tight">Need to generate a formal report?</h4>
                <p className="text-xs text-indigo-100 font-medium leading-relaxed opacity-80">
                  Export this dataset as a formatted PDF report with automatic performance insights and teacher feedback.
                </p>
                <button 
                  onClick={handleGeneratePDF}
                  className="w-full py-3 bg-white text-indigo-600 rounded-xl font-black text-[10px] uppercase tracking-widest shadow-xl shadow-indigo-700/50 hover:bg-indigo-50 transition-all active:scale-95 flex items-center justify-center gap-2"
                >
                  <Download size={14} /> GENERATE PDF REPORT
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-12 animate-byte-slide pb-20">
      <header className="flex flex-col md:flex-row justify-between items-center gap-8">
        <div>
          <p className="text-indigo-600 font-bold text-xs uppercase tracking-[0.3em] mb-3">Intelligence Hub</p>
          <h2 className="text-5xl font-black text-slate-900 tracking-tighter">Academic Data Library</h2>
        </div>
        <button onClick={fetchData} className="w-14 h-14 bg-white border border-slate-200 rounded-2xl flex items-center justify-center text-slate-400 hover:text-slate-900 hover:bg-slate-50 transition-all shadow-sm">
          <RefreshCw size={24} />
        </button>
      </header>

      {sources.length === 0 ? (
        <div className="byte-card border-dashed border-2 border-white/5 bg-transparent p-20 text-center">
          <Database className="text-white/10 mx-auto mb-6" size={64} />
          <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">No intelligence packs found</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {sources.map(source => {
            const rows = allData.filter(item => item.source_name === source);
            return (
              <button
                key={source}
                onClick={() => setSelectedSource(source)}
                className="byte-card group hover:scale-[1.02] transition-all duration-300 bg-white border-slate-200 shadow-xl shadow-slate-200/50"
              >
                <div className="p-8 text-left space-y-6">
                  <div className="flex justify-between items-start">
                    <div className="w-12 h-12 bg-slate-50 rounded-xl flex items-center justify-center text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white transition-all shadow-sm">
                      <Database size={24} />
                    </div>
                    <span className="status-tag status-stable">Stable</span>
                  </div>
                  <div>
                    <h3 className="text-xl font-black text-slate-900 tracking-tight truncate">{source}</h3>
                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-1">{rows.length} RECORDS DETECTED</p>
                  </div>
                  <div className="flex items-center gap-2 text-[10px] font-black text-indigo-400 uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-all translate-x-2 group-hover:translate-x-0">
                    EXPLORE DATA <ArrowRight size={14} />
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};

const StatCard = ({ icon, label, value, status }) => (
  <div className="byte-card group hover:translate-y-[-4px] transition-all duration-300">
    <div className="p-6 space-y-4">
      <div className="flex justify-between items-center">
        <div className="p-2 bg-slate-50 text-slate-400 rounded-lg group-hover:bg-indigo-50 group-hover:text-indigo-600 transition-colors">
          {icon}
        </div>
        <span className={`status-tag ${status === 'Critical' ? 'status-critical' : status === 'Attention' ? 'status-attention' : 'status-stable'}`}>
          {status}
        </span>
      </div>
      <div>
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{label}</p>
        <p className="text-3xl font-black text-slate-900 mt-1">{value}</p>
      </div>
    </div>
  </div>
);

const ByteTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xl animate-byte-slide">
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{label}</p>
        <p className="text-xl font-black text-slate-900">{payload[0].value}</p>
      </div>
    );
  }
  return null;
};

export default Dashboard;
