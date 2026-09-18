import type { Chain, Transaction } from "@/lib/types"
import { AbstractProvider } from "./base"
import { ProviderError } from "@/lib/blockchain/net"
import { getChainConfig, NATIVE_ASSET } from "@/lib/blockchain/config"
import {
  getBalanceViaRpc,
  getBlockTimestampViaRpc,
  getBlockNumberViaRpc,
  getLogsViaRpc,
  getTransactionViaRpc,
  getTokenMetadataViaRpc,
  type RpcLog,
} from "./evm-rpc"
import {
  normalizeNative,
  normalizeToken,
  baseUnitsToDecimal,
  directionOf,
  parseBlockHeight,
  parseDateBounds,
  classifyTimestamp,
} from "@/lib/blockchain/normalize"
import {
  type DataSource,
  type PagedTokenTransfers,
  type PagedTransactions,
  type TokenTransfer,
  type TxQueryOptions,
  type WalletBalance,
} from "@/lib/blockchain/data-source"

// keccak256("Transfer(address,address,uint256)") — the ERC-20/BEP-20
// Transfer event topic0, identical on every EVM chain.
const TRANSFER_TOPIC = "0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3e"

// eth_getLogs range every public node will actually serve without a 429/
// "range too large" rejection.
const LOG_SCAN_BLOCK_WINDOW = 50_000

function addressTopic(address: string): string {
  return "0x" + address.toLowerCase().replace(/^0x/, "").padStart(64, "0")
}

// Direct-node EVM adapter shared by Ethereum, Polygon, BSC, Arbitrum,
// Optimism, Base and Avalanche. No block-explorer/indexer API is used —
// every read is a JSON-RPC call against a public or operator-supplied node.
export class EvmProvider extends AbstractProvider {
  readonly nativeSource: DataSource = "LIVE"

  constructor(readonly chain: Chain) {
    super()
  }

  get name(): string {
    return `evm-rpc:${this.chain}`
  }

  isConfigured(): boolean {
    return getChainConfig(this.chain).configured
  }

  private rpcUrl(): string {
    const cfg = getChainConfig(this.chain)
    if (!cfg.rpcUrl) throw new ProviderError(`${this.chain} has no RPC endpoint configured.`, "not_configured")
    return cfg.rpcUrl
  }

  // RPC-FIRST balance read (eth_getBalance) — works on every EVM chain with
  // zero configuration beyond the public node.
  async getWalletBalance(address: string): Promise<WalletBalance> {
    const wei = await getBalanceViaRpc(this.rpcUrl(), address)
    return {
      address,
      chain: this.chain,
      balance: baseUnitsToDecimal(wei, 18),
      asset: NATIVE_ASSET[this.chain],
      usdBalance: null,
    }
  }

  // Single-transaction lookup by hash — always answerable directly by any
  // node, no indexer required.
  async getTransaction(hash: string): Promise<Transaction | null> {
    const rpcUrl = this.rpcUrl()
    const tx = await getTransactionViaRpc(rpcUrl, hash)
    if (!tx) return null
    const timestamp = tx.blockNumber ? await getBlockTimestampViaRpc(rpcUrl, tx.blockNumber) : null
    return normalizeNative({
      hash,
      chain: this.chain,
      from: tx.from,
      to: tx.to ?? "",
      amount: baseUnitsToDecimal(tx.value, 18),
      asset: NATIVE_ASSET[this.chain],
      timestamp,
      blockHeight: parseBlockHeight(tx.blockNumber),
      provenance: "LIVE_BLOCKCHAIN_DATA",
      sourceType: "RAW_RPC",
    })
  }

  // Raw JSON-RPC has no "list every historical transaction touching this
  // address" call — that requires an indexer/archive service this adapter
  // deliberately does not use. Reporting this honestly as an explicitly-marked
  // UNSUPPORTED_WITH_CURRENT_RPC result.
  async getTransactionsPaged(_address?: string, _chain?: Chain, _options?: TxQueryOptions): Promise<PagedTransactions> {
    // Check RPC connectivity so node outages fail fast and honestly
    try {
      await getBlockNumberViaRpc(this.rpcUrl())
    } catch (err) {
      if (err instanceof ProviderError) {
        throw err
      }
    }
    return {
      transactions: [],
      meta: {
        totalFetched: 0,
        pagesFetched: 0,
        truncated: false,
        unsupported: true,
        status: "UNSUPPORTED_WITH_CURRENT_RPC",
        unsupportedReason:
          `UNSUPPORTED_WITH_CURRENT_RPC: Native ${this.chain} transaction history cannot be listed from a raw JSON-RPC node without an archive/indexer service. Balance and single-transaction lookups and token transfer scans via eth_getLogs are fully live.`,
      },
    }
  }

  async getTransactions(address?: string, chain?: Chain, options?: TxQueryOptions): Promise<Transaction[]> {
    const { transactions } = await this.getTransactionsPaged(address, chain, options)
    return transactions
  }

