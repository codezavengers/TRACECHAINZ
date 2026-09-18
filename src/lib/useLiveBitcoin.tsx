import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import {
  fetchLiveBitcoinNetwork,
  fetchLiveBitcoinAddress,
  type LiveBitcoinNetworkData,
  type LiveBitcoinAddressData,
} from "./bitcoin-live";

interface LiveBitcoinContextType {
  data: LiveBitcoinNetworkData | null;
  isLoading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  queryAddress: (address: string) => Promise<LiveBitcoinAddressData>;
  isQueryingAddress: boolean;
}

const LiveBitcoinContext = createContext<LiveBitcoinContextType | undefined>(undefined);

export function LiveBitcoinProvider({ children }: { children: React.ReactNode }) {
  const [data, setData] = useState<LiveBitcoinNetworkData | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isQueryingAddress, setIsQueryingAddress] = useState(false);

  const loadNetwork = useCallback(async (force = false) => {
    try {
      setIsLoading(true);
      setError(null);
      const res = await fetchLiveBitcoinNetwork(force);
      setData(res);
    } catch (err: any) {
      console.error("Live Bitcoin fetch failed:", err);
      setError(err?.message || "Failed to fetch live Bitcoin data");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadNetwork();

    // Auto-refresh every 25 seconds
    const interval = setInterval(() => {
      loadNetwork(false);
    }, 25000);

    return () => clearInterval(interval);
  }, [loadNetwork]);

  const queryAddress = useCallback(
    async (address: string): Promise<LiveBitcoinAddressData> => {
      setIsQueryingAddress(true);
      try {
        const livePrice = data?.priceUsd || 80650;
        const res = await fetchLiveBitcoinAddress(address, livePrice);
        return res;
      } finally {
        setIsQueryingAddress(false);
      }
    },
    [data?.priceUsd]
  );

  return (
    <LiveBitcoinContext.Provider
      value={{
        data,
        isLoading,
        error,
        refresh: () => loadNetwork(true),
        queryAddress,
        isQueryingAddress,
      }}
    >
      {children}
    </LiveBitcoinContext.Provider>
  );
}

export function useLiveBitcoin(): LiveBitcoinContextType {
  const ctx = useContext(LiveBitcoinContext);
  if (!ctx) {
    throw new Error("useLiveBitcoin must be used within a LiveBitcoinProvider");
  }
  return ctx;
}
