import { Tool } from '@/components/tool';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Globe,
  Link2,
  Loader2,
  Map as MapIcon,
  RotateCcw,
  ZoomIn,
  ZoomOut,
} from 'lucide-react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { toast } from 'sonner';

interface URLNode {
  id: string;
  url: string;
  label: string;
  depth: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  isExternal: boolean;
}

interface URLEdge {
  source: string;
  target: string;
}

interface CrawlResult {
  nodes: URLNode[];
  edges: URLEdge[];
}

const CORS_PROXY = 'https://api.allorigins.win/raw?url=';

function extractDomain(url: string): string {
  try {
    return new URL(url).hostname;
  } catch {
    return url;
  }
}

function normalizeUrl(url: string, baseUrl: string): string | null {
  try {
    const absolute = new URL(url, baseUrl);
    // Only allow http/https
    if (!['http:', 'https:'].includes(absolute.protocol)) {
      return null;
    }
    // Remove hash and trailing slash for consistency
    absolute.hash = '';
    let normalized = absolute.href;
    if (normalized.endsWith('/') && absolute.pathname !== '/') {
      normalized = normalized.slice(0, -1);
    }
    return normalized;
  } catch {
    return null;
  }
}

function getLabelFromUrl(url: string): string {
  try {
    const parsed = new URL(url);
    const path = parsed.pathname;
    if (path === '/' || path === '') {
      return parsed.hostname;
    }
    // Get last meaningful segment
    const segments = path.split('/').filter(Boolean);
    const last = segments[segments.length - 1] || parsed.hostname;
    // Truncate if too long
    return last.length > 20 ? last.slice(0, 17) + '...' : last;
  } catch {
    return url.slice(0, 20);
  }
}

async function fetchAndExtractLinks(url: string): Promise<string[]> {
  const proxyUrl = `${CORS_PROXY}${encodeURIComponent(url)}`;
  const response = await fetch(proxyUrl);

  if (!response.ok) {
    throw new Error(`Failed to fetch: ${response.status}`);
  }

  const html = await response.text();
  const doc = new DOMParser().parseFromString(html, 'text/html');

  const links: string[] = [];
  const anchors = doc.querySelectorAll('a[href]');

  anchors.forEach((anchor) => {
    const href = anchor.getAttribute('href');
    if (href) {
      const normalized = normalizeUrl(href, url);
      if (normalized && !links.includes(normalized)) {
        links.push(normalized);
      }
    }
  });

  return links;
}

async function crawlUrls(
  startUrl: string,
  maxDepth: number,
  onProgress: (message: string) => void
): Promise<CrawlResult> {
  const nodes = new Map<string, URLNode>();
  const edges: URLEdge[] = [];
  const visited = new Set<string>();
  const startDomain = extractDomain(startUrl);

  // Initialize with random positions around center
  const createNode = (url: string, depth: number): URLNode => {
    const angle = Math.random() * 2 * Math.PI;
    const radius = 50 + depth * 100 + Math.random() * 50;
    return {
      id: url,
      url,
      label: getLabelFromUrl(url),
      depth,
      x: 400 + Math.cos(angle) * radius,
      y: 300 + Math.sin(angle) * radius,
      vx: 0,
      vy: 0,
      isExternal: extractDomain(url) !== startDomain,
    };
  };

  // Add start node
  nodes.set(startUrl, createNode(startUrl, 0));

  const queue: Array<{ url: string; depth: number }> = [
    { url: startUrl, depth: 0 },
  ];

  while (queue.length > 0) {
    const { url, depth } = queue.shift()!;

    if (visited.has(url)) continue;
    visited.add(url);

    // Only crawl internal pages and respect depth
    if (depth >= maxDepth || extractDomain(url) !== startDomain) {
      continue;
    }

    onProgress(
      `Crawling: ${getLabelFromUrl(url)} (depth ${depth + 1}/${maxDepth})`
    );

    try {
      const links = await fetchAndExtractLinks(url);

      // Limit links per page to avoid explosion
      const limitedLinks = links.slice(0, 25);

      for (const link of limitedLinks) {
        if (!nodes.has(link)) {
          nodes.set(link, createNode(link, depth + 1));
        }

        if (!edges.some((e) => e.source === url && e.target === link)) {
          edges.push({ source: url, target: link });
        }

        // Only queue internal links for further crawling
        if (!visited.has(link) && extractDomain(link) === startDomain) {
          queue.push({ url: link, depth: depth + 1 });
        }
      }
    } catch (err) {
      console.warn(`Failed to crawl ${url}:`, err);
    }

    // Small delay to avoid rate limiting
    await new Promise((r) => setTimeout(r, 100));
  }

  return {
    nodes: Array.from(nodes.values()),
    edges,
  };
}

