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

        const headers = new Headers();
        headers.set("Content-Type", "application/json");
        headers.set(
            "Content-Disposition",
            `attachment; filename="session-${sessionId.slice(0, 8)}.json"`
        );

        return new NextResponse(JSON.stringify(session, null, 2), { headers });
    } catch (error) {
        console.error("Download error:", error);
        return NextResponse.json(
            { error: "Failed to download session JSON", details: error instanceof Error ? error.message : String(error) },
            { status: 500 }
        );
    }
}
