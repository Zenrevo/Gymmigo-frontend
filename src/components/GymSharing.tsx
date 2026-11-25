import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Badge, Button, Card, Text, Toggle, useToast } from './kit';
import { ownerSuite } from '../api/ownerSuite';
import { getApiErrorMessage } from '../utils/api';

/** Member: let my gym see workouts, diet, health and runs (check-ins and payments are always visible to it). */
export function GymSharingCard() {
  const qc = useQueryClient();
  const toast = useToast();
  const q = useQuery({ queryKey: ['me', 'gym-sharing'], queryFn: ownerSuite.mySharing });
  const set = async (v: boolean) => {
    qc.setQueryData(['me', 'gym-sharing'], { share_training: v, decided: true });
    try { await ownerSuite.setMySharing(v); } catch (e) { qc.invalidateQueries({ queryKey: ['me', 'gym-sharing'] }); toast({ tone: 'danger', title: 'Could not save', message: getApiErrorMessage(e) }); }
  };
  return (
    <Card padding="lg" className="flex items-start justify-between gap-4">
      <div>
        <Text variant="bodyStrong">Share training with my gym</Text>
        <Text variant="caption" tone="subtle">Workouts, diet, health and runs, so your gym and trainer can coach you. Check-ins and payments are always visible to your gym.</Text>
      </div>
      <Toggle checked={!!q.data?.share_training} onChange={set} label="Share training data with my gym" disabled={!q.data} />
    </Card>
  );
}

/** Trainer: gyms that invited me (accept / decline) and gyms I work at. */
export function TrainerGymInvitations() {
  const qc = useQueryClient();
  const toast = useToast();
  const q = useQuery({ queryKey: ['trainer', 'gym-invitations'], queryFn: ownerSuite.myGymInvitations });
  const respond = async (id: string, accept: boolean) => {
    try {
      await ownerSuite.respondInvitation(id, accept);
      toast({ tone: 'success', title: accept ? 'You joined the gym' : 'Invitation declined' });
      qc.invalidateQueries({ queryKey: ['trainer', 'gym-invitations'] });
    } catch (e) {
      toast({ tone: 'danger', title: 'Could not respond', message: getApiErrorMessage(e) });
    }
  };
  if (!q.data?.length) return null;
  return (
    <Card padding="lg" className="space-y-3">
      {q.data.map(r => (
        <div key={r.affiliation_id} className="space-y-2">
          <div className="flex items-center justify-between gap-2">
            <Text variant="bodyStrong">{r.gym_name}</Text>
            <Badge tone={r.status === 'pending' ? 'warning' : 'success'} label={r.status === 'pending' ? 'Invitation' : 'You train here'} />
          </div>
          <Text variant="caption" tone="subtle">{[r.commission_pct != null ? `${r.commission_pct}% of PT you sell` : null, r.monthly_fee ? `₹${r.monthly_fee}/month` : null, r.message].filter(Boolean).join(' · ') || 'PT allocated by the gym shows in your clients.'}</Text>
          {r.status === 'pending' ? <div className="flex gap-2"><Button size="sm" onClick={() => respond(r.affiliation_id, true)}>Accept</Button><Button size="sm" variant="ghost" onClick={() => respond(r.affiliation_id, false)}>Decline</Button></div> : null}
        </div>
      ))}
    </Card>
  );
}
