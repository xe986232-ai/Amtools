import "./globals.css";
import TopNav from "@/components/TopNav";

export const metadata = {
  title: "Fish Audio TTS Demo",
  description: "Simple text-to-speech demo using the Fish Audio S2.1 Pro free API",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id">
      <body>
        <TopNav />
        {children}
      </body>
    </html>
  );
}
