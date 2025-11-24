import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
    req: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const sessionId = params.id;

        const session = await prisma.session.findUnique({
            where: { id: sessionId },
        });

        if (!session) {
            return NextResponse.json(
                { error: "Session not found" },
                { status: 404 }
            );
        }

        const transcript = session.transcript || "No transcript available";

        const headers = new Headers();
        headers.set("Content-Type", "text/plain");
        headers.set(
            "Content-Disposition",
            `attachment; filename="transcript-${sessionId.slice(0, 8)}.txt"`
        );

        return new NextResponse(transcript, { headers });
    } catch (error) {
        console.error("Download error:", error);
        return NextResponse.json(
            { error: "Failed to download transcript" },
            { status: 500 }
        );
    }
}
