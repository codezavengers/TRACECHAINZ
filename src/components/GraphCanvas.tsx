import React, { useState } from "react";
import type { GraphNode, GraphEdge, WalletKind } from "@/lib/types";
import { usd, shortAddr, riskColorVar, WALLET_KIND_LABEL } from "@/lib/format";
import {
  ShieldAlert,
  Landmark,
  Flame,
  ArrowRight,
  Copy,
  Check,
  ExternalLink,
  Layers,
  ZoomIn,
  ZoomOut,
  RotateCcw,
} from "lucide-react";

interface GraphCanvasProps {
  nodes: GraphNode[];
  edges: GraphEdge[];
  selectedNodeId?: string | null;
  onSelectNode?: (node: GraphNode | null) => void;
}

export function GraphCanvas({ nodes, edges, selectedNodeId, onSelectNode }: GraphCanvasProps) {
  const [zoom, setZoom] = useState(1);
  const [copied, setCopied] = useState<string | null>(null);
  const [activeDepth, setActiveDepth] = useState<number | "ALL">("ALL");

  const filteredNodes = nodes.filter((n) => {
    if (activeDepth === "ALL") return true;
    return (n.depth ?? 0) <= activeDepth;
  });

  const filteredNodeIds = new Set(filteredNodes.map((n) => n.id));
  const filteredEdges = edges.filter(
    (e) => filteredNodeIds.has(e.source) && filteredNodeIds.has(e.target)
  );

  const selectedNode = nodes.find((n) => n.id === selectedNodeId) || null;

  // Calculate layout coordinates hierarchically based on depth
  const depthGroups: Record<number, GraphNode[]> = {};
  filteredNodes.forEach((n) => {
    const d = n.depth ?? 0;
    if (!depthGroups[d]) depthGroups[d] = [];
    depthGroups[d].push(n);
  });

  const maxDepth = Math.max(0, ...Object.keys(depthGroups).map(Number));
  const width = Math.max(800, (maxDepth + 1) * 240);
  const height = 480;

  const nodePositions: Record<string, { x: number; y: number }> = {};

  Object.entries(depthGroups).forEach(([depthStr, groupNodes]) => {
    const depth = Number(depthStr);
    const colX = 120 + depth * 220;
    const count = groupNodes.length;
    const spacingY = height / (count + 1);

    groupNodes.forEach((node, idx) => {
      nodePositions[node.id] = {
        x: colX,
        y: spacingY * (idx + 1),
      };
    });
  });

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(text);
    setTimeout(() => setCopied(null), 2000);
  };

  const getNodeColor = (kind: WalletKind) => {
    switch (kind) {
      case "VICTIM":
        return "#3b82f6"; // blue
      case "SUSPICIOUS":
        return "#ef4444"; // red
      case "BURNER":
        return "#f97316"; // orange
      case "VASP":
      case "EXCHANGE":
        return "#eab308"; // gold
      case "BRIDGE":
        return "#a855f7"; // purple
      case "MIXER":
        return "#ec4899"; // pink
      default:
        return "#94a3b8";
    }
  };

  return (
    <div className="relative w-full rounded-xl border border-white/10 bg-[#14171f] overflow-hidden">
      {/* Top control bar */}
      <div className="flex flex-wrap items-center justify-between border-b border-white/10 bg-[#181c26] px-4 py-2.5 text-xs text-slate-300">
        <div className="flex items-center gap-3">
          <span className="font-semibold text-white flex items-center gap-1.5">
            <Layers className="size-3.5 text-amber-400" />
            Interactive Fund Flow Topology
          </span>
          <span className="rounded bg-white/5 px-2 py-0.5 text-[11px] text-slate-400">
            {filteredNodes.length} Wallets · {filteredEdges.length} Transfers
          </span>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 bg-black/40 rounded-lg p-0.5 border border-white/10">
            <span className="text-[10px] text-slate-400 px-1.5 uppercase font-medium">Trace Depth:</span>
            {(["ALL", 1, 2, 3] as const).map((d) => (
              <button
                key={d}
                onClick={() => setActiveDepth(d)}
                className={`px-2 py-0.5 rounded text-[11px] font-medium transition ${
                  activeDepth === d
                    ? "bg-amber-400 text-black shadow-sm font-semibold"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                {d === "ALL" ? "All" : `Hop ${d}`}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-1 bg-black/40 rounded-lg p-0.5 border border-white/10">
            <button
              onClick={() => setZoom((z) => Math.min(1.6, z + 0.15))}
              className="p-1 rounded text-slate-400 hover:text-white hover:bg-white/10"
              title="Zoom in"
            >
              <ZoomIn className="size-3.5" />
            </button>
            <button
              onClick={() => setZoom((z) => Math.max(0.6, z - 0.15))}
              className="p-1 rounded text-slate-400 hover:text-white hover:bg-white/10"
              title="Zoom out"
            >
              <ZoomOut className="size-3.5" />
            </button>
            <button
              onClick={() => setZoom(1)}
              className="p-1 rounded text-slate-400 hover:text-white hover:bg-white/10"
              title="Reset Zoom"
            >
              <RotateCcw className="size-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* SVG Canvas */}
      <div className="relative overflow-x-auto overflow-y-hidden p-4 min-h-[480px] flex items-center justify-center bg-[radial-gradient(#ffffff08_1px,transparent_1px)] [background-size:16px_16px]">
        <div
          style={{
            transform: `scale(${zoom})`,
            transformOrigin: "center center",
            transition: "transform 0.15s ease-out",
          }}
          className="relative"
        >
          <svg width={width} height={height} className="overflow-visible select-none">
            <defs>
              <marker
                id="arrow-gold"
                viewBox="0 0 10 10"
                refX="22"
                refY="5"
                markerWidth="6"
                markerHeight="6"
                orient="auto-start-reverse"
              >
                <path d="M 0 1.5 L 8 5 L 0 8.5 z" fill="#eab308" />
              </marker>
              <marker
                id="arrow-red"
                viewBox="0 0 10 10"
                refX="22"
                refY="5"
                markerWidth="6"
                markerHeight="6"
                orient="auto-start-reverse"
              >
                <path d="M 0 1.5 L 8 5 L 0 8.5 z" fill="#ef4444" />
              </marker>
              <marker
                id="arrow-default"
                viewBox="0 0 10 10"
                refX="22"
                refY="5"
                markerWidth="6"
                markerHeight="6"
                orient="auto-start-reverse"
              >
                <path d="M 0 1.5 L 8 5 L 0 8.5 z" fill="#64748b" />
              </marker>
            </defs>

            {/* Render Edges */}
            {filteredEdges.map((e) => {
              const src = nodePositions[e.source];
              const tgt = nodePositions[e.target];
              if (!src || !tgt) return null;

              const isGold = e.usdValue > 50000;
              const strokeColor = isGold ? "#eab308" : "#64748b";
              const markerId = isGold ? "url(#arrow-gold)" : "url(#arrow-default)";

              // Quadratic bezier curve midpoint
              const midX = (src.x + tgt.x) / 2;
              const midY = (src.y + tgt.y) / 2 - 18;

              return (
                <g key={e.id} className="transition-opacity">
                  <path
                    d={`M ${src.x} ${src.y} Q ${midX} ${midY} ${tgt.x} ${tgt.y}`}
                    fill="none"
                    stroke={strokeColor}
                    strokeWidth={isGold ? 2.5 : 1.7}
                    strokeDasharray={e.kind === "BRIDGED" ? "4 4" : undefined}
                    markerEnd={markerId}
                    opacity={0.8}
                  />
                  {/* Edge pill label */}
                  <g transform={`translate(${midX}, ${midY})`}>
                    <rect
                      x="-42"
                      y="-11"
                      width="84"
                      height="20"
                      rx="4"
                      fill="#0f172a"
                      stroke={strokeColor}
                      strokeWidth="1"
                    />
                    <text
                      x="0"
                      y="3"
                      fill="#f8fafc"
                      fontSize="10"
                      fontWeight="600"
                      textAnchor="middle"
                      className="font-mono"
                    >
                      {usd(e.usdValue)}
                    </text>
                  </g>
                </g>
              );
            })}

            {/* Render Nodes */}
            {filteredNodes.map((n) => {
              const pos = nodePositions[n.id];
              if (!pos) return null;
              const isSelected = selectedNodeId === n.id;
              const color = getNodeColor(n.kind);

              return (
                <g
                  key={n.id}
                  transform={`translate(${pos.x}, ${pos.y})`}
                  onClick={() => onSelectNode?.(isSelected ? null : n)}
                  className="cursor-pointer group"
                >
                  {/* Outer selection ring */}
                  {isSelected && (
                    <circle
                      r="26"
                      fill="none"
                      stroke={color}
                      strokeWidth="2.5"
                      strokeDasharray="4 2"
                      className="animate-spin"
                      style={{ animationDuration: "8s" }}
                    />
                  )}

                  {/* Node Circle */}
                  <circle
                    r="20"
                    fill="#181e2b"
                    stroke={color}
                    strokeWidth={isSelected ? 3 : 2}
                    className="transition duration-150 group-hover:filter group-hover:drop-shadow-[0_0_8px_rgba(234,179,8,0.5)]"
                  />

                  {/* Icon inside circle */}
                  {n.kind === "VASP" || n.kind === "EXCHANGE" ? (
                    <text x="0" y="5" textAnchor="middle" fontSize="14" fill="#eab308">
                      🏛️
                    </text>
                  ) : n.kind === "SUSPICIOUS" ? (
                    <text x="0" y="5" textAnchor="middle" fontSize="14" fill="#ef4444">
                      ⚠️
                    </text>
                  ) : n.kind === "BURNER" ? (
                    <text x="0" y="5" textAnchor="middle" fontSize="14" fill="#f97316">
                      🔥
                    </text>
                  ) : n.kind === "VICTIM" ? (
                    <text x="0" y="5" textAnchor="middle" fontSize="14" fill="#3b82f6">
                      🛡️
                    </text>
                  ) : (
                    <circle r="6" fill={color} />
                  )}

                  {/* Node Label Below */}
                  <text
                    x="0"
                    y="32"
                    textAnchor="middle"
                    fill="#cbd5e1"
                    fontSize="11"
                    fontWeight="500"
                    className="font-mono tracking-tight"
                  >
                    {shortAddr(n.id, 5, 4)}
                  </text>

                  {/* Node Type Pill Below */}
                  <text
                    x="0"
                    y="45"
                    textAnchor="middle"
                    fill={color}
                    fontSize="9.5"
                    fontWeight="600"
                    className="uppercase tracking-wider"
                  >
                    {n.kind}
                  </text>
                </g>
              );
            })}
          </svg>
        </div>

        {/* Legend */}
        <div className="absolute bottom-3 left-3 bg-[#0f172a]/90 backdrop-blur border border-white/10 rounded-lg p-2.5 text-[11px] space-y-1.5 pointer-events-none">
          <div className="font-semibold text-slate-300 text-[10px] uppercase tracking-wider">Node Legend</div>
          <div className="grid grid-cols-2 gap-x-3 gap-y-1 text-slate-400">
            <span className="flex items-center gap-1.5"><span className="size-2 rounded-full bg-blue-500" /> Victim Entry</span>
            <span className="flex items-center gap-1.5"><span className="size-2 rounded-full bg-red-500" /> Suspect Address</span>
            <span className="flex items-center gap-1.5"><span className="size-2 rounded-full bg-orange-500" /> Burner / Transit</span>
            <span className="flex items-center gap-1.5"><span className="size-2 rounded-full bg-amber-400" /> VASP Exchange Deposit</span>
          </div>
        </div>

        {/* Selected Node Details Floating Overlay */}
        {selectedNode && (
          <div className="absolute top-3 right-3 w-80 bg-[#161a24]/95 backdrop-blur-md border border-amber-400/40 rounded-xl p-4 shadow-2xl text-xs space-y-3 z-10 animate-in fade-in slide-in-from-top-2">
            <div className="flex items-start justify-between border-b border-white/10 pb-2.5">
              <div>
                <span
                  className="inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase mb-1"
                  style={{
                    backgroundColor: `color-mix(in oklch, ${getNodeColor(selectedNode.kind)} 20%, transparent)`,
                    color: getNodeColor(selectedNode.kind),
                  }}
                >
                  {WALLET_KIND_LABEL[selectedNode.kind]}
                </span>
                <h4 className="font-semibold text-white text-sm">{selectedNode.label || "Blockchain Node"}</h4>
              </div>
              <button
                onClick={() => onSelectNode?.(null)}
                className="text-slate-400 hover:text-white rounded p-1 hover:bg-white/10"
              >
                ✕
              </button>
            </div>

            <div className="space-y-2 text-slate-300">
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Address:</span>
                <div className="flex items-center gap-1 font-mono text-[11px] text-amber-300">
                  <span>{shortAddr(selectedNode.id, 8, 6)}</span>
                  <button
                    onClick={() => handleCopy(selectedNode.id)}
                    className="hover:text-white transition p-0.5"
                    title="Copy full address"
                  >
                    {copied === selectedNode.id ? <Check className="size-3 text-green-400" /> : <Copy className="size-3" />}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-slate-400">Network Chain:</span>
                <span className="font-medium text-white capitalize">{selectedNode.chain}</span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-slate-400">Identified Volume:</span>
                <span className="font-bold text-amber-400 font-mono text-sm">{usd(selectedNode.usdValue)}</span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-slate-400">Hop Depth:</span>
                <span className="bg-white/10 px-2 py-0.5 rounded font-mono text-white">Hop #{selectedNode.depth ?? 0}</span>
              </div>

              {selectedNode.riskScore != null && (
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Threat Risk Score:</span>
                  <span
                    className="font-bold font-mono px-2 py-0.5 rounded"
                    style={{
                      color: selectedNode.riskScore > 80 ? "var(--risk-critical)" : "var(--risk-medium)",
                      backgroundColor: "rgba(0,0,0,0.3)",
                    }}
                  >
                    {selectedNode.riskScore} / 100
                  </span>
                </div>
              )}
            </div>

            <div className="pt-2 border-t border-white/10 flex gap-2">
              <button
                onClick={() => handleCopy(selectedNode.id)}
                className="flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-white font-medium text-xs border border-white/10 transition"
              >
                <Copy className="size-3" /> Copy Address
              </button>
              <a
                href={
                  selectedNode.chain === "bitcoin"
                    ? `https://mempool.space/address/${selectedNode.id}`
                    : selectedNode.chain === "tron"
                      ? `https://tronscan.org/#/address/${selectedNode.id}`
                      : `https://etherscan.io/address/${selectedNode.id}`
                }
                target="_blank"
                rel="noreferrer"
                className="flex items-center justify-center px-3 py-1.5 rounded-lg bg-amber-400/20 text-amber-300 hover:bg-amber-400/30 border border-amber-400/30 transition"
                title="View on Chain Explorer"
              >
                <ExternalLink className="size-3.5" />
              </a>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
