import { ProviderError } from "@/lib/blockchain/net"

// Minimal, dependency-free JSON-RPC client for public, keyless EVM nodes
// (see PUBLIC_RPC in config.ts). Used for RPC-first balance reads,
// single-transaction lookups, and eth_getLogs token-transfer scans.

interface JsonRpcResponse<T> {
  result?: T
  error?: { code?: number; message?: string }
}

export async function rpcCall<T>(rpcUrl: string, method: string, params: unknown[], timeoutMs = 8000): Promise<T> {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), timeoutMs)
  try {
    const res = await fetch(rpcUrl, {
      method: "POST",
      headers: { "content-type": "application/json", accept: "application/json" },
      body: JSON.stringify({ jsonrpc: "2.0", id: 1, method, params }),
      cache: "no-store",
      signal: controller.signal,
    })
    if (!res.ok) {
      throw new ProviderError(`EVM RPC request failed (${res.status}).`, res.status === 429 ? "rate_limit" : "http", res.status)
    }
    let payload: JsonRpcResponse<T>
    try {
      payload = (await res.json()) as JsonRpcResponse<T>
    } catch {
      throw new ProviderError("EVM RPC returned a malformed response.", "parse")
    }
    if (payload.error) {
      throw new ProviderError(payload.error.message ?? "EVM RPC error.", "http")
    }
    if (payload.result === undefined) {
      throw new ProviderError("EVM RPC returned no result.", "parse")
    }
    return payload.result
  } catch (err) {
    if (err instanceof ProviderError) throw err
    if (err instanceof DOMException && err.name === "AbortError") {
      throw new ProviderError("EVM RPC timed out.", "timeout")
    }
    throw new ProviderError(`EVM RPC network error: ${err instanceof Error ? err.message : "unknown"}.`, "network")
  } finally {
    clearTimeout(timer)
  }
}

export async function rpcCallWithRetry<T>(rpcUrl: string, method: string, params: unknown[], maxRetries = 2): Promise<T> {
  let attempt = 0
  let delay = 300
  while (true) {
    try {
      return await rpcCall<T>(rpcUrl, method, params)
    } catch (err) {
      attempt++
      if (attempt > maxRetries) throw err
      if (err instanceof ProviderError && (err.kind === "rate_limit" || err.kind === "timeout" || err.kind === "network")) {
        await new Promise((resolve) => setTimeout(resolve, delay))
        delay *= 2
        continue
      }
      throw err
    }
  }
}

export interface RpcTx {
  hash: string
  from: string
  to: string | null
  value: string
  blockNumber: string | null
}

export interface RpcBlock {
  timestamp: string
}

// Direct-from-node balance read (eth_getBalance). Works on every EVM chain
// with zero configuration — no indexer, no API key.
export async function getBalanceViaRpc(rpcUrl: string, address: string): Promise<string> {
  return rpcCallWithRetry<string>(rpcUrl, "eth_getBalance", [address, "latest"])
}

// Direct-from-node single-transaction read.
export async function getTransactionViaRpc(rpcUrl: string, hash: string): Promise<RpcTx | null> {
  const tx = await rpcCallWithRetry<RpcTx | null>(rpcUrl, "eth_getTransactionByHash", [hash])
  return tx ?? null
}

export async function getBlockTimestampViaRpc(rpcUrl: string, blockNumberHex: string): Promise<string | null> {
  try {
    const block = await rpcCallWithRetry<RpcBlock | null>(rpcUrl, "eth_getBlockByNumber", [blockNumberHex, false])
    if (!block?.timestamp) return null
    return new Date(Number(BigInt(block.timestamp)) * 1000).toISOString()
  } catch {
    return null
  }
}

// Lightweight reachability/chain-identity probe used by health checks.
export async function getChainIdViaRpc(rpcUrl: string): Promise<string> {
  return rpcCall<string>(rpcUrl, "eth_chainId", [])
}

// Latest block number, used to bound recent-history eth_getLogs scans.
export async function getBlockNumberViaRpc(rpcUrl: string): Promise<number> {
  const hex = await rpcCallWithRetry<string>(rpcUrl, "eth_blockNumber", [])
  return Number(BigInt(hex))
}

