import { useEffect, useState, type ReactNode } from 'react';
import { MapPin, Plus, Star, Trash2, X } from 'lucide-react';
import { Button, Chip, ListGroup, ListItem, Sheet, Text, TextArea, TextField, confirmDialog, useToast } from '../../components/kit';
import ImageUpload from '../../components/ImageUpload';
import MapPickerModal from '../../components/MapPickerModal';
import { profileApi } from '../../api/profile';
import { getApiErrorMessage } from '../../utils/api';
import type { FitnessProfile } from './fitness';

/* eslint-disable @typescript-eslint/no-explicit-any -- profile payloads are untyped on the backend */

// ─── Migo (AI personalization) options — same keys the backend has always stored ───
const GOAL_OPTIONS = [
  { key: 'weight_loss', label: 'Weight loss' },
  { key: 'muscle_gain', label: 'Muscle gain' },
  { key: 'endurance', label: 'Endurance' },
  { key: 'flexibility', label: 'Flexibility' },
  { key: 'general_fitness', label: 'General fitness' },
];
const ACTIVITY_LEVEL_OPTIONS = [
  { key: 'sedentary', label: 'Sedentary' },
  { key: 'lightly_active', label: 'Lightly active' },
  { key: 'moderately_active', label: 'Moderately active' },
  { key: 'very_active', label: 'Very active' },
  { key: 'extra_active', label: 'Extra active' },
];
const EXPERIENCE_OPTIONS = [
  { key: 'beginner', label: 'Beginner' },
  { key: 'intermediate', label: 'Intermediate' },
  { key: 'advanced', label: 'Advanced' },
];
const DIET_OPTIONS = [
  { key: 'veg', label: 'Veg' },
  { key: 'non_veg', label: 'Non-veg' },
  { key: 'eggetarian', label: 'Eggetarian' },
  { key: 'vegan', label: 'Vegan' },
];
const ALLERGY_PRESETS = ['Gluten', 'Dairy', 'Nuts', 'Soy', 'Shellfish', 'Eggs'];
const INJURY_PRESETS = ['Lower Back', 'Knee', 'Shoulder', 'Wrist', 'Ankle', 'Neck', 'Hip'];
const CONDITION_PRESETS = ['Diabetes', 'Hypertension', 'Thyroid', 'PCOS', 'Asthma', 'Heart Condition'];
const DURATION_OPTIONS = [30, 45, 60, 90];
const DAYS_OPTIONS = [3, 4, 5, 6];

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="space-y-2">
      <Text variant="label" tone="subtle">
        {label}
      </Text>
      {children}
    </div>
  );
}

function ChipRow<T extends string | number>({ options, value, onSelect }: { options: { key: T; label: string }[]; value: T | null; onSelect: (v: T) => void }) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map(o => (
        <Chip key={String(o.key)} label={o.label} selected={value === o.key} onClick={() => onSelect(o.key)} />
      ))}
    </div>
  );
}

function MultiChips({ presets, selected, onChange, placeholder }: { presets: string[]; selected: string[]; onChange: (v: string[]) => void; placeholder: string }) {
  const [custom, setCustom] = useState('');
  const toggle = (item: string) => onChange(selected.includes(item) ? selected.filter(s => s !== item) : [...selected, item]);
  const add = () => {
    const t = custom.trim();
    if (t && !selected.includes(t)) onChange([...selected, t]);
    setCustom('');
  };
  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        {[...presets, ...selected.filter(s => !presets.includes(s))].map(p => (
          <Chip key={p} label={p} selected={selected.includes(p)} onClick={() => toggle(p)} icon={selected.includes(p) ? <X size={12} aria-hidden /> : null} />
        ))}
      </div>
      <div className="flex gap-2">
        <TextField
          className="flex-1"
          value={custom}
          onChange={e => setCustom(e.target.value)}
          onKeyDown={e => {
            if (e.key === 'Enter') {
              e.preventDefault();
              add();
            }
          }}
          placeholder={placeholder}
          aria-label={placeholder}
        />
        <Button variant="secondary" icon={Plus} onClick={add} aria-label="Add" />
      </div>
    </div>
  );
}

