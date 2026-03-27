import "./globals.css";
import type { ReactNode } from "react";

export const metadata = {
  title: "VidMetrics Lite",
  description: "YouTube competitor analysis in seconds."
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body className="min-h-screen bg-background text-foreground antialiased">
        {children}
      </body>
    </html>
  );
}

