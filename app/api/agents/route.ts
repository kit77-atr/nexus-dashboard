import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET() {
  try {
    const agents = await prisma.agent.findMany();
    return NextResponse.json(agents);
  } catch (error) {
    return NextResponse.json([], { status: 500 });
  }
}