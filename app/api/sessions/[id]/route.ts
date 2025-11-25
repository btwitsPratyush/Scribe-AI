import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function DELETE(
    req: NextRequest,
    props: { params: Promise<{ id: string }> }
) {
    try {
        const params = await props.params;
        const sessionId = params.id;

        await prisma.session.delete({
            where: { id: sessionId },
        });

        return NextResponse.json({ success: true }, { status: 200 });
    } catch (error) {
        console.error("Delete error:", error);
        return NextResponse.json(
            { error: "Failed to delete session", details: error instanceof Error ? error.message : String(error) },
            { status: 500 }
        );
    }
}
