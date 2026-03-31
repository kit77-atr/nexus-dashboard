import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { GoogleGenerativeAI } from '@google/generative-ai'; 

const prisma = new PrismaClient();

// 💾 ระบบ Cache จำรายชื่อรุ่น AI 
let cachedFreeModels: string[] = [];
let lastFetchTime = 0;

async function getLiveFreeModels() {
  if (cachedFreeModels.length > 0 && Date.now() - lastFetchTime < 3600000) {
    return cachedFreeModels;
  }
  
  try {
    const res = await fetch("https://openrouter.ai/api/v1/models");
    const data = await res.json();
    
    let freeModels = data.data
      .filter((m: any) => m.id.endsWith(':free'))
      .map((m: any) => m.id);
      
    const prioritize = ["google/gemini-1.5-flash:free", "google/gemini-1.5-pro:free", "meta-llama/llama-3-8b-instruct:free"];
    freeModels = [...new Set([...prioritize, ...freeModels])].filter(id => freeModels.includes(id));

    cachedFreeModels = freeModels;
    lastFetchTime = Date.now();
    return freeModels;
  } catch (e) {
    return ["google/gemini-1.5-flash:free", "meta-llama/llama-3-8b-instruct:free"]; 
  }
}

// 🌐 1. ค้นหาข้อมูลสด 
async function searchWeb(query: string) {
  if (!process.env.SERPER_API_KEY) return "⚠️ ไม่ได้ตั้งค่า SERPER_API_KEY";
  try {
    const res = await fetch("https://google.serper.dev/search", {
      method: "POST",
      headers: {
        "X-API-KEY": process.env.SERPER_API_KEY,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ q: query, gl: "th", hl: "th" })
    });
    const data = await res.json();
    return data.organic?.map((item: any) => `[${item.title}]: ${item.snippet}`).slice(0, 3).join("\n") || "ไม่พบข้อมูลสด";
  } catch (e) {
    return "⚠️ ระบบค้นหาภายนอกขัดข้อง";
  }
}

