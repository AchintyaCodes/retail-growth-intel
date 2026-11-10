import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Retail Growth Intelligence",
  description: "RFM segmentation, KPIs and repurchase model — UCI Online Retail II",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-zinc-50">{children}</body>
    </html>
  );
}
