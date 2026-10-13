import "./globals.css";
import { ServiceWorkerRegistration } from "./components/pwa/ServiceWorkerRegistration.jsx";

export const metadata = {
  title: "Pirates — Battle At Sea",
  description: "Pirates: Battle At Sea is a naval strategy game with vs CPU and vs Person modes.",
  applicationName: "Pirates",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    title: "Pirates",
    statusBarStyle: "black-translucent",
  },
  // Newer Next.js emits only mobile-web-app-capable. iPadOS 15 needs Apple's tag.
  other: { "apple-mobile-web-app-capable": "yes" },
  icons: {
    icon: [{ url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" }],
    apple: [{ url: "/icons/apple-touch-icon.png", sizes: "180x180", type: "image/png" }],
  },
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#06111b",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={`flex items-center content-center`}>
        <ServiceWorkerRegistration />
        {children}
      </body>
    </html>
  );
}