// 🧠 2. ระบบ Routing Model 
async function callAI(prompt: string, mode: 'core' | 'agent') {
  const targetModels = await getLiveFreeModels();

  for (const modelId of targetModels) {
    try {
      console.log(`📡 [${mode.toUpperCase()}] TRYING: ${modelId}...`);
      const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${process.env.OPENROUTER_API_KEY}`,
          "HTTP-Referer": "http://localhost:3000",
          "X-Title": "Nexus Squad Workflow",
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          model: modelId,
          messages: [{ role: "user", content: prompt }],
          max_tokens: mode === 'core' ? 300 : 4000 
        })
      });

      const result = await response.json();
      
      if (result.choices && result.choices[0].message.content) {
        return result.choices[0].message.content;
      } 
      
    } catch (e) {
      console.error(`❌ [NODE CRASH]: ${modelId}`);
    }
    
    await new Promise(r => setTimeout(r, 1000));
  }
  
  console.log("⚠️ OpenRouter โควตาเต็ม! สลับเครื่องยนต์ไปใช้ Gemini API โดยตรง...");
  if (process.env.GOOGLE_GENERATIVE_AI_API_KEY) {
    const googleModels = ["gemini-2.0-flash", "gemini-1.5-flash-latest", "gemini-1.5-pro", "gemini-pro"];
    
    for (const gModel of googleModels) {
      try {
        console.log(`📡 [GEMINI FALLBACK] TRYING: ${gModel}...`);
        const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GENERATIVE_AI_API_KEY);
        const model = genAI.getGenerativeModel({ model: gModel });
        const result = await model.generateContent(prompt);
        return result.response.text();
      } catch (geminiError: any) {
        console.warn(`⚠️ [GEMINI REJECTED] ${gModel} โดนปฏิเสธ:`, geminiError.message);
      }
    }
  }

  throw new Error("AI โควตาฟรีขัดข้องทั้งหมด โปรดเช็ค API Key ของ OpenRouter หรือ Gemini");
}

// 🔁 3. ฟังก์ชันเรียก AI ซ้ำ
async function callAIUntilFinished(basePrompt: string, previousContent = "", depth = 0): Promise<string> {
  if (depth >= 1) return previousContent; 

  let currentPrompt = basePrompt;
  if (previousContent) {
    currentPrompt = `${basePrompt}\n\n[⚠️ พิมพ์ต่อจากประโยคนี้ให้จบ ห้ามทวนซ้ำ: "${previousContent.slice(-100)}"]`;
  }

  const responseText = await callAI(currentPrompt, 'agent'); 
  const fullText = previousContent + (previousContent ? " " : "") + responseText;

  const isCutOff = responseText.length > 2500 && !/[.!?ๆมาครับค่ะ]$/.test(responseText.trim());

  if (isCutOff) {
    return await callAIUntilFinished(basePrompt, fullText, depth + 1);
  }

  return fullText;
}

export async function POST(req: Request) {
  let missionId = '';
  try {
    const formData = await req.formData();
    let task = formData.get('task') as string;
    const file = formData.get('file') as File | null;

    if (file) {
      const MAX_FILE_SIZE = 1000000; 
      const allowedTypes = ['text/plain', 'text/csv', 'text/markdown', 'application/json'];

      if (file.size > MAX_FILE_SIZE) {
        return NextResponse.json({ error: `ไฟล์ใหญ่เกินไป` }, { status: 400 });
      }

      if (!allowedTypes.includes(file.type) && !file.name.endsWith('.txt') && !file.name.endsWith('.csv')) {
        return NextResponse.json({ error: `รองรับเฉพาะไฟล์ข้อความ` }, { status: 400 });
      }

      const fileContent = await file.text();
      const safeContent = fileContent.substring(0, 5000); 
      
      task = `${task}\n\n[ข้อมูลจากไฟล์แนบ: ${file.name}]\n"""\n${safeContent}...\n"""`;
    }

    const mission = await prisma.task.create({
      data: { title: task.substring(0, 200), status: 'in-progress', progress: 10 }
    });
    missionId = mission.id;

    console.log("🛡️ NEXUS ACTIVE: Operation Initiated");

    let agents: any[] = [];
    let knowledgeDB: any[] = [];
    
    try {
      [agents, knowledgeDB] = await Promise.all([
        prisma.agent.findMany(),
        prisma.knowledge.findMany({ take: 100 }) 
      ]);
      // 🌟 เพิ่มบรรทัดนี้: พิมพ์บอกถ้าดึงฐานข้อมูลได้สำเร็จ
      console.log(`📊 [DATABASE CHECK] ดึงข้อมูลคลังความรู้สำเร็จ: ${knowledgeDB.length} รายการ`);
    } catch (dbError: any) {
      console.warn("⚠️ Database Sync Warning: ไม่สามารถดึงข้อมูลคลังความรู้ได้");
      // 🌟 เพิ่มบรรทัดนี้: พิมพ์สาเหตุที่พังออกมาให้เห็นชัดๆ!
      console.error("🔍 สาเหตุที่แท้จริงคือ:", dbError.message);
    }

    // --- 🔍 STEP 0: DATABASE DIRECT MATCH (อัปเกรดความฉลาด) ---
    const lowerTask = task.toLowerCase().trim();
    
    // ค้นหาแบบฉลาด: ตรวจสอบว่าคำถามมีคำหลักที่ตรงกับ Topic หรือไม่
    const match = knowledgeDB.find(k => {
      const topicKeywords = k.topic.toLowerCase().trim().split(' ');
      // ถ้าคำถามมี Keyword จาก Topic อย่างน้อย 1 คำ (ที่ยาวกว่า 2 ตัวอักษร) ถือว่าเจอ!
      return topicKeywords.some(keyword => keyword.length > 2 && lowerTask.includes(keyword));
    });

    if (match) {
      console.log(`🎯 [DATABASE HIT] พบข้อมูลตรงในคลัง: ${match.topic}`);
      
      await prisma.task.update({
        where: { id: missionId },
        data: { 
          status: 'completed', 
          progress: 100, 
          result: match.content, 
          summary: `✅ ข้อมูลถูกดึงโดยตรงจากคลังความรู้หัวข้อ: ${match.topic}` 
        }
      });

      return NextResponse.json({ 
        result: { 
          assignTo: ["KNOWLEDGE ENGINE"], 
          summary: match.content, 
          coreThinking: "พบข้อมูลที่แม่นยำในฐานข้อมูลส่วนตัว ไม่จำเป็นต้องเรียกใช้ AI ภายนอก ⚡", 
          webSearch: "Internal Knowledge Base"
        } 
      });
    }
    // -------------------------------------------------------------

    console.log("🛡️ NEXUS ACTIVE: No direct match found, starting AI synthesis...");
    
    const squadInfo = agents.map(a => `- ${a.name} (Role: ${a.role})`).join('\n');
    const internalContext = knowledgeDB.slice(0, 5).map(k => `📌 [หมวด ${k.category}] ${k.topic}: ${k.content}`).join('\n');

    // --- STEP 1: CORE ROUTING ---
    const corePrompt = `คุณคือ CORE AI หน้าที่: วิเคราะห์งาน "${task}"
ทีมที่มี:
${squadInfo}

ตอบ JSON สั้นๆ: {"assignTo": "ชื่อเอเจนท์", "needSearch": true/false, "searchQuery": "คำสั้นๆเพื่อค้นหา", "reason": "สรุปสั้นๆ"}`;

    const coreRaw = await callAI(corePrompt, 'core'); 
    const jsonMatch = coreRaw.match(/\{[\s\S]*\}/);
    
    let targetAgent = agents[0] || { name: 'CORE AI', personality: 'ผู้ช่วยอัจฉริยะ', id: 'default' }; 
    let coreReason = "Auto-assigned by Protocol";
    let searchContext = "";
    let usedSearch = false;
    let queryToSearch = null;
    
    if (jsonMatch) {
      try {
        const coreData = JSON.parse(jsonMatch[0]);
        targetAgent = agents.find(a => a.name === coreData.assignTo) || targetAgent;
        coreReason = coreData.reason || "Direct connection established.";
        
        if (coreData.needSearch && coreData.searchQuery) {
          searchContext = await searchWeb(coreData.searchQuery);
          usedSearch = true;
          queryToSearch = coreData.searchQuery;
        }
      } catch (e) {
        console.log("⚠️ Parse JSON พลาด");
      }
    }

    if(targetAgent.id !== 'default') {
      await prisma.task.update({
        where: { id: missionId },
        data: { agentId: targetAgent.id, progress: 50, searchUsed: usedSearch, searchQuery: queryToSearch }
      });
    }

    // --- STEP 2: AGENT EXECUTION ---
    const agentPrompt = `คุณคือ ${targetAgent.name} (บุคลิก: ${targetAgent.personality})
[ฐานข้อมูลองค์กร]: ${internalContext || "ไม่มีข้อมูล"}
[ข้อมูล Internet]: ${searchContext || "ไม่ได้ทำการค้นหา"}

คำสั่งจากผู้ใช้: "${task}"

⚠️ กฎเหล็กในการตอบ:
1. จงตอบเป็น "ภาษาไทย" ที่ถูกต้อง สละสลวย
2. ห้ามใช้ภาษาจีน หรือภาษาอื่นๆ ปนมาเด็ดขาด 
3. ตรวจทานการพิมพ์ให้ถูกต้อง 100%`;

    const finalOutput = await callAIUntilFinished(agentPrompt);

    await prisma.task.update({
      where: { id: missionId },
      data: { status: 'completed', progress: 100, result: finalOutput, summary: coreReason }
    });

    return NextResponse.json({ 
      result: { 
        assignTo: [targetAgent.name], 
        summary: finalOutput, 
        coreThinking: coreReason,
        webSearch: usedSearch ? `ค้นหาเรื่อง: ${queryToSearch}` : "ใช้ข้อมูลภายใน"
      } 
    });

  } catch (error: any) {
    console.error("🔥 TOTAL SYSTEM FAILURE:", error.message);
    if (missionId) {
      await prisma.task.update({ where: { id: missionId }, data: { status: 'failed', summary: error.message, progress: 100 } });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}