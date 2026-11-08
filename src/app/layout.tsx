import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "MiroFish MVP | Scenario Lab",
  description: "Explore possible futures with a cast of simulated agents.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en">
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
