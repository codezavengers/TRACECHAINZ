import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"
import { BitcoinProvider } from "./bitcoin"

function jsonRpcResponse(result: unknown, error: unknown = null) {
  return new Response(JSON.stringify({ jsonrpc: "1.0", id: "tracechain-btc", result, error }), {
    status: 200,
    headers: { "content-type": "application/json" },
  })
}

const ADDRESS = "1BitcoinEaterAddressDontSendf59kuE"

describe("BitcoinProvider (Bitcoin Core native RPC)", () => {
  const originalEnv = process.env

  beforeEach(() => {
    vi.stubGlobal("fetch", vi.fn())
    process.env = { ...originalEnv, BITCOIN_RPC_URL: "http://127.0.0.1:8332", BITCOIN_RPC_USER: "btcuser", BITCOIN_RPC_PASSWORD: "btcpassword" }
  })

  afterEach(() => {
    vi.unstubAllGlobals()
    process.env = originalEnv
  })

  it("is configured when BITCOIN_RPC_URL is set", () => {
    expect(new BitcoinProvider().isConfigured()).toBe(true)
  })

  it("is not configured when BITCOIN_RPC_URL is unset", () => {
    delete process.env.BITCOIN_RPC_URL
    delete process.env.TRACECHAIN_BTC_API_URL
    expect(new BitcoinProvider().isConfigured()).toBe(false)
  })

  it("fetches single transaction via getrawtransaction and decodes UTXO vin/vout", async () => {
    const mockFetch = fetch as unknown as ReturnType<typeof vi.fn>
    const rawTx = {
      txid: "tx123",
      hash: "tx123",
      version: 2,
      size: 225,
      vsize: 225,
      weight: 900,
      locktime: 0,
      vin: [
        {
          txid: "prevtx456",
          vout: 0,
          scriptSig: { asm: "", hex: "" },
          sequence: 4294967295,
          prevout: {
            value: 1.5,
            scriptPubKey: { asm: "", hex: "", address: "bc1qsender", type: "witness_v0_keyhash" },
          },
        },
      ],
      vout: [
        {
          value: 1.49,
          n: 0,
          scriptPubKey: { asm: "", hex: "", address: ADDRESS, type: "witness_v0_keyhash" },
        },
      ],
      blockhash: "00000000000000000001",
      confirmations: 10,
      time: 1700000000,
      blocktime: 1700000000,
    }

    mockFetch.mockResolvedValueOnce(jsonRpcResponse(rawTx))
    // Mock getblockheader for block height resolution
    mockFetch.mockResolvedValueOnce(jsonRpcResponse({ hash: "00000000000000000001", height: 850000, confirmations: 10, time: 1700000000 }))

    const provider = new BitcoinProvider()
    const tx = await provider.getTransaction("tx123")
    expect(tx).not.toBeNull()
    expect(tx?.hash).toBe("tx123")
    expect(tx?.chain).toBe("bitcoin")
    expect(tx?.from).toBe("bc1qsender")
    expect(tx?.to).toBe(ADDRESS)
    expect(tx?.amount).toBe(1.49)
    expect(tx?.asset).toBe("BTC")
    expect(tx?.timestamp).toBe(new Date(1700000000 * 1000).toISOString())
    expect(tx?.blockHeight).toBe(850000)
    expect(tx?.sourceType).toBe("RAW_RPC")
  })

  it("calls getblockcount and getblockchaininfo natively", async () => {
    const mockFetch = fetch as unknown as ReturnType<typeof vi.fn>
    mockFetch.mockResolvedValueOnce(jsonRpcResponse(850000))
    const provider = new BitcoinProvider()
    const height = await provider.getBlockCount()
    expect(height).toBe(850000)
  })

  it("honestly reports that arbitrary address history is unsupported without node indexing", async () => {
    const provider = new BitcoinProvider()
    const { transactions, meta } = await provider.getTransactionsPaged(ADDRESS)
    expect(transactions).toEqual([])
    expect(meta.unsupported).toBe(true)
    expect(meta.unsupportedReason).toContain("UNSUPPORTED_WITH_CURRENT_RPC")
  })

  it("never reports usdBalance as 0 for an unpriced wallet balance", async () => {
    const provider = new BitcoinProvider()
    const balance = await provider.getWalletBalance(ADDRESS)
    expect(balance.usdBalance).toBeNull()
    expect(balance.asset).toBe("BTC")
  })

  it("returns no token transfers (Bitcoin has no token layer)", async () => {
    const provider = new BitcoinProvider()
    expect(await provider.getTokenTransfers()).toEqual([])
  })
})
