import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { TripCartProvider } from "@/components/TripCartDrawer";
import TripCartDrawer from "@/components/TripCartDrawer";
import { AuthProvider } from "@/contexts/AuthContext";
import { AppProvider } from "@/contexts/AppContext";
import Navigation from "@/components/Navigation";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Where Next - AI Travel Planning",
  description: "Plan your perfect trip with AI-powered travel recommendations",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <AuthProvider>
          <AppProvider>
            <Navigation />
            <TripCartProvider>
              {children}
              <TripCartDrawer />
            </TripCartProvider>
          </AppProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
