import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { AccessibilityProvider } from '@/components/AccessibilityProvider';
import { UserProfileProvider } from '@/components/UserProfileProvider/UserProfileProvider';
import { AuthProvider } from '@/components/AuthProvider/AuthProvider';
import { LanguageProvider } from '@/components/LanguageProvider/LanguageProvider';
import { NotificationProvider } from '@/components/NotificationProvider/NotificationProvider';
import { OfflineBanner } from '@/components/OfflineBanner/OfflineBanner';
import { NotificationToaster } from '@/components/ui/NotificationToast/NotificationToaster';
import { CallProvider } from '@/components/CallProvider/CallProvider';
import CallModal from '@/components/CallProvider/CallModal';

import { APP_NAME, APP_TAGLINE } from '@/lib/constants';

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: `${APP_NAME} — ${APP_TAGLINE}`,
  description: APP_TAGLINE,
  manifest: "/manifest.json",
};

import { QueryProvider } from '@/components/Providers/QueryProvider';

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className} suppressHydrationWarning>
        <QueryProvider>
          <AuthProvider>
            <LanguageProvider>
              <UserProfileProvider>
                <NotificationProvider>
                  <AccessibilityProvider>
                    <CallProvider>
                      {children}
                      <OfflineBanner />
                      <NotificationToaster />
                      <CallModal />
                    </CallProvider>
                  </AccessibilityProvider>
                </NotificationProvider>
              </UserProfileProvider>
            </LanguageProvider>
          </AuthProvider>
        </QueryProvider>
      </body>
    </html>
  );
}
