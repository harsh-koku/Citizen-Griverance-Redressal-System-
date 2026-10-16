import type { Metadata } from "next";
import "./globals.css";
import { ThemeProvider } from "@/components/ThemeProvider";
import { Toaster } from "sonner";
import Navbar from "@/components/Navbar";
import { LanguageProvider } from "@/context/LanguageContext";


export const metadata: Metadata = {
  title: "IGRS AI — Public Grievance Redressal System",
  description: "AI-Powered Civic Grievance Redressal and Real-Time Resolution Platform",
  icons: {
    icon: "/logo.png",
    apple: "/logo.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`antialiased bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors duration-200 min-h-[100dvh]`}
      >
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          <LanguageProvider>
            <Navbar />
            <main className="pt-[60px] min-h-[calc(100dvh-60px)]">
              {children}
            </main>
            <Toaster position="top-right" richColors />
          </LanguageProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
