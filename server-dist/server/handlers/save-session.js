"use strict";
/**
 * server/handlers/save-session.ts
 * Save a session to the database using Prisma.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.saveSession = saveSession;
const prisma_1 = require("../../lib/prisma");
async function saveSession({ title, transcript, userId, }) {
    // optionally create a summary later (or populate summary column when available)
    const s = await prisma_1.prisma.session.create({
        data: {
            title,
            transcript,
            status: "completed",
            userId: userId !== null && userId !== void 0 ? userId : undefined,
        },
    });
    return s;
}
