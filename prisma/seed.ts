import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const agents = [
    { id: 'CORE-1', name: 'CORE (เลขา)', role: 'Orchestrator', category: 'CORE', personality: 'สุภาพ, ประสานงานเก่ง', sprite: '🤖', skills: '["Task Delegation"]' },
    { id: 'TECH-1', name: 'TECH-Coder', role: 'Software Engineer', category: 'TECH', personality: 'เน้นตรรกะ', sprite: '💻', skills: '["Next.js", "TypeScript"]' },
    { id: 'TECH-2', name: 'TECH-Admin', role: 'SysAdmin', category: 'TECH', personality: 'ปลอดภัยไว้ก่อน', sprite: '🛡️', skills: '["Docker", "Security"]' },
    { id: 'TECH-3', name: 'TECH-Auto', role: 'Automation', category: 'TECH', personality: 'ชอบทางลัด', sprite: '⚡', skills: '["Zapier", "Make"]' },
    { id: 'TECH-4', name: 'TECH-Prompt', role: 'Prompt Designer', category: 'TECH', personality: 'สร้างสรรค์', sprite: '✍️', skills: '["Prompt Engineering"]' },
    { id: 'CREA-1', name: 'CREA-Course', role: 'Course Designer', category: 'CREATIVE', personality: 'สอนเก่ง', sprite: '🎓', skills: '["Curriculum"]' },
    { id: 'CREA-2', name: 'CREA-Content', role: 'Content Creator', category: 'CREATIVE', personality: 'ทันกระแส', sprite: '📝', skills: '["SEO", "Copywriting"]' },
    { id: 'CREA-3', name: 'CREA-Graphic', role: 'Designer', category: 'CREATIVE', personality: 'รสนิยมดี', sprite: '🎨', skills: '["UI/UX"]' },
    { id: 'CREA-4', name: 'CREA-Idea', role: 'Creative Thinker', category: 'CREATIVE', personality: 'คิดนอกกรอบ', sprite: '💡', skills: '["Brainstorming"]' },
    { id: 'BIZ-1', name: 'BIZ-Market', role: 'Marketer', category: 'BUSINESS', personality: 'เน้นยอดขาย', sprite: '📈', skills: '["Marketing"]' },
    { id: 'BIZ-2', name: 'BIZ-Strategy', role: 'Strategist', category: 'BUSINESS', personality: 'มองการณ์ไกล', sprite: '♟️', skills: '["Business Plan"]' },
    { id: 'BIZ-3', name: 'BIZ-News', role: 'Reporter', category: 'BUSINESS', personality: 'หูไวตาไว', sprite: '📰', skills: '["News Synthesis"]' },
    { id: 'FIN-1', name: 'FIN-Account', role: 'Accountant', category: 'FINANCE', personality: 'เป๊ะทุกตัวเลข', sprite: '🧾', skills: '["Accounting"]' },
    { id: 'FIN-2', name: 'FIN-Gold', role: 'XAUUSD Trader', category: 'FINANCE', personality: 'กล้าได้กล้าเสีย', sprite: '📊', skills: '["Technical Analysis"]' },
    { id: 'FIN-3', name: 'FIN-Stock', role: 'Stock Analyst', category: 'FINANCE', personality: 'เน้นพื้นฐาน', sprite: '💹', skills: '["Equity Analysis"]' }
  ];

  console.log('🌱 Start seeding agents...');
  for (const agent of agents) {
    await prisma.agent.upsert({
      where: { id: agent.id },
      update: agent,
      create: agent,
    });
  }
  console.log('✅ Seeding finished.');
}

main()
  .catch((e) => console.error(e))
  .finally(async () => await prisma.$disconnect());