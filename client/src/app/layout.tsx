import type { Metadata } from "next";
import { Inter, Roboto_Mono } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "./context/AuthContext";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const robotoMono = Roboto_Mono({
  variable: "--font-roboto-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Finaxial | Financial Insights Automated with AI",
  description: "Transform financial data into actionable intelligence for financial institutions using generative AI.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.variable} ${robotoMono.variable}`}>
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
