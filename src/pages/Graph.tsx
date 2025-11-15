import { useState, useMemo } from 'react';
import { useCueGraph } from '../lib/store';
import { getIncomingEdges, getOutgoingEdges } from '../lib/analytics';
import { GraphEgoView } from '../components/GraphEgoView';
import { trackEvent } from '../lib/telemetry';

export function Graph() {
  const { eventTypes, edges, settings, eventInstances } = useCueGraph();
  const [selectedTypeId, setSelectedTypeId] = useState<string | null>(null);

  // Auto-select first event type if none selected
  const currentTypeId = selectedTypeId || eventTypes[0]?.id || null;
  const currentType = eventTypes.find(t => t.id === currentTypeId);

  const incomingEdges = useMemo(() => {
    if (!currentTypeId || !settings) return [];
    return getIncomingEdges(currentTypeId, edges, settings.graphEdgeThreshold);
  }, [currentTypeId, edges, settings]);

  const outgoingEdges = useMemo(() => {
    if (!currentTypeId || !settings) return [];
    return getOutgoingEdges(currentTypeId, edges, settings.graphEdgeThreshold);
  }, [currentTypeId, edges, settings]);

  const handleNodeClick = (typeId: string) => {
    setSelectedTypeId(typeId);
    trackEvent('graph_node_viewed', { has_edges: true });
  };

  const eventTypeStats = useMemo(() => {
    if (!currentType) return null;

    const instances = eventInstances.filter(e => e.eventTypeId === currentType.id);
    const last90Days = instances.filter(e => {
      const daysSince = (Date.now() - new Date(e.timestampUTC).getTime()) / (1000 * 60 * 60 * 24);
      return daysSince <= 90;
    });

    return {
      totalCount: instances.length,
      last90DaysCount: last90Days.length,
    };
  }, [currentType, eventInstances]);

  if (!currentType) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600 dark:text-gray-400">
            No event types available
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">
          Event Graph
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mb-6">
          Explore connections between events
        </p>

        {/* Event type selector */}
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 mb-6">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Select event to explore:
          </label>
          <select
            value={currentTypeId || ''}
            onChange={(e) => setSelectedTypeId(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
          >
            {eventTypes.map(type => (
              <option key={type.id} value={type.id}>
                {type.emoji} {type.label}
              </option>
            ))}
          </select>
        </div>

        {/* Event details */}
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 mb-6">
          <div className="flex items-center gap-4 mb-4">
            <span className="text-5xl">{currentType.emoji}</span>
            <div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                {currentType.label}
              </h2>
              {eventTypeStats && (
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Logged {eventTypeStats.last90DaysCount} times in the last 90 days
                  {eventTypeStats.totalCount > eventTypeStats.last90DaysCount && (
                    <span> ({eventTypeStats.totalCount} total)</span>
                  )}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Ego graph visualization */}
        <div className="mb-6">
          <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">
            Relationship Network
          </h3>
          <GraphEgoView
            centerNode={currentType}
            incomingEdges={incomingEdges}
            outgoingEdges={outgoingEdges}
            eventTypes={eventTypes}
            onNodeClick={handleNodeClick}
          />
        </div>

        {/* Outgoing edges (what happens after) */}
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 mb-6">
          <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">
            What tends to happen after "{currentType.label}"?
          </h3>

          {outgoingEdges.length === 0 ? (
            <p className="text-gray-500 dark:text-gray-400">
              No patterns found yet. Keep logging events and adding connections.
            </p>
          ) : (
            <div className="space-y-4">
              {outgoingEdges.map(edge => {
                const toType = eventTypes.find(t => t.id === edge.toEventTypeId);
                if (!toType) return null;

                const percentage = edge.countFrom > 0
                  ? Math.round((edge.matchedPairs / edge.countFrom) * 100)
                  : 0;

                const medianHours = edge.medianDelayHours
                  ? Math.round(edge.medianDelayHours)
                  : null;

                return (
                  <div
                    key={edge.toEventTypeId}
                    className="border border-gray-200 dark:border-gray-700 rounded-lg p-4"
                  >
                    <div className="flex items-start gap-3">
                      <span className="text-3xl">{toType.emoji}</span>
                      <div className="flex-1">
                        <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">
                          {toType.label}
                        </h4>

                        <p className="text-sm text-gray-700 dark:text-gray-300 mb-2">
                          "{toType.label}" happened <strong>{edge.matchedPairs} times</strong> within {Math.round(edge.minHours)}–{Math.round(edge.maxHours)} hours after "{currentType.label}".
                        </p>

                        <div className="flex gap-6 text-sm">
                          <div>
                            <span className="text-gray-500 dark:text-gray-400">Frequency: </span>
                            <span className="font-medium text-gray-900 dark:text-gray-100">
                              {percentage}%
                            </span>
                          </div>

                          {medianHours !== null && (
                            <div>
                              <span className="text-gray-500 dark:text-gray-400">Typical delay: </span>
                              <span className="font-medium text-gray-900 dark:text-gray-100">
                                ~{medianHours}h
                              </span>
                            </div>
                          )}
                        </div>

                        <div className="flex gap-2 mt-2">
                          {edge.edgeSources.includes('user') && (
                            <span className="text-xs px-2 py-1 bg-primary-100 dark:bg-primary-900 text-primary-700 dark:text-primary-300 rounded">
                              You confirmed {edge.userLinkCount}×
                            </span>
                          )}
                          {edge.edgeSources.includes('inferred') && (
                            <span className="text-xs px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded">
                              Auto-detected pattern
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Incoming edges (what happens before) */}
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6">
          <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">
            What tends to happen before "{currentType.label}"?
          </h3>

          {incomingEdges.length === 0 ? (
            <p className="text-gray-500 dark:text-gray-400">
              No patterns found yet. Keep logging events and adding connections.
            </p>
          ) : (
            <div className="space-y-4">
              {incomingEdges.map(edge => {
                const fromType = eventTypes.find(t => t.id === edge.fromEventTypeId);
                if (!fromType) return null;

                const percentage = edge.countTo > 0
                  ? Math.round((edge.matchedPairs / edge.countTo) * 100)
                  : 0;

                const medianHours = edge.medianDelayHours
                  ? Math.round(edge.medianDelayHours)
                  : null;

                return (
                  <div
                    key={edge.fromEventTypeId}
                    className="border border-gray-200 dark:border-gray-700 rounded-lg p-4"
                  >
                    <div className="flex items-start gap-3">
                      <span className="text-3xl">{fromType.emoji}</span>
                      <div className="flex-1">
                        <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">
                          {fromType.label}
                        </h4>

                        <p className="text-sm text-gray-700 dark:text-gray-300 mb-2">
                          "{currentType.label}" happened <strong>{edge.matchedPairs} times</strong> within {Math.round(edge.minHours)}–{Math.round(edge.maxHours)} hours after "{fromType.label}".
                        </p>

                        <div className="flex gap-6 text-sm">
                          <div>
                            <span className="text-gray-500 dark:text-gray-400">Frequency: </span>
                            <span className="font-medium text-gray-900 dark:text-gray-100">
                              {percentage}%
                            </span>
                          </div>

                          {medianHours !== null && (
                            <div>
                              <span className="text-gray-500 dark:text-gray-400">Typical delay: </span>
                              <span className="font-medium text-gray-900 dark:text-gray-100">
                                ~{medianHours}h
                              </span>
                            </div>
                          )}
                        </div>

                        <div className="flex gap-2 mt-2">
                          {edge.edgeSources.includes('user') && (
                            <span className="text-xs px-2 py-1 bg-primary-100 dark:bg-primary-900 text-primary-700 dark:text-primary-300 rounded">
                              You confirmed {edge.userLinkCount}×
                            </span>
                          )}
                          {edge.edgeSources.includes('inferred') && (
                            <span className="text-xs px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded">
                              Auto-detected pattern
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Disclaimer */}
        <div className="mt-6 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
          <p className="text-sm text-yellow-900 dark:text-yellow-200">
            <strong>Remember:</strong> These are correlations in your log, not medical or scientific proof of causation. Many factors can influence your experiences.
          </p>
        </div>
      </div>
    </div>
  );
}
