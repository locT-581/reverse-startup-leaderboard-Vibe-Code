import type { Metadata } from 'next';
import { Plus_Jakarta_Sans, Space_Grotesk } from 'next/font/google';
import ChaosListener from '@/domains/sabotage/components/ChaosListener';
import './globals.css';

const plusJakartaSans = Plus_Jakarta_Sans({ subsets: ['latin', 'vietnamese'], variable: '--font-plus-jakarta-sans' });
const spaceGrotesk = Space_Grotesk({ subsets: ['latin', 'vietnamese'], variable: '--font-space-grotesk' });

export const metadata: Metadata = {
  title: 'SnakeLegs - Bảng xếp hạng Khởi nghiệp Ngược',
  description: 'SaaS Siêu Hiện Đại',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="vi" className={`${plusJakartaSans.variable} ${spaceGrotesk.variable}`}>
      <body>
        <ChaosListener />
        {children}
      </body>
    </html>
  );
}
