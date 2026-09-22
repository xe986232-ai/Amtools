# Fish Audio TTS Demo (Next.js)

Web kecil buat nyoba text-to-speech pakai model gratis `s2.1-pro-free` dari Fish Audio.

## Cara jalanin

1. Install dependencies:
   ```
   npm install
   ```

2. Copy `.env.local.example` jadi `.env.local`, terus isi API key kamu:
   ```
   cp .env.local.example .env.local
   ```
   Ambil API key di https://fish.audio/app/api-keys/

3. Jalankan dev server:
   ```
   npm run dev
   ```

4. Buka http://localhost:3000, ketik teks, klik "Generate Speech".

## Struktur

- `app/api/tts/route.ts` — API route server-side yang manggil Fish Audio, API key aman di server, nggak kebuka ke browser.
- `app/page.tsx` — halaman utama dengan textarea + tombol generate + audio player.
- `app/globals.css` — styling sederhana dark mode.

## Catatan

- Free tier `s2.1-pro-free` berlaku sampai 30 November 2026, unlimited usage di bawah Fair Use Policy (tanpa hard cap karakter, tapi bisa di-throttle kalau kelihatan abuse).
- Nggak ada SLA/jaminan uptime — cocok buat development & prototyping, bukan production serius.
