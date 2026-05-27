import type { Metadata, Viewport } from "next";
import { Baloo_2 } from "next/font/google";
import "./globals.css";
import PwaRegister from "@/components/PwaRegister";

const baloo = Baloo_2({
  subsets: ["latin"],
  weight: ["500", "600", "700", "800"]
});

export const metadata: Metadata = {
  title: "Monster Farm Quest",
  description: "Apprends les tables de multiplication en élevant tes créatures !",
  manifest: "/manifest.json",
  applicationName: "Monster Farm Quest",
  // Pour iOS : permet d'installer comme web-app standalone
  appleWebApp: {
    capable: true,
    title: "Monster Farm",
    statusBarStyle: "black-translucent"
  },
  icons: {
    icon: [
      { url: "/icon-192.webp", sizes: "192x192", type: "image/webp" },
      { url: "/icon-512.jpg", sizes: "512x512", type: "image/jpeg" }
    ],
    apple: [
      { url: "/icon-192.webp", sizes: "192x192" }
    ]
  },
  // Robots, ouvert ou privé : libre au user. Par défaut, on autorise.
  formatDetection: {
    telephone: false
  }
};

export const viewport: Viewport = {
  themeColor: "#4F46E5",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  // Évite que les barres système rognent le contenu sur mobile
  viewportFit: "cover"
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr">
      <body className={baloo.className}>
        <PwaRegister />
        {children}
      </body>
    </html>
  );
}
