import type { EventType, EventInstance, EventLink, TypeEdgeStats, EdgeSource } from './types';

// Utility: Calculate percentile from sorted array
function percentile(sortedArr: number[], p: number): number | undefined {
  if (sortedArr.length === 0) return undefined;
  const index = (p / 100) * (sortedArr.length - 1);
  const lower = Math.floor(index);
  const upper = Math.ceil(index);
  const weight = index % 1;
  if (upper >= sortedArr.length) return sortedArr[sortedArr.length - 1];
  return sortedArr[lower] * (1 - weight) + sortedArr[upper] * weight;
}

// Utility: Calculate median
function median(sortedArr: number[]): number | undefined {
  return percentile(sortedArr, 50);
}

// Utility: Convert ISO timestamp to hours since epoch
function toHours(isoTimestamp: string): number {
  return new Date(isoTimestamp).getTime() / (1000 * 60 * 60);
}

// Utility: Clamp value between min and max
function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

/**
 * Aggregate EventLinks into TypeEdgeStats (user evidence)
 */
export function aggregateUserLinks(
  _eventTypes: EventType[],
  eventInstances: EventInstance[],
  eventLinks: EventLink[]
): Map<string, TypeEdgeStats> {
  // Build instance lookup
  const instanceMap = new Map<string, EventInstance>();
  eventInstances.forEach(instance => {
    instanceMap.set(instance.id, instance);
  });

  // Group links by (fromEventTypeId, toEventTypeId)
  const edgeGroups = new Map<string, {
    fromEventTypeId: string;
    toEventTypeId: string;
    deltaHours: number[];
    linkCount: number;
  }>();

  for (const link of eventLinks) {
    const fromInstance = instanceMap.get(link.fromEventId);
    const toInstance = instanceMap.get(link.toEventId);

    if (!fromInstance || !toInstance) continue;

    const deltaHours = toHours(toInstance.timestampUTC) - toHours(fromInstance.timestampUTC);
    if (deltaHours < 0) continue; // Skip backward links

    const key = `${fromInstance.eventTypeId}->${toInstance.eventTypeId}`;
    const existing = edgeGroups.get(key);

    if (existing) {
      existing.deltaHours.push(deltaHours);
      existing.linkCount++;
    } else {
      edgeGroups.set(key, {
        fromEventTypeId: fromInstance.eventTypeId,
        toEventTypeId: toInstance.eventTypeId,
        deltaHours: [deltaHours],
        linkCount: 1,
      });
    }
  }

  // Build TypeEdgeStats for each group
  const result = new Map<string, TypeEdgeStats>();

  edgeGroups.forEach((group, key) => {
    const sortedDeltas = [...group.deltaHours].sort((a, b) => a - b);
    const p25 = percentile(sortedDeltas, 25) || 0;
    const p50 = median(sortedDeltas) || 0;
    const p75 = percentile(sortedDeltas, 75) || 0;
    const p10 = percentile(sortedDeltas, 10) || 0;
    const p90 = percentile(sortedDeltas, 90) || 0;

    // Set time window based on percentiles (e.g., p10-p90 with padding)
    const minHours = Math.max(0, p10 * 0.8);
    const maxHours = p90 * 1.2;

    // Count instances of from and to types
    const fromInstances = eventInstances.filter(e => e.eventTypeId === group.fromEventTypeId);
    const toInstances = eventInstances.filter(e => e.eventTypeId === group.toEventTypeId);

    const edge: TypeEdgeStats = {
      fromEventTypeId: group.fromEventTypeId,
      toEventTypeId: group.toEventTypeId,
      minHours,
      maxHours,
      countFrom: fromInstances.length,
      countTo: toInstances.length,
      matchedPairs: group.linkCount,
      medianDelayHours: p50,
      p25DelayHours: p25,
      p75DelayHours: p75,
      userLinkCount: group.linkCount,
      inferredStrength: 0, // Will be computed if we infer this edge
      edgeSources: ['user'],
    };

    result.set(key, edge);
  });

  return result;
}

/**
 * Candidate time windows for inference (in hours)
 */
const CANDIDATE_WINDOWS = [
  { min: 0, max: 12 },
  { min: 0, max: 24 },
  { min: 0, max: 48 },
  { min: 12, max: 72 },
  { min: 24, max: 168 }, // 1 week
];

/**
 * Infer correlations between event types
 */
