import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Mixtape Africa — Prompt Generator",
  description: "Generate Deep Afro House track concepts for Kie.ai",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="min-h-screen bg-[#0D0D0D]" suppressHydrationWarning>
        {children}
      </body>
    </html>
  );
}
