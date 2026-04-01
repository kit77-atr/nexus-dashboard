"use client";
export const dynamic = 'force-dynamic';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  Terminal, Activity, Brain, Send, Shield, Cpu, Search, Database, 
  CheckCircle2, Paperclip, StopCircle, History, Users, X, FileText, 
  Command, BarChart2, Code2, PenTool, Radar, Mic, Volume2, Sparkles, Network,
  Menu, // 🌟 นำเข้า Menu สำหรับมือถือ
  icons
} from 'lucide-react';

// --- 🌟 Theme Colors สำหรับโลโก้แต่ละหมวดหมู่ ---
const getCategoryTheme = (category: string) => {
  switch(category?.toUpperCase()) {
    case 'CORE': return 'from-amber-400 to-orange-600 shadow-orange-500/30 text-white border-orange-400/30';
    case 'TECH': return 'from-cyan-400 to-blue-600 shadow-blue-500/30 text-white border-blue-400/30';
    case 'CREATIVE': return 'from-fuchsia-400 to-purple-600 shadow-purple-500/30 text-white border-purple-400/30';
    case 'FINANCE': return 'from-emerald-400 to-teal-600 shadow-teal-500/30 text-white border-teal-400/30';
    case 'BUSINESS': return 'from-indigo-400 to-violet-600 shadow-violet-500/30 text-white border-violet-400/30';
    default: return 'from-slate-400 to-slate-600 shadow-slate-500/30 text-white border-slate-400/30';
  }
};

// --- คอมโพเนนต์ใหม่: แปลงชื่อเป็นไอคอน (🌟 อัปเกรดเป็นรูประบบ 3D/รูปอัปโหลด) ---
const DynamicIcon = ({ name, className }: { name: string, className?: string }) => {
  if (!name) return <Sparkles className={className} />;
  
  // แปลงชื่อ Agent เป็นตัวเล็กติดกันเพื่อใช้เรียกไฟล์ เช่น "Nexus Core" -> "nexuscore"
  const formattedName = name.replace(/[^a-zA-Z0-9]/g, '').toLowerCase();

  return (
    <img 
      // 1. พยายามดึงรูปจากโฟลเดอร์ public/avatars/ ก่อน
      src={`/avatars/${formattedName}.png`} 
      alt={name} 
      className={`${className} object-cover w-full h-full rounded-full`}
      onError={(e) => {
        // 2. ถ้าหารูปในโฟลเดอร์ไม่เจอ ให้ดึงรูปหุ่นรบ 3D สุ่มอัตโนมัติจาก DiceBear
        (e.target as HTMLImageElement).src = `https://api.dicebear.com/7.x/bottts/svg?seed=${formattedName}&baseColor=475569,2563eb,8b5cf6&textureChance=100`;
      }}
    />
  );
};

// --- คอมโพเนนต์ Typewriter ---
const TypewriterEffect = ({ text }: { text: string }) => {
  const [displayedText, setDisplayedText] = useState("");
  useEffect(() => {
    let index = 0;
    const interval = setInterval(() => {
      setDisplayedText((prev) => prev + text.charAt(index));
      index++;
      
      // 🌟 แก้ไข: เพิ่มระบบ Auto-Scroll เลื่อนจอตามอัตโนมัติเวลา AI กำลังพิมพ์
      const chatBox = document.getElementById("nexus-chat-box");
      if (chatBox) {
        chatBox.scrollTop = chatBox.scrollHeight;
      }

      if (index >= text.length) clearInterval(interval);
    }, 10); 
    return () => clearInterval(interval);
  }, [text]);
  return <span>{displayedText}</span>;
};

