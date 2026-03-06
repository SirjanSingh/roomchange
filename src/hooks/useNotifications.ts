"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { getNotificationCounts } from "@/app/actions";

interface NotificationCounts {
  incomingOffers: number;
  newMatches: number;
}

export function useNotifications(enabled: boolean) {
  const [counts, setCounts] = useState<NotificationCounts>({
    incomingOffers: 0,
    newMatches: 0,
  });
  const prevOffers = useRef(0);
  const [hasNewOffer, setHasNewOffer] = useState(false);

  const poll = useCallback(async () => {
    if (!enabled) return;
    try {
      const result = await getNotificationCounts();
      setCounts(result);
      if (result.incomingOffers > prevOffers.current && prevOffers.current >= 0) {
        setHasNewOffer(true);
        setTimeout(() => setHasNewOffer(false), 5000);
      }
      prevOffers.current = result.incomingOffers;
    } catch {
      // ignore polling errors
    }
  }, [enabled]);

  useEffect(() => {
    if (!enabled) return;
    poll();
    const interval = setInterval(poll, 30_000);
    return () => clearInterval(interval);
  }, [enabled, poll]);

  return { counts, hasNewOffer };
}
