import { Text } from '../../components/kit';
import { ActionButton } from '../ActionSheet';
import { DataTable, type Column } from '../ui';

type Row = Record<string, unknown>;
const show = (v: unknown) => (v == null || v === '' ? '—' : Array.isArray(v) ? (v.length ? v.join(', ') : '—') : typeof v === 'object' ? JSON.stringify(v) : String(v));

/** A list of a gym's items (plans, add-ons, equipment…) with add / edit / delete, run as the gym's owner. */
export function ItemsSection({ gymId, title, rows, columns, add, update, remove, nameOf }: {
  gymId: string;
  title: string;
  rows: Row[];
  columns: Column<Row>[];
  add?: string;
  update?: string;
  remove?: string;
  nameOf?: (r: Row) => string;
}) {
  return (
    <section>
      <div className="mb-2 flex items-center justify-between">
        <Text variant="label" tone="subtle">{title} ({rows.length})</Text>
        {add ? <ActionButton entity="gym" entityId={gymId} op={add} label="+ Add" mode="create" /> : null}
      </div>
      <DataTable rows={rows} rowKey={r => String(r.id)} empty={`No ${title.toLowerCase()}.`} columns={[
        ...columns,
        ...(update || remove ? [{
          key: 'x', label: '', render: (r: Row) => (
            <div className="flex justify-end gap-1">
              {update ? <ActionButton entity="gym" entityId={gymId} op={update} itemId={String(r.id)} initial={r} label="Edit" /> : null}
              {remove ? <ActionButton entity="gym" entityId={gymId} op={remove} itemId={String(r.id)} label="Remove" variant="danger" title={`Remove ${nameOf ? nameOf(r) : show(r.name)}?`} /> : null}
            </div>
          ),
        }] : []),
      ]} />
    </section>
  );
}

export function FacilitiesPanel({ gymId, amenities, facilities, equipment }: { gymId: string; amenities: Row[]; facilities: Row[]; equipment: Row[] }) {
  return (
    <div className="flex flex-col gap-6">
      <ItemsSection gymId={gymId} title="Equipment" rows={equipment} add="equipment.add" update="equipment.update" remove="equipment.delete"
        columns={[{ key: 'n', label: 'Name', render: r => show(r.name) }, { key: 'q', label: 'Qty', render: r => show(r.quantity) }, { key: 'c', label: 'Category', render: r => show(r.category ?? r.brand) }]} />
      <ItemsSection gymId={gymId} title="Facilities" rows={facilities} add="facility.add" update="facility.update" remove="facility.delete"
        columns={[{ key: 'n', label: 'Name', render: r => show(r.name ?? r.facility_name) }, { key: 'd', label: 'Details', render: r => show(r.description ?? r.details) }]} />
      <ItemsSection gymId={gymId} title="Amenities" rows={amenities} add="amenity.add" remove="amenity.delete" nameOf={r => show(r.name ?? r.amenity)}
        columns={[{ key: 'n', label: 'Amenity', render: r => show(r.name ?? r.amenity) }]} />
    </div>
  );
}
