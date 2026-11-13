export type OwnerGymItem = {
  gym: {
    id: string;
    name: string;
    is_verified?: boolean;
    is_active?: boolean;
    max_capacity?: number | null;
    logo_url?: string | null;
    cover_image_url?: string | null;
    city?: string | null;
    addresses?: { city?: string | null }[];
  };
  metrics?: { active_members?: number; monthly_revenue?: number; current_occupancy?: number } | null;
};

const inr = new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 });

export const formatINR = (n: number | null | undefined) => inr.format(Math.round(n ?? 0));

/** ₹ in lakh/crore short form, like the app: ₹45k, ₹1.2L, ₹3Cr. */
export const formatINRCompact = (n: number | null | undefined) => {
  const v = Math.round(n ?? 0);
  const a = Math.abs(v);
  const trim = (x: number) => (x >= 100 ? x.toFixed(0) : x >= 10 ? x.toFixed(1) : x.toFixed(2)).replace(/\.?0+$/, '');
  if (a >= 1e7) return `₹${trim(v / 1e7)}Cr`;
  if (a >= 1e5) return `₹${trim(v / 1e5)}L`;
  if (a >= 1e4) return `₹${trim(v / 1e3)}k`;
  return formatINR(v);
};

export const compactNumber = (n: number | null | undefined) => {
  if (n == null || Number.isNaN(n)) return '—';
  if (Math.abs(n) >= 1_000_000) return `${(n / 1_000_000).toFixed(1).replace(/\.0$/, '')}M`;
  if (Math.abs(n) >= 1_000) return `${(n / 1_000).toFixed(1).replace(/\.0$/, '')}k`;
  return String(n);
};

/** Why a gym won't show in Explore, or null when it's live. */
export const gymWarning = (g: { is_verified?: boolean; is_active?: boolean }) =>
  !g.is_verified && g.is_active === false
    ? 'Not verified and inactive, so it won’t appear in Explore.'
    : !g.is_verified
      ? 'Pending verification. It won’t appear in Explore until approved.'
      : g.is_active === false
        ? 'Currently inactive. Members can’t discover your gym.'
        : null;
