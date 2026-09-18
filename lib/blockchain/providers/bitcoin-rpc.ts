import { ProviderError } from "@/lib/blockchain/net"

export interface BitcoinRpcConfig {
  url: string
  user?: string
  password?: string
  timeoutMs?: number
}

export interface BitcoinBlockchainInfo {
  chain: string
  blocks: number
  headers: number
  bestblockhash: string
  difficulty: number
  mediantime: number
  verificationprogress: number
  initialblockdownload: boolean
  chainwork: string
  size_on_disk: number
  pruned: boolean
  warnings?: string[]
}

export interface BitcoinNetworkInfo {
  version: number
  subversion: string
  protocolversion: number
  connections: number
  networks: Array<{ name: string; limited: boolean; reachable: boolean; proxy: string }>
  relayfee: number
  warnings?: string[]
}

export interface BitcoinBlockHeader {
  hash: string
  confirmations: number
  height: number
  version: number
  versionHex: string
  merkleroot: string
  time: number
  mediantime: number
  nonce: number
  bits: string
  difficulty: number
  chainwork: string
  nTx: number
  previousblockhash?: string
  nextblockhash?: string
}

export interface BitcoinBlock extends BitcoinBlockHeader {
  size: number
  strippedsize?: number
  weight: number
  tx: string[] | BitcoinRawTx[]
}

export interface BitcoinVin {
  coinbase?: string
  txid?: string
  vout?: number
  scriptSig?: { asm: string; hex: string }
  sequence: number
  txinwitness?: string[]
  prevout?: {
    generated?: boolean
    height?: number
    value: number
    scriptPubKey: { asm: string; desc?: string; hex: string; address?: string; type: string }
  }
}

export interface BitcoinVout {
  value: number // In BTC
  n: number
  scriptPubKey: {
    asm: string
    desc?: string
    hex: string
    address?: string
    addresses?: string[]
    type: string
  }
}

export interface BitcoinRawTx {
  txid: string
  hash: string
  version: number
  size: number
  vsize: number
  weight: number
  locktime: number
  vin: BitcoinVin[]
  vout: BitcoinVout[]
  blockhash?: string
  confirmations?: number
  time?: number
  blocktime?: number
}

export interface BitcoinTxOut {
  bestblock: string
  confirmations: number
  value: number
  scriptPubKey: {
    asm: string
    desc?: string
    hex: string
    address?: string
    type: string
  }
  coinbase: boolean
}

interface JsonRpcResponse<T> {
  result?: T
  error?: { code: number; message: string } | null
  id: string | number
}

export class BitcoinRpcClient {
  private readonly url: string
  private readonly authHeader?: string
  private readonly timeoutMs: number

  constructor(config: BitcoinRpcConfig) {
    let cleanUrl = config.url.trim()
    let user = config.user
    let password = config.password

    // Support embedded basic auth in url, e.g. http://user:pass@host:port
    try {
      if (cleanUrl.includes("@") && cleanUrl.startsWith("http")) {
        const parsed = new URL(cleanUrl)
        if (parsed.username && !user) user = decodeURIComponent(parsed.username)
        if (parsed.password && !password) password = decodeURIComponent(parsed.password)
        parsed.username = ""
        parsed.password = ""
        cleanUrl = parsed.toString()
      }
    } catch {
      // Ignore URL parse failures here; fetch will handle invalid URLs
    }

    this.url = cleanUrl
    this.timeoutMs = config.timeoutMs ?? 10000

    if (user || password) {
      const creds = `${user ?? ""}:${password ?? ""}`
      this.authHeader = `Basic ${Buffer.from(creds).toString("base64")}`
    }
  }

