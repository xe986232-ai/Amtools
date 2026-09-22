"use client";

import { useState, useRef } from "react";

export default function Home() {
  const [text, setText] = useState("Halo, ini adalah tes text-to-speech pakai Fish Audio.");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement>(null);

  async function handleGenerate() {
    if (!text.trim()) return;
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/tts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({ error: "Terjadi kesalahan" }));
        throw new Error(data.error || `Request gagal (${res.status})`);
      }

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      setAudioUrl(url);

      setTimeout(() => audioRef.current?.play(), 100);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Terjadi kesalahan tidak diketahui");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="wrap">
      <h1>Fish Audio TTS Demo</h1>
      <p className="sub">Model: s2.1-pro-free · gratis via Fair Use Policy</p>

      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Ketik teks yang mau diubah jadi suara..."
      />
      <div className="char-count">{text.length} karakter</div>

      <div className="row">
        <button onClick={handleGenerate} disabled={loading || !text.trim()}>
          {loading ? "Generating..." : "Generate Speech"}
        </button>
      </div>

      {error && <div className="error">{error}</div>}

      {audioUrl && (
        <div className="player">
          <audio ref={audioRef} controls src={audioUrl} />
        </div>
      )}
    </div>
  );
}
