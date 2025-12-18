import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "AirTag Assistant",
  description: "RAG chatbot that answers only questions about Apple AirTags with citations."
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}