/** "Update Fitness Goals & Diet Prefs" — the Migo setup form (POST /profile/fitness). */
export function MigoSetupSheet({ open, onClose, initial, onSaved }: { open: boolean; onClose: () => void; initial: FitnessProfile; onSaved: () => void }) {
  const toast = useToast();
  const [f, setF] = useState<FitnessProfile>(initial);
  const [saving, setSaving] = useState(false);
  useEffect(() => {
    if (open) setF(initial);
  }, [open, initial]);
  const set = <K extends keyof FitnessProfile>(k: K, v: FitnessProfile[K]) => setF(prev => ({ ...prev, [k]: v }));
  const num = (v: string) => (v ? parseInt(v, 10) : null);

  const save = async () => {
    setSaving(true);
    try {
      const payload: Record<string, unknown> = {};
      (Object.keys(f) as (keyof FitnessProfile)[]).forEach(k => {
        if (f[k] !== null && f[k] !== undefined) payload[k] = f[k];
      });
      await profileApi.saveFitness(payload);
      toast({ tone: 'success', title: 'AI preferences saved!' });
      onSaved();
      onClose();
    } catch (err) {
      toast({ tone: 'error', title: getApiErrorMessage(err) });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Sheet
      open={open}
      onClose={onClose}
      eyebrow="Migo AI co-pilot"
      title="Fitness goals & diet"
      size="lg"
      footer={<Button label="Save preferences" loading={saving} onClick={save} fullWidth />}>
      <div className="space-y-6">
        <Field label="Primary goal">
          <ChipRow options={GOAL_OPTIONS} value={f.primary_goal} onSelect={v => set('primary_goal', v)} />
        </Field>
        <Field label="Activity level">
          <ChipRow options={ACTIVITY_LEVEL_OPTIONS} value={f.activity_level} onSelect={v => set('activity_level', v)} />
        </Field>
        <Field label="Experience">
          <ChipRow options={EXPERIENCE_OPTIONS} value={f.experience_level} onSelect={v => set('experience_level', v)} />
        </Field>
        <Field label="Diet">
          <ChipRow options={DIET_OPTIONS} value={f.dietary_preference} onSelect={v => set('dietary_preference', v)} />
        </Field>
        <div className="grid grid-cols-3 gap-3">
          <TextField label="Height (cm)" type="number" placeholder="170" value={f.height ?? ''} onChange={e => set('height', num(e.target.value))} />
          <TextField label="Weight (kg)" type="number" placeholder="70" value={f.current_weight ?? ''} onChange={e => set('current_weight', num(e.target.value))} />
          <TextField label="Target (kg)" type="number" placeholder="65" value={f.target_weight ?? ''} onChange={e => set('target_weight', num(e.target.value))} />
        </div>
        <Field label="Food allergies & restrictions">
          <MultiChips presets={ALLERGY_PRESETS} selected={f.food_allergies || []} onChange={v => set('food_allergies', v)} placeholder="e.g. Lactose, Peanuts…" />
        </Field>
        <Field label="Injuries / physical limitations">
          <MultiChips presets={INJURY_PRESETS} selected={f.injuries || []} onChange={v => set('injuries', v)} placeholder="e.g. ACL tear, Sciatica…" />
        </Field>
        <Field label="Medical conditions">
          <MultiChips presets={CONDITION_PRESETS} selected={f.medical_conditions || []} onChange={v => set('medical_conditions', v)} placeholder="e.g. Arthritis…" />
        </Field>
        <Field label="Workout duration">
          <ChipRow options={DURATION_OPTIONS.map(d => ({ key: d, label: `${d} min` }))} value={f.preferred_workout_duration} onSelect={v => set('preferred_workout_duration', v)} />
        </Field>
        <Field label="Workout days / week">
          <ChipRow options={DAYS_OPTIONS.map(d => ({ key: d, label: `${d} days` }))} value={f.workout_days_per_week} onSelect={v => set('workout_days_per_week', v)} />
        </Field>
        <TextArea
          label="Anything else Migo should know"
          rows={3}
          placeholder="Tell Migo anything else that will help tailor your journey…"
          value={f.notes_for_agent || ''}
          onChange={e => set('notes_for_agent', e.target.value)}
        />
      </div>
    </Sheet>
  );
}

/** Edit profile: avatar, name, email, birthday, gender, city and bio (PATCH /profile/me). */
export function EditProfileSheet({ open, onClose, profile, onSaved }: { open: boolean; onClose: () => void; profile: any; onSaved: () => Promise<void> | void }) {
  const toast = useToast();
  const [p, setP] = useState<any>(profile || {});
  const [saving, setSaving] = useState(false);
  const [mapOpen, setMapOpen] = useState(false);
  useEffect(() => {
    if (open) setP(profile || {});
  }, [open, profile]);

  const save = async () => {
    setSaving(true);
    try {
      await profileApi.update({ ...p, date_of_birth: p.date_of_birth || null, gender: p.gender || null });
      toast({ tone: 'success', title: 'Profile updated successfully' });
      await onSaved();
      onClose();
    } catch (err) {
      toast({ tone: 'error', title: getApiErrorMessage(err) || 'Failed to update profile' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <Sheet open={open && !mapOpen} onClose={onClose} eyebrow="Profile" title="Edit profile" footer={<Button label="Save changes" loading={saving} onClick={save} fullWidth />}>
        <div className="space-y-4">
          <div className="mx-auto w-32">
            <ImageUpload label="Photo" aspectRatio="square" initialUrl={p.avatar_url} onUploadComplete={url => setP({ ...p, avatar_url: url })} />
          </div>
          <TextField label="Full name" value={p.full_name || ''} placeholder="Your name" onChange={e => setP({ ...p, full_name: e.target.value })} />
          <TextField label="Email" type="email" value={p.email || ''} placeholder="you@example.com" onChange={e => setP({ ...p, email: e.target.value })} />
          <div className="grid grid-cols-2 gap-3">
            <TextField label="Date of birth" type="date" value={p.date_of_birth || ''} onChange={e => setP({ ...p, date_of_birth: e.target.value })} />
            <label className="flex flex-col gap-1.5">
              <span className="t-label text-ink-subtle">Gender</span>
              <select
                value={p.gender || ''}
                onChange={e => setP({ ...p, gender: e.target.value })}
                className="t-body h-12 rounded-gm-lg border border-border-strong bg-surface px-3 text-ink outline-none focus:border-accent">
                <option value="">Select</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other</option>
              </select>
            </label>
          </div>
          <div className="flex items-end gap-2">
            <TextField className="flex-1" label="City" value={p.city || ''} placeholder="Your city" onChange={e => setP({ ...p, city: e.target.value })} />
            <Button variant="secondary" icon={MapPin} label="Map" onClick={() => setMapOpen(true)} />
          </div>
          <TextArea label="Bio" rows={3} value={p.bio || ''} placeholder="Tell people about yourself…" onChange={e => setP({ ...p, bio: e.target.value })} />
        </div>
      </Sheet>
      <MapPickerModal
        isOpen={mapOpen}
        onClose={() => setMapOpen(false)}
        onConfirm={loc => {
          setP((prev: any) => ({ ...prev, city: loc.city }));
          setMapOpen(false);
        }}
      />
    </>
  );
}

/** Home location & saved addresses (GET/POST/DELETE /profile/me/addresses). */
export function AddressesSheet({ open, onClose, addresses, onChanged }: { open: boolean; onClose: () => void; addresses: any[]; onChanged: () => void }) {
  const toast = useToast();
  const [mapOpen, setMapOpen] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);

  const add = async (loc: { address_line1: string; city: string; state: string; pincode: string; latitude: number; longitude: number }) => {
    setBusy('add');
    try {
      await profileApi.addAddress({
        label: addresses.length ? 'Saved location' : 'Home',
        address_line1: loc.address_line1,
        city: loc.city,
        state: loc.state,
        pincode: loc.pincode,
        latitude: loc.latitude,
        longitude: loc.longitude,
        is_primary: addresses.length === 0,
        country: 'India',
      });
      toast({ tone: 'success', title: 'Address added' });
      onChanged();
    } catch (err) {
      toast({ tone: 'error', title: getApiErrorMessage(err) });
    } finally {
      setBusy(null);
      setMapOpen(false);
    }
  };

  const remove = async (id: string) => {
    const ok = await confirmDialog({ title: 'Delete this saved address?', confirmLabel: 'Delete', tone: 'danger' });
    if (!ok) return;
    setBusy(id);
    try {
      await profileApi.deleteAddress(id);
      toast({ tone: 'success', title: 'Address deleted' });
      onChanged();
    } catch (err) {
      toast({ tone: 'error', title: getApiErrorMessage(err) });
    } finally {
      setBusy(null);
    }
  };

  return (
    <>
      <Sheet
        open={open && !mapOpen}
        onClose={onClose}
        eyebrow="Membership & wallet"
        title="Home location"
        footer={<Button label="Add a location on the map" icon={Plus} loading={busy === 'add'} onClick={() => setMapOpen(true)} fullWidth />}>
        {addresses.length ? (
          <ListGroup>
            {addresses.map(a => (
              <ListItem
                key={a.id}
                icon={a.is_primary ? Star : MapPin}
                title={`${a.label || 'Address'}${a.is_primary ? ' · Primary' : ''}`}
                subtitle={[a.address_line1, a.city, a.state, a.pincode].filter(Boolean).join(', ')}
                right={
                  <button
                    type="button"
                    aria-label={`Delete ${a.label || 'address'}`}
                    disabled={busy === a.id}
                    onClick={() => remove(a.id)}
                    className="flex h-9 w-9 items-center justify-center rounded-full text-danger hover:bg-danger-soft disabled:opacity-40">
                    <Trash2 size={16} />
                  </button>
                }
              />
            ))}
          </ListGroup>
        ) : (
          <Text tone="muted">No saved locations yet. Add your home so Explore can show gyms near you.</Text>
        )}
      </Sheet>
      <MapPickerModal isOpen={mapOpen} onClose={() => setMapOpen(false)} onConfirm={add} />
    </>
  );
}
