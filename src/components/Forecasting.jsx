import React, { useState, useEffect } from 'react';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
  BarChart, Bar, Cell
} from 'recharts';
import { 
  TrendingUp, Calendar, MapPin, Activity, AlertCircle, 
  ChevronRight, RefreshCw, BarChart3, PieChart
} from 'lucide-react';

const COLORS = ['#3F51B5', '#6366f1', '#8b5cf6', '#d946ef', '#f43f5e'];

const Forecasting = () => {
  const [states, setStates] = useState([]);
  const [selectedState, setSelectedState] = useState('');
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchStates();
  }, []);

  const fetchStates = async () => {
    try {
      const response = await fetch('http://localhost:8001/states');
      const result = await response.json();
      setStates(result.states);
      if (result.states.length > 0) {
        setSelectedState(result.states[0]);
      }
    } catch (err) {
      console.error('Error fetching states:', err);
      setError('Could not connect to forecasting service.');
    }
  };

  const fetchForecast = async (state) => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`http://localhost:8001/forecast/${state}`);
      if (!response.ok) throw new Error('Failed to fetch forecast');
      const result = await response.json();
      setData(result);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (selectedState) {
      fetchForecast(selectedState);
    }
  }, [selectedState]);

  const chartData = data ? [
    ...data.historical.map(h => ({ name: h.Date, actual: h.Total, forecast: null })),
    ...data.forecast.map(f => ({ name: f.Date, actual: null, forecast: f.Total }))
  ] : [];

  const metricsData = data ? Object.entries(data.all_metrics).map(([name, value]) => ({
    name,
    mape: (value * 100).toFixed(2)
  })) : [];

  return (
    <div className="space-y-10 animate-byte-slide pb-20">
      <header className="flex flex-col md:flex-row justify-between items-end gap-6">
        <div className="space-y-2">
          <p className="text-indigo-400 font-bold text-xs uppercase tracking-[0.3em]">AI Predictive Engine</p>
          <h2 className="text-5xl font-black text-white tracking-tighter">Sales Forecasting</h2>
        </div>
        
        <div className="flex items-center gap-4 bg-white/5 p-2 rounded-2xl border border-white/10">
          <div className="pl-4 pr-2">
            <MapPin size={18} className="text-indigo-400" />
          </div>
          <select 
            value={selectedState} 
            onChange={(e) => setSelectedState(e.target.value)}
            className="bg-transparent border-none text-white font-black uppercase tracking-widest text-[10px] outline-none min-w-[200px] cursor-pointer py-3 pr-8"
          >
            {states.map(s => <option key={s} value={s} className="bg-[#1B1F2B]">{s}</option>)}
          </select>
        </div>
      </header>

      {error && (
        <div className="bg-red-500/10 border border-red-500/20 p-6 rounded-2xl flex items-center gap-4 text-red-500">
          <AlertCircle size={24} />
          <p className="text-sm font-bold uppercase tracking-widest">{error}</p>
        </div>
      )}

      {loading ? (
        <div className="flex flex-col items-center justify-center h-[50vh] space-y-4">
          <div className="w-10 h-10 border-4 border-white/5 border-t-indigo-500 rounded-full animate-spin" />
          <p className="text-slate-400 font-bold uppercase tracking-widest text-[10px]">Training Models & Analyzing Trends...</p>
        </div>
      ) : data ? (
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">
          {/* Main Chart */}
          <div className="xl:col-span-8 space-y-8">
            <div className="byte-card p-8">
              <div className="flex justify-between items-center mb-10">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-indigo-500 rounded-xl flex items-center justify-center shadow-lg">
                    <TrendingUp size={20} className="text-white" />
                  </div>
                  <div>
                    <h3 className="text-sm font-black uppercase tracking-widest text-white">8-Week Sales Forecast</h3>
                    <p className="text-[10px] text-slate-400 font-bold uppercase">{selectedState} Market Projection</p>
                  </div>
                </div>
                <div className="flex gap-6">
                   <div className="flex items-center gap-2">
                     <div className="w-3 h-3 rounded-full bg-indigo-500" />
                     <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Historical</span>
                   </div>
                   <div className="flex items-center gap-2">
                     <div className="w-3 h-3 rounded-full bg-fuchsia-500" />
                     <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Projected</span>
                   </div>
                </div>
              </div>

              <div className="h-[400px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#ffffff05" vertical={false} />
                    <XAxis 
                      dataKey="name" 
                      stroke="#475569" 
                      fontSize={10} 
                      tickLine={false} 
                      axisLine={false} 
                      tickFormatter={(val) => val.split('-').slice(1).join('/')}
                    />
                    <YAxis stroke="#475569" fontSize={10} tickLine={false} axisLine={false} tickFormatter={(val) => `$${(val/1e6).toFixed(1)}M`} />
                    <Tooltip content={<CustomTooltip />} />
                    <Line 
                      type="monotone" 
                      dataKey="actual" 
                      stroke="#6366f1" 
                      strokeWidth={4} 
                      dot={{ fill: '#6366f1', strokeWidth: 2, r: 4 }} 
                      activeDot={{ r: 8 }}
                      connectNulls
                    />
                    <Line 
                      type="monotone" 
                      dataKey="forecast" 
                      stroke="#d946ef" 
                      strokeWidth={4} 
                      strokeDasharray="8 4"
                      dot={{ fill: '#d946ef', strokeWidth: 2, r: 4 }}
                      connectNulls
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
               <div className="byte-card p-6 bg-indigo-600 border-none">
                 <div className="space-y-4">
                    <div className="flex justify-between items-start">
                      <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center">
                        <Activity size={24} className="text-white" />
                      </div>
                      <span className="bg-white/20 text-white text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-widest">Optimized</span>
                    </div>
                    <div>
                      <p className="text-indigo-100/60 font-black text-[10px] uppercase tracking-widest">Best Model Selected</p>
                      <h4 className="text-3xl font-black text-white tracking-tight">{data.best_model}</h4>
                      <p className="text-indigo-100/80 text-xs font-bold mt-2">
                        Achieved the lowest Mean Absolute Percentage Error (MAPE) of {(data.mape * 100).toFixed(2)}% during cross-validation.
                      </p>
                    </div>
                 </div>
               </div>

               <div className="byte-card p-6 border-white/5">
                 <div className="space-y-4">
                   <p className="text-slate-400 font-black text-[10px] uppercase tracking-widest flex items-center gap-2">
                     <PieChart size={14} className="text-indigo-400" />
                     Model Performance Comparison
                   </p>
                   <div className="h-[120px]">
                     <ResponsiveContainer width="100%" height="100%">
                       <BarChart data={metricsData} layout="vertical">
                         <XAxis type="number" hide />
                         <YAxis dataKey="name" type="category" stroke="#475569" fontSize={9} axisLine={false} tickLine={false} width={60} />
                         <Bar dataKey="mape" radius={[0, 4, 4, 0]} barSize={12}>
                           {metricsData.map((entry, index) => (
                             <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                           ))}
                         </Bar>
                       </BarChart>
                     </ResponsiveContainer>
                   </div>
                 </div>
               </div>
            </div>
          </div>

          {/* Sidebar Info */}
          <div className="xl:col-span-4 space-y-8">
             <div className="byte-card">
               <div className="byte-card-header border-b border-white/5">
                 <span className="text-sm font-black uppercase tracking-widest">Forecast Schedule</span>
                 <Calendar size={16} className="text-indigo-400" />
               </div>
               <div className="byte-card-content p-0">
                 {data.forecast.map((item, i) => (
                   <div key={i} className="flex items-center justify-between p-4 border-b border-white/5 hover:bg-white/5 transition-colors cursor-default">
                     <div className="flex items-center gap-4">
                       <div className="text-[10px] font-black text-slate-500 uppercase">Week {i+1}</div>
                       <div className="text-xs font-bold text-white">{item.Date}</div>
                     </div>
                     <div className="text-sm font-black text-indigo-400">
                       ${(item.Total / 1e6).toFixed(2)}M
                     </div>
                   </div>
                 ))}
               </div>
             </div>

             <div className="byte-card bg-[#1B1F2B] border-white/5 p-8 relative overflow-hidden">
                <div className="relative z-10 space-y-6">
                  <div className="w-12 h-12 bg-indigo-500/10 rounded-2xl flex items-center justify-center border border-indigo-500/20">
                    <BarChart3 size={24} className="text-indigo-400" />
                  </div>
                  <div className="space-y-2">
                    <h4 className="text-xl font-black text-white tracking-tight">Intelligence Report</h4>
                    <p className="text-xs text-slate-400 font-bold leading-relaxed">
                      Download the comprehensive forecasting analysis including model hyperparameters and feature importance scores.
                    </p>
                  </div>
                  <button className="flex items-center gap-2 text-[10px] font-black text-white bg-indigo-600 px-6 py-4 rounded-xl uppercase tracking-[0.2em] hover:bg-indigo-700 transition-all active:scale-95 shadow-lg shadow-indigo-600/20">
                    GENERATE PDF <ChevronRight size={14} />
                  </button>
                </div>
                <div className="absolute -right-10 -bottom-10 opacity-5">
                   <TrendingUp size={200} />
                </div>
             </div>
          </div>
        </div>
      ) : (
        <div className="byte-card border-dashed border-2 border-white/5 bg-transparent p-20 text-center">
          <TrendingUp className="text-white/10 mx-auto mb-6" size={64} />
          <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">Select a state to generate intelligence</p>
        </div>
      )}
    </div>
  );
};

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-[#1B1F2B] p-4 rounded-2xl border border-white/10 shadow-2xl animate-byte-slide">
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 border-b border-white/5 pb-2">{label}</p>
        <div className="space-y-1">
          {payload.map((p, i) => p.value && (
            <div key={i} className="flex items-center justify-between gap-6">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{p.name}</span>
              <span className={`text-sm font-black ${p.name === 'actual' ? 'text-indigo-400' : 'text-fuchsia-400'}`}>
                ${(p.value / 1e6).toFixed(2)}M
              </span>
            </div>
          ))}
        </div>
      </div>
    );
  }
  return null;
};

export default Forecasting;
