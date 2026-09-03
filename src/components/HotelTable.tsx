import type { Hotel } from '../types';
import { hotelArea } from '../lib/places';
import DataTable, { type Column } from './DataTable';

const won = (t: string) =>
  Number((t.match(/[\d,]+/)?.[0] ?? '0').replace(/,/g, '')) * (/만/.test(t) ? 10000 : 1);

/** 숙소 비교표 — 등급·평점·2박 총액 정렬. 행 클릭 시 상세(부모가 처리). */
export default function HotelTable({
  hotels, selectedId, onRowClick,
}: {
  hotels: Hotel[];
  selectedId?: string | null;
  onRowClick: (id: string) => void;
}) {
  if (!hotels.length) {
    return <p className="py-10 text-center text-xs text-slate-600">등록된 숙소 후보가 없어요</p>;
  }

  const cols: Column<Hotel>[] = [
    { key: 'name', label: '숙소명', width: 150, sortable: true, filter: 'text', get: (h) => h.name,
      render: (h) => <span className="truncate font-medium text-white">{h.name}</span> },
    { key: 'grade', label: '등급', width: 58, sortable: true, filter: 'multi', get: (h) => h.grade },
    { key: 'area', label: '구역', width: 74, sortable: true, filter: 'multi', get: (h) => hotelArea(h) || '-' },
    { key: 'rating', label: '평점', width: 62, sortable: true, filter: 'range', get: (h) => h.rating,
      render: (h) => <span className="text-slate-300">★ {h.rating}</span> },
    { key: 'priceTotalText', label: '2박 총액', width: 96, sortable: true, filter: 'range', get: (h) => won(h.priceTotalText),
      render: (h) => <span className="text-slate-300">{h.priceTotalText}</span> },
    { key: 'nearby', label: '인근', width: 150, sortable: false, filter: 'text', get: (h) => h.nearby,
      render: (h) => <span className="text-slate-400">{h.nearby}</span> },
  ];

  return (
    <div>
      <p className="px-0.5 pb-1.5 text-[11px] text-slate-500">2박 기준 · 열 제목을 눌러 정렬 · 행을 누르면 상세</p>
      <DataTable
        rows={hotels}
        columns={cols}
        rowKey={(h) => h.id}
        selectedKey={selectedId ?? null}
        onRowClick={(h) => onRowClick(h.id)}
      />
    </div>
  );
}
