import type { EventType, TypeEdgeStats } from '../lib/types';

interface GraphEgoViewProps {
  centerNode: EventType;
  incomingEdges: TypeEdgeStats[];
  outgoingEdges: TypeEdgeStats[];
  eventTypes: EventType[];
  onNodeClick: (eventTypeId: string) => void;
}

export function GraphEgoView({
  centerNode,
  incomingEdges,
  outgoingEdges,
  eventTypes,
  onNodeClick,
}: GraphEgoViewProps) {
  const width = 600;
  const height = 500;
  const centerX = width / 2;
  const centerY = height / 2;
  const nodeRadius = 40;
  const orbitRadius = 180;

  // Limit to top 6 neighbors (3 incoming, 3 outgoing)
  const topIncoming = incomingEdges.slice(0, 3);
  const topOutgoing = outgoingEdges.slice(0, 3);

  // Position incoming nodes on the left
  const incomingNodes = topIncoming.map((edge, i) => {
    const angle = Math.PI - (Math.PI / 3) * (i - 1); // Spread on left side
    const eventType = eventTypes.find(t => t.id === edge.fromEventTypeId)!;
    return {
      edge,
      eventType,
      x: centerX + Math.cos(angle) * orbitRadius,
      y: centerY + Math.sin(angle) * orbitRadius,
    };
  });

  // Position outgoing nodes on the right
  const outgoingNodes = topOutgoing.map((edge, i) => {
    const angle = (Math.PI / 3) * (i - 1); // Spread on right side
    const eventType = eventTypes.find(t => t.id === edge.toEventTypeId)!;
    return {
      edge,
      eventType,
      x: centerX + Math.cos(angle) * orbitRadius,
      y: centerY + Math.sin(angle) * orbitRadius,
    };
  });

  const getStrokeWidth = (strength: number) => {
    return 1 + strength * 4; // 1-5px based on strength
  };

  const getStrokeColor = (edge: TypeEdgeStats) => {
    const hasUserLinks = edge.userLinkCount > 0;
    return hasUserLinks ? '#6366f1' : '#9ca3af'; // primary or gray
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl p-4 overflow-x-auto">
      <svg
        width={width}
        height={height}
        viewBox={`0 0 ${width} ${height}`}
        className="mx-auto"
      >
        {/* Draw edges from incoming nodes */}
        {incomingNodes.map(({ edge, x, y }) => (
          <g key={`edge-in-${edge.fromEventTypeId}`}>
            <defs>
              <marker
                id={`arrowhead-${edge.fromEventTypeId}`}
                markerWidth="10"
                markerHeight="10"
                refX="9"
                refY="3"
                orient="auto"
                markerUnits="strokeWidth"
              >
                <path
                  d="M0,0 L0,6 L9,3 z"
                  fill={getStrokeColor(edge)}
                />
              </marker>
            </defs>
            <line
              x1={x}
              y1={y}
              x2={centerX - nodeRadius}
              y2={centerY}
              stroke={getStrokeColor(edge)}
              strokeWidth={getStrokeWidth(edge.inferredStrength)}
              markerEnd={`url(#arrowhead-${edge.fromEventTypeId})`}
            />
          </g>
        ))}

        {/* Draw edges to outgoing nodes */}
        {outgoingNodes.map(({ edge, x, y }) => (
          <g key={`edge-out-${edge.toEventTypeId}`}>
            <defs>
              <marker
                id={`arrowhead-out-${edge.toEventTypeId}`}
                markerWidth="10"
                markerHeight="10"
                refX="9"
                refY="3"
                orient="auto"
                markerUnits="strokeWidth"
              >
                <path
                  d="M0,0 L0,6 L9,3 z"
                  fill={getStrokeColor(edge)}
                />
              </marker>
            </defs>
            <line
              x1={centerX + nodeRadius}
              y1={centerY}
              x2={x}
              y2={y}
              stroke={getStrokeColor(edge)}
              strokeWidth={getStrokeWidth(edge.inferredStrength)}
              markerEnd={`url(#arrowhead-out-${edge.toEventTypeId})`}
            />
          </g>
        ))}

        {/* Draw incoming nodes */}
        {incomingNodes.map(({ eventType, x, y }) => (
          <g
            key={`node-in-${eventType.id}`}
            onClick={() => onNodeClick(eventType.id)}
            className="cursor-pointer"
          >
            <circle
              cx={x}
              cy={y}
              r={nodeRadius}
              fill="white"
              stroke="#6366f1"
              strokeWidth="2"
              className="hover:fill-primary-50 transition-colors"
            />
            <text
              x={x}
              y={y}
              textAnchor="middle"
              dominantBaseline="middle"
              fontSize="28"
            >
              {eventType.emoji}
            </text>
          </g>
        ))}

        {/* Draw outgoing nodes */}
        {outgoingNodes.map(({ eventType, x, y }) => (
          <g
            key={`node-out-${eventType.id}`}
            onClick={() => onNodeClick(eventType.id)}
            className="cursor-pointer"
          >
            <circle
              cx={x}
              cy={y}
              r={nodeRadius}
              fill="white"
              stroke="#6366f1"
              strokeWidth="2"
              className="hover:fill-primary-50 transition-colors"
            />
            <text
              x={x}
              y={y}
              textAnchor="middle"
              dominantBaseline="middle"
              fontSize="28"
            >
              {eventType.emoji}
            </text>
          </g>
        ))}

        {/* Draw center node */}
        <g>
          <circle
            cx={centerX}
            cy={centerY}
            r={nodeRadius + 5}
            fill="#6366f1"
            className="drop-shadow-lg"
          />
          <text
            x={centerX}
            y={centerY}
            textAnchor="middle"
            dominantBaseline="middle"
            fontSize="32"
          >
            {centerNode.emoji}
          </text>
        </g>
      </svg>

      {/* Legend */}
      <div className="mt-4 flex justify-center gap-6 text-sm">
        <div className="flex items-center gap-2">
          <div className="w-8 h-0.5 bg-primary-600"></div>
          <span className="text-gray-600 dark:text-gray-400">User confirmed</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-8 h-0.5 bg-gray-400"></div>
          <span className="text-gray-600 dark:text-gray-400">Inferred pattern</span>
        </div>
      </div>
    </div>
  );
}
