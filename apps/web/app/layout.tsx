import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "HBBA — Навигатор здоровья",
  description: "Экспертная система первичного триажа по зонам тела и описанию симптомов",
};

const themeScript = `
  try {
    const saved = localStorage.getItem('hbba-theme');
    const dark = saved ? saved === 'dark' : window.matchMedia('(prefers-color-scheme: dark)').matches;
    document.documentElement.dataset.theme = dark ? 'dark' : 'light';
  } catch (_) {}
`;

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ru" suppressHydrationWarning>
      <head><script dangerouslySetInnerHTML={{ __html: themeScript }} /></head>
      <body>{children}</body>
    </html>
  );
}
