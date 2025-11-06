import type { Metadata } from "next";
import { Poppins, Open_Sans } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { ThemeProvider } from "@/components/theme-provider";
import { AuthProvider } from "@/lib/auth-context";

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["400", "600", "700"],
  variable: "--font-poppins",
});

const openSans = Open_Sans({
  subsets: ["latin"],
  weight: ["400", "600"],
  variable: "--font-open-sans",
});

export const metadata: Metadata = {
  title: "EDUWALY - Gestion Scolaire",
  description: "Plateforme SaaS multi-tenant de gestion scolaire et universitaire",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fr" suppressHydrationWarning>
      <body className={`${openSans.variable} ${poppins.variable}`}>
        <ThemeProvider defaultTheme="system" storageKey="schooly-theme">
          <AuthProvider>
            {children}
            <Toaster />
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
