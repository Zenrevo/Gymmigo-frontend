import { useState } from 'react';
import { Button } from '../components/kit';
import { adminError, adminGet } from './api';
import { RecordEditor } from './RecordEditor';
import { useAdmin } from './useAdmin';

/**
 * "Edit all fields": loads the latest copy of one row and opens the raw record editor (every editable
 * column, typed, conflict-checked, audited and undoable).
 */
export function EditAll({ table, row, label = 'Edit all fields' }: { table: string; row: Record<string, unknown>; label?: string }) {
  const { can } = useAdmin();
  const [data, setData] = useState<Record<string, unknown> | null>(null);
  const [busy, setBusy] = useState(false);
  const id = row.id ?? row.user_id;
  if (!can('data.edit') || !id) return null;
  const open = async () => {
    setBusy(true);
    try {
      setData((await adminGet<{ data: Record<string, unknown> }>(`/data/tables/${table}/rows/${String(id)}`)).data);
    } catch (e) {
      alert(adminError(e).message);
    } finally {
      setBusy(false);
    }
  };
  return (
    <>
      <Button size="sm" variant="ghost" label={label} loading={busy} onClick={open} />
      {data ? <RecordEditor table={table} id={String(id)} data={data} onClose={() => setData(null)} /> : null}
    </>
  );
}
