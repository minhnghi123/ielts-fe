import type { Metadata } from "next";
import { Lexend, Noto_Sans } from "next/font/google"; // Import font chuẩn Google
import "./globals.css"; // Import Tailwind CSS

// Cấu hình Font
const lexend = Lexend({
  subsets: ["latin"],
  variable: "--font-lexend",
  display: "swap",
});

const notoSans = Noto_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "700"],
  variable: "--font-noto",
  display: "swap",
});

export const metadata: Metadata = {
  title: "IELTS Master Platform",
  description: "Comprehensive IELTS preparation tools",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${lexend.variable} ${notoSans.variable}`}>
      <head>
        {/* Import Icon Google Material Symbols */}
        <link
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap"
          rel="stylesheet"
        />
      </head>
      {/* Body gốc của toàn app */}
      <body className="bg-background font-display text-foreground antialiased">
        {children}
      </body>
    </html>
  );
}
