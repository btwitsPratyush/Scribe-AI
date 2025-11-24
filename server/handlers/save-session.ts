/**
 * server/handlers/save-session.ts
 * Save a session to the database using Prisma.
 */

import { prisma } from "../../lib/prisma";

export async function saveSession({
  title,
  transcript,
  userId,
}: {
  title: string;
  transcript: string;
  userId?: string | null;
}) {
  // optionally create a summary later (or populate summary column when available)
  const s = await prisma.session.create({
    data: {
      title,
      transcript,
      status: "completed",
      userId: userId ?? undefined,
    },
  });

  return s;
}