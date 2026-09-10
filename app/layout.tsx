import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Margotheia",
  description: "O oráculo que escuta antes de revelar.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  );
}
