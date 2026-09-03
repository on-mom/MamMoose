import { useState } from 'react';
import { MapPin, Clock, Phone, Globe, RefreshCw, Loader2, ChevronDown } from 'lucide-react';
import type { PoiInfo } from '../types';
import { parseMapsUrl, lookupPlace } from '../lib/placeLookup';

/** 구글 지도 정보를 한 번 불러오는 훅. Places API 미허용/실패 시 error 세팅. */
export function useLookupPoi() {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const run = async (opts: { mapUrl?: string; name?: string; lat?: number | null; lng?: number | null }): Promise<PoiInfo | null> => {
    setBusy(true);
    setError('');
    try {
      const p = opts.mapUrl ? parseMapsUrl(opts.mapUrl) : {};
      const info = await lookupPlace({
        query: p.query || opts.name || undefined,
        placeId: p.placeId,
        lat: p.lat ?? opts.lat ?? undefined,
        lng: p.lng ?? opts.lng ?? undefined,
      });
      if (!info) setError('정보를 불러오지 못했어요 (구글맵 키에 Places API 허용 필요)');
      return info;
    } catch (e) {
      setError((e as Error).message || '조회 실패');
      return null;
    } finally {
      setBusy(false);
    }
  };
  return { run, busy, error };
}

/** 불러온 장소 정보 표시 (주소·영업시간·전화·웹). */
export default function PoiPanel({ poi, onRefresh }: { poi?: PoiInfo; onRefresh?: () => void; refreshing?: boolean }) {
  const [openHours, setOpenHours] = useState(false);
  if (!poi) return null;

  const todayIdx = (new Date().getDay() + 6) % 7; // weekday_text 는 월요일 시작

  return (
    <div className="space-y-2 rounded-xl bg-white/[0.04] p-3 text-[12px]">
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-semibold text-moose-heart">🗺️ 구글 지도 정보</span>
        {onRefresh && (
          <button onClick={onRefresh} className="text-slate-500"><RefreshCw size={12} /></button>
        )}
      </div>

      {poi.rating != null && (
        <div className="text-slate-300">★ {poi.rating.toFixed(1)}{poi.ratingCount ? ` · 리뷰 ${poi.ratingCount.toLocaleString()}` : ''}</div>
      )}
      {poi.address && (
        <div className="flex gap-1.5 text-slate-200"><MapPin size={13} className="mt-0.5 shrink-0 text-slate-500" />{poi.address}</div>
      )}
      {poi.hours?.length && (
        <div>
          <button onClick={() => setOpenHours((v) => !v)} className="flex w-full items-center gap-1.5 text-slate-200">
            <Clock size={13} className="shrink-0 text-slate-500" />
            <span className={poi.openNow == null ? '' : poi.openNow ? 'text-emerald-400' : 'text-rose-400'}>
              {poi.openNow == null ? '영업시간' : poi.openNow ? '영업 중' : '영업 종료'}
            </span>
            <span className="text-slate-400">· {poi.hours[todayIdx]?.split(': ')[1] ?? '-'}</span>
            <ChevronDown size={12} className={`ml-auto text-slate-500 transition ${openHours ? 'rotate-180' : ''}`} />
          </button>
          {openHours && (
            <div className="mt-1 space-y-0.5 pl-[18px] text-[11px] text-slate-400">
              {poi.hours.map((h, i) => (
                <div key={i} className={i === todayIdx ? 'text-slate-200' : ''}>{h}</div>
              ))}
            </div>
          )}
        </div>
      )}
      {poi.phone && (
        <a href={`tel:${poi.phone}`} className="flex gap-1.5 text-slate-200"><Phone size={13} className="mt-0.5 shrink-0 text-slate-500" />{poi.phone}</a>
      )}
      {poi.website && (
        <a href={poi.website} target="_blank" rel="noreferrer" className="flex gap-1.5 truncate text-moose-heart">
          <Globe size={13} className="mt-0.5 shrink-0" /><span className="truncate">{poi.website.replace(/^https?:\/\//, '')}</span>
        </a>
      )}
      <div className="text-[9px] text-slate-600">
        {new Date(poi.fetchedAt).toLocaleDateString('ko-KR')} 기준 · 방문 전 최신 정보 확인 권장
      </div>
    </div>
  );
}

/** 로딩/에러 표시가 딸린 "정보 불러오기" 버튼 */
export function PoiFetchButton({ busy, error, onClick, label = '구글 지도에서 정보 불러오기' }: {
  busy: boolean; error: string; onClick: () => void; label?: string;
}) {
  return (
    <div>
      <button
        onClick={onClick}
        disabled={busy}
        className="flex w-full items-center justify-center gap-1.5 rounded-lg border border-white/10 py-2 text-[12px] text-slate-300 disabled:opacity-50"
      >
        {busy ? <Loader2 size={13} className="animate-spin" /> : <MapPin size={13} className="text-moose-heart" />}
        {busy ? '불러오는 중…' : label}
      </button>
      {error && <p className="mt-1 text-[10px] text-rose-400">{error}</p>}
    </div>
  );
}
