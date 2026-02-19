import { useCallback, useMemo, useRef, useState } from "react";
import type { RefObject, TouchEvent as ReactTouchEvent } from "react";

export type PullToRefreshState = "idle" | "pulling" | "ready" | "refreshing";

export interface UsePullToRefreshOptions {
  enabled?: boolean;
  isRefreshing?: boolean;
  threshold?: number;
  maxDistance?: number;
  onRefresh: () => Promise<void>;
}

export interface UsePullToRefreshResult {
  containerRef: RefObject<HTMLDivElement>;
  pullDistance: number;
  pullProgress: number;
  state: PullToRefreshState;
  onTouchStart: (event: ReactTouchEvent<HTMLDivElement>) => void;
  onTouchMove: (event: ReactTouchEvent<HTMLDivElement>) => void;
  onTouchEnd: () => void;
  onTouchCancel: () => void;
}

const DEFAULT_THRESHOLD = 72;
const DEFAULT_MAX_DISTANCE = 128;
const DAMPING = 0.55;

export const clampPullDistance = (distance: number, maxDistance: number): number => {
  return Math.max(0, Math.min(maxDistance, distance));
};

export const computePullProgress = (distance: number, threshold: number): number => {
  if (threshold <= 0) {
    return 0;
  }

  return Math.max(0, Math.min(1, distance / threshold));
};

export const usePullToRefresh = (
  options: UsePullToRefreshOptions,
): UsePullToRefreshResult => {
  const {
    enabled = true,
    isRefreshing = false,
    threshold = DEFAULT_THRESHOLD,
    maxDistance = DEFAULT_MAX_DISTANCE,
    onRefresh,
  } = options;

  const containerRef = useRef<HTMLDivElement>(null);
  const touchStartYRef = useRef<number | null>(null);
  const isTrackingRef = useRef<boolean>(false);
  const isRefreshingRef = useRef<boolean>(false);
  const pullDistanceRef = useRef<number>(0);

  const [pullDistance, setPullDistance] = useState<number>(0);

  const updatePullDistance = useCallback((nextDistance: number) => {
    pullDistanceRef.current = nextDistance;
    setPullDistance(nextDistance);
  }, []);

  const resetGesture = useCallback(() => {
    isTrackingRef.current = false;
    touchStartYRef.current = null;
    updatePullDistance(0);
  }, [updatePullDistance]);

  const startRefresh = useCallback(async () => {
    if (isRefreshingRef.current) {
      return;
    }

    isRefreshingRef.current = true;
    try {
      await onRefresh();
    } catch {
      // Refresh failures are handled by the caller's state/messages.
    } finally {
      isRefreshingRef.current = false;
      updatePullDistance(0);
    }
  }, [onRefresh, updatePullDistance]);

  const onTouchStart = useCallback((event: ReactTouchEvent<HTMLDivElement>) => {
    if (!enabled || isRefreshing || event.touches.length !== 1) {
      return;
    }

    const container = containerRef.current;
    if (!container || container.scrollTop > 0) {
      return;
    }

    touchStartYRef.current = event.touches[0].clientY;
    isTrackingRef.current = true;
    updatePullDistance(0);
  }, [enabled, isRefreshing, updatePullDistance]);

  const onTouchMove = useCallback((event: ReactTouchEvent<HTMLDivElement>) => {
    if (!isTrackingRef.current || !enabled || isRefreshing) {
      return;
    }

    const touchStartY = touchStartYRef.current;
    if (touchStartY === null) {
      return;
    }

    const container = containerRef.current;
    if (!container || container.scrollTop > 0) {
      resetGesture();
      return;
    }

    const deltaY = event.touches[0].clientY - touchStartY;
    if (deltaY <= 0) {
      updatePullDistance(0);
      return;
    }

    event.preventDefault();
    const dampedDistance = clampPullDistance(deltaY * DAMPING, maxDistance);
    updatePullDistance(dampedDistance);
  }, [enabled, isRefreshing, maxDistance, resetGesture, updatePullDistance]);

  const onTouchEnd = useCallback(() => {
    if (!isTrackingRef.current) {
      return;
    }

    isTrackingRef.current = false;
    touchStartYRef.current = null;

    if (!enabled || isRefreshing || pullDistanceRef.current < threshold) {
      updatePullDistance(0);
      return;
    }

    updatePullDistance(Math.min(threshold * 0.55, maxDistance));
    void startRefresh();
  }, [enabled, isRefreshing, maxDistance, startRefresh, threshold, updatePullDistance]);

  const onTouchCancel = useCallback(() => {
    resetGesture();
  }, [resetGesture]);

  const state: PullToRefreshState = useMemo(() => {
    if (isRefreshing) {
      return "refreshing";
    }

    if (pullDistance >= threshold) {
      return "ready";
    }

    if (pullDistance > 0) {
      return "pulling";
    }

    return "idle";
  }, [isRefreshing, pullDistance, threshold]);

  const pullProgress = useMemo(() => {
    return computePullProgress(pullDistance, threshold);
  }, [pullDistance, threshold]);

  return {
    containerRef,
    pullDistance,
    pullProgress,
    state,
    onTouchStart,
    onTouchMove,
    onTouchEnd,
    onTouchCancel,
  };
};