// Simple force-directed layout simulation
function useForceSimulation(
  nodes: URLNode[],
  edges: URLEdge[],
  width: number,
  height: number
) {
  const [positions, setPositions] = useState<
    Map<string, { x: number; y: number }>
  >(new Map());
  const simulationRef = useRef<number | null>(null);
  const nodesRef = useRef<URLNode[]>([]);

  useEffect(() => {
    if (nodes.length === 0) {
      setPositions(new Map());
      return;
    }

    // Clone nodes for simulation
    nodesRef.current = nodes.map((n) => ({ ...n }));
    const simNodes = nodesRef.current;

    const centerX = width / 2;
    const centerY = height / 2;

    let alpha = 1;
    const alphaDecay = 0.02;
    const alphaMin = 0.001;

    const simulate = () => {
      if (alpha < alphaMin) {
        simulationRef.current = null;
        return;
      }

      // Reset forces
      simNodes.forEach((node) => {
        node.vx = 0;
        node.vy = 0;
      });

      // Repulsion between all nodes
      for (let i = 0; i < simNodes.length; i++) {
        for (let j = i + 1; j < simNodes.length; j++) {
          const nodeA = simNodes[i];
          const nodeB = simNodes[j];
          const dx = nodeB.x - nodeA.x;
          const dy = nodeB.y - nodeA.y;
          const dist = Math.sqrt(dx * dx + dy * dy) || 1;
          const force = (300 * alpha) / (dist * dist);
          const fx = (dx / dist) * force;
          const fy = (dy / dist) * force;
          nodeA.vx -= fx;
          nodeA.vy -= fy;
          nodeB.vx += fx;
          nodeB.vy += fy;
        }
      }

      // Attraction along edges
      const nodeMap = new Map(simNodes.map((n) => [n.id, n]));
      edges.forEach((edge) => {
        const source = nodeMap.get(edge.source);
        const target = nodeMap.get(edge.target);
        if (source && target) {
          const dx = target.x - source.x;
          const dy = target.y - source.y;
          const dist = Math.sqrt(dx * dx + dy * dy) || 1;
          const force = (dist - 80) * 0.05 * alpha;
          const fx = (dx / dist) * force;
          const fy = (dy / dist) * force;
          source.vx += fx;
          source.vy += fy;
          target.vx -= fx;
          target.vy -= fy;
        }
      });

      // Center gravity
      simNodes.forEach((node) => {
        node.vx += (centerX - node.x) * 0.01 * alpha;
        node.vy += (centerY - node.y) * 0.01 * alpha;
      });

      // Apply velocities
      simNodes.forEach((node) => {
        node.x += node.vx;
        node.y += node.vy;
        // Bound to viewport
        node.x = Math.max(30, Math.min(width - 30, node.x));
        node.y = Math.max(30, Math.min(height - 30, node.y));
      });

      alpha -= alphaDecay;

      // Update positions
      const newPositions = new Map<string, { x: number; y: number }>();
      simNodes.forEach((node) => {
        newPositions.set(node.id, { x: node.x, y: node.y });
      });
      setPositions(newPositions);

      simulationRef.current = requestAnimationFrame(simulate);
    };

    simulationRef.current = requestAnimationFrame(simulate);

    return () => {
      if (simulationRef.current) {
        cancelAnimationFrame(simulationRef.current);
      }
    };
  }, [nodes, edges, width, height]);

  return positions;
}

interface GraphProps {
  nodes: URLNode[];
  edges: URLEdge[];
  width: number;
  height: number;
  zoom: number;
  onNodeClick: (node: URLNode) => void;
}

