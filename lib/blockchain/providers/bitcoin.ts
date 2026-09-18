import type { Chain, Transaction } from "@/lib/types"
import { AbstractProvider } from "./base"
import { ProviderError } from "@/lib/blockchain/net"
import { getChainConfig } from "@/lib/blockchain/config"
import { normalizeNative } from "@/lib/blockchain/normalize"
import {
  type DataSource,
  type PagedTransactions,
  type TokenTransfer,
  type TxQueryOptions,
  type WalletBalance,
} from "@/lib/blockchain/data-source"
import {
  BitcoinRpcClient,
  type BitcoinBlock,
  type BitcoinBlockHeader,
  type BitcoinBlockchainInfo,
  type BitcoinNetworkInfo,
  type BitcoinRawTx,
  type BitcoinTxOut,
} from "./bitcoin-rpc"

export class BitcoinProvider extends AbstractProvider {
  readonly chain: Chain = "bitcoin"
  readonly name = "bitcoin:rpc"
  readonly nativeSource: DataSource = "LIVE"

  private client(): BitcoinRpcClient {
    const cfg = getChainConfig("bitcoin")
    if (!cfg.configured || !cfg.baseUrl) {
      throw new ProviderError(
        "Bitcoin Core RPC is not configured. Set BITCOIN_RPC_URL (and BITCOIN_RPC_USER / BITCOIN_RPC_PASSWORD if authentication is required).",
        "not_configured",
      )
    }
    const user = process.env.BITCOIN_RPC_USER
    const password = process.env.BITCOIN_RPC_PASSWORD || cfg.apiKey
    return new BitcoinRpcClient({
      url: cfg.baseUrl,
      user,
      password,
    })
  }

  isConfigured(): boolean {
    return getChainConfig("bitcoin").configured
  }

  async getBlockchainInfo(): Promise<BitcoinBlockchainInfo> {
    return this.client().getBlockchainInfo()
  }

  async getNetworkInfo(): Promise<BitcoinNetworkInfo> {
    return this.client().getNetworkInfo()
  }

  async getBlockCount(): Promise<number> {
    return this.client().getBlockCount()
  }

  async getBestBlockHash(): Promise<string> {
    return this.client().getBestBlockHash()
  }

  async getBlockHash(height: number): Promise<string> {
    return this.client().getBlockHash(height)
  }

  async getBlockHeader(hash: string): Promise<BitcoinBlockHeader> {
    return this.client().getBlockHeader(hash)
  }

  async getBlock(hash: string, verbosity = 1): Promise<BitcoinBlock> {
    return this.client().getBlock(hash, verbosity)
  }

  async getRawTransaction(txid: string, verbose = true): Promise<BitcoinRawTx> {
    return this.client().getRawTransaction(txid, verbose)
  }

  async decodeRawTransaction(hex: string): Promise<BitcoinRawTx> {
    return this.client().decodeRawTransaction(hex)
  }

  async getTxOut(txid: string, n: number, includeMempool = true): Promise<BitcoinTxOut | null> {
    return this.client().getTxOut(txid, n, includeMempool)
  }

  async getRawMempool(verbose = false): Promise<string[] | Record<string, unknown>> {
    return this.client().getRawMempool(verbose)
  }

  // Single transaction lookup using native Bitcoin Core getrawtransaction RPC.
  async getTransaction(hash: string): Promise<Transaction | null> {
    try {
      const client = this.client()
      const tx = await client.getRawTransaction(hash, true)
      if (!tx) return null

      // Resolve block height if blockhash is present
      let blockHeight: number | null = null
      if (tx.blockhash) {
        try {
          const header = await client.getBlockHeader(tx.blockhash)
          if (header && typeof header.height === "number") {
            blockHeight = header.height
          }
        } catch {
          // Non-fatal if header lookup fails
        }
      }

      // Map UTXO inputs and outputs preserving true multi-input / multi-output semantics
      const inputs = tx.vin.map((v) => ({
        txid: v.txid,
        vout: v.vout,
        coinbase: v.coinbase,
        address: v.prevout?.scriptPubKey?.address,
        value: v.prevout?.value,
      }))

      const outputs = tx.vout.map((v) => ({
        n: v.n,
        address: v.scriptPubKey?.address ?? v.scriptPubKey?.addresses?.[0] ?? "unknown",
        value: v.value ?? 0,
      }))

      // Determine primary sender
      const fromAddr =
        inputs.find((i) => i.address)?.address ??
        (inputs[0]?.coinbase ? "coinbase" : inputs[0]?.txid ? `${inputs[0].txid.slice(0, 10)}…:${inputs[0].vout ?? 0}` : "unknown")

      // Determine primary recipient and amount: sort outputs descending by BTC value
      const sortedOutputs = [...outputs].sort((a, b) => b.value - a.value)
      const primaryOutput = sortedOutputs[0]
      const toAddr = primaryOutput?.address ?? "unknown"
      const amount = primaryOutput?.value ?? 0

      const blockTimeSec = tx.blocktime ?? tx.time
      const timestamp = blockTimeSec ? new Date(blockTimeSec * 1000).toISOString() : null

      return normalizeNative({
        hash: tx.txid || hash,
        chain: "bitcoin",
        from: fromAddr,
        to: toAddr,
        amount,
        asset: "BTC",
        timestamp,
        blockHeight,
        provenance: "LIVE_BLOCKCHAIN_DATA",
        sourceType: "RAW_RPC",
      })
    } catch {
      return null
    }
  }

  // Native Bitcoin Core RPC has no built-in arbitrary address index.
  // Standard bitcoind cannot answer "list every transaction for this address"
  // without node-side indexing (-addressindex / txindex / indexer service).
  // This limitation is surfaced honestly rather than fabricating data or falling back to an explorer.
  async getTransactionsPaged(_address?: string, _chain?: Chain, _options?: TxQueryOptions): Promise<PagedTransactions> {
    return {
      transactions: [],
      meta: {
        totalFetched: 0,
        pagesFetched: 0,
        truncated: false,
        unsupported: true,
        unsupportedReason:
          "UNSUPPORTED_WITH_CURRENT_RPC: Bitcoin Core does not index arbitrary address history without txindex and address-index capabilities (-addressindex / node-side indexer). Native RPC single transaction lookup (getrawtransaction), block data (getblock), and blockchain info (getblockchaininfo) are fully supported.",
      },
    }
  }

  async getTransactions(address?: string, chain?: Chain, options?: TxQueryOptions): Promise<Transaction[]> {
    const { transactions } = await this.getTransactionsPaged(address, chain, options)
    return transactions
  }

  async getWalletBalance(address: string): Promise<WalletBalance> {
    return {
      address,
      chain: "bitcoin",
      balance: 0,
      asset: "BTC",
      usdBalance: null,
    }
  }

  // Bitcoin has no native token layer.
  async getTokenTransfers(): Promise<TokenTransfer[]> {
    return []
  }
}
