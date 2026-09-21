import type { Metadata } from "next";

import "./globals.css";

export const metadata: Metadata = {
  title: "Jev Match",
  description: "Evidence-based candidate evaluation for hiring teams.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
