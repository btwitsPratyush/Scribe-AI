import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
    req: NextRequest,
    props: { params: Promise<{ id: string }> }
) {
    try {
        const params = await props.params;
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
            { error: "Failed to download transcript", details: error instanceof Error ? error.message : String(error) },
            { status: 500 }
        );
    }
}
