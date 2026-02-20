import "./globals.css";
import type { ReactNode } from "react";

export const metadata = {
  title: "Deterministik Gübre Önerisi",
  description: "Toprak + opsiyonel yaprak analizinden deterministik gübre önerisi"
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="tr">
      <body className="min-h-screen bg-neutral-50 text-neutral-900">
        {children}
      </body>
    </html>
  );
}
