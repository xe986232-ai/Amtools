import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

export async function GET() {
  const dir = path.join(process.cwd(), "public", "audio", "status-periode");

  try {
    const files = fs
      .readdirSync(dir)
      .filter((f) => f.toLowerCase().endsWith(".mp3"));

    return NextResponse.json({ files });
  } catch {
    return NextResponse.json({ files: [] });
  }
}
