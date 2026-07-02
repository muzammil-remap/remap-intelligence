import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: "REMAP Intelligence — Free AI Readiness Report",
  description:
    "Clarity out of the chaos. Get your AI Readiness Report in under 3 minutes. Free — no sales call required.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={inter.variable}>
      <body style={{ background: "#060f18", color: "#f1f5f9" }}>{children}</body>
    </html>
  );
}
