import type { Metadata } from "next";
import { Geist } from "next/font/google";
import "./globals.css";

const geist = Geist({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Steam Backlog Manager",
  description: "Verwalte deinen Steam-Backlog mit Spielzeit-Ranking und Gmail-Benachrichtigungen",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="de">
      <body className={`${geist.className} antialiased`}>{children}</body>
    </html>
  );
}
