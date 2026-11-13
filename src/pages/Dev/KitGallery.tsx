import { useState, type ReactNode } from 'react';
import { Bell, Dumbbell, Footprints, MapPin, Plus, Settings, Share2, Sparkles, Trash2, Trophy, User } from 'lucide-react';
import {
  AppBar,
  Avatar,
  Badge,
  BarChart,
  Button,
  Card,
  Checkbox,
  Chip,
  confirmDialog,
  DateField,
  Divider,
  EmptyState,
  ErrorState,
  IconButton,
  ListGroup,
  ListItem,
  Meter,
  OtpInput,
  PageHeader,
  ProgressRing,
  ProgressSteps,
  SectionHeader,
  SegmentedControl,
  SelectableCard,
  Sheet,
  SignatureCard,
  Skeleton,
  SkeletonText,
  StatTile,
  Tag,
  Text,
  TextArea,
  TextField,
  TimeField,
  Toggle,
  useToast,
} from '../../components/kit';

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="flex flex-col gap-3">
      <h2 className="t-label text-ink-subtle">{title}</h2>
      {children}
    </section>
  );
}

function Gallery() {
  const toast = useToast();
  const [seg, setSeg] = useState<'gym' | 'sports'>('sports');
  const [on, setOn] = useState(true);
  const [check, setCheck] = useState(true);
  const [otp, setOtp] = useState('1234');
  const [sheet, setSheet] = useState(false);
  const [role, setRole] = useState('user');
  const [date, setDate] = useState('2026-11-12');
  const [time, setTime] = useState('19:00');
  const [chip, setChip] = useState('30');

  return (
    <div className="flex flex-col gap-10">
      <Section title="Type">
        <Card padding="lg" className="flex flex-col gap-1">
          <Text variant="hero">6.24</Text>
          <Text variant="display">Display · Choose your path</Text>
          <Text variant="h1">H1 · 30-day strength & 5K</Text>
          <Text variant="h2">H2 · Your plans</Text>
          <Text variant="title">Title · Tempo run 5 km</Text>
          <Text variant="subtitle">Subtitle · Rahul Verma</Text>
          <Text>Body · Migo builds workouts and meals around your goal.</Text>
          <Text variant="callout" tone="muted">Callout muted</Text>
          <Text variant="footnote" tone="subtle">Footnote subtle</Text>
          <Text variant="label" tone="accent">Label accent</Text>
          <Text variant="metric">12,450</Text>
        </Card>
      </Section>

      <Section title="Buttons">
        <div className="flex flex-wrap gap-3">
          <Button label="Primary" />
          <Button label="Secondary" variant="secondary" />
          <Button label="Outline" variant="outline" />
          <Button label="Ghost" variant="ghost" />
          <Button label="Danger" variant="danger" icon={Trash2} />
          <Button label="Loading" loading />
          <Button label="Disabled" disabled />
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Button label="Medium" size="md" iconRight={Plus} />
          <Button label="Small" size="sm" icon={Share2} />
          <Button label="Small secondary" size="sm" variant="secondary" />
          <IconButton icon={Bell} label="Notifications" badge />
          <IconButton icon={Settings} label="Settings" variant="sunken" />
          <IconButton icon={Plus} label="Add" variant="accent" />
        </div>
      </Section>

      <Section title="Cards & tiles">
        <div className="grid gap-3 md:grid-cols-3">
          <Card>
            <Text variant="title">Surface card</Text>
            <Text variant="footnote" tone="muted">Default card</Text>
          </Card>
          <Card variant="raised">
            <Text variant="title">Raised</Text>
          </Card>
          <Card variant="accent" onClick={() => toast({ tone: 'success', title: 'Card pressed' })}>
            <Text variant="title">Accent (pressable)</Text>
          </Card>
        </div>
        <SignatureCard>
          <Badge label="Workout · 30 days" tone="accent" />
          <Text variant="h1" className="mt-2">
            Signature card
          </Text>
          <Text tone="muted">Always dark with the ember glow.</Text>
        </SignatureCard>
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          <StatTile label="Distance" value="28.0" unit="km" caption="This week" icon={Footprints} />
          <StatTile label="Active time" value="1h 45m" />
          <StatTile label="Activities" value="2" emphasis />
          <StatTile label="Calories" value="647" unit="kcal" caption="+12% vs last week" captionTone="success" />
        </div>
      </Section>

      <Section title="Lists">
        <ListGroup label="Community">
          <ListItem icon={User} title="Find people" subtitle="Search members and follow them" to="/app/people" />
          <ListItem icon={Footprints} title="Run together" subtitle="Live group runs with friends" onClick={() => undefined} />
          <ListItem icon={Bell} title="Notifications" right={<Toggle checked={on} onChange={setOn} label="Notifications" />} />
          <ListItem leading={<Avatar name="Rahul Verma" ring="#4ADE80" />} title="Rahul Verma" subtitle="4.62 km · 4'36&quot;/km" value="1st" />
          <ListItem icon={Trash2} title="Delete account" destructive onClick={() => undefined} />
        </ListGroup>
      </Section>

      <Section title="Badges, tags, chips, avatars">
        <div className="flex flex-wrap items-center gap-2">
          <Badge label="Neutral" />
          <Badge label="Accent" tone="accent" />
          <Badge label="Done" tone="success" dot />
          <Badge label="Warning" tone="warning" />
          <Badge label="Danger" tone="danger" />
          <Badge label="Info" tone="info" />
          <Tag parts={['Quads', 'Barbell', '4 × 8']} />
        </div>
        <div className="flex flex-wrap gap-2">
          {['7', '30', '45', '90'].map(d => (
            <Chip key={d} label={`${d} days`} selected={chip === d} onClick={() => setChip(d)} />
          ))}
        </div>
        <div className="flex items-center gap-4">
          <Avatar name="Ashwin Kumar" size={56} />
          <Avatar name="Priya Shah" ring="#60A5FA" />
          <Avatar name="Neha Iyer" ring="#A78BFA" size={32} status="online" />
        </div>
      </Section>

      <Section title="Controls">
        <SegmentedControl
          aria-label="Home mode"
          value={seg}
          onChange={setSeg}
          options={[
            { value: 'gym', label: 'Gym', icon: Dumbbell },
            { value: 'sports', label: 'Sports', icon: Footprints },
          ]}
          className="max-w-sm"
        />
        <div className="flex flex-wrap items-center gap-6">
          <Toggle checked={on} onChange={setOn} label="Hide start & end" />
          <Checkbox checked={check} onChange={setCheck} label="I agree to the Terms of Service and Privacy Policy." />
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <TextField label="Mobile number" prefix="+91" placeholder="10-digit mobile number" />
          <TextField label="Email address" optional placeholder="john@example.com" helper="We’ll only use it for receipts." />
          <TextField label="Business name" error="Business name is required." />
          <TextArea label="Notes" optional placeholder="How did it go?" />
          <DateField label="Start date" value={date} onChange={setDate} />
          <TimeField label="Reminder" value={time} onChange={setTime} />
        </div>
        <div className="max-w-sm">
          <OtpInput value={otp} onChange={setOtp} />
        </div>
        <div className="flex flex-col gap-3 md:max-w-lg">
          <SelectableCard icon={User} title="Member" description="Find gyms, book trainers, and track your fitness journey." selected={role === 'user'} onSelect={() => setRole('user')} />
          <SelectableCard icon={Dumbbell} title="Trainer" description="Manage clients and schedules." badge="Coming soon" disabled onSelect={() => undefined} />
        </div>
      </Section>

      <Section title="Progress & data">
        <ProgressSteps total={3} current={2} className="max-w-sm" />
        <div className="flex flex-wrap items-center gap-6">
          <ProgressRing value={5 / 30}>
            <span className="t-title text-ink">5</span>
            <span className="t-label-sm text-ink-subtle">of 30</span>
          </ProgressRing>
          <ProgressRing value={0.63} size={96} stroke={9} color="var(--gm-success)" label="63% on track">
            <span className="t-title text-ink">63%</span>
          </ProgressRing>
          <Meter value={8} label="Diet quality score" className="min-w-[260px] flex-1" />
        </div>
        <Card>
          <SectionHeader label="Weekly distance" meta="Last 8 weeks" />
          <BarChart
            className="mt-4"
            bars={[3, 5, 8, 2, 12, 6, 9, 14].map((v, i) => ({ label: i === 7 ? 'Now' : `W${i + 1}`, value: v, highlight: i === 7 }))}
            formatValue={v => `${v} km`}
          />
        </Card>
        <Card className="flex flex-col gap-3">
          <Skeleton className="h-36 w-full" rounded="xl" />
          <SkeletonText lines={3} />
        </Card>
      </Section>

      <Section title="States">
        <div className="grid gap-3 md:grid-cols-2">
          <Card>
            <EmptyState icon={Trophy} title="No plans yet" message="Create a 7, 30, 45 or 90-day plan with Migo." actionLabel="New plan" compact />
          </Card>
          <Card>
            <ErrorState onRetry={() => undefined} />
          </Card>
        </div>
      </Section>

      <Section title="Overlays & headers">
        <div className="flex flex-wrap gap-3">
          <Button label="Open sheet" variant="secondary" onClick={() => setSheet(true)} />
          <Button
            label="Confirm dialog"
            variant="secondary"
            onClick={async () => {
              const ok = await confirmDialog({ title: 'Remove plan from calendar?', message: 'Future days are removed; logged days stay.', confirmLabel: 'Remove', tone: 'danger' });
              toast({ tone: ok ? 'success' : 'info', title: ok ? 'Removed' : 'Kept' });
            }}
          />
          <Button label="Toast" variant="secondary" onClick={() => toast({ tone: 'success', title: 'Profile completed!' })} />
        </div>
        <Card>
          <AppBar caption="STEP 01 / 03" onBack={() => undefined} right={<IconButton icon={MapPin} label="Map" size={40} />} />
          <Divider className="my-3" />
          <PageHeader eyebrow="Running" title="Run together" subtitle="Live group runs on one shared map." actions={<Button label="Create a room" size="md" icon={Plus} />} />
        </Card>
      </Section>

      <Sheet
        open={sheet}
        onClose={() => setSheet(false)}
        eyebrow="Today’s prescribed session"
        title="Log day 5"
        footer={<Button label="Save log" fullWidth onClick={() => setSheet(false)} />}>
        <div className="flex flex-col gap-4">
          <Text tone="muted">The sheet is a bottom sheet on phones and a dialog on desktop. Focus stays inside; Esc closes it.</Text>
          <TextField label="How did it go?" optional placeholder="Felt strong…" />
          <TextArea label="Notes" optional />
          <div className="flex items-center gap-2 text-accent-text">
            <Sparkles size={16} aria-hidden />
            <Text variant="callout" tone="accent">
              Scrolls internally when long.
            </Text>
          </div>
        </div>
      </Sheet>
    </div>
  );
}

/** Dev-only gallery of every kit component, light and dark side by side on wide screens. */
export default function KitGallery() {
  return (
    <div className="flex flex-col gap-8">
      <PageHeader eyebrow="Design system" title="Obsidian Kinetic kit" subtitle="Every component in src/components/kit, in both themes." />
      <div className="grid gap-8 2xl:grid-cols-2">
        <div data-theme="light" className="rounded-gm-xxl border border-border bg-background p-5 text-ink">
          <Gallery />
        </div>
        <div data-theme="dark" className="rounded-gm-xxl border border-border bg-background p-5 text-ink">
          <Gallery />
        </div>
      </div>
    </div>
  );
}
