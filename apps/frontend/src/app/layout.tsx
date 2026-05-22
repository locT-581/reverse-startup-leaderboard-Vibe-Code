import type { Metadata } from 'next';
import { Inter, Outfit } from 'next/font/google';
import ChaosListener from '@/domains/sabotage/components/ChaosListener';
import './globals.css';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });
const outfit = Outfit({ subsets: ['latin'], variable: '--font-outfit' });

export const metadata: Metadata = {
  title: 'Bảng xếp hạng Khởi nghiệp Ngược',
  description: 'SaaS Siêu Hiện Đại',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="vi">
      <body className={`${inter.variable} ${outfit.variable}`}>
        <ChaosListener />
        {children}
      </body>
    </html>
  );
}