function Graph({ nodes, edges, width, height, zoom, onNodeClick }: GraphProps) {
  const positions = useForceSimulation(nodes, edges, width, height);

  const getNodePosition = useCallback(
    (id: string) => positions.get(id) || { x: width / 2, y: height / 2 },
    [positions, width, height]
  );

  const depthColors = [
    'var(--chart-1, #2563eb)',
    'var(--chart-2, #16a34a)',
    'var(--chart-3, #ca8a04)',
    'var(--chart-4, #dc2626)',
    'var(--chart-5, #9333ea)',
  ];

  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      className='bg-accent/30 rounded-lg'
      style={{ transform: `scale(${zoom})`, transformOrigin: 'center' }}
    >
      <defs>
        <marker
          id='arrowhead'
          markerWidth='6'
          markerHeight='6'
          refX='20'
          refY='3'
          orient='auto'
        >
          <path
            d='M0,0 L0,6 L6,3 z'
            fill='currentColor'
            className='text-muted-foreground/50'
          />
        </marker>
      </defs>

      {/* Edges */}
      <g className='text-muted-foreground/30'>
        {edges.map((edge, i) => {
          const source = getNodePosition(edge.source);
          const target = getNodePosition(edge.target);
          return (
            <line
              key={i}
              x1={source.x}
              y1={source.y}
              x2={target.x}
              y2={target.y}
              stroke='currentColor'
              strokeWidth='1'
              markerEnd='url(#arrowhead)'
            />
          );
        })}
      </g>

      {/* Nodes */}
      {nodes.map((node) => {
        const pos = getNodePosition(node.id);
        const color = node.isExternal
          ? 'var(--muted-foreground)'
          : depthColors[node.depth % depthColors.length];

        return (
          <g
            key={node.id}
            transform={`translate(${pos.x}, ${pos.y})`}
            className='cursor-pointer'
            onClick={() => onNodeClick(node)}
          >
            <circle
              r={node.depth === 0 ? 12 : 8}
              fill={color}
              className='transition-all hover:opacity-80'
              stroke={node.depth === 0 ? 'var(--foreground)' : 'none'}
              strokeWidth={2}
            />
            <text
              y={node.depth === 0 ? 24 : 18}
              textAnchor='middle'
              className='fill-foreground text-[10px] font-medium'
              style={{ pointerEvents: 'none' }}
            >
              {node.label}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

export function URLMapTool() {
  const [inputUrl, setInputUrl] = useState('');
  const [maxDepth, setMaxDepth] = useState('1');
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState('');
  const [nodes, setNodes] = useState<URLNode[]>([]);
  const [edges, setEdges] = useState<URLEdge[]>([]);
  const [zoom, setZoom] = useState(1);
  const [selectedNode, setSelectedNode] = useState<URLNode | null>(null);

  const graphWidth = 800;
  const graphHeight = 600;

  const handleCrawl = useCallback(async () => {
    let url = inputUrl.trim();
    if (!url) {
      toast.error('Please enter a URL');
      return;
    }

    // Add protocol if missing
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      url = 'https://' + url;
      setInputUrl(url);
    }

    try {
      new URL(url);
    } catch {
      toast.error('Please enter a valid URL');
      return;
    }

    setLoading(true);
    setProgress('Starting...');
    setNodes([]);
    setEdges([]);
    setSelectedNode(null);
    setZoom(1);

    try {
      const result = await crawlUrls(url, parseInt(maxDepth), setProgress);
      setNodes(result.nodes);
      setEdges(result.edges);
      toast.success(
        `Found ${result.nodes.length} pages and ${result.edges.length} links`
      );
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to crawl URL');
    } finally {
      setLoading(false);
      setProgress('');
    }
  }, [inputUrl, maxDepth]);

  const handleReset = useCallback(() => {
    setNodes([]);
    setEdges([]);
    setSelectedNode(null);
    setZoom(1);
    setInputUrl('');
  }, []);

  const stats = useMemo(() => {
    const internalNodes = nodes.filter((n) => !n.isExternal);
    const externalNodes = nodes.filter((n) => n.isExternal);
    const maxFoundDepth = Math.max(0, ...nodes.map((n) => n.depth));
    return {
      internal: internalNodes.length,
      external: externalNodes.length,
      maxDepth: maxFoundDepth,
    };
  }, [nodes]);

  return (
    <Tool toolId='url-map'>
      <div className='space-y-6'>
        {/* Input Section */}
        <div className='space-y-4'>
          <div className='flex flex-col gap-4 sm:flex-row'>
            <div className='flex-1'>
              <Input
                type='url'
                placeholder='https://example.com'
                value={inputUrl}
                onChange={(e) => setInputUrl(e.target.value)}
                onKeyDown={(e) =>
                  e.key === 'Enter' && !loading && handleCrawl()
                }
                disabled={loading}
              />
            </div>
            <div className='flex gap-2'>
              <Select
                value={maxDepth}
                onValueChange={setMaxDepth}
                disabled={loading}
              >
                <SelectTrigger className='w-32'>
                  <SelectValue placeholder='Depth' />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value='1'>Depth: 1</SelectItem>
                  <SelectItem value='2'>Depth: 2</SelectItem>
                  <SelectItem value='3'>Depth: 3</SelectItem>
                </SelectContent>
              </Select>
              <Button onClick={handleCrawl} disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 className='h-4 w-4 animate-spin' />
                    Crawling
                  </>
                ) : (
                  <>
                    <MapIcon className='h-4 w-4' />
                    Map
                  </>
                )}
              </Button>
            </div>
          </div>

          {loading && progress && (
            <p className='text-muted-foreground text-sm'>{progress}</p>
          )}
        </div>

        {/* Graph Section */}
        {nodes.length > 0 && (
          <>
            {/* Controls */}
            <div className='flex items-center justify-between'>
              <div className='flex gap-2'>
                <Button
                  variant='outline'
                  size='icon'
                  onClick={() => setZoom((z) => Math.min(2, z + 0.2))}
                  title='Zoom in'
                >
                  <ZoomIn className='h-4 w-4' />
                </Button>
                <Button
                  variant='outline'
                  size='icon'
                  onClick={() => setZoom((z) => Math.max(0.5, z - 0.2))}
                  title='Zoom out'
                >
                  <ZoomOut className='h-4 w-4' />
                </Button>
                <Button
                  variant='outline'
                  size='icon'
                  onClick={handleReset}
                  title='Reset'
                >
                  <RotateCcw className='h-4 w-4' />
                </Button>
              </div>

              {/* Legend */}
              <div className='text-muted-foreground flex items-center gap-4 text-xs'>
                <span className='flex items-center gap-1'>
                  <span
                    className='inline-block h-3 w-3 rounded-full'
                    style={{ backgroundColor: 'var(--chart-1, #2563eb)' }}
                  />
                  Root
                </span>
                <span className='flex items-center gap-1'>
                  <span
                    className='inline-block h-3 w-3 rounded-full'
                    style={{ backgroundColor: 'var(--chart-2, #16a34a)' }}
                  />
                  Depth 1
                </span>
                <span className='flex items-center gap-1'>
                  <span className='bg-muted-foreground inline-block h-3 w-3 rounded-full' />
                  External
                </span>
              </div>
            </div>

            {/* Graph */}
            <div className='border-border overflow-hidden rounded-lg border'>
              <div className='overflow-auto'>
                <Graph
                  nodes={nodes}
                  edges={edges}
                  width={graphWidth}
                  height={graphHeight}
                  zoom={zoom}
                  onNodeClick={setSelectedNode}
                />
              </div>
            </div>

            {/* Selected Node Info */}
            {selectedNode && (
              <div className='border-border bg-accent/50 rounded-lg border p-4'>
                <div className='flex items-start justify-between gap-4'>
                  <div className='min-w-0 flex-1'>
                    <h3 className='truncate font-medium'>
                      {selectedNode.label}
                    </h3>
                    <a
                      href={selectedNode.url}
                      target='_blank'
                      rel='noopener noreferrer'
                      className='text-muted-foreground hover:text-foreground block truncate text-sm underline'
                    >
                      {selectedNode.url}
                    </a>
                    <div className='text-muted-foreground mt-1 text-xs'>
                      Depth: {selectedNode.depth} ·{' '}
                      {selectedNode.isExternal ? 'External' : 'Internal'}
                    </div>
                  </div>
                  <Button
                    variant='outline'
                    size='sm'
                    onClick={() => {
                      setInputUrl(selectedNode.url);
                      setSelectedNode(null);
                    }}
                  >
                    Map this
                  </Button>
                </div>
              </div>
            )}

            {/* Stats */}
            <div className='grid gap-4 sm:grid-cols-3'>
              <div className='border-border bg-accent/50 rounded-lg border p-4'>
                <div className='flex items-center gap-2'>
                  <Globe className='text-muted-foreground h-4 w-4' />
                  <span className='text-muted-foreground text-sm'>
                    Internal Pages
                  </span>
                </div>
                <p className='mt-1 text-2xl font-bold'>{stats.internal}</p>
              </div>
              <div className='border-border bg-accent/50 rounded-lg border p-4'>
                <div className='flex items-center gap-2'>
                  <Link2 className='text-muted-foreground h-4 w-4' />
                  <span className='text-muted-foreground text-sm'>
                    External Links
                  </span>
                </div>
                <p className='mt-1 text-2xl font-bold'>{stats.external}</p>
              </div>
              <div className='border-border bg-accent/50 rounded-lg border p-4'>
                <div className='flex items-center gap-2'>
                  <MapIcon className='text-muted-foreground h-4 w-4' />
                  <span className='text-muted-foreground text-sm'>
                    Total Links
                  </span>
                </div>
                <p className='mt-1 text-2xl font-bold'>{edges.length}</p>
              </div>
            </div>
          </>
        )}

        {/* Empty State */}
        {!loading && nodes.length === 0 && (
          <div className='border-border bg-accent/50 text-muted-foreground rounded-lg border p-8 text-center'>
            <MapIcon className='mx-auto mb-3 h-12 w-12 opacity-50' />
            <p className='font-medium'>
              Enter a URL to visualize its link structure
            </p>
            <p className='mt-1 text-sm'>
              The tool will crawl the page and map all links up to the specified
              depth
            </p>
          </div>
        )}
      </div>
    </Tool>
  );
}
