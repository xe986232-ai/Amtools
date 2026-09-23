"use client";

import { useEffect, useMemo, useState } from "react";
import statusPeriodeData from "@/data/status-periode-data.json";

type Row = {
  status: string;
  periode: string;
  filename: string;
  teks: string;
};

const rows = statusPeriodeData as Row[];

// Semua status yang bakal muncul di app, walau belum semua ada audionya.
// Biar kategori yang belum digarap tetep kelihatan sebagai "belum ada".
const STATUS_ORDER = ["Kepala Tukang", "Tukang", "Tukang 2", "Laden"];

export default function StatusPeriodePage() {
  const [available, setAvailable] = useState<Set<string> | null>(null);
  const [openStatus, setOpenStatus] = useState<Record<string, boolean>>({});

  useEffect(() => {
    fetch("/api/status-periode-audio-list")
      .then((r) => r.json())
      .then((d: { files: string[] }) => setAvailable(new Set(d.files)))
      .catch(() => setAvailable(new Set()));
  }, []);

  const grouped = useMemo(() => {
    const map = new Map<string, Row[]>();
    for (const status of STATUS_ORDER) map.set(status, []);
    for (const r of rows) {
      if (!map.has(r.status)) map.set(r.status, []);
      map.get(r.status)!.push(r);
    }
    return map;
  }, []);

  const totalReady = available
    ? rows.filter((r) => available.has(r.filename)).length
    : 0;

  return (
    <div className="sp-wrap">
      <div className="sp-header">
        <h1>Preview Audio Status &amp; Periode</h1>
        <p className="sub">
          {available === null
            ? "Memuat status audio…"
            : `${totalReady} / ${rows.length} file siap (4 status × 2 periode = 8 total)`}
        </p>
      </div>

      {STATUS_ORDER.map((status) => {
        const list = grouped.get(status) ?? [];
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
                {available === null ? "…" : `${readyCount} / 2`}
              </span>
              <span className={`chevron ${isOpen ? "open" : ""}`}>▾</span>
            </button>

            {isOpen && (
              <div className="table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>Periode</th>
                      <th>Teks</th>
                      <th>Preview</th>
                    </tr>
                  </thead>
                  <tbody>
                    {["Periode 1 (1-15)", "Periode 2 (16-30)"].map((periodeLabel) => {
                      const r = list.find((row) => row.periode === periodeLabel);
                      const ready = r && available ? available.has(r.filename) : false;
                      return (
                        <tr key={periodeLabel}>
                          <td>{periodeLabel}</td>
                          <td className="teks">{r ? r.teks : "—"}</td>
                          <td className="preview">
                            {ready && r ? (
                              <audio
                                controls
                                preload="none"
                                src={`/audio/status-periode/${r.filename}`}
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
        .sp-wrap {
          max-width: 1000px;
          margin: 0 auto;
          padding: 40px 20px 60px;
        }
        .sp-header h1 {
          font-size: 1.4rem;
          margin-bottom: 4px;
        }
        .sp-header .sub {
          color: #a1a1a1;
          font-size: 0.9rem;
          margin: 0 0 28px;
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
          min-width: 560px;
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
