import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Providers from "./Providers";
import "./globals.css";

// Fonts setup
const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// Metadata for the layout
export const metadata: Metadata = {
  title: "Mint Scape",
  description: "A Next.js application for Mint Scape.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
