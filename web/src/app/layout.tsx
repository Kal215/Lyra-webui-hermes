import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { LyraShell } from "@/components/LyraShell";
import Script from "next/script";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
};

export const metadata: Metadata = {
  title: "Lyra",
  description: "Application Shell",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="id"
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <head>
        <Script id="theme-init" strategy="beforeInteractive"
          dangerouslySetInnerHTML={{
            __html: `
              try {
                let mode = 'light';
                let surface = 'stone';
                let workspace = 'light';
                let lang = 'id';
                const appearance = localStorage.getItem('lyra-appearance');
                if (appearance) {
                  const p = JSON.parse(appearance);
                  mode = p.state.mode || 'light';
                  surface = p.state.surface || 'stone';
                  workspace = p.state.workspaceTheme || 'light';
                }
                const languageStr = localStorage.getItem('lyra-language');
                if (languageStr) {
                  const l = JSON.parse(languageStr);
                  lang = l.state.language || 'id';
                }
                document.documentElement.setAttribute('data-mode', mode);
                document.documentElement.setAttribute('data-surface', surface);
                document.documentElement.setAttribute('data-workspace', workspace);
                document.documentElement.lang = lang;
              } catch (e) {}
            `,
          }}
        />
      </head>
      <body className="min-h-full flex flex-col bg-lyra-bg text-lyra-text transition-colors duration-300">
        <LyraShell>{children}</LyraShell>
      </body>
    </html>
  );
}