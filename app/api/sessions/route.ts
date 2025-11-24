import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const limit = Number(searchParams.get("limit")) || 10;

    const sessions = await prisma.session.findMany({
      take: limit,
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        title: true,
        status: true,
        createdAt: true,
        summary: true,
        duration: true,
        transcript: true,        // <-- FIXED
        recordingType: true,     // <-- FIXED
      },
    });

    return NextResponse.json({ sessions }, { status: 200 });
  } catch (err) {
    console.error("SESSION FETCH ERROR", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}