'use client';

import React, { useRef, useEffect, useState, useCallback } from 'react';
import { GraphData, GraphNode } from '@/types';
import { Search, ZoomIn, ZoomOut, RotateCcw, Sparkles, Link2, X } from 'lucide-react';

interface KnowledgeGraphCanvasProps {
  graphData: GraphData;
  onNodeClick: (nodeId: string) => void;
  onConnectNodes?: (sourceId: string, targetId: string) => Promise<void> | void;
}

interface SimNode extends GraphNode {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
}

export function KnowledgeGraphCanvas({ graphData, onNodeClick, onConnectNodes }: KnowledgeGraphCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const [searchFilter, setSearchFilter] = useState('');
  const [hoveredNode, setHoveredNode] = useState<SimNode | null>(null);
  const [zoom, setZoom] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });

  const [connectMode, setConnectMode] = useState(false);
  const [connectSource, setConnectSource] = useState<SimNode | null>(null);
  const [connectFeedback, setConnectFeedback] = useState<string | null>(null);

  const connectSourceRef = useRef<SimNode | null>(null);
  const mouseCanvasPosRef = useRef<{ x: number; y: number } | null>(null);
  const hoveredNodeRef = useRef<SimNode | null>(null);

  useEffect(() => {
    connectSourceRef.current = connectSource;
  }, [connectSource]);

  useEffect(() => {
    hoveredNodeRef.current = hoveredNode;
  }, [hoveredNode]);

  const nodesRef = useRef<SimNode[]>([]);
  const isDraggingRef = useRef(false);
  const dragNodeRef = useRef<SimNode | null>(null);
  const lastMousePosRef = useRef({ x: 0, y: 0 });
  const animFrameRef = useRef<number | null>(null);

  // Initialize or update nodes with simulation coordinates
  useEffect(() => {
    const width = 800;
    const height = 600;

    const existingMap = new Map(nodesRef.current.map((n) => [n.id, n]));

    const simNodes: SimNode[] = graphData.nodes.map((n, i) => {
      const existing = existingMap.get(n.id);
      const angle = (i / Math.max(1, graphData.nodes.length)) * Math.PI * 2;
      const dist = 120 + Math.random() * 100;
      const baseRadius = 6 + Math.min(n.backlink_count * 2.5, 14);

      return {
        ...n,
        x: existing ? existing.x : width / 2 + Math.cos(angle) * dist,
        y: existing ? existing.y : height / 2 + Math.sin(angle) * dist,
        vx: existing ? existing.vx : (Math.random() - 0.5) * 2,
        vy: existing ? existing.vy : (Math.random() - 0.5) * 2,
        radius: baseRadius,
      };
    });

    nodesRef.current = simNodes;
  }, [graphData]);

  // Simulation physics loop and rendering
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let isMounted = true;

    const runSimulationStep = () => {
      const nodes = nodesRef.current;
      const nodeMap = new Map(nodes.map((n) => [n.id, n]));
      const width = canvas.width;
      const height = canvas.height;

      // 1. Repulsion between all nodes (Coulomb's law)
      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          const a = nodes[i];
          const b = nodes[j];
          const dx = b.x - a.x;
          const dy = b.y - a.y;
          const distSq = dx * dx + dy * dy + 1;
          const dist = Math.sqrt(distSq);
          if (dist < 300) {
            const force = 1200 / distSq;
            const fx = (dx / dist) * force;
            const fy = (dy / dist) * force;
            a.vx -= fx;
            a.vy -= fy;
            b.vx += fx;
            b.vy += fy;
          }
        }
      }

      // 2. Spring attraction along edges (Hooke's law)
      graphData.edges.forEach((edge) => {
        const source = nodeMap.get(edge.source);
        const target = nodeMap.get(edge.target);
        if (source && target) {
          const dx = target.x - source.x;
          const dy = target.y - source.y;
          const dist = Math.sqrt(dx * dx + dy * dy) || 1;
          const desiredDist = 110;
          const force = (dist - desiredDist) * 0.04;
          const fx = (dx / dist) * force;
          const fy = (dy / dist) * force;
          source.vx += fx;
          source.vy += fy;
          target.vx -= fx;
          target.vy -= fy;
        }
      });

      // 3. Center gravity and damping
      nodes.forEach((node) => {
        if (node === dragNodeRef.current) return;
        const dx = width / 2 - node.x;
        const dy = height / 2 - node.y;
        node.vx += dx * 0.003;
        node.vy += dy * 0.003;

        // Damping / friction
        node.vx *= 0.88;
        node.vy *= 0.88;

        node.x += node.vx;
        node.y += node.vy;
      });

      // Render Canvas
      ctx.clearRect(0, 0, width, height);

      ctx.save();
      ctx.translate(offset.x, offset.y);
      ctx.scale(zoom, zoom);

      const isDark = typeof document !== 'undefined' ? document.documentElement.classList.contains('dark') : true;
      const edgeColor = isDark ? 'rgba(56, 189, 248, 0.35)' : 'rgba(2, 132, 199, 0.4)';
      const nodeColor = isDark ? '#38bdf8' : '#0284c7';
      const nodeFill = isDark ? 'rgba(14, 165, 233, 0.3)' : 'rgba(2, 132, 199, 0.15)';
      const textColor = isDark ? 'rgba(255, 255, 255, 0.95)' : 'rgba(15, 23, 42, 0.95)';

      // Draw Edges
      ctx.lineWidth = 1.2;
      ctx.strokeStyle = edgeColor;
      graphData.edges.forEach((edge) => {
        const source = nodeMap.get(edge.source);
        const target = nodeMap.get(edge.target);
        if (source && target) {
          ctx.beginPath();
          ctx.moveTo(source.x, source.y);
          ctx.lineTo(target.x, target.y);
          ctx.stroke();
        }
      });
      // Draw live connecting line if in connect mode and source is selected
      if (connectSourceRef.current && mouseCanvasPosRef.current) {
        ctx.beginPath();
        ctx.moveTo(connectSourceRef.current.x, connectSourceRef.current.y);
        const targetX =
          hoveredNodeRef.current && hoveredNodeRef.current.id !== connectSourceRef.current.id
            ? hoveredNodeRef.current.x
            : mouseCanvasPosRef.current.x;
        const targetY =
          hoveredNodeRef.current && hoveredNodeRef.current.id !== connectSourceRef.current.id
            ? hoveredNodeRef.current.y
            : mouseCanvasPosRef.current.y;
        ctx.lineTo(targetX, targetY);
        ctx.strokeStyle = '#38bdf8';
        ctx.lineWidth = 2.5;
        ctx.setLineDash([6, 6]);
        ctx.stroke();
        ctx.setLineDash([]);
      }

      // Draw Nodes
      nodes.forEach((node) => {
        const isHovered = hoveredNode?.id === node.id;
        const isConnectSource = connectSource?.id === node.id;
        const isHoveredTarget =
          connectSource && hoveredNode?.id === node.id && node.id !== connectSource.id;
        const matchesSearch =
          searchFilter.trim() &&
          node.title.toLowerCase().includes(searchFilter.toLowerCase().trim());

        ctx.beginPath();
        ctx.arc(node.x, node.y, node.radius + (isHovered ? 4 : 0), 0, Math.PI * 2);

        if (matchesSearch) {
          ctx.fillStyle = '#f59e0b';
          ctx.fill();
          ctx.lineWidth = 3;
          ctx.strokeStyle = '#d97706';
          ctx.stroke();
        } else if (isConnectSource) {
          ctx.fillStyle = '#0284c7';
          ctx.fill();
          ctx.lineWidth = 3.5;
          ctx.strokeStyle = '#38bdf8';
          ctx.stroke();
        } else if (isHoveredTarget) {
          ctx.fillStyle = '#7c3aed';
          ctx.fill();
          ctx.lineWidth = 3;
          ctx.strokeStyle = '#c084fc';
          ctx.stroke();
        } else if (isHovered) {
          ctx.fillStyle = '#6366f1';
          ctx.fill();
          ctx.lineWidth = 3;
          ctx.strokeStyle = '#4338ca';
          ctx.stroke();
        } else {
          ctx.fillStyle = nodeFill;
          ctx.fill();
          ctx.lineWidth = 2;
          ctx.strokeStyle = nodeColor;
          ctx.stroke();
        }

        // Draw pulsating halo on connect source
        if (isConnectSource) {
          ctx.beginPath();
          ctx.arc(node.x, node.y, node.radius + 8, 0, Math.PI * 2);
          ctx.strokeStyle = '#38bdf8';
          ctx.lineWidth = 2;
          ctx.setLineDash([4, 4]);
          ctx.stroke();
          ctx.setLineDash([]);
        }

        // Draw node title
        ctx.font = isHovered ? 'bold 11px system-ui' : '10px system-ui';
        ctx.fillStyle = textColor;
        ctx.textAlign = 'center';
        ctx.fillText(node.title, node.x, node.y + node.radius + 12);
      });

      ctx.restore();

      if (isMounted) {
        animFrameRef.current = requestAnimationFrame(runSimulationStep);
      }
    };

    animFrameRef.current = requestAnimationFrame(runSimulationStep);

    return () => {
      isMounted = false;
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [graphData, zoom, offset, hoveredNode, searchFilter]);

  // Handle canvas resize
  useEffect(() => {
    const handleResize = () => {
      const canvas = canvasRef.current;
      if (canvas && canvas.parentElement) {
        canvas.width = canvas.parentElement.clientWidth;
        canvas.height = canvas.parentElement.clientHeight || 550;
      }
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const getCanvasMousePos = (e: React.MouseEvent<HTMLCanvasElement>): { x: number; y: number; rawX: number; rawY: number } => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0, rawX: 0, rawY: 0 };
    const rect = canvas.getBoundingClientRect();
    const rawX = e.clientX - rect.left;
    const rawY = e.clientY - rect.top;
    return {
      x: (rawX - offset.x) / zoom,
      y: (rawY - offset.y) / zoom,
      rawX,
      rawY,
    };
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const { x, y, rawX, rawY } = getCanvasMousePos(e);
    lastMousePosRef.current = { x: rawX, y: rawY };

    // Find clicked node
    const clicked = nodesRef.current.find((n) => {
      const dx = n.x - x;
      const dy = n.y - y;
      return Math.sqrt(dx * dx + dy * dy) <= n.radius + 6;
    });

    if (clicked) {
      dragNodeRef.current = clicked;
    } else {
      isDraggingRef.current = true;
    }
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const { x, y, rawX, rawY } = getCanvasMousePos(e);
    mouseCanvasPosRef.current = { x, y };

    if (dragNodeRef.current) {
      dragNodeRef.current.x = x;
      dragNodeRef.current.y = y;
      dragNodeRef.current.vx = 0;
      dragNodeRef.current.vy = 0;
      return;
    }

    if (isDraggingRef.current) {
      const dx = rawX - lastMousePosRef.current.x;
      const dy = rawY - lastMousePosRef.current.y;
      setOffset((prev) => ({ x: prev.x + dx, y: prev.y + dy }));
      lastMousePosRef.current = { x: rawX, y: rawY };
      return;
    }

    // Hover detection
    const found = nodesRef.current.find((n) => {
      const dx = n.x - x;
      const dy = n.y - y;
      return Math.sqrt(dx * dx + dy * dy) <= n.radius + 6;
    });
    setHoveredNode(found || null);
  };

  const handleMouseUp = () => {
    if (dragNodeRef.current) {
      dragNodeRef.current = null;
    }
    isDraggingRef.current = false;
  };

  const handleClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const { x, y } = getCanvasMousePos(e);
    const clicked = nodesRef.current.find((n) => {
      const dx = n.x - x;
      const dy = n.y - y;
      return Math.sqrt(dx * dx + dy * dy) <= n.radius + 6;
    });

    if (clicked) {
      if (connectMode) {
        if (!connectSource) {
          setConnectSource(clicked);
        } else if (connectSource.id === clicked.id) {
          setConnectSource(null);
        } else {
          if (onConnectNodes) {
            onConnectNodes(connectSource.id, clicked.id);
          }
          setConnectFeedback(`Linked "${connectSource.title}" ↔ "${clicked.title}"!`);
          setConnectSource(null);
          setConnectMode(false);
          setTimeout(() => setConnectFeedback(null), 3000);
        }
        return;
      }
      onNodeClick(clicked.id);
    } else if (connectMode && connectSource) {
      setConnectSource(null);
    }
  };

  const handleZoom = (delta: number) => {
    setZoom((prev) => Math.max(0.4, Math.min(3, prev + delta)));
  };

  const resetView = () => {
    setZoom(1);
    setOffset({ x: 0, y: 0 });
  };

  return (
    <div className="relative h-[650px] w-full rounded-3xl border border-white/20 bg-slate-950/40 backdrop-blur-2xl overflow-hidden shadow-2xl">
      {/* Canvas */}
      <canvas
        ref={canvasRef}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onClick={handleClick}
        className="h-full w-full cursor-grab active:cursor-grabbing"
      />

      {/* Floating Toolbar */}
      <div className="absolute top-4 left-4 z-10 flex items-center gap-2">
        <div className="flex items-center rounded-2xl border border-white/20 bg-white/10 px-3.5 py-1.5 shadow-sm backdrop-blur-xl">
          <Search className="h-3.5 w-3.5 text-sky-300 mr-2" />
          <input
            type="text"
            placeholder="Filter nodes..."
            value={searchFilter}
            onChange={(e) => setSearchFilter(e.target.value)}
            className="w-32 sm:w-44 bg-transparent text-xs text-white placeholder-white/40 focus:outline-none"
          />
        </div>

        <button
          type="button"
          onClick={() => {
            setConnectMode(!connectMode);
            setConnectSource(null);
          }}
          className={`flex items-center gap-1.5 rounded-2xl border px-3 py-1.5 text-xs font-semibold shadow-sm backdrop-blur-xl transition active:scale-[0.98] ${
            connectMode
              ? 'bg-sky-500 text-white border-sky-400 shadow-sky-500/30'
              : 'border-white/20 bg-white/10 text-white hover:bg-white/20'
          }`}
          title="Click two notes to link them directly on the canvas"
        >
          <Link2 className="h-3.5 w-3.5" />
          <span>{connectMode ? 'Exit Connect Mode' : 'Connect Nodes'}</span>
        </button>
      </div>

      {/* Top Banner for Connect Mode */}
      {connectMode && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-20 flex items-center gap-3 rounded-2xl border border-sky-400/40 bg-slate-950/90 px-4 py-2 text-xs text-white shadow-2xl backdrop-blur-xl animate-in fade-in slide-in-from-top-2 duration-150">
          <div className="flex h-2 w-2 rounded-full bg-sky-400 animate-ping" />
          {!connectSource ? (
            <span>Click first note to start connection</span>
          ) : (
            <span>
              Selected <span className="font-bold text-sky-300">"{connectSource.title}"</span> → Click target note to connect
            </span>
          )}
          <button
            type="button"
            onClick={() => {
              setConnectMode(false);
              setConnectSource(null);
            }}
            className="ml-2 rounded-lg p-1 text-white/50 hover:text-white hover:bg-white/10"
            title="Cancel connect"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      )}

      {/* Feedback Toast */}
      {connectFeedback && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2 rounded-2xl border border-emerald-400/40 bg-emerald-950/90 px-4 py-2 text-xs font-semibold text-emerald-200 shadow-2xl backdrop-blur-xl animate-in fade-in duration-200">
          <Sparkles className="h-3.5 w-3.5 text-emerald-300" />
          <span>{connectFeedback}</span>
        </div>
      )}

      <div className="absolute top-4 right-4 z-10 flex items-center gap-1 rounded-2xl border border-white/20 bg-white/10 p-1 shadow-sm backdrop-blur-xl text-white">
        <button
          type="button"
          onClick={() => handleZoom(0.2)}
          title="Zoom in"
          className="rounded-xl p-1.5 text-white/80 hover:text-white hover:bg-white/10 transition"
        >
          <ZoomIn className="h-4 w-4" />
        </button>
        <button
          type="button"
          onClick={() => handleZoom(-0.2)}
          title="Zoom out"
          className="rounded-xl p-1.5 text-white/80 hover:text-white hover:bg-white/10 transition"
        >
          <ZoomOut className="h-4 w-4" />
        </button>
        <button
          type="button"
          onClick={resetView}
          title="Reset View"
          className="rounded-xl p-1.5 text-white/80 hover:text-white hover:bg-white/10 transition"
        >
          <RotateCcw className="h-4 w-4" />
        </button>
      </div>

      {/* Hover Info Tooltip */}
      {hoveredNode && (
        <div className="absolute bottom-4 left-4 z-10 rounded-2xl border border-white/20 bg-slate-950/90 px-4 py-2.5 text-xs shadow-2xl backdrop-blur-2xl pointer-events-none text-white">
          <p className="font-bold text-sky-200">{hoveredNode.title}</p>
          <p className="text-[11px] text-white/60">
            {hoveredNode.backlink_count} incoming {hoveredNode.backlink_count === 1 ? 'link' : 'links'} · Click to open note
          </p>
        </div>
      )}

      {/* Graph Legend / Stats */}
      <div className="absolute bottom-4 right-4 z-10 rounded-2xl border border-white/20 bg-white/10 px-3.5 py-1.5 text-[11px] font-medium text-sky-100 shadow-sm backdrop-blur-xl">
        <span>{graphData.nodes.length} Notes</span> · <span>{graphData.edges.length} [[Connections]]</span>
      </div>
    </div>
  );
}