export function inferCorrelations(
  _eventTypes: EventType[],
  eventInstances: EventInstance[],
  existingEdges: Map<string, TypeEdgeStats>,
  options: {
    minMatchedPairs?: number;
    minRateRatio?: number;
    minCountFrom?: number;
    minCountTo?: number;
  } = {}
): Map<string, TypeEdgeStats> {
  const {
    minMatchedPairs = 3,
    minRateRatio = 1.5,
    minCountFrom = 3,
    minCountTo = 3,
  } = options;

  // Sort instances by time
  const sortedInstances = [...eventInstances].sort((a, b) =>
    toHours(a.timestampUTC) - toHours(b.timestampUTC)
  );

  // Get time range of data
  if (sortedInstances.length < 2) return new Map();

  const minTime = toHours(sortedInstances[0].timestampUTC);
  const maxTime = toHours(sortedInstances[sortedInstances.length - 1].timestampUTC);
  const totalHours = maxTime - minTime;

  // Group instances by event type
  const instancesByType = new Map<string, EventInstance[]>();
  sortedInstances.forEach(instance => {
    const list = instancesByType.get(instance.eventTypeId) || [];
    list.push(instance);
    instancesByType.set(instance.eventTypeId, list);
  });

  const result = new Map<string, TypeEdgeStats>();

  // For each pair of event types (A, B)
  const typeIds = Array.from(instancesByType.keys());

  for (const fromTypeId of typeIds) {
    for (const toTypeId of typeIds) {
      if (fromTypeId === toTypeId) continue;

      const key = `${fromTypeId}->${toTypeId}`;

      // Skip if already has strong user evidence
      const existingEdge = existingEdges.get(key);
      if (existingEdge && existingEdge.userLinkCount >= minMatchedPairs) {
        continue;
      }

      const fromInstances = instancesByType.get(fromTypeId)!;
      const toInstances = instancesByType.get(toTypeId)!;

      if (fromInstances.length < minCountFrom || toInstances.length < minCountTo) {
        continue;
      }

      // Try each candidate window
      let bestWindow: TypeEdgeStats | null = null;
      let bestStrength = 0;

      for (const window of CANDIDATE_WINDOWS) {
        const { min: minH, max: maxH } = window;

        // Count matches: for each "to" instance, check if there's a "from" instance in the window before it
        const matches: number[] = [];
        let insideCount = 0;

        for (const toInstance of toInstances) {
          const toTime = toHours(toInstance.timestampUTC);

          // Find "from" instances in the window
          const fromInWindow = fromInstances.filter(fromInstance => {
            const fromTime = toHours(fromInstance.timestampUTC);
            const delta = toTime - fromTime;
            return delta >= minH && delta <= maxH;
          });

          if (fromInWindow.length > 0) {
            insideCount++;
            // Record the delay to the closest "from" instance
            const closestDelta = Math.min(
              ...fromInWindow.map(f => toTime - toHours(f.timestampUTC))
            );
            matches.push(closestDelta);
          }
        }

        const matchedPairs = insideCount;
        if (matchedPairs < minMatchedPairs) continue;

        // Estimate window coverage
        const totalWindowHours = fromInstances.length * (maxH - minH);
        const totalOutsideWindowHours = Math.max(0, totalHours * toInstances.length - totalWindowHours);

        const outsideCount = toInstances.length - insideCount;

        // Compute rates
        const epsilon = 0.0001;
        const rateInside = totalWindowHours > 0 ? insideCount / totalWindowHours : 0;
        const rateOutside = totalOutsideWindowHours > 0 ? outsideCount / totalOutsideWindowHours : epsilon;

        const rateRatio = rateInside / (rateOutside + epsilon);

        if (rateRatio < minRateRatio) continue;

        // Compute strength score (0-1)
        // Normalize rate ratio to 0-1 range (cap at 10x)
        const normalizedRatio = clamp(rateRatio / 10, 0, 1);
        // Factor in number of matches (more matches = higher confidence)
        const matchFactor = clamp(matchedPairs / 10, 0, 1);
        const strength = (normalizedRatio * 0.7 + matchFactor * 0.3);

        if (strength > bestStrength) {
          bestStrength = strength;

          // Compute delay stats
          const sortedMatches = [...matches].sort((a, b) => a - b);

          bestWindow = {
            fromEventTypeId: fromTypeId,
            toEventTypeId: toTypeId,
            minHours: minH,
            maxHours: maxH,
            countFrom: fromInstances.length,
            countTo: toInstances.length,
            matchedPairs,
            medianDelayHours: median(sortedMatches),
            p25DelayHours: percentile(sortedMatches, 25),
            p75DelayHours: percentile(sortedMatches, 75),
            rateInsideWindowPerHour: rateInside,
            rateOutsideWindowPerHour: rateOutside,
            totalWindowHours,
            totalOutsideWindowHours,
            userLinkCount: 0,
            inferredStrength: strength,
            edgeSources: ['inferred'],
          };
        }
      }

      if (bestWindow) {
        result.set(key, bestWindow);
      }
    }
  }

  return result;
}