  async call<T>(method: string, params: unknown[] = []): Promise<T> {
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), this.timeoutMs)

    const headers: Record<string, string> = {
      "content-type": "application/json",
      accept: "application/json",
    }
    if (this.authHeader) {
      headers["authorization"] = this.authHeader
    }

    try {
      const res = await fetch(this.url, {
        method: "POST",
        headers,
        body: JSON.stringify({
          jsonrpc: "1.0",
          id: "tracechain-btc",
          method,
          params,
        }),
        cache: "no-store",
        signal: controller.signal,
      })

      if (res.status === 401) {
        throw new ProviderError("Bitcoin RPC authentication failed (HTTP 401). Verify BITCOIN_RPC_USER and BITCOIN_RPC_PASSWORD.", "not_configured", 401)
      }
      if (res.status === 429) {
        throw new ProviderError("Bitcoin RPC rate limit exceeded (HTTP 429).", "rate_limit", 429)
      }
      if (!res.ok) {
        let errBody = ""
        try {
          errBody = await res.text()
        } catch {
          // ignore
        }
        throw new ProviderError(`Bitcoin RPC request failed (${res.status}): ${errBody || res.statusText}`, "http", res.status)
      }

      let payload: JsonRpcResponse<T>
      try {
        payload = (await res.json()) as JsonRpcResponse<T>
      } catch {
        throw new ProviderError("Bitcoin RPC returned malformed JSON.", "parse")
      }

      if (payload.error) {
        const code = payload.error.code
        const msg = payload.error.message || "Bitcoin RPC error"
        // Code -5: No such mempool or blockchain transaction / txindex missing
        if (code === -5) {
          throw new ProviderError(msg, "http", 404)
        }
        throw new ProviderError(`Bitcoin RPC error (${code}): ${msg}`, "http", code)
      }

      if (payload.result === undefined) {
        throw new ProviderError("Bitcoin RPC response contained no result.", "parse")
      }

      return payload.result
    } catch (err) {
      if (err instanceof ProviderError) throw err
      if (err instanceof DOMException && err.name === "AbortError") {
        throw new ProviderError("Bitcoin RPC request timed out.", "timeout")
      }
      throw new ProviderError(`Bitcoin RPC network error: ${err instanceof Error ? err.message : "unknown"}`, "network")
    } finally {
      clearTimeout(timer)
    }
  }

  async getBlockchainInfo(): Promise<BitcoinBlockchainInfo> {
    return this.call<BitcoinBlockchainInfo>("getblockchaininfo")
  }

  async getNetworkInfo(): Promise<BitcoinNetworkInfo> {
    return this.call<BitcoinNetworkInfo>("getnetworkinfo")
  }

  async getBlockCount(): Promise<number> {
    return this.call<number>("getblockcount")
  }

  async getBestBlockHash(): Promise<string> {
    return this.call<string>("getbestblockhash")
  }

  async getBlockHash(height: number): Promise<string> {
    return this.call<string>("getblockhash", [height])
  }

  async getBlockHeader(hash: string, verbose = true): Promise<BitcoinBlockHeader> {
    return this.call<BitcoinBlockHeader>("getblockheader", [hash, verbose])
  }

  async getBlock(hash: string, verbosity = 1): Promise<BitcoinBlock> {
    return this.call<BitcoinBlock>("getblock", [hash, verbosity])
  }

  async getRawTransaction(txid: string, verbose = true): Promise<BitcoinRawTx> {
    return this.call<BitcoinRawTx>("getrawtransaction", [txid, verbose])
  }

  async decodeRawTransaction(hex: string): Promise<BitcoinRawTx> {
    return this.call<BitcoinRawTx>("decoderawtransaction", [hex])
  }

  async getTxOut(txid: string, n: number, includeMempool = true): Promise<BitcoinTxOut | null> {
    return this.call<BitcoinTxOut | null>("gettxout", [txid, n, includeMempool])
  }

  async getRawMempool(verbose = false): Promise<string[] | Record<string, unknown>> {
    return this.call<string[] | Record<string, unknown>>("getrawmempool", [verbose])
  }
}
