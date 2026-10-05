import "./globals.css";

export const metadata = {
  title: "Pirates — Battle At Sea",
  description: "Pirates: Battle At Sea is a naval strategy game with VS CPU and manual tabletop modes.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
