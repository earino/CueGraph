import { useMemo } from 'react';
import { useCueGraph } from '../lib/store';
import { getSuggestedInsights } from '../lib/analytics';
import { trackEvent } from '../lib/telemetry';
import { useNavigate } from 'react-router-dom';

export function Insights() {
  const { edges, eventTypes, settings } = useCueGraph();
  const navigate = useNavigate();

  const insights = useMemo(() => {
    if (!settings) return [];
    return getSuggestedInsights(edges, settings.graphEdgeThreshold, 2);
  }, [edges, settings]);

  const handleViewDetails = (fromTypeId: string, toTypeId: string) => {
    trackEvent('insight_viewed');
    // Navigate to graph view focused on this edge
    navigate(`/graph?from=${fromTypeId}&to=${toTypeId}`);
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">
          Insights
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mb-8">
          Patterns discovered in your event log
        </p>

        {insights.length === 0 ? (
          <div className="bg-white dark:bg-gray-800 rounded-xl p-8 text-center">
            <div className="text-6xl mb-4">📊</div>
            <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
              No insights yet
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              Keep logging events and adding connections. CueGraph will automatically discover patterns in your data over time.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {insights.map(edge => {
              const fromType = eventTypes.find(t => t.id === edge.fromEventTypeId);
              const toType = eventTypes.find(t => t.id === edge.toEventTypeId);

              if (!fromType || !toType) return null;

              // Calculate percentage
              const percentage = edge.countFrom > 0
                ? Math.round((edge.matchedPairs / edge.countFrom) * 100)
                : 0;

              // Format time window
              const minHours = Math.round(edge.minHours);
              const maxHours = Math.round(edge.maxHours);
              const timeWindow = minHours === maxHours
                ? `${minHours}h`
                : `${minHours}–${maxHours}h`;

              // Format delay
              const medianHours = edge.medianDelayHours
                ? Math.round(edge.medianDelayHours)
                : null;

              const strengthPercent = Math.round(edge.inferredStrength * 100);

              return (
                <div
                  key={`${edge.fromEventTypeId}-${edge.toEventTypeId}`}
                  className="bg-white dark:bg-gray-800 rounded-xl p-6 border-2 border-primary-200 dark:border-primary-800"
                >
                  <div className="flex items-start gap-4 mb-4">
                    <div className="flex items-center gap-3">
                      <span className="text-3xl">{fromType.emoji}</span>
                      <span className="text-2xl text-gray-400">→</span>
                      <span className="text-3xl">{toType.emoji}</span>
                    </div>

                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900 dark:text-gray-100 text-lg">
                        {fromType.label} → {toType.label}
                      </h3>
                    </div>

                    <div className="text-right">
                      <div className="text-2xl font-bold text-primary-600 dark:text-primary-400">
                        {strengthPercent}%
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        strength
                      </div>
                    </div>
                  </div>

                  <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 mb-4">
                    <p className="text-sm text-gray-700 dark:text-gray-300 mb-2">
                      <strong>Pattern found:</strong> "{toType.label}" often follows "{fromType.label}" within {timeWindow}.
                    </p>

                    <div className="grid grid-cols-2 gap-4 mt-3 text-sm">
                      <div>
                        <p className="text-gray-500 dark:text-gray-400">Occurrences:</p>
                        <p className="font-semibold text-gray-900 dark:text-gray-100">
                          {edge.matchedPairs} of {edge.countFrom} times ({percentage}%)
                        </p>
                      </div>

                      {medianHours !== null && (
                        <div>
                          <p className="text-gray-500 dark:text-gray-400">Typical delay:</p>
                          <p className="font-semibold text-gray-900 dark:text-gray-100">
                            {medianHours}h
                          </p>
                        </div>
                      )}
                    </div>

                    {edge.rateInsideWindowPerHour !== undefined && edge.rateOutsideWindowPerHour !== undefined && (
                      <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-600">
                        <p className="text-xs text-gray-600 dark:text-gray-400">
                          Inside window: {edge.rateInsideWindowPerHour.toFixed(4)} events/hour
                          <br />
                          Outside window: {edge.rateOutsideWindowPerHour.toFixed(4)} events/hour
                        </p>
                      </div>
                    )}
                  </div>

                  <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3 mb-4">
                    <p className="text-xs text-blue-900 dark:text-blue-200">
                      <strong>Note:</strong> This is a correlation pattern in your log, not proof of causation. Consider other factors that might be involved.
                    </p>
                  </div>

                  <button
                    onClick={() => handleViewDetails(edge.fromEventTypeId, edge.toEventTypeId)}
                    className="w-full py-2 bg-primary-600 hover:bg-primary-700 text-white font-medium rounded-lg transition-colors"
                  >
                    View in Graph
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
