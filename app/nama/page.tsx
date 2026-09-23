"use client";

import { useEffect, useMemo, useState } from "react";
import namaData from "@/data/nama-data.json";

type NamaRow = {
  name: string;
  filename: string;
  sourceFile: string;
};

const rows = namaData as NamaRow[];

export default function NamaPage() {
  const [available, setAvailable] = useState<Set<string> | null>(null);
  const [query, setQuery] = useState("");

  useEffect(() => {
    fetch("/api/nama-audio-list")
      .then((r) => r.json())
      .then((d: { files: string[] }) => setAvailable(new Set(d.files)))
      .catch(() => setAvailable(new Set()));
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter((r) => r.name.toLowerCase().includes(q));
  }, [query]);

  const totalReady = available
    ? rows.filter((r) => available.has(r.filename)).length
    : 0;

  return (
    <div className="nama-wrap">
      <div className="nama-header">
        <h1>Preview Audio Nama Pegawai</h1>
        <p className="sub">
          {available === null
            ? "Memuat status audio…"
            : `${totalReady} / ${rows.length} file siap`}
        </p>
        <input
          className="search"
          placeholder="Cari nama…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </div>

      <section className="category">
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Nama</th>
                <th>File</th>
                <th>Preview</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((r) => {
                const ready = available?.has(r.filename) ?? false;
                return (
                  <tr key={r.filename}>
                    <td className="nama">{r.name}</td>
                    <td className="fname">{r.filename}</td>
                    <td className="preview">
                      {ready ? (
                        <audio
                          controls
                          preload="none"
                          src={`/audio/nama/${r.filename}`}
                        />
                      ) : (
                        <span className="pending">Belum digenerate</span>
                      )}
                    </td>
                  </tr>
                );
              })}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={3} className="empty">
                    Tidak ada nama yang cocok.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      <style>{`
        .nama-wrap {
          max-width: 1000px;
          margin: 0 auto;
          padding: 40px 20px 60px;
        }
        .nama-header h1 {
          font-size: 1.4rem;
          margin-bottom: 4px;
        }
        .nama-header .sub {
          color: #a1a1a1;
          font-size: 0.9rem;
          margin: 0 0 16px;
        }
        .search {
          width: 100%;
          padding: 10px 14px;
          border-radius: 10px;
          border: 1px solid #333;
          background: #1a1a1c;
          color: #f2f2f2;
          font-size: 0.9rem;
          margin-bottom: 28px;
        }
        .search:focus {
          outline: none;
          border-color: #6ea8fe;
        }
        .category {
          margin-bottom: 20px;
          border: 1px solid #262a33;
          border-radius: 14px;
          overflow: hidden;
          background: #141518;
        }
        .table-wrap {
          overflow-x: auto;
        }
        table {
          width: 100%;
          border-collapse: collapse;
          min-width: 500px;
        }
        th, td {
          padding: 10px 14px;
          text-align: left;
          border-bottom: 1px solid #21242c;
          font-size: 13px;
          white-space: nowrap;
        }
        th {
          color: #8a8f9a;
          font-weight: 600;
          font-size: 11px;
          text-transform: uppercase;
          letter-spacing: 0.03em;
        }
        tr:last-child td {
          border-bottom: none;
        }
        td.nama {
          color: #f2f2f2;
          font-weight: 500;
        }
        td.fname {
          color: #8a8f9a;
          font-family: monospace;
          font-size: 12px;
        }
        .pending {
          font-size: 12px;
          color: #6b6f78;
          font-style: italic;
        }
        .empty {
          text-align: center;
          color: #6b6f78;
          padding: 24px;
        }
        audio {
          width: 220px;
          height: 32px;
        }
      `}</style>
    </div>
  );
}
