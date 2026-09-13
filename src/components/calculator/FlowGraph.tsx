import React, { useState, useRef, useMemo } from 'react';
import { CalculationBreakdown, ProductionNode } from '../../types';
import { formatRate, formatPower } from '../../utils/calculator';
import { ZoomIn, ZoomOut, Maximize2, Zap, Cog, ArrowRight } from 'lucide-react';

interface FlowGraphProps {
  calculation: CalculationBreakdown;
  onSelectRecipe?: (recipeId: string) => void;
}

interface NodeLayout {
  node: ProductionNode;
  x: number;
  y: number;
  width: number;
  height: number;
}

export const FlowGraph: React.FC<FlowGraphProps> = ({ calculation, onSelectRecipe }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 40, y: 40 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);

  // Group nodes by depth and calculate grid positions
  const { layouts, width, height, rawInputNodes } = useMemo(() => {
    const nodes = calculation.nodes;
    if (nodes.length === 0) {
      return { layouts: [], width: 800, height: 500, rawInputNodes: [] };
    }

    const NODE_WIDTH = 260;
    const NODE_GAP_X = 140;
    const NODE_GAP_Y = 30;

    // Group by depth
    const depthMap = new Map<number, ProductionNode[]>();
    nodes.forEach((n) => {
      const list = depthMap.get(n.depth) || [];
      list.push(n);
      depthMap.set(n.depth, list);
    });

    // Also handle raw inputs as a special depth -1 column on the far left
    const rawNodes = calculation.rawInputs.map((raw, idx) => ({
      ...raw,
      id: `raw-${raw.itemId}`,
      x: 30,
      y: idx * 80 + 40,
      width: 180,
      height: 60,
    }));

    const sortedDepths = Array.from(depthMap.keys()).sort((a, b) => a - b);
    const layoutsArr: NodeLayout[] = [];

    const startX = calculation.rawInputs.length > 0 ? 280 : 40;

    let maxY = 400;

    sortedDepths.forEach((depth, depthColIndex) => {
      const colNodes = depthMap.get(depth) || [];
      const colX = startX + depthColIndex * (NODE_WIDTH + NODE_GAP_X);

      // Estimate height based on number of inputs/outputs
      colNodes.forEach((node, nodeRowIndex) => {
        const inputCount = node.inputs.length;
        const outputCount = node.outputs.length;
        const baseHeight = 140 + Math.max(inputCount, outputCount) * 22;

        // Calculate Y offset
        let currentY = 40;
        for (let i = 0; i < nodeRowIndex; i++) {
          const prev = colNodes[i];
          const prevH = 140 + Math.max(prev.inputs.length, prev.outputs.length) * 22;
          currentY += prevH + NODE_GAP_Y;
        }

        if (currentY + baseHeight > maxY) {
          maxY = currentY + baseHeight;
        }

        layoutsArr.push({
          node,
          x: colX,
          y: currentY,
          width: NODE_WIDTH,
          height: baseHeight,
        });
      });
    });

    const totalWidth = startX + sortedDepths.length * (NODE_WIDTH + NODE_GAP_X) + 100;
    const totalHeight = Math.max(maxY + 100, (rawNodes.length * 85) + 80, 600);

    return { layouts: layoutsArr, width: totalWidth, height: totalHeight, rawInputNodes: rawNodes };
  }, [calculation]);

  // Handle pan & zoom
  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button !== 0) return; // Only left click
    setIsDragging(true);
    setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    setPan({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y,
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const zoomFactor = 1.1;
    let newZoom = e.deltaY < 0 ? zoom * zoomFactor : zoom / zoomFactor;
    newZoom = Math.min(Math.max(newZoom, 0.3), 2.5);
    setZoom(newZoom);
  };

  const resetView = () => {
    setZoom(0.85);
    setPan({ x: 40, y: 40 });
  };

  // Build edge SVG paths
  const edgePaths = useMemo(() => {
    return calculation.edges.map((edge) => {
      const sourceLayout = layouts.find((l) => l.node.id === edge.sourceNodeId);
      const targetLayout = layouts.find((l) => l.node.id === edge.targetNodeId);

      if (!sourceLayout || !targetLayout) return null;

      // Source point on right edge of source node
      const sx = sourceLayout.x + sourceLayout.width;
      const sy = sourceLayout.y + sourceLayout.height / 2;

      // Target point on left edge of target node
      const tx = targetLayout.x;
      const ty = targetLayout.y + targetLayout.height / 2;

      const deltaX = Math.abs(tx - sx) * 0.5;
      const pathData = `M ${sx} ${sy} C ${sx + deltaX} ${sy}, ${tx - deltaX} ${ty}, ${tx} ${ty}`;

      const midX = (sx + tx) / 2;
      const midY = (sy + ty) / 2;

      return {
        id: edge.id,
        path: pathData,
        midX,
        midY,
        edge,
      };
    }).filter(Boolean);
  }, [layouts, calculation.edges]);

  return (
    <div className="relative w-full h-[650px] bg-[#0c121e] rounded-xl border border-slate-800/80 overflow-hidden shadow-2xl select-none group">
      {/* Background blueprint grid pattern */}
      <div
        className="absolute inset-0 pointer-events-none opacity-[0.08]"
        style={{
          backgroundImage: `
            radial-gradient(circle at 1px 1px, #94a3b8 1px, transparent 0),
            linear-gradient(to right, #38bdf8 1px, transparent 1px),
            linear-gradient(to bottom, #38bdf8 1px, transparent 1px)
          `,
          backgroundSize: `${32 * zoom}px ${32 * zoom}px, ${160 * zoom}px ${160 * zoom}px, ${160 * zoom}px ${160 * zoom}px`,
          backgroundPosition: `${pan.x}px ${pan.y}px`,
        }}
      />

      {/* Floating Toolbar Controls */}
      <div className="absolute top-4 right-4 z-20 flex items-center gap-1.5 bg-slate-900/90 backdrop-blur-md border border-slate-700/80 p-1.5 rounded-lg shadow-xl">
        <button
          onClick={() => setZoom((z) => Math.min(z + 0.15, 2.5))}
          className="p-1.5 text-slate-400 hover:text-amber-400 hover:bg-slate-800 rounded transition"
          title="Zoom In"
        >
          <ZoomIn className="w-4 h-4" />
        </button>
        <span className="text-xs font-mono text-slate-400 px-1 select-none min-w-[45px] text-center">
          {Math.round(zoom * 100)}%
        </span>
        <button
          onClick={() => setZoom((z) => Math.max(z - 0.15, 0.3))}
          className="p-1.5 text-slate-400 hover:text-amber-400 hover:bg-slate-800 rounded transition"
          title="Zoom Out"
        >
          <ZoomOut className="w-4 h-4" />
        </button>
        <div className="h-4 w-[1px] bg-slate-700 mx-0.5" />
        <button
          onClick={resetView}
          className="p-1.5 text-slate-400 hover:text-amber-400 hover:bg-slate-800 rounded transition"
          title="Reset Zoom & Pan"
        >
          <Maximize2 className="w-4 h-4" />
        </button>
      </div>

      {/* Interactive Canvas Area */}
      <div
        ref={containerRef}
        className="w-full h-full cursor-grab active:cursor-grabbing"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onWheel={handleWheel}
      >
        <div
          style={{
            transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
            transformOrigin: '0 0',
            width: `${width}px`,
            height: `${height}px`,
            position: 'relative',
          }}
        >
          {/* SVG Connection Edges Layer */}
          <svg
            className="absolute inset-0 pointer-events-none overflow-visible"
            style={{ width: `${width}px`, height: `${height}px` }}
          >
            <defs>
              <linearGradient id="edgeGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#f59e0b" stopOpacity="0.8" />
                <stop offset="100%" stopColor="#0ea5e9" stopOpacity="0.9" />
              </linearGradient>
              <marker
                id="arrowhead"
                markerWidth="8"
                markerHeight="8"
                refX="7"
                refY="4"
                orient="auto"
              >
                <polygon points="0 0, 8 4, 0 8" fill="#0ea5e9" />
              </marker>
            </defs>

            {edgePaths.map((ep) => {
              if (!ep) return null;
              return (
                <g key={ep.id}>
                  {/* Outer glow line */}
                  <path
                    d={ep.path}
                    fill="none"
                    stroke="#0284c7"
                    strokeWidth="4"
                    strokeOpacity="0.25"
                  />
                  {/* Main animated flow line */}
                  <path
                    d={ep.path}
                    fill="none"
                    stroke="url(#edgeGradient)"
                    strokeWidth="2.5"
                    strokeDasharray="6 4"
                    className="animate-[dash_1.5s_linear_infinite]"
                    markerEnd="url(#arrowhead)"
                  />
                </g>
              );
            })}
          </svg>

          {/* Edge Throughput Floating Badges */}
          {edgePaths.map((ep) => {
            if (!ep) return null;
            return (
              <div
                key={`badge-${ep.id}`}
                className="absolute z-10 -translate-x-1/2 -translate-y-1/2 px-2 py-0.5 rounded-full bg-slate-900/95 border border-slate-700/80 shadow-md flex items-center gap-1.5 text-[11px] font-mono pointer-events-auto hover:scale-110 hover:border-amber-400 transition"
                style={{ left: ep.midX, top: ep.midY }}
                title={`${ep.edge.itemName}: ${formatRate(ep.edge.ratePerMin)} / min`}
              >
                <span className="text-sm">{ep.edge.itemIcon}</span>
                <span className="text-amber-300 font-medium">
                  {formatRate(ep.edge.ratePerMin)}
                </span>
                <span className="text-[9px] text-slate-400">/m</span>
              </div>
            );
          })}

          {/* Raw Resource Inputs Column */}
          {rawInputNodes.map((raw) => (
            <div
              key={raw.id}
              className="absolute bg-slate-900/90 border border-emerald-500/40 rounded-lg p-2.5 shadow-lg flex items-center justify-between pointer-events-auto backdrop-blur"
              style={{
                left: raw.x,
                top: raw.y,
                width: raw.width,
                height: raw.height,
              }}
            >
              <div className="flex items-center gap-2 overflow-hidden">
                <span className="text-2xl">{raw.itemIcon}</span>
                <div className="overflow-hidden">
                  <div className="text-xs font-semibold text-slate-200 truncate">
                    {raw.itemName}
                  </div>
                  <div className="text-[10px] text-emerald-400 font-mono">
                    RAW HARVEST
                  </div>
                </div>
              </div>
              <div className="text-right">
                <div className="text-xs font-mono font-bold text-emerald-300">
                  {formatRate(raw.ratePerMin)}
                </div>
                <div className="text-[9px] text-slate-400 font-mono">/min</div>
              </div>
            </div>
          ))}

          {/* Production Recipe Nodes */}
          {layouts.map(({ node, x, y, width: nWidth, height: nHeight }) => {
            const isSelected = selectedNodeId === node.id;
            return (
              <div
                key={node.id}
                onClick={() => {
                  setSelectedNodeId(node.id);
                  if (onSelectRecipe) onSelectRecipe(node.recipeId);
                }}
                className={`absolute rounded-xl border transition-all duration-150 pointer-events-auto shadow-2xl backdrop-blur-md overflow-hidden ${
                  node.isTarget
                    ? 'bg-slate-900/95 border-amber-500/80 shadow-amber-500/10 ring-2 ring-amber-500/30'
                    : isSelected
                    ? 'bg-slate-900/95 border-cyan-400 ring-2 ring-cyan-400/30'
                    : 'bg-slate-900/90 border-slate-700/80 hover:border-slate-500'
                }`}
                style={{
                  left: x,
                  top: y,
                  width: nWidth,
                  height: nHeight,
                }}
              >
                {/* Node Top Header */}
                <div
                  className={`px-3 py-2 border-b flex items-center justify-between ${
                    node.isTarget
                      ? 'bg-amber-500/15 border-amber-500/30 text-amber-300'
                      : 'bg-slate-800/60 border-slate-700/60 text-slate-200'
                  }`}
                >
                  <div className="flex items-center gap-2 overflow-hidden">
                    <span className="text-lg">{node.crafterIcon}</span>
                    <div className="truncate">
                      <div className="text-xs font-bold leading-tight truncate">
                        {node.recipeName}
                      </div>
                      <div className="text-[10px] text-slate-400 flex items-center gap-1">
                        <span>{node.crafterName}</span>
                        <span>•</span>
                        <span>{node.craftTime}s</span>
                      </div>
                    </div>
                  </div>
                  {node.isTarget && (
                    <span className="text-[9px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30 shrink-0">
                      Target
                    </span>
                  )}
                </div>

                {/* Building Count Banner */}
                <div className="px-3 py-2 bg-slate-950/40 border-b border-slate-800 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-1 text-slate-300 font-mono">
                    <Cog className="w-3.5 h-3.5 text-amber-400" />
                    <span className="font-bold text-amber-300 text-sm">
                      {formatRate(node.machinesExact, 2)}
                    </span>
                    <span className="text-[10px] text-slate-400">
                      (need {node.machinesCeil})
                    </span>
                  </div>

                  <div className="flex items-center gap-1 text-[11px] font-mono text-slate-400">
                    <Zap className="w-3 h-3 text-yellow-400" />
                    <span>{formatPower(node.powerKW)}</span>
                  </div>
                </div>

                {/* Ingredients & Products Row */}
                <div className="p-2.5 grid grid-cols-2 gap-2 text-[11px]">
                  {/* Inputs */}
                  <div className="space-y-1">
                    <div className="text-[9px] uppercase tracking-wider text-slate-400 font-semibold mb-1">
                      In / min
                    </div>
                    {node.inputs.map((inp) => (
                      <div
                        key={inp.itemId}
                        className="flex items-center justify-between text-slate-300 bg-slate-800/40 px-1.5 py-0.5 rounded"
                      >
                        <span className="truncate flex items-center gap-1">
                          <span>{inp.itemIcon}</span>
                          <span className="truncate max-w-[50px]">{inp.itemName}</span>
                        </span>
                        <span className="font-mono text-rose-300 font-semibold">
                          -{formatRate(inp.ratePerMin)}
                        </span>
                      </div>
                    ))}
                  </div>

                  {/* Outputs */}
                  <div className="space-y-1 border-l border-slate-800/80 pl-2">
                    <div className="text-[9px] uppercase tracking-wider text-slate-400 font-semibold mb-1 flex items-center gap-1">
                      <span>Out / min</span>
                      <ArrowRight className="w-2.5 h-2.5 text-cyan-400" />
                    </div>
                    {node.outputs.map((out) => (
                      <div
                        key={out.itemId}
                        className="flex items-center justify-between text-slate-200 bg-slate-800/60 px-1.5 py-0.5 rounded font-mono"
                      >
                        <span className="truncate flex items-center gap-1">
                          <span>{out.itemIcon}</span>
                          <span className="truncate max-w-[50px]">{out.itemName}</span>
                        </span>
                        <span className="font-mono text-cyan-300 font-semibold">
                          +{formatRate(out.ratePerMin)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Key Legend Footer */}
      <div className="absolute bottom-3 left-4 z-20 flex items-center gap-4 text-[11px] text-slate-400 bg-slate-900/85 backdrop-blur-md px-3 py-1.5 rounded-lg border border-slate-800 shadow">
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-400/80" />
          <span>Raw Extraction</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-cyan-400/80" />
          <span>Intermediate Fabricator</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-amber-400/80" />
          <span>Target Product</span>
        </div>
        <div className="flex items-center gap-1.5 text-slate-500">
          <span>• Click node to edit crafter • Drag canvas to pan</span>
        </div>
      </div>
    </div>
  );
};
