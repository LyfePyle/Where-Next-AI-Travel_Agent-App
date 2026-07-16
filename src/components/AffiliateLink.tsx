'use client';

/**
 * Reusable affiliate link — logs a click row then opens the partner URL in a new tab.
 * Uses the internal /api/affiliate/redirect route so destination/dates/tripId stay
 * consistent with Trip Hub and openAffiliateRedirect().
 */

import type { CSSProperties, ReactNode } from 'react';
import type { AffiliateType } from '@/lib/affiliates';
import { buildAffiliateRedirectUrl } from '@/lib/payments';

export interface AffiliateLinkProps {
  type: AffiliateType;
  destination: string;
  startDate?: string;
  endDate?: string;
  adults?: number;
  origin?: string;
  tripId?: string;
  /** Display label (used when children not provided) */
  label?: string;
  partner?: string;
  className?: string;
  style?: CSSProperties;
  children?: ReactNode;
}

export default function AffiliateLink({
  type,
  destination,
  startDate,
  endDate,
  adults,
  origin,
  tripId,
  label,
  className,
  style,
  children,
}: AffiliateLinkProps) {
  const href = buildAffiliateRedirectUrl(type, {
    destination,
    startDate,
    endDate,
    adults,
    origin,
    tripId,
  });

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer sponsored"
      className={className}
      style={style}
    >
      {children ?? label ?? 'Book'}
    </a>
  );
}
