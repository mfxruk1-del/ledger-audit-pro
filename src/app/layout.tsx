import type { Metadata, Viewport } from "next";
import "./globals.css";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
};

export const metadata: Metadata = {
  title: "Ledger Audit Pro - Professional Financial Tracking",
  description: "Manage and track your financial ledgers with Ledger Audit Pro. Professional financial tracking built with modern web technologies.",
  keywords: ["Ledger", "Audit", "Finance", "Accounting", "Next.js", "TypeScript", "Tailwind CSS"],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="bg-background text-foreground">
        {children}
      </body>
    </html>
  );
}
