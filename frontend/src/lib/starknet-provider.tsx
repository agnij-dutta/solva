"use client";

import { ReactNode } from "react";
import { sepolia } from "@starknet-react/chains";
import { StarknetConfig, InjectedConnector, jsonRpcProvider } from "@starknet-react/core";

function createSafeConnector(id: string, name: string) {
  const connector = new InjectedConnector({ options: { id, name } });
  // Patch switchChain to no-op — Braavos doesn't support wallet_switchStarknetChain
  (connector as any).switchChain = async () => {};
  return connector;
}

const chains = [sepolia];

const connectors = [
  createSafeConnector("argentX", "Argent"),
  createSafeConnector("braavos", "Braavos"),
];

const provider = jsonRpcProvider({
  rpc: () => ({
    nodeUrl: process.env.NEXT_PUBLIC_STARKNET_RPC_URL || "https://api.cartridge.gg/x/starknet/sepolia",
  }),
});

export function StarknetProvider({ children }: { children: ReactNode }) {
  return (
    <StarknetConfig
      chains={chains}
      provider={provider}
      connectors={connectors}
      autoConnect
    >
      {children}
    </StarknetConfig>
  );
}
