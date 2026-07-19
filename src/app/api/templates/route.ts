import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

const prisma = new PrismaClient();

// GET all templates
export async function GET() {
  try {
    const templates = await prisma.template.findMany({
      orderBy: { createdAt: "asc" },
    });
    return NextResponse.json(templates);
  } catch (error) {
    return NextResponse.json(
      { error: "Erro ao carregar os templates do banco de dados." },
      { status: 500 }
    );
  }
}