export interface RpcLog {
  address: string
  topics: string[]
  data: string
  blockNumber: string
  transactionHash: string
  logIndex?: string
}

// Direct-from-node ERC-20/BEP-20 Transfer-event scan (eth_getLogs).
export async function getLogsViaRpc(
  rpcUrl: string,
  params: { address?: string; topics: (string | string[] | null)[]; fromBlock: number; toBlock: number },
): Promise<RpcLog[]> {
  const toHex = (n: number) => "0x" + n.toString(16)
  return rpcCallWithRetry<RpcLog[]>(rpcUrl, "eth_getLogs", [
    {
      ...(params.address ? { address: params.address } : {}),
      topics: params.topics,
      fromBlock: toHex(params.fromBlock),
      toBlock: toHex(params.toBlock),
    },
  ])
}

// ---------------------------------------------------------------------------
// ERC-20 Token Metadata Resolution via eth_call
// ---------------------------------------------------------------------------

function decodeAbiString(hex: string): string | null {
  if (!hex || hex === "0x") return null
  const raw = hex.startsWith("0x") ? hex.slice(2) : hex
  if (raw.length < 64) return null
  try {
    if (raw.length >= 128) {
      const offset = Number(BigInt("0x" + raw.slice(0, 64)))
      if (offset >= 32 && offset * 2 + 64 <= raw.length) {
        const lenStart = offset * 2
        const length = Number(BigInt("0x" + raw.slice(lenStart, lenStart + 64)))
        if (length > 0 && length <= 128) {
          const strHex = raw.slice(lenStart + 64, lenStart + 64 + length * 2)
          const decoded = Buffer.from(strHex, "hex").toString("utf8").replace(/\0+$/, "").trim()
          if (decoded) return decoded
        }
      }
    }
    // Fallback: bytes32 ASCII string
    const bytes32Hex = raw.slice(0, 64)
    const str = Buffer.from(bytes32Hex, "hex").toString("utf8").replace(/\0+$/, "").trim()
    if (str && /^[\x20-\x7E]+$/.test(str)) {
      return str
    }
  } catch {
    return null
  }
  return null
}

function decodeAbiUint(hex: string): number | null {
  if (!hex || hex === "0x") return null
  try {
    const n = Number(BigInt(hex))
    if (Number.isFinite(n) && n >= 0 && n <= 78) {
      return n
    }
  } catch {
    return null
  }
  return null
}

export interface TokenMetadata {
  symbol: string
  name: string
  decimals: number | null
}

const tokenMetadataCache = new Map<string, TokenMetadata>()
const MAX_METADATA_CACHE_SIZE = 1000

export async function getTokenMetadataViaRpc(rpcUrl: string, tokenAddress: string): Promise<TokenMetadata> {
  const cacheKey = `${rpcUrl.toLowerCase()}:${tokenAddress.toLowerCase()}`
  if (tokenMetadataCache.has(cacheKey)) {
    return tokenMetadataCache.get(cacheKey)!
  }

  let decimals: number | null = null
  let symbol = "UNKNOWN"
  let name = "Unknown Token"

  try {
    const [decHex, symHex, nameHex] = await Promise.all([
      rpcCall<string>(rpcUrl, "eth_call", [{ to: tokenAddress, data: "0x313ce567" }, "latest"], 3000).catch(() => null),
      rpcCall<string>(rpcUrl, "eth_call", [{ to: tokenAddress, data: "0x95d89b41" }, "latest"], 3000).catch(() => null),
      rpcCall<string>(rpcUrl, "eth_call", [{ to: tokenAddress, data: "0x06fdde03" }, "latest"], 3000).catch(() => null),
    ])

    if (decHex) decimals = decodeAbiUint(decHex)
    if (symHex) {
      const s = decodeAbiString(symHex)
      if (s) symbol = s
    }
    if (nameHex) {
      const n = decodeAbiString(nameHex)
      if (n) name = n
    }
  } catch {
    // Graceful fallback to UNKNOWN values
  }

  const result: TokenMetadata = { symbol, name, decimals }
  if (tokenMetadataCache.size >= MAX_METADATA_CACHE_SIZE) {
    tokenMetadataCache.clear()
  }
  tokenMetadataCache.set(cacheKey, result)
  return result
}
