import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: '我的物品',
  description: '在本地记录电子产品的购入、投入、使用周期与归档状态。',
};
export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="zh-CN">
      <head>
        <link rel="preload" href="/fonts/noto-serif-sc-headings-v1.woff2" as="font" type="font/woff2" crossOrigin="anonymous" />
        <link rel="preload" href="/fonts/noto-sans-sc-ui-v1.woff2" as="font" type="font/woff2" crossOrigin="anonymous" />
      </head>
      <body>{children}</body>
    </html>
  );
}
