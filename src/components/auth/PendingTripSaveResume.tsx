'use client';

import { useEffect, useRef } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import {
  destinationAfterPendingSave,
  getPendingTripSave,
  resumePendingTripSaveOnce,
} from '@/lib/pending-trip-save';

/**
 * If a guest started a save then landed somewhere authenticated (e.g. /dashboard),
 * finish the save once and send them to the new trip hub.
 */
export default function PendingTripSaveResume() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const attempted = useRef(false);

  useEffect(() => {
    if (loading || !user || attempted.current) return;
    if (pathname.startsWith('/auth/')) return;
    if (!getPendingTripSave()) return;

    attempted.current = true;
    void resumePendingTripSaveOnce().then((result) => {
      const dest = destinationAfterPendingSave(result);
      if (dest) router.replace(dest);
    });
  }, [loading, user, pathname, router]);

  return null;
}
