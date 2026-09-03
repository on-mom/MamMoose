import { useState } from 'react';
import { MapPin, Utensils } from 'lucide-react';
import type { Hotel } from '../types';
import { useAppStore } from '../store/useAppStore';
import { uid } from '../lib/uid';
import { useMyName } from '../lib/members';
import { pushNotify } from '../lib/push';
import { firstSentence } from '../lib/notify';
import { hotelArea } from '../lib/places';
import Modal from '../components/Modal';
import DataTable, { type Column } from '../components/DataTable';
import CommentThread from '../components/CommentThread';
import { accessForArea, fmtVnd } from '../lib/hanoiAccess';
import PlacesView from './PlacesView';

const won = (t: string) => Number((t.match(/[\d,]+/)?.[0] ?? '0').replace(/,/g, '')) * (/만/.test(t) ? 10000 : 1);
const mapQ = (name: string) => `https://maps.google.com/?q=${encodeURIComponent(name + ' Hanoi')}`;

export default function RestaurantsTab() {
  const [view, setView] = useState<'place' | 'stay'>('place');
  return (
    <div className="flex h-full flex-col">
      <div className="edge min-h-0 flex-1 space-y-3 overflow-y-auto py-3">
        <h2 className="font-title text-xl font-bold text-white">{view === 'place' ? '장소' : '숙소 후보'}</h2>
        {view === 'place' ? <PlacesView embedded /> : <StayView />}
      </div>
      {/* 하단 고정 전환 바 (엄지 접근) */}
      <div className="edge shrink-0 border-t border-moose-edge bg-moose-night/95 py-2 backdrop-blur">
        <div className="flex gap-1 rounded-lg bg-moose-dusk p-1 text-xs">
          {([['place', '장소'], ['stay', '숙소']] as const).map(([k, l]) => (
            <button
              key={k}
              onClick={() => setView(k)}
              className={`flex-1 rounded-md py-2 ${view === k ? 'btn-heart' : 'text-slate-400'}`}
            >
              {l}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ================= 숙소 후보 ================= */
function StayView() {
  const hotels = useAppStore((s) => s.present[s.activeProjectId]?.hotels ?? []);
  const mutate = useAppStore((s) => s.mutate);
  const me = useMyName();
  const [detailId, setDetailId] = useState<string | null>(null);
  const detail = detailId ? hotels.find((h) => h.id === detailId) ?? null : null;
  const access = detail ? accessForArea(hotelArea(detail)) : null;

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

  if (!hotels.length) {
    return <p className="py-12 text-center text-xs text-slate-600">이 여행에 숙소 후보 데이터가 없어요</p>;
  }

  return (
    <div>
      <p className="px-0.5 pb-1.5 text-[11px] text-slate-500">9/11~13 · 2박 기준 · 행을 누르면 상세 (조식 후기·특징·지도)</p>
      <DataTable
        rows={hotels}
        columns={cols}
        rowKey={(h) => h.id}
        selectedKey={detail?.id ?? null}
        onRowClick={(h) => setDetailId(h.id)}
      />
      {detail && (
        <Modal
          onClose={() => setDetailId(null)}
          title={
            <>
              <div className="font-title text-lg font-bold leading-tight text-white">{detail.name}</div>
              <div className="mt-0.5 text-[13px] text-slate-400">{detail.grade} · ★ {detail.rating} · {detail.priceTotalText}</div>
            </>
          }
          footer={
            <a
              href={mapQ(detail.name)}
              target="_blank"
              rel="noreferrer"
              className="btn-heart flex items-center justify-center gap-1.5 rounded-xl py-2.5 text-sm font-semibold"
            >
              <MapPin size={15} /> 구글 지도에서 열기
            </a>
          }
        >
          <div className="space-y-3 text-[13px]">
            <div>
              <div className="text-[11px] text-slate-500">주소 {hotelArea(detail) && `· ${hotelArea(detail)}`}</div>
              <div className="text-slate-200">{detail.address}</div>
            </div>

            {access && (
              <div className="rounded-xl bg-white/[0.04] p-3">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-semibold text-moose-heart">🚕 그랩 이동 (예상 · 러시아워 제외)</span>
                </div>
                <div className="mt-1.5 grid grid-cols-1 gap-1 text-[12px] text-slate-200">
                  <div className="flex justify-between"><span>노이바이 공항</span><span className="text-slate-400">{access.airportMin}분 · {fmtVnd(access.airportVnd)}</span></div>
                  <div className="flex justify-between"><span>도심 (호안끼엠)</span><span className="text-slate-400">{access.centerMin}분 · {fmtVnd(access.centerVnd)}</span></div>
                  <div className="flex justify-between"><span>구시가지 (올드쿼터)</span><span className="text-slate-400">{access.oldMin}분 · {fmtVnd(access.oldVnd)}</span></div>
                </div>
                <div className="mt-1.5 text-[10px] text-slate-600">구글 지도 API 키를 넣으면 실시간 소요 시간으로 자동 갱신됩니다</div>
              </div>
            )}

            {detail.nearby && (
              <div>
                <div className="text-[11px] text-slate-500">인근 관광지</div>
                <div className="text-slate-200">{detail.nearby}</div>
              </div>
            )}
            {detail.feature && (
              <div className="rounded-xl bg-white/[0.04] p-3">
                <div className="text-[11px] font-semibold text-moose-heart">핵심 특징</div>
                <div className="text-slate-100">{detail.feature}</div>
              </div>
            )}
            {detail.breakfast && (
              <div className="flex gap-2 rounded-xl bg-moose-heart/10 p-3">
                <Utensils size={15} className="mt-0.5 shrink-0 text-moose-heart" />
                <div>
                  <div className="text-[11px] font-semibold text-moose-heart">조식 후기</div>
                  <div className="text-slate-100">{detail.breakfast}</div>
                </div>
              </div>
            )}

            <CommentThread
              comments={detail.comments}
              onAdd={(t, mentions) => {
                mutate((doc) => {
                  const row = doc.hotels.find((x) => x.id === detail.id);
                  if (row) (row.comments ??= []).push({ id: uid(), author: me, text: t, at: Date.now(), mentions: mentions.length ? mentions : undefined });
                });
                if (mentions.length) pushNotify(mentions, `${me}님이 언급했어요`, `${detail.name} · "${firstSentence(t)}"`);
              }}
              onDelete={(cid) => mutate((doc) => {
                const row = doc.hotels.find((x) => x.id === detail.id);
                if (row?.comments) row.comments = row.comments.filter((c) => c.id !== cid);
              })}
            />
          </div>
        </Modal>
      )}
    </div>
  );
}
