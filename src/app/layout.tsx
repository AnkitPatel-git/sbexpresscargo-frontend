import type { Metadata } from "next";
import { Providers } from "@/context/providers";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    template: "%s | SB Express Cargo",
    default: "SB Express Cargo",
  },
  description: "SB Express Cargo and Courier Management System",
};

import { Toaster } from "@/components/ui/sonner";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body suppressHydrationWarning className="antialiased">
        <Providers>
          {children}
        </Providers>
        <Toaster position="top-right" expand={false} richColors />
      </body>
    </html>
  );
}
