"use client";

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  Terminal, Activity, Brain, Send, Shield, Cpu, Search, Database, 
  CheckCircle2, Paperclip, StopCircle, History, Users, X, FileText, 
  Command, BarChart2, Code2, PenTool, Radar, Mic, Volume2, Sparkles, Network
} from 'lucide-react';

// --- คอมโพเนนต์ Typewriter (ความเร็วสมูทขึ้น) ---
const TypewriterEffect = ({ text }: { text: string }) => {
  const [displayedText, setDisplayedText] = useState("");
  useEffect(() => {
    let index = 0;
    const interval = setInterval(() => {
      setDisplayedText((prev) => prev + text.charAt(index));
      index++;
      if (index >= text.length) clearInterval(interval);
    }, 10); 
    return () => clearInterval(interval);
  }, [text]);
  return <span>{displayedText}</span>;
};

// --- คอมโพเนนต์คลื่นเสียงสไตล์ Siri/AI ---
const VoiceVisualizer = () => {
  return (
    <div className="flex items-center gap-1.5 h-full px-6">
      {[...Array(6)].map((_, i) => (
        <div 
          key={i} 
          className="w-1.5 bg-gradient-to-t from-violet-500 to-cyan-400 rounded-full animate-voice-bar shadow-[0_0_10px_rgba(139,92,246,0.5)]"
          style={{ animationDelay: `${i * 0.1}s`, height: `${Math.max(30, Math.random() * 100)}%` }}
        ></div>
      ))}
      <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-400 to-cyan-400 font-bold text-xs ml-4 tracking-[0.2em] animate-pulse">LISTENING...</span>
    </div>
  );
};

