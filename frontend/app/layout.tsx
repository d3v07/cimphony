import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "M&A War Room | Google x Columbia 2026",
  description: "Live M&A Due Diligence Agent — Voice-Driven Analysis",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-gray-950 antialiased">{children}</body>
    </html>
  );
}
