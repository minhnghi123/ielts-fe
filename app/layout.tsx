import type { Metadata } from "next";
import { Instrument_Sans, Instrument_Serif } from "next/font/google";
import "./globals.css";
import { Toaster } from "sonner";
import { QueryProvider } from "@/components/providers/query-provider";
import { AuthHydrator } from "@/components/providers/auth-hydrator";

const instrumentSans = Instrument_Sans({
  subsets: ["latin", "latin-ext"],
  weight: ["400", "500", "600"],
  variable: "--font-instrument-sans",
  display: "swap",
});

const instrumentSerif = Instrument_Serif({
  subsets: ["latin", "latin-ext"],
  weight: ["400"],
  variable: "--font-instrument-serif",
  display: "swap",
});


export const metadata: Metadata = {
  title: "IELTS-MN Platform",
  description: "Comprehensive IELTS preparation tools",
  icons: {
    icon: "/ielts_logo.jpg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${instrumentSans.variable} ${instrumentSerif.variable}`}
    >
      <body className="bg-background font-sans text-foreground antialiased">
        {/* TanStack Query client + devtools */}
        <QueryProvider>
          {/* Hydrates Zustand auth store from the session cookie on first render */}
          <AuthHydrator />
          {children}
          <Toaster position="top-center" richColors />
        </QueryProvider>
      </body>
    </html>
  );
}
