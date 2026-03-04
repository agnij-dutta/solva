import type { Metadata } from "next";
import "./globals.css";
import { Nav } from "@/components/nav";
import { StarknetProvider } from "@/lib/starknet-provider";

export const metadata: Metadata = {
  title: "Solva Protocol | ZK Solvency for BTCFi on Starknet",
  description: "Trustless proof-of-solvency for Bitcoin custodians. ZK proofs verified on Starknet, unlocking DeFi lending gates.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">
        <StarknetProvider>
          <Nav />
          <main className="pt-16">
            {children}
          </main>
        </StarknetProvider>
      </body>
    </html>
  );
}
