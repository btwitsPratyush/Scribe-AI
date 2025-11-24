import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

export async function POST(req: Request) {
  try {
    const { name, email, password } = await req.json();

    if (!name || !email || !password) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    }

    const exists = await prisma.user.findUnique({ where: { email } });

    if (exists) {
      return NextResponse.json({ error: "User already exists" }, { status: 409 });
    }

    const hash = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: { name, email, password: hash },
    });

    return NextResponse.json({ user }, { status: 201 });

  } catch (err: any) {
    console.error("REGISTER ERROR FULL:", err);
    return NextResponse.json({ error: `Server error: ${err.message}` }, { status: 500 });
  }
}