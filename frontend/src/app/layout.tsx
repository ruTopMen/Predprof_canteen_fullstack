import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Школьная столовая",
  description: "Система управления школьной столовой",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ru">
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}
