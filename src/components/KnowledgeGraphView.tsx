import React, { useState, useRef, useEffect } from 'react';
import { BiomedicalGraph, KnowledgeNode, KnowledgeEdge, Medicine } from '../types';
import { useLanguage } from '../context/LanguageContext';
import {
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Filter,
  Search,
  Info,
  GitBranch,
  Layers,
  Sparkles,
  AlertTriangle,
  Pin,
  PinOff,
  ArrowRight,
  Sliders,
  Activity,
  Check,
  CheckCircle2,
} from 'lucide-react';

interface KnowledgeGraphViewProps {
  graph: BiomedicalGraph;
  activeDrugs: Medicine[];
  onPinToWorkbench?: (node: KnowledgeNode) => void;
  onToggleActiveDrug?: (drugId: string) => void;
  onNavigateTab?: (tab: string) => void;
}

export const KnowledgeGraphView: React.FC<KnowledgeGraphViewProps> = ({
  graph,
  activeDrugs,
  onPinToWorkbench,
  onToggleActiveDrug,
  onNavigateTab,
}) => {
  const { translate } = useLanguage();
  const [pinToast, setPinToast] = useState<string | null>(null);
  const [selectedNode, setSelectedNode] = useState<KnowledgeNode | null>(null);
  const [filterType, setFilterType] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [zoomLevel, setZoomLevel] = useState<number>(1);
  const [panOffset, setPanOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  const containerRef = useRef<HTMLDivElement>(null);

  // Filter nodes
  const filteredNodes = graph.nodes.filter((node) => {
    const matchesType = filterType === 'all' || node.type === filterType;
    const matchesSearch =
      !searchTerm ||
      node.label.toLowerCase().includes(searchTerm.toLowerCase()) ||
      node.type.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesType && matchesSearch;
  });

  const filteredNodeIds = new Set(filteredNodes.map((n) => n.id));
  const filteredEdges = graph.edges.filter(
    (e) => filteredNodeIds.has(e.source) && filteredNodeIds.has(e.target)
  );

  // Pan controls
  const handleMouseDown = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).tagName === 'svg' || (e.target as HTMLElement).tagName === 'DIV') {
      setIsDragging(true);
      setDragStart({ x: e.clientX - panOffset.x, y: e.clientY - panOffset.y });
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging) {
      setPanOffset({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y,
      });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const resetView = () => {
    setZoomLevel(1);
    setPanOffset({ x: 0, y: 0 });
    setSelectedNode(null);
  };

  // Node color helper
  const getNodeColor = (type: KnowledgeNode['type']) => {
    switch (type) {
      case 'drug':
        return { fill: '#0891b2', stroke: '#22d3ee', text: '#ecfeff', label: 'Drug' }; // cyan
      case 'enzyme':
        return { fill: '#7c3aed', stroke: '#c084fc', text: '#faf5ff', label: 'CYP Enzyme' }; // purple
      case 'protein':
        return { fill: '#059669', stroke: '#34d399', text: '#f0fdf4', label: 'Protein Target' }; // emerald
      case 'metabolite':
        return { fill: '#d97706', stroke: '#fbbf24', text: '#fffbeb', label: 'Metabolite' }; // amber
      case 'adr':
        return { fill: '#e11d48', stroke: '#fb7185', text: '#fff1f2', label: 'ADR Event' }; // rose
      default:
        return { fill: '#475569', stroke: '#94a3b8', text: '#f8fafc', label: 'Entity' };
    }
  };

  return (
    <div className="space-y-4">
      {/* Controls Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 rounded-xl bg-slate-900 border border-slate-800 text-xs">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 font-bold text-slate-200">
            <GitBranch className="w-4 h-4 text-cyan-400" />
            <span>Biomedical Knowledge Graph</span>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-800 text-cyan-300 font-mono">
              {filteredNodes.length} nodes / {filteredEdges.length} edges
            </span>
          </div>

          {/* Node Filter */}
          <div className="hidden sm:flex items-center gap-1 bg-slate-950 p-1 rounded-lg border border-slate-800">
            {['all', 'drug', 'enzyme', 'protein', 'metabolite', 'adr'].map((type) => (
              <button
                key={type}
                onClick={() => setFilterType(type)}
                className={`px-2 py-1 rounded text-[11px] font-medium capitalize cursor-pointer transition-colors ${
                  filterType === type ? 'bg-cyan-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
                }`}
              >
                {type}
              </button>
            ))}
          </div>
        </div>

        {/* Search & Zoom controls */}
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
            <input
              type="text"
              placeholder="Search graph..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="bg-slate-950 border border-slate-800 rounded-lg pl-8 pr-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500 w-36 sm:w-44"
            />
          </div>

          <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-lg border border-slate-800">
            <button
              onClick={() => setZoomLevel((z) => Math.min(2.5, z + 0.15))}
              className="p-1 hover:bg-slate-800 rounded text-slate-300 hover:text-white cursor-pointer"
              title="Zoom In"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setZoomLevel((z) => Math.max(0.4, z - 0.15))}
              className="p-1 hover:bg-slate-800 rounded text-slate-300 hover:text-white cursor-pointer"
              title="Zoom Out"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={resetView}
              className="p-1 hover:bg-slate-800 rounded text-slate-300 hover:text-white cursor-pointer"
              title="Reset View"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Main Canvas SVG Area */}
      <div
        ref={containerRef}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        className="w-full h-[540px] rounded-2xl bg-slate-950 border border-slate-800 relative overflow-hidden select-none cursor-grab active:cursor-grabbing shadow-inner"
      >
        {/* Subtle coordinate grid */}
        <div
          className="absolute inset-0 opacity-15 pointer-events-none"
          style={{
            backgroundImage:
              'radial-gradient(circle at 1px 1px, rgba(34, 211, 238, 0.4) 1px, transparent 0)',
            backgroundSize: '24px 24px',
          }}
        />

        <svg
          className="w-full h-full"
          style={{
            transform: `translate(${panOffset.x}px, ${panOffset.y}px) scale(${zoomLevel})`,
            transformOrigin: 'center center',
            transition: isDragging ? 'none' : 'transform 0.1s ease-out',
          }}
        >
          <defs>
            <marker
              id="arrow"
              viewBox="0 0 10 10"
              refX="22"
              refY="5"
              markerWidth="6"
              markerHeight="6"
              orient="auto-start-reverse"
            >
              <path d="M 0 0 L 10 5 L 0 10 z" fill="#64748b" />
            </marker>
            <marker
              id="arrow-active"
              viewBox="0 0 10 10"
              refX="22"
              refY="5"
              markerWidth="6"
              markerHeight="6"
              orient="auto-start-reverse"
            >
              <path d="M 0 0 L 10 5 L 0 10 z" fill="#22d3ee" />
            </marker>
          </defs>

          {/* Render Edges */}
          {filteredEdges.map((edge, edgeIdx) => {
            const sourceNode = graph.nodes.find((n) => n.id === edge.source);
            const targetNode = graph.nodes.find((n) => n.id === edge.target);
            if (
              !sourceNode ||
              !targetNode ||
              sourceNode.x === undefined ||
              targetNode.x === undefined ||
              sourceNode.y === undefined ||
              targetNode.y === undefined
            ) {
              return null;
            }

            const isSelectedEdge =
              selectedNode && (selectedNode.id === edge.source || selectedNode.id === edge.target);

            return (
              <g key={`kg_edge_${edge.id}_${edgeIdx}`} className="transition-opacity">
                <line
                  x1={sourceNode.x}
                  y1={sourceNode.y}
                  x2={targetNode.x}
                  y2={targetNode.y}
                  stroke={isSelectedEdge ? '#22d3ee' : '#334155'}
                  strokeWidth={isSelectedEdge ? 2.5 : 1.2}
                  strokeDasharray={edge.relation === 'inhibits' ? '4 2' : undefined}
                  markerEnd={isSelectedEdge ? 'url(#arrow-active)' : 'url(#arrow)'}
                />
                {/* Edge relation badge */}
                <text
                  x={(sourceNode.x + targetNode.x) / 2}
                  y={(sourceNode.y + targetNode.y) / 2 - 4}
                  fill={isSelectedEdge ? '#67e8f9' : '#64748b'}
                  fontSize={8}
                  textAnchor="middle"
                  fontFamily="monospace"
                  className="pointer-events-none select-none"
                >
                  {edge.relation}
                </text>
              </g>
            );
          })}

          {/* Render Nodes */}
          {filteredNodes.map((node, nodeIdx) => {
            if (node.x === undefined || node.y === undefined) return null;
            const style = getNodeColor(node.type);
            const isSelected = selectedNode?.id === node.id;
            const radius = node.type === 'drug' ? 22 : node.type === 'enzyme' ? 18 : 15;

            return (
              <g
                key={`kg_node_${node.id}_${nodeIdx}`}
                transform={`translate(${node.x}, ${node.y})`}
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedNode(node);
                }}
                className="cursor-pointer group"
              >
                {/* Glowing halo when selected */}
                {isSelected && (
                  <circle
                    r={radius + 8}
                    fill="none"
                    stroke="#22d3ee"
                    strokeWidth="2.5"
                    className="animate-pulse"
                  />
                )}

                {/* Node Body */}
                <circle
                  r={radius}
                  fill={style.fill}
                  stroke={isSelected ? '#ffffff' : style.stroke}
                  strokeWidth={isSelected ? 3 : 2}
                  className="transition-transform group-hover:scale-110 drop-shadow-md"
                />

                {/* Node Label Text */}
                <text
                  y={radius + 14}
                  textAnchor="middle"
                  fill="#f1f5f9"
                  fontSize={10}
                  fontWeight={600}
                  className="pointer-events-none select-none font-sans"
                >
                  {node.label}
                </text>

                {/* Sub-label */}
                <text
                  y={radius + 24}
                  textAnchor="middle"
                  fill="#94a3b8"
                  fontSize={8}
                  fontFamily="monospace"
                  className="pointer-events-none select-none uppercase tracking-wider"
                >
                  {node.type}
                </text>
              </g>
            );
          })}
        </svg>

        {/* Legend Overlay */}
        <div className="absolute bottom-3 left-3 bg-slate-900/90 backdrop-blur-md p-2.5 rounded-xl border border-slate-800 text-[10px] space-y-1.5 shadow-lg">
          <span className="font-bold text-slate-300 block mb-1">Knowledge Nodes</span>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-cyan-600 border border-cyan-400" />
            <span className="text-slate-300">Drug Entity</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-purple-600 border border-purple-400" />
            <span className="text-slate-300">CYP Enzyme</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-600 border border-emerald-400" />
            <span className="text-slate-300">Target Receptor</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-600 border border-amber-400" />
            <span className="text-slate-300">Metabolite</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-600 border border-rose-400" />
            <span className="text-slate-300">ADR Event Node</span>
          </div>
        </div>

        {/* Selected Node Details Drawer */}
        {selectedNode && (
          <div className="absolute top-3 right-3 w-80 max-h-[500px] overflow-y-auto bg-slate-900/95 backdrop-blur-xl border border-slate-700/80 rounded-2xl p-4 shadow-2xl z-20 text-xs">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <span className="uppercase tracking-wider font-mono text-[10px] px-2 py-0.5 rounded bg-slate-800 text-cyan-300 font-bold">
                {selectedNode.type}
              </span>
              <button
                onClick={() => setSelectedNode(null)}
                className="text-slate-400 hover:text-white p-0.5"
              >
                ✕
              </button>
            </div>

            <div className="my-3">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h4 className="text-base font-bold text-white tracking-tight">{selectedNode.label}</h4>
                  <p className="text-[11px] text-slate-400 mt-0.5">Biomedical Entity ID: {selectedNode.id}</p>
                </div>

                {/* Quick Pin Icon Button */}
                {selectedNode.type === 'drug' && (
                  <button
                    onClick={() => {
                      if (onPinToWorkbench) {
                        onPinToWorkbench(selectedNode);
                      } else if (onToggleActiveDrug) {
                        onToggleActiveDrug(selectedNode.id);
                      }
                      const isNowActive = activeDrugs.some((d) => d.id === selectedNode.id);
                      setPinToast(
                        isNowActive
                          ? `Removed ${selectedNode.label} from Workbench`
                          : `Pinned ${selectedNode.label} to Simulation Workbench!`
                      );
                      setTimeout(() => setPinToast(null), 3000);
                    }}
                    className={`p-1.5 rounded-lg border text-xs font-semibold flex items-center gap-1 transition-all cursor-pointer ${
                      activeDrugs.some((d) => d.id === selectedNode.id)
                        ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40'
                        : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700'
                    }`}
                    title="Pin / Unpin Drug"
                  >
                    {activeDrugs.some((d) => d.id === selectedNode.id) ? (
                      <PinOff className="w-4 h-4 text-cyan-400" />
                    ) : (
                      <Pin className="w-4 h-4 text-slate-400" />
                    )}
                  </button>
                )}
              </div>

              {/* Pinning & Workbench Navigation CTAs */}
              <div className="mt-3 p-2.5 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                {selectedNode.type === 'drug' && (
                  <>
                    {activeDrugs.some((d) => d.id === selectedNode.id) ? (
                      <div className="space-y-2">
                        <div className="flex items-center gap-1.5 text-emerald-400 font-semibold text-[11px]">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>{translate('Pinned to Workbench')}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => onNavigateTab?.('simulation')}
                            className="flex-1 py-1.5 px-2.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-[11px] flex items-center justify-center gap-1.5 shadow-md shadow-cyan-950/40 transition-colors cursor-pointer"
                          >
                            <Sliders className="w-3 h-3" />
                            <span>{translate('Analyze in Simulation Workbench')}</span>
                          </button>
                          <button
                            onClick={() => {
                              onToggleActiveDrug?.(selectedNode.id);
                              setPinToast(`Unpinned ${selectedNode.label}`);
                              setTimeout(() => setPinToast(null), 3000);
                            }}
                            className="p-1.5 rounded-lg bg-slate-800 hover:bg-rose-950/60 text-slate-400 hover:text-rose-400 border border-slate-700 transition-colors cursor-pointer"
                            title={translate('Remove from Regimen')}
                          >
                            <PinOff className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ) : (
                      <button
                        onClick={() => {
                          if (onPinToWorkbench) {
                            onPinToWorkbench(selectedNode);
                          } else if (onToggleActiveDrug) {
                            onToggleActiveDrug(selectedNode.id);
                          }
                          setPinToast(`Pinned ${selectedNode.label} to Simulation Workbench!`);
                          setTimeout(() => setPinToast(null), 3000);
                        }}
                        className="w-full py-1.5 px-3 rounded-lg bg-gradient-to-r from-cyan-600 to-teal-600 hover:from-cyan-500 hover:to-teal-500 text-white font-bold text-[11px] flex items-center justify-center gap-1.5 shadow-md shadow-cyan-950/40 transition-all cursor-pointer"
                      >
                        <Pin className="w-3.5 h-3.5" />
                        <span>{translate('Pin to Workbench')}</span>
                      </button>
                    )}
                  </>
                )}

                {selectedNode.type === 'enzyme' && (
                  <div className="space-y-1.5">
                    <span className="text-[10px] text-purple-300 font-mono block">
                      Enzyme Parameter Inspection:
                    </span>
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => onNavigateTab?.('simulation')}
                        className="flex-1 py-1 px-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-cyan-300 font-semibold text-[10px] flex items-center justify-center gap-1 cursor-pointer transition-colors"
                      >
                        <Sliders className="w-3 h-3" />
                        <span>Workbench ODEs</span>
                      </button>
                      <button
                        onClick={() => onNavigateTab?.('enzymes')}
                        className="flex-1 py-1 px-2 rounded-lg bg-purple-950/80 hover:bg-purple-900 border border-purple-800/60 text-purple-200 font-semibold text-[10px] flex items-center justify-center gap-1 cursor-pointer transition-colors"
                      >
                        <Activity className="w-3 h-3" />
                        <span>Enzyme Monitor</span>
                      </button>
                    </div>
                  </div>
                )}

                {selectedNode.type === 'adr' && (
                  <button
                    onClick={() => onNavigateTab?.('adr_xai')}
                    className="w-full py-1 px-2 rounded-lg bg-rose-950/80 hover:bg-rose-900 border border-rose-800/60 text-rose-200 font-semibold text-[10px] flex items-center justify-center gap-1 cursor-pointer transition-colors"
                  >
                    <span>Inspect ADR XAI Causal Chain</span>
                    <ArrowRight className="w-3 h-3" />
                  </button>
                )}
              </div>
            </div>

            {/* Dynamic data fields */}
            <div className="space-y-2 text-slate-300">
              {Object.entries(selectedNode.data).map(([key, val]) => (
                <div key={key} className="bg-slate-950/70 p-2 rounded-lg border border-slate-800/80">
                  <span className="text-[10px] text-slate-400 font-mono uppercase tracking-wider block">
                    {key.replace(/([A-Z])/g, ' $1')}
                  </span>
                  <span className="text-xs font-mono font-medium text-cyan-200 break-words">
                    {typeof val === 'object' ? JSON.stringify(val) : String(val)}
                  </span>
                </div>
              ))}
            </div>

            {/* Connected Relationships list */}
            <div className="mt-3 pt-3 border-t border-slate-800">
              <span className="text-[10px] text-slate-400 uppercase font-mono block mb-1">
                Connected Pathways
              </span>
              <ul className="space-y-1">
                {graph.edges
                  .filter((e) => e.source === selectedNode.id || e.target === selectedNode.id)
                  .map((e, eIdx) => (
                    <li
                      key={`pathway_${e.id}_${eIdx}`}
                      className="p-1.5 rounded bg-slate-950 text-[11px] font-mono flex items-center justify-between border border-slate-800"
                    >
                      <span className="text-slate-400">{e.relation}:</span>
                      <span className="font-semibold text-cyan-300 truncate max-w-[150px]">
                        {e.source === selectedNode.id ? e.target : e.source}
                      </span>
                    </li>
                  ))}
              </ul>
            </div>
          </div>
        )}

        {/* Pin Toast Alert Notification */}
        {pinToast && (
          <div className="absolute top-3 left-1/2 -translate-x-1/2 z-50 bg-cyan-950 border border-cyan-500/80 text-cyan-200 px-4 py-2 rounded-xl text-xs font-semibold shadow-2xl flex items-center gap-2 animate-in slide-in-from-top-2">
            <Check className="w-4 h-4 text-cyan-400" />
            <span>{pinToast}</span>
          </div>
        )}
      </div>

      {/* Floating Bottom Pinned Regimen Tray */}
      <div className="p-3 rounded-2xl bg-slate-900 border border-slate-800 flex flex-wrap items-center justify-between gap-3 shadow-lg">
        <div className="flex items-center gap-2 flex-wrap text-xs">
          <div className="flex items-center gap-1.5 font-bold text-slate-200">
            <Pin className="w-4 h-4 text-cyan-400" />
            <span>{translate('Pinned Regimen')} ({activeDrugs.length}):</span>
          </div>
          {activeDrugs.length === 0 ? (
            <span className="text-slate-500 italic text-[11px]">
              {translate('Click any drug node to pin it to Workbench')}
            </span>
          ) : (
            activeDrugs.map((drug) => (
              <span
                key={drug.id}
                className="px-2 py-1 rounded-lg bg-slate-950 border border-cyan-900/60 text-cyan-300 font-mono text-[11px] flex items-center gap-1.5 shadow-sm"
              >
                <span>{drug.genericName}</span>
                <button
                  onClick={() => onToggleActiveDrug?.(drug.id)}
                  className="text-slate-500 hover:text-rose-400 cursor-pointer"
                  title="Unpin"
                >
                  ✕
                </button>
              </span>
            ))
          )}
        </div>

        {activeDrugs.length > 0 && onNavigateTab && (
          <button
            onClick={() => onNavigateTab('simulation')}
            className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-cyan-600 to-teal-600 hover:from-cyan-500 hover:to-teal-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-md shadow-cyan-950/40 cursor-pointer transition-all"
          >
            <span>{translate('Open in Simulation Workbench')}</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
    </div>
  );
};
