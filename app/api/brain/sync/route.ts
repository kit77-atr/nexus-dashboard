import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function POST() {
  try {
    const apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY;
    if (!apiKey) throw new Error("Missing API Key");

    // 🕵️‍♂️ 1. ค้นหาความจริง: ถาม Google ว่าเราใช้รุ่นไหนได้บ้าง (ป้องกัน 404)
    const listRes = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`);
    const listData = await listRes.json();

    if (listData.error) {
      // 🚨 ถ้าตรงนี้ Error แสดงว่า Key หมดอายุจริง หรือตั้งค่าโปรเจกต์ผิด
      throw new Error(`Google Auth Error: ${listData.error.message}`);
    }

    const availableModels = listData.models
      ?.filter((m: any) => m.supportedGenerationMethods.includes('embedContent'))
      .map((m: any) => m.name) || [];

    // เลือกรุ่นที่เทพที่สุด (เราจะเอา 3072 มิติเป็นหลัก)
    const bestModel = availableModels.find((m: string) => m.includes('text-embedding-004')) 
                    || availableModels.find((m: string) => m.includes('embedding-001'))
                    || availableModels[0];

    if (!bestModel) throw new Error("กุญแจนี้ไม่มีสิทธิ์ใช้รุ่น Embedding ครับ");

    // 2. ดึงข้อมูลที่รอการ Sync (เอาทีละ 5 รายการเพื่อความชัวร์)
    const unsyncedItems: any[] = await prisma.$queryRawUnsafe(`
      SELECT id, topic, content FROM "Knowledge" WHERE embedding IS NULL LIMIT 5
    `);

    if (unsyncedItems.length === 0) return NextResponse.json({ message: "สมองกลจำได้ครบหมดแล้วครับ! 🧠✨" });

    let syncedCount = 0;
    for (const item of unsyncedItems) {
      const textToEmbed = `Topic: ${item.topic} Content: ${item.content}`;

      // 3. ยิง API ตรงๆ แบบไม่ผ่าน SDK (ลดความซับซ้อน)
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/${bestModel}:embedContent?key=${apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: { parts: [{ text: textToEmbed }] } })
      });

      const resData = await response.json();
      if (!response.ok) throw new Error(`[${bestModel}]: ${resData.error?.message}`);

      const vector = resData.embedding.values;
      const vectorStr = `[${vector.join(',')}]`;

      // 💾 4. บันทึกลง Supabase (ต้องมั่นใจว่าขยายขนาดเป็น 3072 หรือยัง!)
      await prisma.$executeRawUnsafe(
        `UPDATE "Knowledge" SET embedding = $1::vector WHERE id = $2`, 
        vectorStr, item.id
      );
      syncedCount++;
    }

    return NextResponse.json({ message: `Neural Link Success! ใช้รุ่น ${bestModel} อัปเดตไป ${syncedCount} รายการ 🚀` });

  } catch (error: any) {
    console.error("NEURAL CRITICAL ERROR:", error.message);
    return NextResponse.json({ error: `[SYSTEM FAILURE]: ${error.message}` }, { status: 500 });
  }
}