import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

// 🛡️ ป้องกันการสร้าง Prisma Instance ซ้ำซ้อน (Singleton Pattern)
// ใน Next.js Dev Mode การสร้าง new PrismaClient() ทุกครั้งที่เซฟไฟล์จะทำให้ Connection เต็มไวมาก
const prismaClientSingleton = () => new PrismaClient();
declare global { var prismaGlobal: undefined | ReturnType<typeof prismaClientSingleton>; }
const prisma = globalThis.prismaGlobal ?? prismaClientSingleton();
if (process.env.NODE_ENV !== 'production') globalThis.prismaGlobal = prisma;

export async function GET() {
  try {
    // 1. ดึงข้อมูล Agent พร้อมเรียงลำดับตามชื่อ (เพื่อให้ UI ไม่สลับที่ไปมา)
    const agents = await prisma.agent.findMany({
      orderBy: {
        name: 'asc', // เรียงจาก A-Z
      },
    });

    // 2. เช็คกรณีไม่มีข้อมูลในระบบ
    if (!agents || agents.length === 0) {
      console.warn("⚠️ [SYSTEM] No agents found in database.");
      return NextResponse.json({ message: "ไม่พบข้อมูล Agent ในระบบ", data: [] }, { status: 200 });
    }

    // 3. ส่งข้อมูลกลับพร้อมสถานะ Success
    console.log(`✅ [SYSTEM] Loaded ${agents.length} agents successfully.`);
    return NextResponse.json(agents);

  } catch (error: any) {
    // 🕵️‍♂️ Log Error ให้ละเอียดขึ้นเพื่อให้ Kit แก้บั๊กใน Terminal ได้ง่าย
    console.error("❌ [AGENT FETCH ERROR]:", error.message);
    
    return NextResponse.json(
      { 
        error: "ไม่สามารถดึงข้อมูล Agent ได้", 
        details: error.message 
      }, 
      { status: 500 }
    );
  }
}