import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { BadgeCheck, ChevronDown, Crosshair, Dumbbell, MapPin, Navigation, Search, SearchX, SlidersHorizontal, Sparkles, Star, Target } from 'lucide-react';
import { Avatar, Badge, Button, Card, Chip, EmptyState, ErrorState, IconButton, SegmentedControl, Skeleton, Spinner, Text, cn } from '../../components/kit';
import InfoModal from '../../components/InfoModal';
import { MapPanel, type MapPoint } from '../../components/explore/MapPanel';
import { useGeoLocation } from '../../context/LocationContext';
import { openInMap } from '../../utils/navigation';
import { discoveryApi, type DiscoveryParams } from '../../api/discovery';

/* eslint-disable @typescript-eslint/no-explicit-any -- search payloads are untyped */

const CATEGORIES = ['All', 'CrossFit', 'Strength', 'Yoga', 'MMA', 'Cardio', 'HIIT'];
const RADII = [1, 2, 5, 10];

const getPeriodText = (duration?: string | null) => {
  if (!duration) return '/mo';
  const lower = duration.toLowerCase();
  if (lower.includes('day')) return '/day';
  if (lower.includes('week')) return '/wk';
  if (lower.includes('month')) return '/mo';
  if (lower.includes('quarter')) return '/qtr';
  if (lower.includes('half')) return '/6mo';
  if (lower.includes('year')) return '/yr';
  if (lower.includes('session')) return '/sess';
  return `/${duration.substring(0, 3)}`;
};

const formatDistance = (d?: number | null) => (d == null ? null : d < 1 ? `${Math.round(d * 1000)} m` : `${d.toFixed(1)} km`);
const inr = (n: number) => `₹${Math.round(n).toLocaleString('en-IN')}`;

function occupancy(cur?: number | null, max?: number | null) {
  if (!max || cur == null) return null;
  const r = cur / max;
  return r > 0.8 ? { label: 'Busy', tone: 'bg-danger' } : r > 0.5 ? { label: 'Moderate', tone: 'bg-warning' } : { label: 'Quiet', tone: 'bg-success' };
}

function Rating({ value, count }: { value?: number | null; count?: number | null }) {
  if (!value) return <Badge label="New" tone="accent" />;
  return (
    <span className="inline-flex items-center gap-1">
      <Star size={13} className="fill-rating text-rating" aria-hidden />
      <span className="t-callout font-bold text-ink">{value.toFixed(1)}</span>
      {count ? <span className="t-caption text-ink-subtle">({count})</span> : null}
    </span>
  );
}

const glassPill = 't-caption inline-flex items-center gap-1.5 rounded-full bg-black/55 px-2.5 py-1 font-semibold text-white backdrop-blur';

