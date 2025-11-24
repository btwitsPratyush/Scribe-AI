import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

export async function POST(req: Request) {
  try {
    const { email, password } = await req.json();

    const user = await prisma.user.findUnique({ where: { email } });

    if (!user) {
      return NextResponse.json({ error: "Invalid email" }, { status: 401 });
    }

    const valid = await bcrypt.compare(password, user.password);

    if (!valid) {
      return NextResponse.json({ error: "Invalid password" }, { status: 401 });
    }

    const res = NextResponse.json({ user }, { status: 200 });

    res.cookies.set("auth", user.id, {
      httpOnly: true,
      secure: false,
      path: "/",
    });

    return res;
  } catch (err: any) {
    console.error("LOGIN ERROR FULL:", err);
    return NextResponse.json({ error: `Server error: ${err.message}` }, { status: 500 });
  }
}