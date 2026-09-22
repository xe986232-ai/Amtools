'use client';

import { useCallback, useRef, useState } from 'react';
import { initializeApp, FirebaseApp } from 'firebase/app';
import {
  getDatabase,
  ref,
  get,
  set,
  onValue,
  onChildAdded,
  onChildChanged,
  Database,
} from 'firebase/database';

// ---------- Types ----------

interface AttendanceData {
  uid: string;
  name: string;
  granted: boolean;
  timestamp: number;
}

interface Employee {
  uid: string;
  name: string;
}

interface LogRow {
  id: string;
  name: string;
  granted: boolean;
  time: string;
}

type AppMode = 'normal' | 'register';

// ---------- Fish Audio voice model ----------
// Satu-satunya model suara yang dipakai di seluruh aplikasi ini.
const FISH_VOICE_ID = 'b2c63324fb864a80b39b0c198ea23034';

// ---------- Firebase config ----------
// NOTE: Firebase web config values are safe to expose client-side; access is
// controlled by your Realtime Database security rules, not by hiding this object.

const firebaseConfig = {
  apiKey: 'AIzaSyDjxcceosbcuvuR6p5FCPFFis3yrx57qCc',
  authDomain: 'absen-ea176.firebaseapp.com',
  databaseURL: 'https://absen-ea176-default-rtdb.asia-southeast1.firebasedatabase.app',
  projectId: 'absen-ea176',
  storageBucket: 'absen-ea176.firebasestorage.app',
  messagingSenderId: '958434731866',
  appId: '1:958434731866:web:6a759e9789c92aeac4f563',
  measurementId: 'G-66LX4WF15H',
};