function GymResultCard({ gym, onOpen }: { gym: any; onOpen: () => void }) {
  const cover = gym.cover_image_url || gym.logo_url;
  const occ = occupancy(gym.current_occupancy, gym.max_capacity);
  const distance = formatDistance(gym.distance);
  const amenities = ((gym.amenities ?? []) as any[]).map(a => (typeof a === 'string' ? a : a?.name)).filter(Boolean) as string[];
  const tags = amenities.length ? amenities : (gym.specializations ?? []);
  return (
    <Card padding="none" className="overflow-hidden" data-testid="gym-card">
      <button type="button" onClick={onOpen} aria-label={gym.name} className="relative block h-[180px] w-full bg-surface-sunken">
        {cover ? <img src={cover} alt="" className="h-full w-full object-cover" loading="lazy" /> : <Dumbbell size={36} className="mx-auto text-ink-subtle" aria-hidden />}
        {cover || occ ? <span className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black/55 to-transparent" aria-hidden /> : null}
        {gym.is_verified ? (
          <span className={cn(glassPill, 'absolute left-3 top-3')}>
            <BadgeCheck size={13} aria-hidden /> Verified partner
          </span>
        ) : null}
        {occ ? (
          <span className={cn(glassPill, 'absolute bottom-3 left-3')}>
            <span className={cn('h-2 w-2 rounded-full', occ.tone)} aria-hidden />
            {occ.label} · {gym.current_occupancy}/{gym.max_capacity}
          </span>
        ) : null}
      </button>
      <div className="flex flex-col gap-3 p-4">
        <div className="flex items-start gap-3">
          <div className="min-w-0 flex-1">
            <button type="button" onClick={onOpen} className="text-left">
              <Text variant="h2" className="line-clamp-2">
                {gym.name}
              </Text>
            </button>
            <button
              type="button"
              onClick={e => openInMap(e, gym.address_line1 || gym.city, gym.latitude, gym.longitude)}
              className="mt-1 flex max-w-full items-center gap-1 text-left text-ink-muted hover:text-accent-text">
              <MapPin size={13} className="shrink-0" aria-hidden />
              <span className="t-footnote truncate">{gym.address_line1 || gym.city || 'Location unavailable'}</span>
            </button>
          </div>
          <div className="flex flex-col items-end">
            <Rating value={gym.rating_avg} count={gym.rating_count} />
            {distance ? (
              <Text variant="caption" tone="accent" className="mt-0.5 font-bold">
                {distance} away
              </Text>
            ) : null}
          </div>
        </div>
        {tags.length ? (
          <div className="flex flex-wrap gap-1.5">
            {tags.slice(0, 4).map((a: string) => (
              <Badge key={a} label={a} />
            ))}
          </div>
        ) : null}
        <div className="flex items-center gap-2 border-t border-border pt-3">
          <div className="min-w-0 flex-1">
            {gym.starting_price != null ? (
              <>
                <Text variant="labelSm" tone="subtle">
                  From
                </Text>
                <span className="flex items-baseline gap-1">
                  <span className="t-title tabular-nums text-ink">{inr(gym.starting_price)}</span>
                  <span className="t-caption text-ink-subtle">{getPeriodText(gym.starting_price_duration)}</span>
                </span>
              </>
            ) : (
              <Text variant="caption" tone="subtle">
                Plans on request
              </Text>
            )}
          </div>
          <Button label="View Plans" variant="secondary" size="sm" to={`/app/gyms/${gym.id}?tab=plans`} />
          <Button label="Explore" size="sm" onClick={onOpen} />
        </div>
      </div>
    </Card>
  );
}

function TrainerResultCard({ trainer, onOpen }: { trainer: any; onOpen: () => void }) {
  const specs: string[] = trainer.specializations ?? [];
  const distance = formatDistance(trainer.distance);
  return (
    <Card padding="lg" data-testid="trainer-card">
      <div className="flex items-center gap-2">
        <Text variant="labelSm" tone="accent" className="flex-1">
          Performance coach
        </Text>
        {trainer.location ? <Badge label={trainer.location} tone="accent" /> : null}
      </div>
      <button type="button" onClick={onOpen} className="mt-3 flex w-full items-center gap-3 text-left">
        <Avatar name={trainer.full_name} src={trainer.avatar_url} size={60} />
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <Text variant="title" className="flex-1 truncate">
              {trainer.full_name || 'Trainer'}
            </Text>
            <Rating value={trainer.rating_avg} />
          </div>
          <Text variant="footnote" tone="muted" className="truncate">
            {specs.length ? specs.slice(0, 2).join(' & ') : 'Online / Home visits'}
            {specs.length > 2 ? ` +${specs.length - 2}` : ''}
          </Text>
          <div className="mt-1 flex items-center gap-3">
            {trainer.hourly_rate ? (
              <span className="t-subtitle text-accent-text">
                {inr(trainer.hourly_rate)}
                <span className="t-caption text-ink-subtle"> /hr</span>
              </span>
            ) : null}
            {distance ? (
              <Text variant="caption" tone="subtle">
                {distance} away
              </Text>
            ) : null}
          </div>
        </div>
      </button>
      <div className="mt-4 grid grid-cols-2 gap-2">
        <Button label="Profile & Stats" variant="secondary" size="sm" onClick={onOpen} />
        <Button label="Book Trial" size="sm" to={`/app/trainers/${trainer.id}?book=1`} />
      </div>
    </Card>
  );
}

/** Explore: map + search + filters + gym/trainer results (GET /gyms/, /trainers/). */
export default function Discovery() {
  const navigate = useNavigate();
  const { selectedLocation, currentGPS, refreshGPS, isLocating } = useGeoLocation();
  const [tab, setTab] = useState<'gyms' | 'trainers'>('gyms');
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);
  const [search, setSearch] = useState('');
  const [nearMe, setNearMe] = useState(true);
  const [radius, setRadius] = useState(2);
  const [category, setCategory] = useState('All');
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [infoOpen, setInfoOpen] = useState(false);

  const fetchItems = useCallback(async () => {
    setLoading(true);
    setFailed(false);
    setItems([]);
    try {
      const params: DiscoveryParams = { search, page_size: 20, sort_by: nearMe ? 'distance' : 'rating' };
      if (category !== 'All') {
        if (tab === 'gyms') params.search = params.search ? `${params.search} ${category}` : category;
        else params.specialization = category;
      }
      if (selectedLocation) {
        params.lat = selectedLocation.latitude;
        params.lng = selectedLocation.longitude;
        if (nearMe) params.radius = radius;
      }
      setItems(await discoveryApi.list(tab, params));
    } catch (err) {
      console.error('Failed to fetch items:', err);
      setFailed(true);
    } finally {
      setLoading(false);
    }
  }, [tab, search, nearMe, selectedLocation, radius, category]);

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  const toggleNearMe = () => {
    if (nearMe) {
      setNearMe(false);
      return;
    }
    setNearMe(true);
    if (!selectedLocation) refreshGPS();
    try {
      if (!localStorage.getItem('hideDiscoveryNearMeInfo')) setInfoOpen(true);
    } catch {
      // storage blocked: skip the hint
    }
  };

  const area = selectedLocation?.city ?? null;
  const ready = !loading && !failed;
  const noun = tab === 'gyms' ? (items.length === 1 ? 'gym' : 'gyms') : items.length === 1 ? 'trainer' : 'trainers';
  const nextRadius = RADII.find(r => r > radius);
  const center = selectedLocation ? { lat: selectedLocation.latitude, lng: selectedLocation.longitude } : currentGPS;
  const points: MapPoint[] =
    tab === 'gyms'
      ? items.filter(g => g.latitude != null && g.longitude != null).map(g => ({ id: g.id, lat: Number(g.latitude), lng: Number(g.longitude), title: g.name }))
      : [];
  const open = (item: any) => navigate(tab === 'gyms' ? `/app/gyms/${item.id}` : `/app/trainers/${item.id}`);

  const mapBlock = (
    <div className="relative">
      <MapPanel center={center} points={points} onPick={id => navigate(`/app/gyms/${id}`)} className="h-[210px] rounded-gm-xl lg:h-[calc(100dvh-140px)]" />
      <div className="pointer-events-none absolute inset-x-3 top-3 flex items-center gap-2">
        <span className="t-caption pointer-events-auto inline-flex min-w-0 items-center gap-1.5 rounded-full border border-border bg-surface px-3 py-1.5 font-semibold text-ink shadow-card">
          <Navigation size={13} aria-hidden />
          <span className="truncate">{selectedLocation ? [selectedLocation.address_line1?.split(',')[0], area].filter(Boolean).join(', ') : 'Set your location'}</span>
        </span>
        <button
          type="button"
          onClick={() => setFiltersOpen(o => !o)}
          aria-label="Change search radius"
          className={cn(
            't-caption pointer-events-auto ml-auto inline-flex shrink-0 items-center gap-1 rounded-full border px-3 py-1.5 font-semibold shadow-card',
            nearMe ? 'border-accent-border bg-accent-soft text-accent-text' : 'border-border bg-surface text-ink',
          )}>
          Radius: {radius} km <ChevronDown size={13} aria-hidden />
        </button>
      </div>
      <div className="absolute bottom-3 right-3">
        <IconButton icon={Crosshair} label="Recenter on my location" onClick={() => refreshGPS()} variant="surface" className={isLocating ? '[&_svg]:animate-pulse' : ''} />
      </div>
    </div>
  );

  return (
    <div className="mx-auto w-full max-w-[1280px] pb-10">
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)] lg:gap-8">
        <div className="lg:hidden">{mapBlock}</div>

        <div className="flex min-w-0 flex-col gap-5">
          <div>
            <div className="flex items-center justify-between gap-3">
              <Text variant="display">Find your next {tab === 'gyms' ? 'gym' : 'coach'}</Text>
              <span className="t-caption inline-flex shrink-0 items-center gap-1.5 rounded-full bg-accent-soft px-2.5 py-1 font-semibold text-accent-text">
                <span className="h-2 w-2 animate-pulse rounded-full bg-accent" aria-hidden /> Live radar
              </span>
            </div>
            <Text variant="footnote" tone="muted" className="mt-1">
              {ready
                ? `Explore ${items.length} ${tab === 'gyms' ? 'partner centers' : 'coaches'}${area ? ` near ${area}` : ''}${nearMe ? ` within ${radius} km` : ''}.`
                : failed
                  ? 'Couldn’t load results. Tap Try again.'
                  : 'Scanning partner centers around you…'}
            </Text>
          </div>

          <div className="flex items-center gap-2">
            <label className="flex h-14 min-w-0 flex-1 items-center gap-2 rounded-gm-lg border border-border-strong bg-surface px-4 focus-within:border-accent">
              <input
                type="search"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search gym name, area, trainer…"
                aria-label="Search"
                className="t-body min-w-0 flex-1 bg-transparent text-ink outline-none placeholder:text-ink-subtle"
              />
              {loading ? <Spinner size={18} /> : <Search size={18} className="text-ink-subtle" aria-hidden />}
            </label>
            <button
              type="button"
              onClick={() => setFiltersOpen(o => !o)}
              aria-label="Search radius filters"
              aria-pressed={filtersOpen}
              className={cn(
                'flex h-14 w-14 shrink-0 items-center justify-center rounded-full border',
                filtersOpen ? 'border-accent bg-accent text-on-accent' : 'border-border-strong bg-surface text-ink hover:bg-surface-sunken',
              )}>
              <SlidersHorizontal size={20} aria-hidden />
            </button>
          </div>

          <SegmentedControl<'gyms' | 'trainers'>
            aria-label="Results"
            value={tab}
            onChange={setTab}
            options={[
              { value: 'gyms', label: tab === 'gyms' && ready ? `Gyms (${items.length})` : 'Gyms' },
              { value: 'trainers', label: tab === 'trainers' && ready ? `Trainers (${items.length})` : 'Trainers' },
            ]}
          />

          <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 [scrollbar-width:none] lg:mx-0 lg:flex-wrap lg:px-0">
            <Chip label={isLocating ? 'Locating…' : 'Near me'} icon={<Navigation size={14} aria-hidden />} selected={nearMe} onClick={toggleNearMe} />
            {CATEGORIES.map(c => (
              <Chip key={c} label={c} selected={category === c} onClick={() => setCategory(c)} />
            ))}
          </div>

          {filtersOpen ? (
            <Card padding="md">
              <div className="flex items-center justify-between">
                <Text variant="label" tone="subtle">
                  Search radius
                </Text>
                {!nearMe ? (
                  <Text variant="caption" tone="subtle">
                    Applies with Near me
                  </Text>
                ) : null}
              </div>
              <div className="mt-2 flex gap-2">
                {RADII.map(r => (
                  <Chip key={r} label={`${r} km`} selected={radius === r} onClick={() => setRadius(r)} />
                ))}
              </div>
            </Card>
          ) : null}

          {ready ? (
            <div className="flex items-center justify-between gap-3">
              <Text variant="callout" className="truncate font-bold">
                {items.length} {noun} found{area ? ` near ${area}` : ''}
              </Text>
              <Text variant="caption" tone="muted">
                {nearMe ? 'Nearest first' : 'Top rated first'}
              </Text>
            </div>
          ) : null}

          {loading ? (
            <div className="flex flex-col gap-4">
              <Skeleton className="h-[300px] rounded-gm-xl" />
              <Skeleton className="h-[300px] rounded-gm-xl" />
            </div>
          ) : failed ? (
            <ErrorState message="Tap Try again." onRetry={fetchItems} />
          ) : !items.length ? (
            <EmptyState icon={SearchX} title="No results found" message="Try a different search or expand your search area." />
          ) : (
            <div className="flex flex-col gap-4">
              {items.map(item =>
                tab === 'gyms' ? <GymResultCard key={`g-${item.id}`} gym={item} onOpen={() => open(item)} /> : <TrainerResultCard key={`t-${item.id}`} trainer={item} onOpen={() => open(item)} />,
              )}
              {nearMe ? (
                <div className="flex flex-col items-center gap-1 pt-4 text-center">
                  <Target size={22} className="text-accent" aria-hidden />
                  <Text variant="footnote" tone="muted">
                    You’ve reached the edge of {radius} km radius
                  </Text>
                  {nextRadius ? (
                    <button type="button" onClick={() => setRadius(nextRadius)} className="t-button-sm text-accent-text hover:underline">
                      Expand to {nextRadius} km
                    </button>
                  ) : null}
                </div>
              ) : null}
            </div>
          )}
        </div>

        <aside className="hidden lg:block">
          <div className="sticky top-[84px]">{mapBlock}</div>
        </aside>
      </div>

      <InfoModal
        isOpen={infoOpen}
        onClose={() => setInfoOpen(false)}
        title="Nearest Gyms"
        description={`We're currently showing gyms within a ${radius}km radius of your location, sorted by proximity to give you the most convenient options.`}
        icon={Sparkles}
        storageKey="hideDiscoveryNearMeInfo"
      />
    </div>
  );
}
