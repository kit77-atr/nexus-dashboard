"use client";
import { useState } from 'react';

export default function KnowledgeAdmin() {
  const [isLoading, setIsLoading] = useState(false);
  const [status, setStatus] = useState("SYSTEM READY");

  const handleSync = async () => {
    setIsLoading(true);
    setStatus("INITIALIZING NEURAL LINK... กำลังเชื่อมต่อสมองกล 🧠");
    
    try {
      const res = await fetch('/api/brain/sync', { method: 'POST' });
      const data = await res.json();
      
      if (res.ok) {
        setStatus(data.message);
      } else {
        setStatus(`ERROR: ${data.error}`);
      }
    } catch (e) {
      setStatus("CONNECTION FAILED ❌ ไม่สามารถเชื่อมต่อฐานข้อมูลได้");
    }
    
    setIsLoading(false);
  };

  return (
    <div className="min-h-screen bg-gray-950 text-cyan-400 p-8 md:p-16 font-mono flex items-center justify-center">
      <div className="w-full max-w-3xl border border-cyan-500/30 bg-gray-900/80 p-8 rounded-xl shadow-[0_0_30px_rgba(6,182,212,0.15)] backdrop-blur-sm">
        
        {/* Header Section */}
        <div className="mb-8 border-b border-cyan-800/50 pb-6">
          <h1 className="text-3xl md:text-4xl font-bold mb-2 tracking-widest text-white drop-shadow-[0_0_10px_rgba(255,255,255,0.3)]">
            NEXUS <span className="text-cyan-500">NEURAL CONTROL</span>
          </h1>
          <p className="text-gray-400">Corporate Brain Data Ingestion System (ระบบเติมความจำองค์กร)</p>
        </div>

        {/* Status Monitor Section */}
        <div className="bg-black/60 p-6 rounded-lg mb-8 border border-gray-800 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-1 h-full bg-cyan-500"></div>
          <h2 className="text-lg mb-3 text-cyan-300/80">
            SYSTEM STATUS: <span className={`ml-2 font-bold ${isLoading ? 'text-yellow-400 animate-pulse' : 'text-white'}`}>{status}</span>
          </h2>
          <p className="text-sm text-gray-500 leading-relaxed">
            ระบบจะทำการสแกนตาราง "Knowledge" ในฐานข้อมูล Supabase 
            หากพบข้อมูลใหม่ที่เพิ่งถูกเพิ่มเข้ามา ระบบจะเรียกใช้ Google Generative AI เพื่อแปลงข้อความเป็น Vector Embedding 
            และบันทึกลงสมองกลโดยอัตโนมัติ
          </p>
        </div>

        {/* Action Button */}
        <button
          onClick={handleSync}
          disabled={isLoading}
          className={`w-full py-5 rounded-md font-bold text-lg tracking-[0.2em] transition-all duration-300 relative overflow-hidden group
            ${isLoading 
              ? 'bg-gray-800 text-cyan-700 cursor-not-allowed border border-gray-700' 
              : 'bg-cyan-600 hover:bg-cyan-500 text-white shadow-[0_0_20px_rgba(6,182,212,0.4)] hover:shadow-[0_0_30px_rgba(6,182,212,0.6)] border border-cyan-400'
            }`}
        >
          {isLoading ? (
            <span className="flex items-center justify-center">
              <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-cyan-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              SYNCING NEURAL NETWORK...
            </span>
          ) : (
            'START NEURAL SYNC'
          )}
        </button>

      </div>
    </div>
  );
}