import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const limit = Number(searchParams.get("limit")) || 20;
    const offset = Number(searchParams.get("offset")) || 0;
    const status = searchParams.get("status");

    const where: any = {};
    if (status && status !== "all") {
      where.status = status;
    }

    // Get total count for pagination
    const total = await prisma.session.count({ where });

    const sessions = await prisma.session.findMany({
      take: limit,
      skip: offset,
      where,
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        title: true,
        status: true,
        createdAt: true,
        summary: true,
        duration: true,
        transcript: true,
        recordingType: true,
      },
    });

    return NextResponse.json({
      sessions,
      pagination: {
        total,
        limit,
        offset,
        hasMore: offset + sessions.length < total,
      }
    }, { status: 200 });
  } catch (err) {
    console.error("SESSION FETCH ERROR", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}