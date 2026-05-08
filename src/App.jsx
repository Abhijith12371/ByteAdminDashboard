import React, { useState, useEffect } from 'react';
import { Database, PlusCircle, FileUp, LayoutDashboard, ChevronRight, Menu, X, LogOut, User, Bell, Search, Settings, TrendingUp } from 'lucide-react';
import { supabase } from './lib/supabase';
import Auth from './components/Auth';
import ManualEntry from './components/ManualEntry';
import ExcelUpload from './components/ExcelUpload';
import Dashboard from './components/Dashboard';
import Forecasting from './components/Forecasting';

function App() {
  const [session, setSession] = useState(null);
  const [activeTab, setActiveTab] = useState('home');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0F1117] flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-white/5 border-t-indigo-500 rounded-full animate-spin" />
      </div>
    );
  }

  if (!session) {
    return <Auth />;
  }

  const handleSignOut = async () => {
    await supabase.auth.signOut();
  };

  const tabs = [
    { id: 'home', label: 'Admin Dashboard', icon: LayoutDashboard, status: 'Active' },
    { id: 'manual', label: 'Manual Entry', icon: PlusCircle, status: 'New' },
    { id: 'upload', label: 'Excel Upload', icon: FileUp, status: 'Active' },
    { id: 'dashboard', label: 'Data Library', icon: Database, status: 'Stable' },
    { id: 'forecasting', label: 'AI Forecasting', icon: TrendingUp, status: 'Beta' },
  ];

  const renderContent = () => {
    switch (activeTab) {
      case 'manual':
        return <ManualEntry onComplete={() => setActiveTab('dashboard')} />;
      case 'upload':
        return <ExcelUpload onComplete={() => setActiveTab('dashboard')} />;
      case 'dashboard':
        return <Dashboard />;
      case 'forecasting':
        return <Forecasting />;
      default:
        return (
          <div className="space-y-10 animate-byte-slide">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
              <div>
                <p className="text-indigo-400 font-bold text-xs uppercase tracking-[0.3em] mb-3">System Overview</p>
                <h1 className="text-4xl font-black text-white tracking-tighter">Welcome Back,</h1>
                <p className="text-slate-400 text-lg font-medium mt-1">Management Portal • {session.user.email}</p>
              </div>
              <div className="flex gap-3">
                 <button className="byte-button-secondary bg-white/5 border-white/10 text-white hover:bg-white/10">
                   <Settings size={18} /> Settings
                 </button>
                 <button onClick={() => setActiveTab('upload')} className="byte-button-primary">
                   <FileUp size={18} /> New Assessment
                 </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
              {/* Quick Action Cards styled like the mockups */}
              <div className="byte-card animate-byte-slide" style={{ animationDelay: '0.1s' }}>
                <div className="byte-card-header">
                  <span className="font-bold flex items-center gap-2 text-sm uppercase tracking-widest">
                    <LayoutDashboard size={16} className="text-indigo-400" /> Administrative Hub
                  </span>
                  <span className="status-tag status-stable">Online</span>
                </div>
                <div className="byte-card-content space-y-6">
                  <div className="flex items-center justify-between py-2 border-b border-slate-50">
                    <span className="text-slate-400 font-bold text-xs uppercase">Active Modules</span>
                    <span className="font-black text-lg text-slate-900">12</span>
                  </div>
                  <div className="flex items-center justify-between py-2 border-b border-slate-50">
                    <span className="text-slate-400 font-bold text-xs uppercase">Data Sync Status</span>
                    <span className="text-green-600 font-black text-sm">94.2% COMPLIANT</span>
                  </div>
                  <button onClick={() => setActiveTab('dashboard')} className="w-full byte-button-primary bg-[#1B1F2B] hover:bg-slate-800 text-xs py-3">
                    VIEW SYSTEM ANALYTICS
                  </button>
                </div>
              </div>

              <div className="byte-card animate-byte-slide" style={{ animationDelay: '0.2s' }}>
                <div className="byte-card-header">
                  <span className="font-bold flex items-center gap-2 text-sm uppercase tracking-widest">
                    <PlusCircle size={16} className="text-indigo-400" /> Manual Entry
                  </span>
                  <span className="status-tag status-active">Enabled</span>
                </div>
                <div className="byte-card-content space-y-4">
                  <p className="text-slate-500 text-sm leading-relaxed">
                    Access the centralized manual data entry portal to record assessments and academic metrics for individual students.
                  </p>
                  <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                    <div className="flex justify-between items-center mb-2">
                       <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Last Entry</span>
                       <span className="text-[10px] font-bold text-indigo-600 italic">2 mins ago</span>
                    </div>
                    <p className="text-xs font-black text-slate-900">Grade 5 - Section A / Math Quiz</p>
                  </div>
                  <button onClick={() => setActiveTab('manual')} className="w-full byte-button-primary text-xs py-3 mt-2">
                    START NEW ENTRY
                  </button>
                </div>
              </div>

              <div className="byte-card animate-byte-slide" style={{ animationDelay: '0.3s' }}>
                <div className="byte-card-header">
                  <span className="font-bold flex items-center gap-2 text-sm uppercase tracking-widest">
                    <FileUp size={16} className="text-indigo-400" /> Smart Import
                  </span>
                  <span className="status-tag status-attention">Review</span>
                </div>
                <div className="byte-card-content space-y-4">
                   <div className="flex items-center gap-4 mb-4">
                     <div className="w-12 h-12 bg-indigo-50 rounded-xl flex items-center justify-center text-indigo-600">
                       <Database size={24} />
                     </div>
                     <div>
                       <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Import Queue</p>
                       <p className="text-sm font-black text-slate-900">4 SPREADSHEETS PENDING</p>
                     </div>
                   </div>
                   <button onClick={() => setActiveTab('upload')} className="w-full byte-button-secondary text-xs py-3 flex items-center justify-center gap-2">
                     <FileUp size={14} /> INITIALIZE SMART UPLOAD
                   </button>
                </div>
              </div>
            </div>
          </div>
        );
    }
  };

  return (
    <div className="flex min-h-screen">
      {/* Sidebar - Inspired by "Byte" Sidebar style */}
      <aside 
        className={`${isSidebarOpen ? 'w-72' : 'w-24'} bg-[#1B1F2B] border-r border-white/5 transition-all duration-500 flex flex-col z-20 overflow-hidden`}
      >
        <div className="p-8 mb-8 flex items-center justify-between">
          {isSidebarOpen && <span className="text-2xl font-black text-white tracking-tighter">Byte</span>}
          <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="p-2.5 hover:bg-white/5 rounded-xl text-slate-400 transition-colors">
            {isSidebarOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>

        <nav className="flex-1 px-4 space-y-2">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`w-full flex items-center gap-4 px-4 py-4 rounded-xl transition-all relative group ${
                activeTab === tab.id 
                  ? 'bg-indigo-600 text-white shadow-xl shadow-indigo-500/20' 
                  : 'text-slate-400 hover:bg-white/5 hover:text-white'
              }`}
            >
              <tab.icon size={20} className={activeTab === tab.id ? 'text-white' : 'text-slate-500 group-hover:text-indigo-400 transition-colors'} />
              {isSidebarOpen && (
                <div className="flex-1 flex items-center justify-between">
                  <span className="font-bold text-sm tracking-tight">{tab.label}</span>
                  <span className={`status-tag scale-75 opacity-50 ${tab.status === 'New' ? 'status-active' : 'status-stable'}`}>
                    {tab.status}
                  </span>
                </div>
              )}
              {activeTab === tab.id && <div className="absolute left-0 w-1 h-8 bg-white rounded-r-full" />}
            </button>
          ))}
        </nav>

        <div className="p-6 border-t border-white/5 space-y-3">
          {isSidebarOpen && (
            <div className="flex items-center gap-3 p-3 rounded-xl bg-white/5 border border-white/5 mb-4">
              <div className="w-10 h-10 rounded-lg bg-indigo-600 flex items-center justify-center text-white font-bold shadow-lg shadow-indigo-500/20">
                {session.user.email[0].toUpperCase()}
              </div>
              <div className="overflow-hidden">
                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest leading-none mb-1">Authenticated</p>
                <p className="text-xs font-black text-white truncate">{session.user.email}</p>
              </div>
            </div>
          )}
          <button 
            onClick={handleSignOut}
            className={`w-full flex items-center gap-3 p-4 rounded-xl text-slate-400 hover:text-red-400 hover:bg-red-400/10 transition-all font-bold ${isSidebarOpen ? '' : 'justify-center'}`}
          >
            <LogOut size={20} />
            {isSidebarOpen && <span className="text-sm">Log Out System</span>}
          </button>
        </div>
      </aside>

      {/* Main Content Workspace */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        {/* Top Header Breadcrumbs */}
        <header className="h-20 bg-[#1B1F2B]/50 backdrop-blur-md border-b border-white/5 px-10 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-4 text-xs font-bold uppercase tracking-widest">
            <span className="text-slate-500">System</span>
            <ChevronRight size={14} className="text-slate-600" />
            <span className="text-indigo-400">{activeTab === 'home' ? 'Dashboard' : activeTab.replace('-', ' ')}</span>
          </div>
          <div className="flex items-center gap-6">
            <div className="relative hidden md:block">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
              <input type="text" placeholder="Global search..." className="bg-white/5 border border-white/10 rounded-lg pl-10 pr-4 py-2 text-xs text-white outline-none focus:border-indigo-500/50 w-64" />
            </div>
            <button className="relative p-2 text-slate-400 hover:text-white transition-colors">
              <Bell size={20} />
              <div className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border-2 border-[#1B1F2B]" />
            </button>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-10">
          <div className="max-w-7xl mx-auto">
            {renderContent()}
          </div>
        </main>
      </div>
    </div>
  );
}

export default App;
