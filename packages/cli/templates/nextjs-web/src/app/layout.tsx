import "./globals.css";
import type { Metadata } from "next";
import type { ReactNode } from "react";
import { AppProviders } from "./providers";

export const metadata: Metadata = {
  title: "Qubic Next.js Starter",
  description: "Scaffolded with Nous Labs SDK and React bindings",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  );
}
