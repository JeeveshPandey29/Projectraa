import type { Metadata } from "next";
import "./globals.css";

import Script from "next/script";

import { Providers } from "@/components/Providers";
import ErrorReporter from "@/components/ErrorReporter";
import VisualEditsMessenger from "../visual-edits/VisualEditsMessenger";
import { Toaster } from "../components/ui/toaster";


export const metadata: Metadata = {
  title: "Projectra",
  description: "Project-Based Learning Management System",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="antialiased">
        {/* Orchids browser logs */}
        <Script
          id="orchids-browser-logs"
          src="https://slelguoygbfzlpylpxfs.supabase.co/storage/v1/object/public/scripts/orchids-browser-logs.js"
          strategy="afterInteractive"
          data-orchids-project-id="13706217-e685-4101-b344-99a2559f51fc"
        />

        <ErrorReporter />

        {/* Route messenger */}
        <Script
          src="https://slelguoygbfzlpylpxfs.supabase.co/storage/v1/object/public/scripts/route-messenger.js"
          strategy="afterInteractive"
          data-target-origin="*"
          data-message-type="ROUTE_CHANGE"
          data-include-search-params="true"
          data-only-in-iframe="true"
          data-debug="true"
          data-custom-data='{"appName": "Projectra", "version": "1.0.0"}'
        />

        <Providers>
          {children}
        </Providers>

        {/* Global UI layers */}
        <Toaster />
        <VisualEditsMessenger />
      </body>
    </html>
  );
}
