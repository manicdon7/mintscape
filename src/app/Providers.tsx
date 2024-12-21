"use client";

import {
  RainbowKitProvider,
  getDefaultConfig,
} from "@rainbow-me/rainbowkit";
import { WagmiConfig } from "wagmi";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  mainnet,
  polygon,
  optimism,
  arbitrum,
  base,
} from "wagmi/chains";
import "@rainbow-me/rainbowkit/styles.css";
import customStorage from "./utils/customStorage";

const queryClient = new QueryClient();

const Providers: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const config = getDefaultConfig({
    appName: "Mint Scape",
    projectId: "7113755340b6bd2fc130bc4f1f82100e",
    chains: [mainnet, polygon, optimism, arbitrum, base],
    storage:customStorage,
    ssr: true,
  });

  return (
    <WagmiConfig config={config}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider>{children}</RainbowKitProvider>
      </QueryClientProvider>
    </WagmiConfig>
  );
};

export default Providers;
