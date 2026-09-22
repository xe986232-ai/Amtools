"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const LINKS = [
  { href: "/", label: "TTS Demo" },
  { href: "/attendance", label: "Absensi" },
  { href: "/gaji", label: "Preview Gaji" },
];

export default function TopNav() {
  const pathname = usePathname();

  return (
    <nav className="topnav">
      {LINKS.map((l) => (
        <Link
          key={l.href}
          href={l.href}
          className={pathname === l.href ? "active" : ""}
        >
          {l.label}
        </Link>
      ))}
      <style>{`
        .topnav {
          display: flex;
          gap: 4px;
          padding: 14px 20px;
          border-bottom: 1px solid #21242c;
          max-width: 1000px;
          margin: 0 auto;
        }
        .topnav a {
          color: #a1a1a1;
          text-decoration: none;
          font-size: 0.85rem;
          padding: 6px 12px;
          border-radius: 999px;
        }
        .topnav a.active {
          color: #0f0f10;
          background: #f2f2f2;
          font-weight: 600;
        }
        .topnav a:hover:not(.active) {
          color: #f2f2f2;
        }
      `}</style>
    </nav>
  );
}
