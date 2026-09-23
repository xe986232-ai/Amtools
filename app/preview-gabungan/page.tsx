"use client";

const CONTOH = {
  nama: "Rahman",
  status: "Tukang",
  periode: "Periode 1 (1-15)",
  teksStatus: "Status sebagai, Tukang. Periode satu sampai lima belas.",
  teksGaji: "Gaji yang diperoleh, berjumlah: Satu juta, Tujuh ratus lima puluh lima ribu, Rupiah.",
  filename: "preview-gabungan-rahman.mp3",
};

export default function PreviewGabunganPage() {
  return (
    <div className="pg-wrap">
      <div className="pg-header">
        <h1>Preview Gabungan (Nama + Status &amp; Periode + Gaji)</h1>
        <p className="sub">
          Contoh hasil kalau tiga kategori audio digabung jadi satu, berurutan dengan jeda singkat.
        </p>
      </div>

      <section className="card">
        <div className="steps">
          <div className="step">
            <span className="tag">1. Nama</span>
            <p>{CONTOH.nama}</p>
          </div>
          <div className="step">
            <span className="tag">2. Status &amp; Periode</span>
            <p>{CONTOH.teksStatus}</p>
            <span className="meta">{CONTOH.status} · {CONTOH.periode}</span>
          </div>
          <div className="step">
            <span className="tag">3. Gaji</span>
            <p>{CONTOH.teksGaji}</p>
          </div>
        </div>

        <div className="player">
          <audio controls preload="none" src={`/audio/preview-gabungan/${CONTOH.filename}`} />
        </div>
      </section>

      <style>{`
        .pg-wrap {
          max-width: 1000px;
          margin: 0 auto;
          padding: 40px 20px 60px;
        }
        .pg-header h1 {
          font-size: 1.4rem;
          margin-bottom: 4px;
        }
        .pg-header .sub {
          color: #a1a1a1;
          font-size: 0.9rem;
          margin: 0 0 28px;
        }
        .card {
          border: 1px solid #262a33;
          border-radius: 14px;
          background: #141518;
          padding: 20px;
        }
        .steps {
          display: flex;
          flex-direction: column;
          gap: 14px;
          margin-bottom: 20px;
        }
        .step {
          border-bottom: 1px solid #21242c;
          padding-bottom: 12px;
        }
        .step:last-child {
          border-bottom: none;
          padding-bottom: 0;
        }
        .tag {
          display: inline-block;
          font-size: 11px;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.03em;
          color: #8a8f9a;
          margin-bottom: 4px;
        }
        .step p {
          margin: 0;
          font-size: 14px;
          color: #f2f2f2;
        }
        .meta {
          display: inline-block;
          margin-top: 4px;
          font-size: 12px;
          color: #6b6f78;
        }
        .player {
          padding-top: 6px;
        }
        audio {
          width: 100%;
          height: 40px;
        }
      `}</style>
    </div>
  );
}