// --- คอมโพเนนต์คลื่นเสียง ---
const VoiceVisualizer = () => {
  return (
    <div className="flex items-center gap-1.5 h-full px-4 md:px-6">
      {[...Array(6)].map((_, i) => (
        <div 
          key={i} 
          className="w-1 md:w-1.5 bg-gradient-to-t from-violet-500 to-cyan-400 rounded-full animate-voice-bar shadow-[0_0_10px_rgba(139,92,246,0.5)]"
          style={{ animationDelay: `${i * 0.1}s`, height: `${Math.max(30, Math.random() * 100)}%` }}
        ></div>
      ))}
      <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-400 to-cyan-400 font-bold text-[10px] md:text-xs ml-2 md:ml-4 tracking-[0.2em] animate-pulse">LISTENING...</span>
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
  
  // 🌟 State สำหรับเปิด-ปิดเมนูบนมือถือ
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  
  const chatEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null); 
  const timerRef = useRef<NodeJS.Timeout | null>(null);

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
      
      // 🌟 เพิ่มการดักจับ Error กรณี API หมดโควตา (Rate Limit / Insufficient Credits)
      if (!res.ok || data.error) {
         const errorMessage = data.error?.toLowerCase() || "";
         if (errorMessage.includes('limit') || errorMessage.includes('quota') || errorMessage.includes('credit') || errorMessage.includes('free') || errorMessage.includes('429')) {
             setLogs(prev => [...prev, { 
                role: 'error', 
                text: '⚠️ SYSTEM ALERT: ฐานข้อมูล API ฟรีถึงขีดจำกัดแล้ว (RATE LIMIT EXCEEDED).\n\nกรุณารอสักครู่ (ระบบจะรีเซ็ตโควตาอัตโนมัติในอีกประมาณ 1-5 นาที)', 
                time: new Date().toLocaleTimeString() 
             }]);
         } else {
             setLogs(prev => [...prev, { role: 'error', text: `API_ERROR: ${data.error || 'Connection Failed'}`, time: new Date().toLocaleTimeString() }]);
         }
         return; // หยุดการทำงานถ้าเกิด Error
      }
      
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
  
  const getAgentInfo = (agentName: string) => {
    return agents.find(a => a.name === agentName) || { icon: 'brain', category: 'CORE', sprite: '🤖', name: agentName };
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) setAttachedFile(e.target.files[0]);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const quickDirectives = [
    { icon: <BarChart2 className="w-5 h-5"/>, text: "XAUUSD Analysis", desc: "Scan market trends" },
    { icon: <Code2 className="w-5 h-5"/>, text: "Code Optimization", desc: "Audit structural code" },
    { icon: <PenTool className="w-5 h-5"/>, text: "Business Draft", desc: "Generate Smooth Start" },
    { icon: <Shield className="w-5 h-5"/>, text: "System Audit", desc: "Check internal params" },
  ];

  return (
    <div className="flex h-[100dvh] w-full bg-[#020205] text-slate-200 font-sans overflow-hidden selection:bg-blue-500/30 selection:text-white relative">
      
      {/* 🌌 Cosmic Background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
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

      {/* 📱 Overlay สำหรับมือถือเวลาเปิดเมนู */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-30 md:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* 🛡️ 1. Elegant Sidebar (Responsive) */}
      <aside className={`fixed md:relative z-40 w-[85%] max-w-[340px] shrink-0 h-full glass-panel flex flex-col p-6 transform transition-transform duration-300 ease-in-out ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0 shadow-2xl md:shadow-none bg-[#020205]/95 md:bg-transparent`}>
        
        {/* Mobile Close Button */}
        <button 
          className="absolute top-6 right-6 p-2 rounded-full hover:bg-white/10 md:hidden transition-colors"
          onClick={() => setIsSidebarOpen(false)}
        >
          <X className="w-5 h-5 text-slate-300" />
        </button>

        {/* Premium Logo */}
        <div className="flex items-center gap-4 mb-8 group cursor-pointer mt-2 md:mt-0 relative z-10">
          <div className="relative flex items-center justify-center w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-500/20 to-violet-500/20 border border-white/10 shadow-[0_0_20px_rgba(59,130,246,0.15)] group-hover:shadow-[0_0_30px_rgba(139,92,246,0.3)] transition-all duration-500 overflow-hidden">
            <Sparkles className="w-6 h-6 text-blue-300 shimmer" />
          </div>
          <div className="flex flex-col">
            <h1 className="font-black text-xl md:text-2xl tracking-[0.15em] bg-gradient-to-r from-white via-blue-100 to-violet-200 text-gradient">
              NEXUS<span className="text-blue-500 font-light">15</span>
            </h1>
            <p className="text-[8px] md:text-[9px] text-blue-400/80 font-mono uppercase tracking-[0.3em]">Syndicate Intelligence</p>
          </div>
        </div>

        {/* Floating Tabs */}
        <div className="flex p-1 bg-black/20 rounded-xl border border-white/5 mb-8 relative z-10">
          <button onClick={() => setActiveTab('agents')} className={`flex-1 py-2 rounded-lg text-[10px] md:text-[11px] font-bold tracking-widest transition-all duration-300 ${activeTab === 'agents' ? 'bg-white/10 text-white shadow-md' : 'text-slate-500 hover:text-slate-300'}`}>ROSTER</button>
          <button onClick={() => setActiveTab('history')} className={`flex-1 py-2 rounded-lg text-[10px] md:text-[11px] font-bold tracking-widest transition-all duration-300 ${activeTab === 'history' ? 'bg-white/10 text-white shadow-md' : 'text-slate-500 hover:text-slate-300'}`}>ARCHIVE</button>
        </div>
        
        <div className="flex-1 overflow-y-auto space-y-6 md:space-y-8 pr-2 custom-scrollbar pb-10 relative z-10">
          {activeTab === 'agents' ? (
            categories.map(cat => {
              const catAgents = agents.filter(a => a.category === cat);
              if(catAgents.length === 0) return null;
              return (
                <div key={cat} className="space-y-3 md:space-y-4 animate-in fade-in slide-in-from-left-4 duration-700">
                  <p className="text-[9px] md:text-[10px] font-bold text-slate-500 uppercase tracking-[0.4em] font-mono ml-2">{cat}</p>
                  {catAgents.map(a => {
                    const theme = getCategoryTheme(a.category);
                    
                    return (
                      <div key={a.id} className="flex items-center gap-4 p-2.5 md:p-3 rounded-2xl hover:bg-white/5 transition-all duration-300 cursor-pointer group">
                        <div className={`flex items-center justify-center w-10 h-10 md:w-12 md:h-12 bg-gradient-to-br ${theme} p-0.5 rounded-full group-hover:scale-110 transition-all duration-300 shadow-lg relative overflow-hidden`}>
                          <DynamicIcon name={a.name} className="w-full h-full" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-[13px] md:text-[14px] font-semibold text-slate-200 group-hover:text-white truncate transition-colors">{a.name}</p>
                          <p className="text-[9px] md:text-[10px] text-blue-400/70 font-mono truncate uppercase tracking-wider">{a.role}</p>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )
            })
          ) : (
            <div className="space-y-3 animate-in fade-in slide-in-from-right-4 duration-700">
              {tasks.length === 0 && <p className="text-center text-slate-500 text-xs mt-10 font-mono uppercase tracking-widest">Archive Empty.</p>}
              {tasks.slice().reverse().map(t => (
                <div key={t.id} className="p-4 md:p-5 glass-card rounded-2xl hover:border-violet-500/30 transition-all cursor-pointer group">
                  <p className="text-[12px] md:text-[13px] text-slate-300 font-medium line-clamp-2 group-hover:text-white transition-colors">{t.title}</p>
                  <div className="mt-4 flex items-center justify-between">
                    <span className="text-[9px] md:text-[10px] text-slate-500 font-mono uppercase">{new Date(t.createdAt).toLocaleDateString()}</span>
                    <span className={`text-[8px] md:text-[9px] px-2 py-1 rounded-full font-bold uppercase tracking-widest ${t.status === 'completed' ? 'text-blue-300 bg-blue-500/10 border border-blue-500/20' : 'text-amber-300 bg-amber-500/10 border border-amber-500/20'}`}>
                      {t.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Minimal Telemetry */}
        <div className="mt-auto pt-6 border-t border-white/5 flex items-center justify-between px-2 relative z-10">
           <div className="flex flex-col gap-2">
              <span className="text-[8px] md:text-[9px] text-slate-400 font-mono uppercase tracking-[0.2em] flex items-center gap-2">Neural Load <span className="text-blue-400">{sysLoad}%</span></span>
              <div className="flex gap-1 h-1.5 w-20 md:w-24 bg-white/5 rounded-full overflow-hidden">
                <div className="h-full bg-gradient-to-r from-blue-500 to-violet-500 transition-all duration-1000 ease-out" style={{ width: `${sysLoad}%` }}></div>
              </div>
           </div>
           <Network className="w-4 h-4 md:w-5 md:h-5 text-slate-600 animate-pulse-slow" />
        </div>
      </aside>

      {/* 🚀 2. Main Center */}
      <main className="flex-1 flex flex-col h-[100dvh] relative z-20 w-full overflow-hidden bg-transparent">
        
        {/* Sleek Top Bar (Responsive) */}
        <header className="h-16 md:h-20 shrink-0 flex items-center justify-between px-4 md:px-10 z-10 glass-panel md:bg-transparent md:border-none md:backdrop-filter-none border-b border-white/5">
           <div className="flex items-center gap-3">
             <button 
               onClick={() => setIsSidebarOpen(true)}
               className="md:hidden p-2 -ml-2 text-slate-300 hover:text-white transition-colors rounded-full hover:bg-white/5"
             >
               <Menu className="w-6 h-6" />
             </button>
             
             <div className="hidden md:flex items-center gap-3 px-4 py-2 rounded-full glass-card border border-white/5 shadow-lg">
               <div className="w-2 h-2 rounded-full bg-blue-400 shadow-[0_0_10px_#60a5fa] animate-pulse"></div>
               <span className="text-[10px] font-bold text-slate-300 uppercase tracking-widest">Connection Secure</span>
             </div>
           </div>
           
           <div className="flex items-center gap-2 md:gap-3 text-slate-400 text-[10px] md:text-xs font-mono">
             <Shield className="w-3 h-3 md:w-4 md:h-4 text-violet-400"/>
             <span>CMDR <span className="text-white font-bold tracking-wider">KITTIPHOB</span></span>
           </div>
        </header>

        <section id="nexus-chat-box" className="flex-1 overflow-y-auto px-4 md:px-10 pt-4 pb-40 md:pb-64 custom-scrollbar relative z-10 w-full scroll-smooth">
          <div className="max-w-4xl mx-auto space-y-8 md:space-y-12 min-h-full flex flex-col pb-10">
            
            {logs.length === 0 && (
              <div className="flex-1 flex flex-col items-center justify-center mt-10 md:mt-20 animate-in zoom-in duration-1000 slide-in-from-bottom-10">
                <div className="relative mb-6 md:mb-10">
                  <div className="absolute inset-0 bg-blue-500/20 blur-[80px] md:blur-[100px] rounded-full"></div>
                  <div className="w-24 h-24 md:w-32 md:h-32 rounded-full border-[0.5px] border-white/10 flex items-center justify-center relative z-10 shadow-[inset_0_0_40px_rgba(255,255,255,0.02)] shimmer bg-black/20 backdrop-blur-sm">
                    <Sparkles className="w-10 h-10 md:w-12 md:h-12 text-blue-300 opacity-80" />
                  </div>
                </div>
                <h2 className="text-2xl md:text-4xl font-black bg-gradient-to-b from-white to-slate-400 text-gradient tracking-[0.1em] md:tracking-[0.2em] mb-2 md:mb-4 text-center">HOW CAN WE ASSIST?</h2>
                <p className="text-slate-500 font-mono text-[9px] md:text-[11px] tracking-[0.2em] md:tracking-[0.3em] mb-10 md:mb-16 uppercase text-center">Syndicate Awaiting Input</p>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4 w-full max-w-2xl px-2">
                  {quickDirectives.map((qd, idx) => (
                    <button 
                      key={idx}
                      onClick={() => sendMission(qd.text)}
                      className="flex items-start gap-3 md:gap-4 p-4 md:p-5 glass-card rounded-2xl hover:bg-white/5 hover:border-blue-500/30 hover:-translate-y-1 transition-all duration-300 text-left group"
                    >
                      <div className="p-2 md:p-2.5 bg-gradient-to-br from-white/10 to-transparent rounded-xl text-blue-300 group-hover:text-white transition-colors shadow-sm">
                        {qd.icon}
                      </div>
                      <div className="flex flex-col gap-0.5 md:gap-1 mt-0.5 md:mt-1">
                        <span className="text-[12px] md:text-[13px] font-bold text-slate-200 group-hover:text-white">{qd.text}</span>
                        <span className="text-[10px] md:text-[11px] text-slate-500 group-hover:text-slate-400">{qd.desc}</span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {logs.map((log, i) => {
              const agentDetails = getAgentInfo(log.agent);
              const theme = getCategoryTheme(agentDetails.category);

              return (
                <div key={i} className={`flex items-start gap-3 md:gap-6 w-full ${log.role === 'user' ? 'flex-row-reverse' : 'flex-row'} animate-in slide-in-from-bottom-6 duration-700`}>
                  
                  {log.role !== 'system' && (
                    <div className={`shrink-0 w-8 h-8 md:w-12 md:h-12 flex items-center justify-center text-sm md:text-xl rounded-full relative overflow-hidden shadow-xl ${
                      log.role === 'user' ? 'bg-gradient-to-br from-blue-600 to-violet-600 p-0' : 
                      log.role === 'error' ? 'bg-gradient-to-br from-red-600 to-orange-600 p-0' : 
                      `bg-gradient-to-br ${theme} p-0.5`
                    }`}>
                      <span className="relative z-10 w-full h-full flex items-center justify-center drop-shadow-md">
                        {log.role === 'user' ? '😎' : 
                         log.role === 'error' ? '💥' : 
                         <DynamicIcon name={agentDetails.name} className="w-full h-full" />
                        }
                      </span>
                    </div>
                  )}

                  <div className={`flex flex-col ${log.role === 'user' ? 'items-end' : 'items-start'} w-full max-w-[90%] md:max-w-[85%]`}>
                    {log.role !== 'system' && (
                      <div className="flex items-center gap-2 md:gap-3 mb-1.5 md:mb-2 px-1 md:px-2">
                        <span className="text-[9px] md:text-[11px] font-bold uppercase tracking-widest text-slate-400">
                          {log.role === 'user' ? 'Kit' : log.agent}
                        </span>
                        <span className="text-[8px] md:text-[9px] text-slate-600 font-mono">{log.time}</span>
                      </div>
                    )}

                    <div className={`p-4 md:p-6 relative text-[13px] md:text-[15px] backdrop-blur-2xl shadow-xl w-fit ${
                      log.role === 'user' ? 'bg-blue-600/10 border border-blue-500/20 text-white rounded-3xl rounded-tr-sm' : 
                      log.role === 'system' ? 'bg-transparent border-none text-slate-500 font-mono text-[9px] md:text-[10px] w-full my-1 flex flex-col gap-2 md:gap-3 items-center' :
                      log.role === 'error' ? 'bg-red-950/30 border border-red-500/30 text-red-200 rounded-3xl rounded-tl-sm' :
                      'bg-white/[0.04] border border-white/10 text-slate-200 rounded-3xl rounded-tl-sm'
                    }`}>
                      
                      {log.role === 'system' && (
                        <div className="flex flex-col items-center gap-2 md:gap-3">
                          <div className={`flex items-center gap-1.5 md:gap-2 font-bold tracking-[0.1em] md:tracking-[0.2em] uppercase text-[8px] md:text-[10px] px-3 md:px-4 py-1.5 rounded-full glass-card ${log.text.includes('ABORTED') ? 'text-red-400 border-red-500/30' : log.text.includes('RATE LIMIT') ? 'text-amber-400 border-amber-500/30 bg-amber-950/40' : 'text-blue-300 border-blue-500/20'}`}>
                            {log.text.includes('ABORTED') ? <StopCircle className="w-3 h-3 md:w-3.5 md:h-3.5"/> : <CheckCircle2 className="w-3 h-3 md:w-3.5 md:h-3.5"/>} 
                            {log.text}
                          </div>
                          {log.searchMode && log.searchMode !== "ใช้ข้อมูลภายใน" && (
                            <div className="px-3 md:px-4 py-1.5 bg-white/5 text-slate-300 border border-white/10 rounded-full flex items-center gap-1.5 md:gap-2"><Search className="w-3 h-3 text-blue-400"/> {log.searchMode}</div>
                          )}
                          {log.searchMode === "ใช้ข้อมูลภายใน" && (
                            <div className="px-3 md:px-4 py-1.5 bg-white/5 text-slate-300 border border-white/10 rounded-full flex items-center gap-1.5 md:gap-2"><Database className="w-3 h-3 text-violet-400"/> Database Extracted</div>
                          )}
                        </div>
                      )}

                      {log.file && (
                        <div className="mb-4 md:mb-5 p-2.5 md:p-3.5 bg-white/5 border border-white/5 rounded-xl flex items-center gap-3 md:gap-4 w-fit shadow-sm hover:bg-white/10 transition-colors cursor-default">
                          <div className="p-1.5 md:p-2 bg-blue-500/20 rounded-lg"><FileText className="w-4 h-4 md:w-5 md:h-5 text-blue-300"/></div>
                          <div className="flex flex-col pr-2">
                            <span className="text-[11px] md:text-[13px] text-white font-bold">{log.file}</span>
                            <span className="text-[9px] md:text-[10px] text-slate-400 font-mono uppercase">Attached Document</span>
                          </div>
                        </div>
                      )}

                      {log.role === 'ai' && log.coreReason && (
                         <div className="mb-4 md:mb-5 pb-4 md:pb-5 border-b border-white/5 text-[10px] md:text-[11px] text-slate-400 flex items-start gap-2 md:gap-3">
                           <Brain className="w-3 h-3 md:w-4 md:h-4 text-violet-400 opacity-70 mt-0.5 shrink-0"/> 
                           <span className="leading-relaxed italic break-words">"{log.coreReason}"</span>
                         </div>
                      )}

                      {log.role === 'ai' ? (
                        <div className="whitespace-pre-wrap leading-[1.7] md:leading-[1.8] tracking-wide text-slate-200 break-words w-full">
                          <TypewriterEffect text={log.text} />
                        </div>
                      ) : (
                        log.role !== 'system' && <div className="whitespace-pre-wrap leading-[1.7] md:leading-[1.8] tracking-wide break-words w-full">{log.text}</div>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
            
            {loading && (
              <div className="flex items-center gap-4 md:gap-6 animate-in fade-in duration-500 w-full">
                <div className="shrink-0 w-8 h-8 md:w-12 md:h-12 rounded-full glass-panel flex items-center justify-center">
                  <div className="w-4 h-4 md:w-5 md:h-5 border-2 border-t-blue-400 border-r-blue-400 border-b-transparent border-l-transparent rounded-full animate-spin"></div>
                </div>
                <div className="glass-card px-4 md:px-6 py-3 md:py-4 rounded-2xl rounded-tl-sm flex items-center gap-4 md:gap-6">
                  <span className="text-[9px] md:text-[11px] font-bold text-slate-300 tracking-[0.1em] md:tracking-[0.2em] uppercase flex items-center gap-2 md:gap-3">
                    <Sparkles className="w-3 h-3 md:w-4 md:h-4 text-blue-400 animate-pulse"/> Synthesizing
                  </span>
                  <span className="text-[9px] md:text-[10px] font-mono text-slate-500 bg-white/5 px-2 py-1 rounded-md">{elapsedTime}s</span>
                </div>
              </div>
            )}
            
            <div className="h-24 md:h-32 shrink-0 w-full"></div>
            <div ref={chatEndRef} />
          </div>
        </section>

        {/* ⌨️ Floating Dock Console */}
        <div className="absolute bottom-4 md:bottom-10 left-0 right-0 px-4 md:px-8 z-20 flex justify-center pb-safe">
          <div className="w-full max-w-3xl relative pointer-events-auto group/console">
            
            {attachedFile && (
              <div className="absolute -top-14 md:-top-16 left-1/2 -translate-x-1/2 glass-card px-4 md:px-5 py-2 md:py-2.5 rounded-full flex items-center gap-2 md:gap-4 shadow-xl animate-in slide-in-from-bottom-2 w-max max-w-[90%]">
                <FileText className="w-3 h-3 md:w-4 md:h-4 text-blue-400 shrink-0"/>
                <span className="text-[10px] md:text-xs text-white font-medium max-w-[150px] md:max-w-[200px] truncate">{attachedFile.name}</span>
                <div className="w-[1px] h-3 md:h-4 bg-white/10 shrink-0"></div>
                <button type="button" onClick={() => setAttachedFile(null)} className="text-slate-400 hover:text-red-400 transition-colors shrink-0">
                  <X className="w-3 h-3 md:w-4 md:h-4"/>
                </button>
              </div>
            )}
            
            {/* The Dock */}
            <div className="relative flex items-center bg-black/40 backdrop-blur-3xl rounded-[2rem] border border-white/[0.08] shadow-[0_20px_40px_rgba(0,0,0,0.4)] p-1.5 md:p-2 transition-all duration-500 focus-within:bg-black/60 focus-within:border-white/[0.15] focus-within:shadow-[0_20px_60px_rgba(59,130,246,0.15)]">
              
              <input type="file" className="hidden" ref={fileInputRef} onChange={handleFileChange} />
              
              <div className="flex gap-0.5 md:gap-1 pl-1 md:pl-2">
                <button 
                  type="button"
                  onClick={() => setIsListening(!isListening)}
                  className={`w-10 h-10 md:w-12 md:h-12 flex items-center justify-center rounded-full transition-all duration-300 ${isListening ? 'bg-red-500/10 text-red-400' : 'text-slate-400 hover:bg-white/5 hover:text-blue-300'}`}
                >
                  {isListening ? <Volume2 className="w-4 h-4 md:w-5 md:h-5 animate-pulse" /> : <Mic className="w-4 h-4 md:w-5 md:h-5" />}
                </button>

                <button 
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="w-10 h-10 md:w-12 md:h-12 flex items-center justify-center rounded-full text-slate-400 hover:bg-white/5 hover:text-blue-300 transition-all duration-300"
                >
                  <Paperclip className="w-4 h-4 md:w-5 md:h-5" />
                </button>
              </div>

              <div className="w-[1px] h-6 md:h-8 bg-white/10 mx-1 md:mx-2"></div>

              {isListening ? (
                 <div className="flex-1 h-[40px] md:h-[52px] flex items-center bg-transparent mx-1 md:mx-2">
                    <VoiceVisualizer />
                 </div>
              ) : (
                <textarea 
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === 'Enter' && !e.shiftKey && window.innerWidth > 768) {
                      e.preventDefault();
                      sendMission();
                    }
                  }}
                  placeholder="Ask Nexus..."
                  className="flex-1 bg-transparent py-3 md:py-4 px-2 md:px-4 text-[13px] md:text-[15px] focus:outline-none placeholder:text-slate-500 font-medium text-white resize-none max-h-[120px] md:max-h-[200px] custom-scrollbar"
                  rows={1}
                  onInput={(e) => {
                    const target = e.target as HTMLTextAreaElement;
                    target.style.height = 'auto';
                    target.style.height = `${Math.min(target.scrollHeight, window.innerWidth < 768 ? 120 : 200)}px`;
                  }}
                />
              )}
              
              <div className="pr-1 md:pr-2 pl-1">
                {loading ? (
                  <button 
                    type="button"
                    onClick={stopMission}
                    className="h-10 md:h-12 px-4 md:px-6 rounded-full bg-red-500/10 text-red-400 hover:bg-red-500 hover:text-white transition-all duration-300 flex items-center gap-1.5 md:gap-2"
                  >
                    <StopCircle className="w-3 h-3 md:w-4 md:h-4" />
                    <span className="text-[9px] md:text-[11px] font-bold tracking-widest uppercase hidden sm:block">Stop</span>
                  </button>
                ) : (
                  <button 
                    type="button"
                    onClick={() => sendMission()}
                    disabled={(!input.trim() && !attachedFile) || isListening}
                    className={`h-10 w-10 md:h-12 md:w-12 flex items-center justify-center rounded-full transition-all duration-300 shrink-0 ${
                      (!input.trim() && !attachedFile) || isListening
                        ? 'bg-transparent text-slate-600' 
                        : 'bg-gradient-to-r from-blue-600 to-violet-600 hover:from-blue-500 hover:to-violet-500 text-white shadow-[0_0_20px_rgba(99,102,241,0.4)] hover:scale-105 active:scale-95'
                    }`}
                  >
                    <Send className="w-4 h-4 md:w-5 md:h-5 ml-0.5 md:ml-1" />
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