  // ERC-20/BEP-20 transfer history IS answerable directly via eth_getLogs.
  // We scan backward from chain head in bounded windows with deduplication,
  // date filtering, and resolve token metadata via eth_call (decimals/symbol/name).
  async getTokenTransfersPaged(address: string, _chain?: Chain, options: TxQueryOptions = {}): Promise<PagedTokenTransfers> {
    const rpcUrl = this.rpcUrl()
    const cap = Math.min(options.maxTransactions ?? 500, 500)
    const maxWindows = options.maxPages ?? 10
    const bounds = parseDateBounds(options)

    const head = await getBlockNumberViaRpc(rpcUrl)
    const topic = addressTopic(address)

    const all: TokenTransfer[] = []
    const seenHashes = new Set<string>()
    let toBlock = head
    let windowsScanned = 0
    let truncated = false
    let reachedWindowEnd = false

    // Cache of token contract metadata for this request
    const metaCache = new Map<string, { symbol: string; name: string; decimals: number | null }>()

    while (windowsScanned < maxWindows && toBlock > 0) {
      const fromBlock = Math.max(0, toBlock - LOG_SCAN_BLOCK_WINDOW + 1)
      windowsScanned++

      const [sent, received] = await Promise.all([
        getLogsViaRpc(rpcUrl, { topics: [TRANSFER_TOPIC, topic, null], fromBlock, toBlock }),
        getLogsViaRpc(rpcUrl, { topics: [TRANSFER_TOPIC, null, topic], fromBlock, toBlock }),
      ])

      // Deduplicate logs
      const rawLogs = [...sent, ...received]
      const uniqueLogs: RpcLog[] = []
      for (const log of rawLogs) {
        const id = `${log.transactionHash.toLowerCase()}-${log.logIndex ?? ""}-${log.topics.join(":")}`
        if (!seenHashes.has(id)) {
          seenHashes.add(id)
          uniqueLogs.push(log)
        }
      }

      uniqueLogs.sort((a, b) => Number(BigInt(b.blockNumber)) - Number(BigInt(a.blockNumber)))

      // Batch resolve token metadata for contracts seen in this window (bounded up to 20 unique contracts)
      const unknownContracts = Array.from(new Set(uniqueLogs.map((l) => l.address.toLowerCase()))).filter((addr) => !metaCache.has(addr)).slice(0, 20)
      if (unknownContracts.length > 0) {
        await Promise.all(
          unknownContracts.map(async (addr) => {
            const meta = await getTokenMetadataViaRpc(rpcUrl, addr)
            metaCache.set(addr, meta)
          }),
        )
      }

      for (const log of uniqueLogs) {
        if (log.topics.length < 3) continue
        const from = "0x" + log.topics[1].slice(-40)
        const to = "0x" + log.topics[2].slice(-40)
        let amountRaw: string
        try {
          amountRaw = BigInt(log.data).toString()
        } catch {
          continue
        }

        const timestamp = await getBlockTimestampViaRpc(rpcUrl, log.blockNumber)
        const cls = classifyTimestamp(timestamp, bounds)
        if (cls === "after") continue
        if (cls === "before") {
          reachedWindowEnd = true
          break
        }

        const tokenAddr = log.address.toLowerCase()
        const meta = metaCache.get(tokenAddr) ?? { symbol: "UNKNOWN", name: "Unknown Token", decimals: null }
        const decimals = meta.decimals ?? 18
        const amount = baseUnitsToDecimal(amountRaw, decimals)

        all.push({
          hash: log.transactionHash,
          chain: this.chain,
          from,
          to,
          tokenSymbol: meta.symbol,
          tokenName: meta.name,
          tokenAddress: log.address,
          amount,
          decimals,
          timestamp,
          blockHeight: parseBlockHeight(log.blockNumber),
          direction: directionOf(address, from, to),
          usdValue: null,
        })

        if (all.length >= cap) break
      }

      if (all.length >= cap || reachedWindowEnd) {
        truncated = all.length >= cap
        break
      }
      toBlock = fromBlock - 1
    }

    if (toBlock > 0 && !truncated && !reachedWindowEnd && all.length > 0) {
      truncated = true
    }

    const status = all.length === 0 ? "NO_ACTIVITY_FOUND" : truncated ? "HISTORY_TRUNCATED" : "SUCCESS"

    return {
      transfers: all.slice(0, cap),
      meta: {
        totalFetched: all.length,
        pagesFetched: windowsScanned,
        truncated,
        status,
        unsupportedReason: truncated
          ? `Token-transfer history was scanned in ${LOG_SCAN_BLOCK_WINDOW.toLocaleString()}-block windows via eth_getLogs and capped at ${windowsScanned} window(s) from current chain head.`
          : undefined,
      },
    }
  }

  async getTokenTransfers(address: string, chain?: Chain, options?: TxQueryOptions): Promise<TokenTransfer[]> {
    const { transfers } = await this.getTokenTransfersPaged(address, chain, options)
    return transfers
  }
}

// Adapt a rich TokenTransfer into the common Transaction shape
export function evmTokenTransferToTransaction(t: TokenTransfer, referenceAddress?: string): Transaction {
  return normalizeToken({
    hash: t.hash,
    chain: t.chain,
    from: t.from,
    to: t.to,
    amount: t.amount,
    asset: t.tokenSymbol,
    tokenAddress: t.tokenAddress,
    timestamp: t.timestamp,
    blockHeight: t.blockHeight,
    address: referenceAddress,
    sourceType: "RAW_RPC",
  })
}

// Named subclasses for each supported EVM chain
export class EthereumProvider extends EvmProvider {
  constructor() {
    super("ethereum")
  }
}
export class PolygonProvider extends EvmProvider {
  constructor() {
    super("polygon")
  }
}
export class BSCProvider extends EvmProvider {
  constructor() {
    super("bsc")
  }
}
export class ArbitrumProvider extends EvmProvider {
  constructor() {
    super("arbitrum")
  }
}
export class OptimismProvider extends EvmProvider {
  constructor() {
    super("optimism")
  }
}
export class BaseProvider extends EvmProvider {
  constructor() {
    super("base")
  }
}
export class AvalancheProvider extends EvmProvider {
  constructor() {
    super("avalanche")
  }
}
