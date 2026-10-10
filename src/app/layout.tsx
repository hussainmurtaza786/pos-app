import type { Metadata } from "next";
import "./globals.css";
import RootWrapper from "@/RootWrapper";

export const metadata: Metadata = {
  title: "POS System",
  description: "Point of Sale Management System",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <RootWrapper>
          {children}
        </RootWrapper>
      </body>
    </html>
  );
}
