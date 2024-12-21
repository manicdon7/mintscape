'use client';

import "@rainbow-me/rainbowkit/styles.css";
import { RainbowKitProvider, getDefaultConfig } from "@rainbow-me/rainbowkit";
import { WagmiConfig } from "wagmi";
import {
  arbitrum,
  base,
  mainnet,
  optimism,
  polygon,
  polygonMumbai,
  sepolia,
} from "wagmi/chains";

interface RainbowKitProviderWrapperProps {
  children: React.ReactNode;
}

export function RainbowKitProviderWrapper({
  children,
}: RainbowKitProviderWrapperProps) {
  const config = getDefaultConfig({
    appName: "mint-scape",
    projectId: "7113755340b6bd2fc130bc4f1f82100e",
    chains: [
      mainnet,
      polygon,
      polygonMumbai,
      optimism,
      arbitrum,
      base,
      sepolia,
      ...(process.env.NEXT_PUBLIC_ENABLE_TESTNETS === "true" ? [sepolia] : []),
    ],
  });

  return (
    <WagmiConfig config={config}>
      <RainbowKitProvider>{children}</RainbowKitProvider>
    </WagmiConfig>
  );
}