export default function NexusDashboard() {
  const [input, setInput] = useState("");
  const [agents, setAgents] = useState<any[]>([]); 
  const [tasks, setTasks] = useState<any[]>([]);   
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [elapsedTime, setElapsedTime] = useState(0); 
  const [sysLoad, setSysLoad] = useState(42); 
  
  const [activeTab, setActiveTab] = useState<'agents' | 'history'>('agents');
  const [attachedFile, setAttachedFile] = useState<File | null>(null);
  const [isListening, setIsListening] = useState(false); 
  
  const chatEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null); 
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // ดึงข้อมูล Agents
  useEffect(() => {
    const fetchAgents = async () => {
      try {
        const aRes = await fetch('/api/agents');
        if (aRes.ok) {
          const aData = await aRes.json();
          if (Array.isArray(aData)) setAgents(aData);
        }
      } catch (e) { console.error("Agent Sync Error:", e); }
    };
    fetchAgents();
  }, []);

  // ดึงข้อมูล Tasks
  const fetchTasks = useCallback(async () => {
    try {
      const tRes = await fetch('/api/tasks');
      if (tRes.ok) {
        const tData = await tRes.json();
        if (Array.isArray(tData)) setTasks(tData);
      }
    } catch (e) { console.error("Task Sync Error:", e); }
  }, []);

  useEffect(() => {
    fetchTasks();
    const interval = setInterval(fetchTasks, 5000); 
    const loadInterval = setInterval(() => setSysLoad(Math.floor(Math.random() * 50) + 15), 2500);
    return () => { clearInterval(interval); clearInterval(loadInterval); };
  }, [fetchTasks]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs, loading, attachedFile]);

  useEffect(() => {
    if (loading) {
      setElapsedTime(0);
      timerRef.current = setInterval(() => setElapsedTime(prev => prev + 1), 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); }
  }, [loading]);

  const stopMission = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort(); 
      setLoading(false);
      setLogs(prev => [...prev, { role: 'system', text: '🛑 DIRECTIVE OVERRIDDEN & ABORTED.', time: new Date().toLocaleTimeString() }]);
    }
  };

  const sendMission = async (forcedInput?: string) => {
    const taskContent = forcedInput || input;
    if ((!taskContent.trim() && !attachedFile) || loading) return;
    
    setIsListening(false);
    const currentFile = attachedFile;
    setInput(""); 
    setAttachedFile(null); 
    setLoading(true);
    
    abortControllerRef.current = new AbortController();
    
    setLogs(prev => [
      ...prev, 
      { role: 'user', text: taskContent, file: currentFile?.name, time: new Date().toLocaleTimeString() }
    ]);
    
    try {
      const formData = new FormData();
      formData.append('task', taskContent);
      if (currentFile) formData.append('file', currentFile);

      const res = await fetch('/api/mission', {
        method: 'POST',
        body: formData, 
        signal: abortControllerRef.current.signal
      });
      
      const data = await res.json();
      
      if (data.result) {
        setLogs(prev => [...prev, 
          { role: 'system', text: `SYNC SECURED: [${data.result.assignTo[0]}] ENGAGED.`, time: new Date().toLocaleTimeString(), searchMode: data.result.webSearch },
          { role: 'ai', agent: data.result.assignTo[0], text: data.result.summary, time: new Date().toLocaleTimeString(), coreReason: data.result.coreThinking }
        ]);
        fetchTasks();
      }
    } catch (e: any) {
      if (e.name !== 'AbortError') {
        setLogs(prev => [...prev, { role: 'error', text: 'CONNECTION LOST: Unable to reach Nexus Core.', time: new Date().toLocaleTimeString() }]);
      }
    } finally {
      if (abortControllerRef.current?.signal.aborted === false) setLoading(false);
    }
  };

  const categories = ["CORE", "TECH", "CREATIVE", "BUSINESS", "FINANCE"];
  const getAgentSprite = (agentName: string) => agents.find(a => a.name === agentName)?.sprite || '✨';

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) setAttachedFile(e.target.files[0]);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const quickDirectives = [
    { icon: <BarChart2 className="w-5 h-5"/>, text: "XAUUSD Analysis", desc: "Scan current market trends" },
    { icon: <Code2 className="w-5 h-5"/>, text: "Code Optimization", desc: "Audit structural integrity" },
    { icon: <PenTool className="w-5 h-5"/>, text: "Business Draft", desc: "Generate Smooth Start model" },
    { icon: <Shield className="w-5 h-5"/>, text: "System Audit", desc: "Check internal parameters" },
  ];

  return (
    <div className="flex h-screen w-full bg-[#020205] text-slate-200 font-sans overflow-hidden selection:bg-blue-500/30 selection:text-white relative">
      
      {/* 🌌 Ultra-Premium Cosmic Background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-blue-600/10 blur-[120px] rounded-full mix-blend-screen"></div>
        <div className="absolute bottom-[-20%] right-[-10%] w-[60%] h-[60%] bg-violet-600/10 blur-[150px] rounded-full mix-blend-screen"></div>
        <div className="absolute top-[20%] right-[20%] w-[30%] h-[30%] bg-cyan-500/5 blur-[100px] rounded-full mix-blend-screen animate-pulse-slow"></div>
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.03] mix-blend-overlay"></div>
      </div>

      <style dangerouslySetInnerHTML={{__html: `
        .custom-scrollbar::-webkit-scrollbar { width: 4px; height: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255, 255, 255, 0.1); border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(255, 255, 255, 0.3); }
        .animate-spin-slow { animation: spin 12s linear infinite; }
        .animate-pulse-slow { animation: pulse 6s cubic-bezier(0.4, 0, 0.6, 1) infinite; }
        .glass-panel { background: rgba(255, 255, 255, 0.02); backdrop-filter: blur(24px); -webkit-backdrop-filter: blur(24px); border: 1px solid rgba(255, 255, 255, 0.05); }
        .glass-card { background: rgba(255, 255, 255, 0.03); backdrop-filter: blur(16px); border: 1px solid rgba(255, 255, 255, 0.06); box-shadow: 0 8px 32px 0 rgba(0, 0, 0, 0.3); }
        @keyframes voice-bar { 0%, 100% { transform: scaleY(0.3); } 50% { transform: scaleY(1); } }
        .animate-voice-bar { animation: voice-bar 0.6s ease-in-out infinite; transform-origin: bottom; }
        .text-gradient { background-clip: text; -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
        .shimmer { position: relative; overflow: hidden; }
        .shimmer::before { content: ''; position: absolute; top: 0; left: -100%; width: 50%; height: 100%; background: linear-gradient(to right, transparent, rgba(255,255,255,0.1), transparent); transform: skewX(-20deg); animation: shimmer 3s infinite; }
        @keyframes shimmer { 100% { left: 200%; } }
      `}} />

      {/* 🛡️ 1. Elegant Sidebar */}
      <aside className="w-[340px] shrink-0 h-full glass-panel flex flex-col p-6 z-30 relative">
        
        {/* Premium Logo */}
        <div className="flex items-center gap-4 mb-8 group cursor-pointer">
          <div className="relative flex items-center justify-center w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-500/20 to-violet-500/20 border border-white/10 shadow-[0_0_20px_rgba(59,130,246,0.15)] group-hover:shadow-[0_0_30px_rgba(139,92,246,0.3)] transition-all duration-500 overflow-hidden">
            <Sparkles className="w-6 h-6 text-blue-300 shimmer" />
          </div>
          <div className="flex flex-col">
            <h1 className="font-black text-2xl tracking-[0.15em] bg-gradient-to-r from-white via-blue-100 to-violet-200 text-gradient">
              NEXUS<span className="text-blue-500 font-light">15</span>
            </h1>
            <p className="text-[9px] text-blue-400/80 font-mono uppercase tracking-[0.3em]">Syndicate Intelligence</p>
          </div>
        </div>

        {/* Floating Tabs */}
        <div className="flex p-1 bg-black/20 rounded-xl border border-white/5 mb-8">
          <button onClick={() => setActiveTab('agents')} className={`flex-1 py-2 rounded-lg text-[11px] font-bold tracking-widest transition-all duration-300 ${activeTab === 'agents' ? 'bg-white/10 text-white shadow-md' : 'text-slate-500 hover:text-slate-300'}`}>ROSTER</button>
          <button onClick={() => setActiveTab('history')} className={`flex-1 py-2 rounded-lg text-[11px] font-bold tracking-widest transition-all duration-300 ${activeTab === 'history' ? 'bg-white/10 text-white shadow-md' : 'text-slate-500 hover:text-slate-300'}`}>ARCHIVE</button>
        </div>
        
        <div className="flex-1 overflow-y-auto space-y-8 pr-2 custom-scrollbar">
          {activeTab === 'agents' ? (
            categories.map(cat => {
              const catAgents = agents.filter(a => a.category === cat);
              if(catAgents.length === 0) return null;
              return (
                <div key={cat} className="space-y-4 animate-in fade-in slide-in-from-left-4 duration-700">
                  <p className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.4em] font-mono ml-2">{cat}</p>
                  {catAgents.map(a => (
                    <div key={a.id} className="flex items-center gap-4 p-3 rounded-2xl hover:bg-white/5 transition-all duration-300 cursor-pointer group">
                      <div className="flex items-center justify-center w-12 h-12 bg-gradient-to-br from-white/5 to-transparent rounded-full border border-white/5 group-hover:border-blue-400/50 group-hover:scale-105 transition-all duration-300 shadow-lg">
                        <span className="text-xl">{a.sprite}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[14px] font-semibold text-slate-200 group-hover:text-white truncate transition-colors">{a.name}</p>
                        <p className="text-[10px] text-blue-400/70 font-mono truncate uppercase tracking-wider">{a.role}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )
            })
          ) : (
            <div className="space-y-3 animate-in fade-in slide-in-from-right-4 duration-700">
              {tasks.length === 0 && <p className="text-center text-slate-500 text-xs mt-10 font-mono uppercase tracking-widest">Archive Empty.</p>}
              {tasks.slice().reverse().map(t => (
                <div key={t.id} className="p-5 glass-card rounded-2xl hover:border-violet-500/30 transition-all cursor-pointer group">
                  <p className="text-[13px] text-slate-300 font-medium line-clamp-2 group-hover:text-white transition-colors">{t.title}</p>
                  <div className="mt-4 flex items-center justify-between">
                    <span className="text-[10px] text-slate-500 font-mono uppercase">{new Date(t.createdAt).toLocaleDateString()}</span>
                    <span className={`text-[9px] px-2.5 py-1 rounded-full font-bold uppercase tracking-widest ${t.status === 'completed' ? 'text-blue-300 bg-blue-500/10 border border-blue-500/20' : 'text-amber-300 bg-amber-500/10 border border-amber-500/20'}`}>
                      {t.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Minimal Telemetry */}
        <div className="mt-6 pt-6 border-t border-white/5 flex items-center justify-between px-2">
           <div className="flex flex-col gap-2">
              <span className="text-[9px] text-slate-400 font-mono uppercase tracking-[0.2em] flex items-center gap-2">Neural Load <span className="text-blue-400">{sysLoad}%</span></span>
              <div className="flex gap-1 h-1.5 w-24 bg-white/5 rounded-full overflow-hidden">
                <div className="h-full bg-gradient-to-r from-blue-500 to-violet-500 transition-all duration-1000 ease-out" style={{ width: `${sysLoad}%` }}></div>
              </div>
           </div>
           <Network className="w-5 h-5 text-slate-600 animate-pulse-slow" />
        </div>
      </aside>

      {/* 🚀 2. Main Center (Crystal Clear) */}
      <main className="flex-1 flex flex-col h-full relative z-20">
        
        {/* Sleek Top Bar */}
        <header className="h-20 shrink-0 flex items-center justify-between px-10 z-10">
           <div className="flex items-center gap-3 px-4 py-2 rounded-full glass-card border border-white/5 shadow-lg">
             <div className="w-2 h-2 rounded-full bg-blue-400 shadow-[0_0_10px_#60a5fa] animate-pulse"></div>
             <span className="text-[10px] font-bold text-slate-300 uppercase tracking-widest">Connection Secure</span>
           </div>
           <div className="flex items-center gap-3 text-slate-400 text-xs font-mono">
             <Shield className="w-4 h-4 text-violet-400"/>
             <span>CMDR <span className="text-white font-bold tracking-wider">KITTIPHOB</span></span>
           </div>
        </header>

        {/* Chat Area */}
        <section className="flex-1 overflow-y-auto p-10 custom-scrollbar relative z-10">
          <div className="max-w-4xl mx-auto space-y-12 pb-48">
            
            {logs.length === 0 && (
              <div className="h-full flex flex-col items-center justify-center mt-20 animate-in zoom-in duration-1000 slide-in-from-bottom-10">
                <div className="relative mb-10">
                  <div className="absolute inset-0 bg-blue-500/20 blur-[100px] rounded-full"></div>
                  <div className="w-32 h-32 rounded-full border-[0.5px] border-white/10 flex items-center justify-center relative z-10 shadow-[inset_0_0_40px_rgba(255,255,255,0.02)] shimmer">
                    <Sparkles className="w-12 h-12 text-blue-300 opacity-80" />
                  </div>
                </div>
                <h2 className="text-4xl font-black bg-gradient-to-b from-white to-slate-400 text-gradient tracking-[0.2em] mb-4">HOW CAN WE ASSIST?</h2>
                <p className="text-slate-500 font-mono text-[11px] tracking-[0.3em] mb-16 uppercase">Syndicate Awaiting Input</p>
                
                <div className="grid grid-cols-2 gap-4 w-full max-w-2xl">
                  {quickDirectives.map((qd, idx) => (
                    <button 
                      key={idx}
                      onClick={() => sendMission(qd.text)}
                      className="flex items-start gap-4 p-5 glass-card rounded-2xl hover:bg-white/5 hover:border-blue-500/30 hover:-translate-y-1 transition-all duration-300 text-left group"
                    >
                      <div className="p-2.5 bg-gradient-to-br from-white/10 to-transparent rounded-xl text-blue-300 group-hover:text-white transition-colors shadow-sm">
                        {qd.icon}
                      </div>
                      <div className="flex flex-col gap-1 mt-1">
                        <span className="text-[13px] font-bold text-slate-200 group-hover:text-white">{qd.text}</span>
                        <span className="text-[11px] text-slate-500 group-hover:text-slate-400">{qd.desc}</span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {logs.map((log, i) => (
              <div key={i} className={`flex items-start gap-6 ${log.role === 'user' ? 'flex-row-reverse' : 'flex-row'} animate-in slide-in-from-bottom-6 duration-700`}>
                
                {log.role !== 'system' && (
                  <div className={`shrink-0 w-12 h-12 flex items-center justify-center text-xl rounded-full relative overflow-hidden shadow-xl ${
                    log.role === 'user' ? 'bg-gradient-to-br from-blue-600 to-violet-600' : 
                    log.role === 'error' ? 'bg-gradient-to-br from-red-600 to-orange-600' : 'glass-panel'
                  }`}>
                    <span className="relative z-10">{log.role === 'user' ? '😎' : log.role === 'error' ? '💥' : getAgentSprite(log.agent)}</span>
                  </div>
                )}

                <div className={`flex flex-col ${log.role === 'user' ? 'items-end' : 'items-start'} max-w-[85%]`}>
                  {log.role !== 'system' && (
                    <div className="flex items-center gap-3 mb-2 px-2">
                      <span className="text-[11px] font-bold uppercase tracking-widest text-slate-400">
                        {log.role === 'user' ? 'Kit' : log.agent}
                      </span>
                      <span className="text-[9px] text-slate-600 font-mono">{log.time}</span>
                    </div>
                  )}

                  <div className={`p-6 relative text-[15px] backdrop-blur-2xl shadow-xl ${
                    log.role === 'user' ? 'bg-blue-600/10 border border-blue-500/20 text-white rounded-3xl rounded-tr-sm' : 
                    log.role === 'system' ? 'bg-transparent border-none text-slate-500 font-mono text-[10px] w-full my-2 flex flex-col gap-3 items-center' :
                    log.role === 'error' ? 'bg-red-950/30 border border-red-500/30 text-red-200 rounded-3xl rounded-tl-sm' :
                    'bg-white/[0.03] border border-white/5 text-slate-200 rounded-3xl rounded-tl-sm'
                  }`}>
                    
                    {log.role === 'system' && (
                      <div className="flex flex-col items-center gap-3">
                        <div className={`flex items-center gap-2 font-bold tracking-[0.2em] uppercase text-[10px] px-4 py-1.5 rounded-full glass-card ${log.text.includes('ABORTED') ? 'text-red-400 border-red-500/30' : 'text-blue-300 border-blue-500/20'}`}>
                          {log.text.includes('ABORTED') ? <StopCircle className="w-3.5 h-3.5"/> : <CheckCircle2 className="w-3.5 h-3.5"/>} 
                          {log.text}
                        </div>
                        {log.searchMode && log.searchMode !== "ใช้ข้อมูลภายใน" && (
                          <div className="px-4 py-1.5 bg-white/5 text-slate-300 border border-white/10 rounded-full flex items-center gap-2"><Search className="w-3 h-3 text-blue-400"/> {log.searchMode}</div>
                        )}
                        {log.searchMode === "ใช้ข้อมูลภายใน" && (
                          <div className="px-4 py-1.5 bg-white/5 text-slate-300 border border-white/10 rounded-full flex items-center gap-2"><Database className="w-3 h-3 text-violet-400"/> Database Extracted</div>
                        )}
                      </div>
                    )}

                    {log.file && (
                      <div className="mb-5 p-3.5 bg-white/5 border border-white/5 rounded-xl flex items-center gap-4 w-fit shadow-sm hover:bg-white/10 transition-colors cursor-default">
                        <div className="p-2 bg-blue-500/20 rounded-lg"><FileText className="w-5 h-5 text-blue-300"/></div>
                        <div className="flex flex-col pr-2">
                          <span className="text-[13px] text-white font-bold">{log.file}</span>
                          <span className="text-[10px] text-slate-400 font-mono uppercase">Attached Document</span>
                        </div>
                      </div>
                    )}

                    {log.role === 'ai' && log.coreReason && (
                       <div className="mb-5 pb-5 border-b border-white/5 text-[11px] text-slate-400 flex items-start gap-3">
                         <Brain className="w-4 h-4 text-violet-400 opacity-70 mt-0.5"/> 
                         <span className="leading-relaxed italic">"{log.coreReason}"</span>
                       </div>
                    )}

                    {log.role === 'ai' ? (
                      <div className="whitespace-pre-wrap leading-[1.8] tracking-wide text-slate-200">
                        <TypewriterEffect text={log.text} />
                      </div>
                    ) : (
                      log.role !== 'system' && <div className="whitespace-pre-wrap leading-[1.8] tracking-wide">{log.text}</div>
                    )}
                  </div>
                </div>
              </div>
            ))}
            
            {loading && (
              <div className="flex items-center gap-6 animate-in fade-in duration-500">
                <div className="shrink-0 w-12 h-12 rounded-full glass-panel flex items-center justify-center">
                  <div className="w-5 h-5 border-2 border-t-blue-400 border-r-blue-400 border-b-transparent border-l-transparent rounded-full animate-spin"></div>
                </div>
                <div className="glass-card px-6 py-4 rounded-2xl rounded-tl-sm flex items-center gap-6">
                  <span className="text-[11px] font-bold text-slate-300 tracking-[0.2em] uppercase flex items-center gap-3">
                    <Sparkles className="w-4 h-4 text-blue-400 animate-pulse"/> Synthesizing
                  </span>
                  <span className="text-[10px] font-mono text-slate-500 bg-white/5 px-2 py-1 rounded-md">{elapsedTime}s</span>
                </div>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>
        </section>

        {/* ⌨️ Floating Dock Console */}
        <div className="absolute bottom-10 left-0 right-0 px-8 z-20 pointer-events-none flex justify-center">
          <div className="w-full max-w-3xl relative pointer-events-auto group/console">
            
            {attachedFile && (
              <div className="absolute -top-16 left-1/2 -translate-x-1/2 glass-card px-5 py-2.5 rounded-full flex items-center gap-4 shadow-xl animate-in slide-in-from-bottom-2">
                <FileText className="w-4 h-4 text-blue-400"/>
                <span className="text-xs text-white font-medium max-w-[200px] truncate">{attachedFile.name}</span>
                <div className="w-[1px] h-4 bg-white/10"></div>
                <button type="button" onClick={() => setAttachedFile(null)} className="text-slate-400 hover:text-red-400 transition-colors">
                  <X className="w-4 h-4"/>
                </button>
              </div>
            )}
            
            {/* The Dock */}
            <div className="relative flex items-center bg-white/[0.04] backdrop-blur-3xl rounded-[2rem] border border-white/[0.08] shadow-[0_20px_40px_rgba(0,0,0,0.4)] p-2 transition-all duration-500 focus-within:bg-white/[0.06] focus-within:border-white/[0.15] focus-within:shadow-[0_20px_60px_rgba(59,130,246,0.15)]">
              
              <input type="file" className="hidden" ref={fileInputRef} onChange={handleFileChange} />
              
              <div className="flex gap-1 pl-2">
                <button 
                  type="button"
                  onClick={() => setIsListening(!isListening)}
                  className={`w-12 h-12 flex items-center justify-center rounded-full transition-all duration-300 ${isListening ? 'bg-red-500/10 text-red-400' : 'text-slate-400 hover:bg-white/5 hover:text-blue-300'}`}
                >
                  {isListening ? <Volume2 className="w-5 h-5 animate-pulse" /> : <Mic className="w-5 h-5" />}
                </button>

                <button 
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="w-12 h-12 flex items-center justify-center rounded-full text-slate-400 hover:bg-white/5 hover:text-blue-300 transition-all duration-300"
                >
                  <Paperclip className="w-5 h-5" />
                </button>
              </div>

              <div className="w-[1px] h-8 bg-white/10 mx-2"></div>

              {isListening ? (
                 <div className="flex-1 h-[52px] flex items-center bg-transparent mx-2">
                    <VoiceVisualizer />
                 </div>
              ) : (
                <textarea 
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      sendMission();
                    }
                  }}
                  placeholder="Ask Nexus anything..."
                  className="flex-1 bg-transparent py-4 px-4 text-[15px] focus:outline-none placeholder:text-slate-500 font-medium text-white resize-none max-h-[200px] custom-scrollbar"
                  rows={1}
                  onInput={(e) => {
                    const target = e.target as HTMLTextAreaElement;
                    target.style.height = 'auto';
                    target.style.height = `${Math.min(target.scrollHeight, 200)}px`;
                  }}
                />
              )}
              
              <div className="pr-2">
                {loading ? (
                  <button 
                    type="button"
                    onClick={stopMission}
                    className="h-12 px-6 rounded-full bg-red-500/10 text-red-400 hover:bg-red-500 hover:text-white transition-all duration-300 flex items-center gap-2"
                  >
                    <StopCircle className="w-4 h-4" />
                    <span className="text-[11px] font-bold tracking-widest uppercase">Stop</span>
                  </button>
                ) : (
                  <button 
                    type="button"
                    onClick={() => sendMission()}
                    disabled={(!input.trim() && !attachedFile) || isListening}
                    className={`h-12 w-12 flex items-center justify-center rounded-full transition-all duration-300 ${
                      (!input.trim() && !attachedFile) || isListening
                        ? 'bg-transparent text-slate-600' 
                        : 'bg-gradient-to-r from-blue-600 to-violet-600 hover:from-blue-500 hover:to-violet-500 text-white shadow-[0_0_20px_rgba(99,102,241,0.4)] hover:scale-105 active:scale-95'
                    }`}
                  >
                    <Send className="w-5 h-5 ml-1" />
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

      </main>
    </div>
  );
}