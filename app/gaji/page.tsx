"use client";

import { useEffect, useMemo, useState } from "react";
import gajiData from "@/data/gaji-data.json";

type GajiRow = {
  status: string;
  hariFull: number;
  hariSetengah: number;
  totalRupiah: number;
  filename: string;
  teks: string;
};

const rows = gajiData as GajiRow[];

// Urutan kategori ditampilkan sesuai hierarki jabatan di lapangan.
const STATUS_ORDER = ["Kepala Tukang", "Tukang", "Laden"];

function formatRupiah(n: number) {
  return "Rp " + n.toLocaleString("id-ID");
}

export default function GajiPage() {
  const [available, setAvailable] = useState<Set<string> | null>(null);
  const [openStatus, setOpenStatus] = useState<Record<string, boolean>>({});
  const [query, setQuery] = useState("");

  useEffect(() => {
    fetch("/api/gaji-audio-list")
      .then((r) => r.json())
      .then((d: { files: string[] }) => setAvailable(new Set(d.files)))
      .catch(() => setAvailable(new Set()));
  }, []);

  const grouped = useMemo(() => {
    const map = new Map<string, GajiRow[]>();
    for (const status of STATUS_ORDER) map.set(status, []);
    for (const r of rows) {
      if (!map.has(r.status)) map.set(r.status, []);
      map.get(r.status)!.push(r);
    }
    for (const list of map.values()) {
      list.sort((a, b) => a.hariFull - b.hariFull || a.hariSetengah - b.hariSetengah);
    }
    return map;
  }, []);

  const totalReady = available ? rows.filter((r) => available.has(r.filename)).length : 0;

  return (
    <div className="gaji-wrap">
      <div className="gaji-header">
        <h1>Preview Audio Notifikasi Gaji</h1>
        <p className="sub">
          {available === null
            ? "Memuat status audio…"
            : `${totalReady} / ${rows.length} file siap`}
        </p>
        <input
          className="search"
          placeholder="Cari nominal atau teks…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </div>

      {STATUS_ORDER.map((status) => {
        const list = (grouped.get(status) ?? []).filter(
          (r) =>
            query.trim() === "" ||
            r.teks.toLowerCase().includes(query.toLowerCase()) ||
            String(r.totalRupiah).includes(query.trim())
        );
        if (list.length === 0) return null;

        const readyCount = available
          ? list.filter((r) => available.has(r.filename)).length
          : 0;
        const isOpen = openStatus[status] ?? true;

        return (
          <section key={status} className="category">
            <button
              className="category-head"
              onClick={() => setOpenStatus((s) => ({ ...s, [status]: !isOpen }))}
            >
              <span className="category-title">{status}</span>
              <span className="category-count">
                {available === null ? "…" : `${readyCount} / ${list.length}`}
              </span>
              <span className={`chevron ${isOpen ? "open" : ""}`}>▾</span>
            </button>

            {isOpen && (
              <div className="table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>Hari Full</th>
                      <th>Hari Setengah</th>
                      <th>Total Gaji</th>
                      <th>Teks</th>
                      <th>Preview</th>
                    </tr>
                  </thead>
                  <tbody>
                    {list.map((r) => {
                      const ready = available?.has(r.filename) ?? false;
                      return (
                        <tr key={r.filename}>
                          <td>{r.hariFull}</td>
                          <td>{r.hariSetengah}</td>
                          <td className="rupiah">{formatRupiah(r.totalRupiah)}</td>
                          <td className="teks">{r.teks}</td>
                          <td className="preview">
                            {ready ? (
                              <audio
                                controls
                                preload="none"
                                src={`/audio/gaji/${r.filename}`}
                              />
                            ) : (
                              <span className="pending">Belum digenerate</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        );
      })}

      <style>{`
        .gaji-wrap {
          max-width: 1000px;
          margin: 0 auto;
          padding: 40px 20px 60px;
        }
        .gaji-header h1 {
          font-size: 1.4rem;
          margin-bottom: 4px;
        }
        .gaji-header .sub {
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
        .category-head {
          width: 100%;
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 14px 18px;
          background: transparent;
          border: none;
          color: #f2f2f2;
          font-size: 1rem;
          font-weight: 600;
          cursor: pointer;
          text-align: left;
        }
        .category-count {
          margin-left: auto;
          font-size: 0.8rem;
          font-weight: 500;
          color: #a1a1a1;
          background: #1f2128;
          padding: 3px 10px;
          border-radius: 999px;
        }
        .chevron {
          transition: transform 0.15s ease;
          color: #a1a1a1;
        }
        .chevron.open {
          transform: rotate(180deg);
        }
        .table-wrap {
          overflow-x: auto;
          border-top: 1px solid #262a33;
        }
        table {
          width: 100%;
          border-collapse: collapse;
          min-width: 700px;
        }
        th, td {
          padding: 10px 14px;
          text-align: left;
          border-bottom: 1px solid #21242c;
          font-size: 13px;
          white-space: nowrap;
        }
        td.teks {
          white-space: normal;
          min-width: 260px;
          color: #d1d1d1;
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
        td.rupiah {
          font-variant-numeric: tabular-nums;
          color: #9ad4ff;
        }
        .pending {
          font-size: 12px;
          color: #6b6f78;
          font-style: italic;
        }
        audio {
          width: 220px;
          height: 32px;
        }
      `}</style>
    </div>
  );
}
