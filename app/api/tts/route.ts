import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const apiKey = process.env.FISH_AUDIO_API_KEY;

  if (!apiKey) {
    return NextResponse.json(
      { error: "FISH_AUDIO_API_KEY belum di-set di .env.local" },
      { status: 500 }
    );
  }

  let text: string;
  try {
    const body = await req.json();
    text = body.text;
  } catch {
    return NextResponse.json({ error: "Body request tidak valid" }, { status: 400 });
  }

  if (!text || typeof text !== "string" || !text.trim()) {
    return NextResponse.json({ error: "Teks tidak boleh kosong" }, { status: 400 });
  }

  const fishRes = await fetch("https://api.fish.audio/v1/tts", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      model: "s2.1-pro-free",
    },
    body: JSON.stringify({
      text,
      format: "mp3",
    }),
  });

  if (!fishRes.ok) {
    const errText = await fishRes.text();
    return NextResponse.json(
      { error: `Fish Audio API error (${fishRes.status}): ${errText}` },
      { status: fishRes.status }
    );
  }

  const audioBuffer = await fishRes.arrayBuffer();

  return new NextResponse(audioBuffer, {
    headers: {
      "Content-Type": "audio/mpeg",
    },
  });
}