/**
 * Merge user and inferred edges
 */
export function mergeEdges(
  userEdges: Map<string, TypeEdgeStats>,
  inferredEdges: Map<string, TypeEdgeStats>
): Map<string, TypeEdgeStats> {
  const result = new Map<string, TypeEdgeStats>(userEdges);

  inferredEdges.forEach((inferredEdge, key) => {
    const existingEdge = result.get(key);

    if (existingEdge) {
      // Merge: combine sources and stats
      const merged: TypeEdgeStats = {
        ...existingEdge,
        edgeSources: Array.from(new Set([...existingEdge.edgeSources, ...inferredEdge.edgeSources])) as EdgeSource[],
        inferredStrength: Math.max(existingEdge.inferredStrength, inferredEdge.inferredStrength),
        // Keep user-based time window if available, otherwise use inferred
        minHours: existingEdge.userLinkCount > 0 ? existingEdge.minHours : inferredEdge.minHours,
        maxHours: existingEdge.userLinkCount > 0 ? existingEdge.maxHours : inferredEdge.maxHours,
        matchedPairs: existingEdge.matchedPairs + inferredEdge.matchedPairs,
        // Use inferred rates if not present
        rateInsideWindowPerHour: existingEdge.rateInsideWindowPerHour || inferredEdge.rateInsideWindowPerHour,
        rateOutsideWindowPerHour: existingEdge.rateOutsideWindowPerHour || inferredEdge.rateOutsideWindowPerHour,
        totalWindowHours: existingEdge.totalWindowHours || inferredEdge.totalWindowHours,
        totalOutsideWindowHours: existingEdge.totalOutsideWindowHours || inferredEdge.totalOutsideWindowHours,
      };

      result.set(key, merged);
    } else {
      // No existing edge, add inferred edge
      result.set(key, inferredEdge);
    }
  });

  return result;
}

/**
 * Compute all edges from event data
 */
export function computeAllEdges(
  eventTypes: EventType[],
  eventInstances: EventInstance[],
  eventLinks: EventLink[],
  options?: {
    minMatchedPairs?: number;
    minRateRatio?: number;
    minCountFrom?: number;
    minCountTo?: number;
  }
): TypeEdgeStats[] {
  const userEdges = aggregateUserLinks(eventTypes, eventInstances, eventLinks);
  const inferredEdges = inferCorrelations(eventTypes, eventInstances, userEdges, options);
  const allEdges = mergeEdges(userEdges, inferredEdges);

  return Array.from(allEdges.values());
}

/**
 * Get outgoing edges for a specific event type (what happens after)
 */
export function getOutgoingEdges(
  eventTypeId: string,
  allEdges: TypeEdgeStats[],
  minStrength = 0
): TypeEdgeStats[] {
  return allEdges
    .filter(edge => edge.fromEventTypeId === eventTypeId && edge.inferredStrength >= minStrength)
    .sort((a, b) => {
      // Sort by: inferredStrength desc, userLinkCount desc, matchedPairs desc
      if (b.inferredStrength !== a.inferredStrength) {
        return b.inferredStrength - a.inferredStrength;
      }
      if (b.userLinkCount !== a.userLinkCount) {
        return b.userLinkCount - a.userLinkCount;
      }
      return b.matchedPairs - a.matchedPairs;
    });
}

/**
 * Get incoming edges for a specific event type (what happens before)
 */
export function getIncomingEdges(
  eventTypeId: string,
  allEdges: TypeEdgeStats[],
  minStrength = 0
): TypeEdgeStats[] {
  return allEdges
    .filter(edge => edge.toEventTypeId === eventTypeId && edge.inferredStrength >= minStrength)
    .sort((a, b) => {
      // Sort by: inferredStrength desc, userLinkCount desc, matchedPairs desc
      if (b.inferredStrength !== a.inferredStrength) {
        return b.inferredStrength - a.inferredStrength;
      }
      if (b.userLinkCount !== a.userLinkCount) {
        return b.userLinkCount - a.userLinkCount;
      }
      return b.matchedPairs - a.matchedPairs;
    });
}

/**
 * Get suggested insights (inferred edges without strong user support)
 */
export function getSuggestedInsights(
  allEdges: TypeEdgeStats[],
  minStrength = 0.3,
  maxUserLinks = 1
): TypeEdgeStats[] {
  return allEdges
    .filter(edge =>
      edge.edgeSources.includes('inferred') &&
      edge.inferredStrength >= minStrength &&
      edge.userLinkCount <= maxUserLinks
    )
    .sort((a, b) => b.inferredStrength - a.inferredStrength);
}
