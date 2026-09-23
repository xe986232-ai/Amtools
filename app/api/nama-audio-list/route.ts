import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

// Sama polanya kayak gaji-audio-list: baca folder public/audio/nama
// secara server-side, dipakai halaman /nama buat status "sudah/belum".
export async function GET() {
  const dir = path.join(process.cwd(), "public", "audio", "nama");

  try {
    const files = fs
      .readdirSync(dir)
      .filter((f) => f.toLowerCase().endsWith(".mp3"));

    return NextResponse.json({ files });
  } catch {
    return NextResponse.json({ files: [] });
  }
}
