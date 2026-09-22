import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

// Membaca folder public/audio/gaji secara server-side dan
// mengembalikan daftar nama file mp3 yang sudah tersedia.
// Dipakai halaman /gaji supaya status "sudah digenerate / belum"
// otomatis update tiap kali ada Tahap baru yang di-push, tanpa
// perlu edit kode.
export async function GET() {
  const dir = path.join(process.cwd(), "public", "audio", "gaji");

  try {
    const files = fs
      .readdirSync(dir)
      .filter((f) => f.toLowerCase().endsWith(".mp3"));

    return NextResponse.json({ files });
  } catch {
    // Folder belum ada / kosong — bukan error fatal, anggap kosong saja.
    return NextResponse.json({ files: [] });
  }
}