export default function AttendanceDashboard() {
  // connection / mode state
  const [connected, setConnected] = useState(false);
  const [mode, setModeState] = useState<AppMode>('normal');

  // form inputs
  const [newUid, setNewUid] = useState('');
  const [newName, setNewName] = useState('');
  const [addMsg, setAddMsg] = useState<{ text: string; ok: boolean } | null>(null);

  // data
  const [logs, setLogs] = useState<LogRow[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);

  // refs that must not trigger re-render
  const speechQueueRef = useRef<string[]>([]);
  const speakingRef = useRef(false);
  const knownAttendanceRef = useRef<Record<string, number>>({});
  const lastKnownScanTsRef = useRef(0);
  const modeRef = useRef<AppMode>('normal');
  const dbRef = useRef<Database | null>(null);
  const appRef = useRef<FirebaseApp | null>(null);

  // ---------- Speech queue ----------

  const speakWithBrowser = useCallback((text: string) => {
    return new Promise<void>((resolve) => {
      if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
        resolve();
        return;
      }
      const utter = new SpeechSynthesisUtterance(text);
      utter.lang = 'id-ID';
      utter.rate = 1;
      utter.onend = () => resolve();
      utter.onerror = () => resolve();
      window.speechSynthesis.speak(utter);
    });
  }, []);

  const speakWithFish = useCallback(async (text: string) => {
    const res = await fetch('/api/tts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text, reference_id: FISH_VOICE_ID }),
    });

    if (!res.ok) {
      const data = await res.json().catch(() => ({ error: `Fish TTS error ${res.status}` }));
      throw new Error(data.error || `Fish TTS error ${res.status}`);
    }

    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const audio = new Audio(url);
    await new Promise<void>((resolve, reject) => {
      audio.onended = () => resolve();
      audio.onerror = () => reject(new Error('Audio playback failed'));
      audio.play().catch(reject);
    }).finally(() => URL.revokeObjectURL(url));
  }, []);

  const processSpeechQueue = useCallback(async () => {
    if (speakingRef.current || speechQueueRef.current.length === 0) return;
    speakingRef.current = true;
    const text = speechQueueRef.current.shift() as string;

    try {
      await speakWithFish(text);
    } catch (err) {
      console.warn('Fish Audio TTS tidak tersedia, pakai suara browser:', (err as Error).message);
      await speakWithBrowser(text);
    }

    speakingRef.current = false;
    processSpeechQueue();
  }, [speakWithFish, speakWithBrowser]);

  const speak = useCallback(
    (text: string) => {
      if (!text) return;
      speechQueueRef.current.push(text);
      processSpeechQueue();
    },
    [processSpeechQueue]
  );

  // ---------- Log helpers ----------

  const addLogEntry = useCallback((name: string, granted: boolean, timeStr: string) => {
    setLogs((prev) => [
      { id: `${Date.now()}-${Math.random()}`, name, granted, time: timeStr },
      ...prev,
    ]);
  }, []);

  const handleEntry = useCallback(
    (data: AttendanceData | null) => {
      if (!data || !data.uid) return;

      // Skip "echoes" of already-processed timestamps (e.g. Firebase replay on connect)
      if (knownAttendanceRef.current[data.uid] === data.timestamp) return;
      knownAttendanceRef.current[data.uid] = data.timestamp;

      const now = new Date().toLocaleTimeString('id-ID');

      if (data.granted) {
        speak(`Absen berhasil, atas nama ${data.name}`);
      } else {
        speak('Kartu tidak dikenal, akses ditolak');
      }

      addLogEntry(data.granted ? data.name : 'Kartu tidak dikenal', data.granted, now);
    },
    [speak, addLogEntry]
  );

  // ---------- Mode ----------

  const setMode = useCallback(
    (newMode: AppMode) => {
      modeRef.current = newMode;
      setModeState(newMode);

      if (dbRef.current) {
        set(ref(dbRef.current, 'mode'), newMode);
      }

      if (newMode === 'register') {
        setNewUid('');
      }

      if (newMode === 'normal') {
        speak('Mode absensi aktif. Silakan melakukan absensi.');
      } else {
        speak('Mode pendaftaran aktif. Silakan melakukan pendaftaran kartu.');
      }
    },
    [speak]
  );

  // ---------- Connect ----------

  const connectFirebase = useCallback(() => {
    if (!appRef.current) {
      appRef.current = initializeApp(firebaseConfig);
    }
    const db = getDatabase(appRef.current);
    dbRef.current = db;

    // Voice here is also what unlocks browser audio permission — must be triggered by a user click.
    speak('Selamat datang di konsol absensi RFID. Sistem sudah terhubung dan siap digunakan.');

    setConnected(true);

    // Fetch existing attendance as a baseline BEFORE attaching live listeners,
    // so old history isn't announced as a "new scan" on connect.
    const attendanceRef = ref(db, 'attendance');
    get(attendanceRef).then((snap) => {
      const existing = (snap.val() || {}) as Record<string, AttendanceData>;
      Object.keys(existing).forEach((uid) => {
        knownAttendanceRef.current[uid] = existing[uid].timestamp;
      });

      onChildAdded(attendanceRef, (childSnap) => handleEntry(childSnap.val()));
      onChildChanged(attendanceRef, (childSnap) => handleEntry(childSnap.val()));
    });

    onValue(ref(db, 'employees'), (snap) => {
      const data = (snap.val() || {}) as Record<string, { name: string }>;
      const uids = Object.keys(data);
      setEmployees(uids.map((uid) => ({ uid, name: data[uid].name })));
    });

    onValue(ref(db, 'last_scan'), (snap) => {
      const d = snap.val();
      if (!d) return;
      if (modeRef.current === 'register' && d.ts > lastKnownScanTsRef.current) {
        setNewUid(d.uid);
      }
      lastKnownScanTsRef.current = d.ts;
    });

    setMode('normal');
  }, [speak, handleEntry, setMode]);

  // ---------- Add employee ----------

  const addEmployee = useCallback(() => {
    const uid = newUid.trim().toUpperCase();
    const name = newName.trim();

    if (!uid || !name) {
      setAddMsg({ text: 'Tap kartu dulu dan isi nama sebelum simpan.', ok: false });
      return;
    }

    if (!dbRef.current) return;

    set(ref(dbRef.current, 'employees/' + uid), { name })
      .then(() => {
        setAddMsg({ text: `Pegawai "${name}" (${uid}) berhasil ditambahkan.`, ok: true });
        setNewUid('');
        setNewName('');
      })
      .catch((err: Error) => {
        setAddMsg({ text: 'Gagal menyimpan: ' + err.message, ok: false });
      });
  }, [newUid, newName]);

  // ---------- Render ----------

  return (
    <div className="wrap">
      <header>
        <div>
          <div className="title">Konsol Absensi RFID</div>
          <div className="project">absen-ea176</div>
        </div>
        <div className={`status-pill${connected ? ' connected' : ''}`}>
          <span className="status-dot" />
          {connected ? 'Terhubung' : 'Belum terhubung'}
        </div>
      </header>

      {!connected && (
        <div id="setup">
          <div className="project-line">
            Firebase project <b>absen-ea176</b> sudah otomatis terisi.
          </div>
          <button onClick={connectFirebase}>Hubungkan &amp; aktifkan suara</button>
          <div className="hint">
            Klik untuk memulai — browser memerlukan interaksi pengguna sebelum mengizinkan audio.
            Suara pakai satu model voice Fish Audio yang sudah ditentukan lewat server; kalau
            gagal, otomatis pakai suara bawaan browser.
          </div>
        </div>
      )}

      <div id="modeSwitch">
        <button
          className={mode === 'normal' ? 'active' : ''}
          onClick={() => setMode('normal')}
          disabled={!connected}
        >
          Log absensi
        </button>
        <button
          className={mode === 'register' ? 'active' : ''}
          onClick={() => setMode('register')}
          disabled={!connected}
        >
          Daftarkan pegawai
        </button>
      </div>

      {mode === 'normal' && (
        <div id="panelAbsensi">
          <div className="panel-note">
            Tap kartu ke pembaca RFID. Kartu terdaftar akan diumumkan lewat suara dan tercatat di
            bawah.
          </div>
          <table>
            <thead>
              <tr>
                <th className="col-status">Status</th>
                <th>Nama</th>
                <th className="col-time">Waktu</th>
              </tr>
            </thead>
            <tbody>
              {logs.length === 0 ? (
                <tr className="empty-row">
                  <td colSpan={3}>belum ada aktivitas</td>
                </tr>
              ) : (
                logs.map((row) => (
                  <tr key={row.id}>
                    <td className="col-status">
                      <span className={`badge ${row.granted ? 'ok' : 'fail'}`}>
                        {row.granted ? 'Masuk' : 'Ditolak'}
                      </span>
                    </td>
                    <td className={`row-name${row.granted ? '' : ' denied'}`}>{row.name}</td>
                    <td className="col-time">{row.time}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {mode === 'register' && (
        <div id="panelDaftar">
          <div id="addForm">
            <h3>Tambah pegawai baru</h3>
            <div className="sub">Tap kartu ke pembaca — UID terisi otomatis di kolom di bawah.</div>
            <div className="field">
              <label htmlFor="newUid">UID kartu</label>
              <input
                id="newUid"
                placeholder="menunggu kartu ditap..."
                readOnly
                value={newUid}
              />
            </div>
            <div className="field">
              <label htmlFor="newName">Nama pegawai</label>
              <input
                id="newName"
                placeholder="mis. Budi Santoso"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
              />
            </div>
            <button onClick={addEmployee}>Simpan pegawai</button>
            {addMsg && (
              <div id="addMsg" style={{ color: addMsg.ok ? 'var(--ok)' : 'var(--fail)' }}>
                {addMsg.text}
              </div>
            )}
          </div>
          <div className="section-label">Pegawai terdaftar</div>
          <table>
            <thead>
              <tr>
                <th>Nama</th>
                <th className="col-uid">UID</th>
              </tr>
            </thead>
            <tbody>
              {employees.length === 0 ? (
                <tr className="empty-row">
                  <td colSpan={2}>belum ada pegawai</td>
                </tr>
              ) : (
                employees.map((emp) => (
                  <tr key={emp.uid}>
                    <td>{emp.name}</td>
                    <td className="col-uid">{emp.uid}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      <style jsx global>{`
        :root {
          --bg: #15161b;
          --panel: #1d1f26;
          --panel-alt: #20222a;
          --border: #2c2e37;
          --border-strong: #3a3d49;
          --text: #e7e5e0;
          --muted: #8d8f99;
          --accent: #c9a227;
          --accent-dim: #7a6420;
          --ok: #5c8a64;
          --ok-dim: #2a3a2d;
          --fail: #b85c4d;
          --fail-dim: #3a2926;
          --sans: 'IBM Plex Sans', -apple-system, Segoe UI, Roboto, sans-serif;
          --mono: 'IBM Plex Mono', ui-monospace, SFMono-Regular, Menlo, monospace;
        }
        * {
          box-sizing: border-box;
        }
        body {
          margin: 0;
          font-family: var(--sans);
          background: var(--bg);
          color: var(--text);
          min-height: 100vh;
          padding: 20px 16px 60px;
        }
      `}</style>

      <style jsx>{`
        .wrap {
          max-width: 560px;
          margin: 0 auto;
        }
        header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          padding: 18px 20px;
          background: var(--panel);
          border: 1px solid var(--border);
          border-bottom: none;
          border-radius: 6px 6px 0 0;
        }
        .title {
          font-size: 1.05rem;
          font-weight: 600;
          letter-spacing: 0.01em;
        }
        .project {
          font-family: var(--mono);
          font-size: 0.75rem;
          color: var(--muted);
          margin-top: 3px;
        }
        .status-pill {
          display: flex;
          align-items: center;
          gap: 7px;
          font-family: var(--mono);
          font-size: 0.75rem;
          color: var(--muted);
          white-space: nowrap;
          margin-top: 2px;
        }
        .status-dot {
          width: 7px;
          height: 7px;
          border-radius: 50%;
          background: var(--muted);
          flex-shrink: 0;
        }
        .status-pill.connected {
          color: var(--ok);
        }
        .status-pill.connected .status-dot {
          background: var(--ok);
          box-shadow: 0 0 0 3px var(--ok-dim);
        }
        #setup {
          background: var(--panel-alt);
          border: 1px solid var(--border);
          padding: 22px 20px;
          margin-bottom: 16px;
        }
        .project-line {
          font-family: var(--mono);
          font-size: 0.8rem;
          color: var(--muted);
          margin-bottom: 14px;
        }
        .project-line b {
          color: var(--text);
          font-weight: 500;
        }
        button {
          font-family: var(--sans);
          cursor: pointer;
        }
        #setup button {
          background: var(--accent);
          color: #1a1500;
          border: none;
          padding: 11px 20px;
          border-radius: 4px;
          font-weight: 600;
          font-size: 0.9rem;
          width: 100%;
        }
        #setup button:hover {
          background: #ddb52d;
        }
        .hint {
          color: var(--muted);
          font-size: 0.78rem;
          margin-top: 10px;
          line-height: 1.5;
        }
        #modeSwitch {
          display: flex;
          border: 1px solid var(--border);
          background: var(--panel);
        }
        #modeSwitch button {
          flex: 1;
          padding: 13px 10px;
          border: none;
          border-right: 1px solid var(--border);
          background: transparent;
          color: var(--muted);
          font-weight: 500;
          font-size: 0.85rem;
        }
        #modeSwitch button:last-child {
          border-right: none;
        }
        #modeSwitch button.active {
          color: var(--accent);
          background: var(--panel-alt);
          box-shadow: inset 0 -2px 0 var(--accent);
        }
        #modeSwitch button:disabled {
          opacity: 0.4;
          cursor: not-allowed;
        }
        #modeSwitch button:not(:disabled):hover {
          color: var(--text);
        }
        #panelAbsensi,
        #panelDaftar {
          border: 1px solid var(--border);
          border-top: none;
          border-radius: 0 0 6px 6px;
          background: var(--panel);
          overflow: hidden;
        }
        .panel-note {
          padding: 12px 20px;
          font-size: 0.78rem;
          color: var(--muted);
          border-bottom: 1px solid var(--border);
          line-height: 1.5;
        }
        table {
          width: 100%;
          border-collapse: collapse;
          font-size: 0.85rem;
        }
        thead th {
          text-align: left;
          padding: 9px 14px;
          font-size: 0.7rem;
          font-weight: 600;
          color: var(--muted);
          letter-spacing: 0.03em;
          border-bottom: 1px solid var(--border);
          background: var(--panel-alt);
        }
        tbody td {
          padding: 10px 14px;
          border-bottom: 1px solid var(--border);
          vertical-align: middle;
        }
        tbody tr:last-child td {
          border-bottom: none;
        }
        .col-status {
          width: 70px;
        }
        .col-time {
          width: 96px;
          text-align: right;
          font-family: var(--mono);
          color: var(--muted);
          font-size: 0.78rem;
        }
        .badge {
          display: inline-block;
          font-family: var(--mono);
          font-size: 0.68rem;
          font-weight: 600;
          padding: 2px 7px;
          border-radius: 3px;
          letter-spacing: 0.02em;
        }
        .badge.ok {
          background: var(--ok-dim);
          color: var(--ok);
        }
        .badge.fail {
          background: var(--fail-dim);
          color: var(--fail);
        }
        .row-name {
          font-weight: 500;
        }
        .row-name.denied {
          color: var(--muted);
          font-style: italic;
          font-weight: 400;
        }
        .empty-row td {
          padding: 22px 14px;
          text-align: center;
          color: var(--muted);
          font-family: var(--mono);
          font-size: 0.78rem;
          border-bottom: none;
        }
        #addForm {
          padding: 18px 20px;
          border-bottom: 1px solid var(--border);
        }
        #addForm h3 {
          margin: 0 0 3px;
          font-size: 0.9rem;
          font-weight: 600;
        }
        .sub {
          font-size: 0.78rem;
          color: var(--muted);
          margin-bottom: 14px;
          line-height: 1.5;
        }
        .field {
          margin-bottom: 10px;
        }
        .field label {
          display: block;
          font-size: 0.7rem;
          color: var(--muted);
          font-weight: 600;
          letter-spacing: 0.03em;
          margin-bottom: 5px;
        }
        #addForm input {
          width: 100%;
          background: var(--bg);
          color: var(--text);
          border: 1px solid var(--border-strong);
          border-radius: 4px;
          padding: 10px 11px;
          font-size: 0.88rem;
          font-family: var(--mono);
        }
        #addForm input:focus {
          outline: none;
          border-color: var(--accent);
        }
        #addForm input::placeholder {
          color: var(--muted);
          font-family: var(--sans);
        }
        #addForm input[readonly] {
          color: var(--muted);
          background: var(--panel-alt);
        }
        #addForm button {
          background: var(--ok);
          color: #0f1810;
          border: none;
          padding: 10px 18px;
          border-radius: 4px;
          font-weight: 600;
          width: 100%;
          font-size: 0.88rem;
          margin-top: 4px;
        }
        #addForm button:hover {
          background: #6fa378;
        }
        #addMsg {
          font-size: 0.78rem;
          margin-top: 10px;
          font-family: var(--mono);
          line-height: 1.5;
        }
        .section-label {
          padding: 10px 14px;
          font-size: 0.7rem;
          font-weight: 600;
          color: var(--muted);
          letter-spacing: 0.03em;
          background: var(--panel-alt);
          border-bottom: 1px solid var(--border);
        }
        .col-uid {
          font-family: var(--mono);
          color: var(--muted);
          font-size: 0.78rem;
          text-align: right;
        }
        @media (max-width: 480px) {
          header {
            flex-direction: column;
            gap: 8px;
          }
        }
      `}</style>
    </div>
  );
}
