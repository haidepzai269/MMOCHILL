import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { AppearanceProvider } from "@/components/appearance-provider";
import { LoadingProvider } from "@/lib/contexts/loading-context";
import { SoundProvider } from "@/lib/contexts/sound-context";
import { NotificationProvider } from "@/lib/contexts/notification-context";
import { Toaster } from "sonner";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "MMOChill - Earn Rewards",
  description: "Complete tasks to earn rewards",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased min-h-screen bg-background text-foreground`}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <AppearanceProvider>
            <LoadingProvider>
              <SoundProvider>
                <NotificationProvider>
                  {children}
                  <Toaster position="bottom-right" richColors theme="system" />
                </NotificationProvider>
              </SoundProvider>
            </LoadingProvider>
          </AppearanceProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
