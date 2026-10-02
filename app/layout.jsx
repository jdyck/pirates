import "./globals.css";

export const metadata = {
  title: "Sink ’Em — Battleship",
  description: "Sink ’Em is a one-player Battleship game. Arrange your fleet, then take on the computer.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
