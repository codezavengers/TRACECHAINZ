import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import type { Chain } from "@/lib/types";
import {
  fetchLiveMarketPrices,
  fetchLiveAllChainProviders,
  probeLiveAddress,
  type LiveMarketPrices,
  type LiveProviderTelemetry,
  type LiveAddressProbeResult,
} from "@/lib/multichain-live";

interface MultiChainContextValue {
  prices: LiveMarketPrices | null;
  providers: Record<Chain, LiveProviderTelemetry> | null;
  isLoading: boolean;
  isProbing: boolean;
  refreshAll: () => Promise<void>;
  refreshProviders: () => Promise<void>;
  probeAddress: (address: string, chainHint?: Chain) => Promise<LiveAddressProbeResult>;
}

const MultiChainContext = createContext<MultiChainContextValue | null>(null);

export function MultiChainProvider({ children }: { children: React.ReactNode }) {
  const [prices, setPrices] = useState<LiveMarketPrices | null>(null);
  const [providers, setProviders] = useState<Record<Chain, LiveProviderTelemetry> | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isProbing, setIsProbing] = useState(false);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [priceData, providerData] = await Promise.all([
        fetchLiveMarketPrices(),
        fetchLiveAllChainProviders(),
      ]);
      setPrices(priceData);
      setProviders(providerData);
    } catch (err) {
      console.error("MultiChainProvider error:", err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const refreshProviders = useCallback(async () => {
    try {
      const providerData = await fetchLiveAllChainProviders();
      setProviders(providerData);
    } catch (err) {
      console.error("Failed to refresh providers:", err);
    }
  }, []);

  const probeAddress = useCallback(
    async (address: string, chainHint?: Chain): Promise<LiveAddressProbeResult> => {
      setIsProbing(true);
      try {
        const result = await probeLiveAddress(address, chainHint);
        return result;
      } finally {
        setIsProbing(false);
      }
    },
    []
  );

  useEffect(() => {
    loadData();

    // Periodic telemetry refresh every 45 seconds
    const interval = setInterval(() => {
      loadData();
    }, 45_000);

    return () => clearInterval(interval);
  }, [loadData]);

  return (
    <MultiChainContext.Provider
      value={{
        prices,
        providers,
        isLoading,
        isProbing,
        refreshAll: loadData,
        refreshProviders,
        probeAddress,
      }}
    >
      {children}
    </MultiChainContext.Provider>
  );
}

export function useMultiChain() {
  const context = useContext(MultiChainContext);
  if (!context) {
    throw new Error("useMultiChain must be used within a MultiChainProvider");
  }
  return context;
}
