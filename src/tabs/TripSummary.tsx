import { useMemo, useRef, useState } from 'react';
import { Download, Loader2 } from 'lucide-react';
import { useAppStore, useActiveProject } from '../store/useAppStore';
import { toKrw, commas, cachedRate, FALLBACK_VND_KRW } from '../lib/currency';
import { useMemoryPicks } from '../lib/memories';
import CoupleMoose from '../components/CoupleMoose';

const tripDays = (s: string, e: string) =>
  Math.max(1, Math.round((Date.parse(e) - Date.parse(s)) / 86400000) + 1);

/** 여행 요약 카드 — 추억함에서 생성, 이미지로 저장. */
export default function TripSummary() {
  const project = useActiveProject()!;
  const doc = useAppStore((s) => s.present[s.activeProjectId]);
  const settings = useAppStore((s) => s.settings);
  const picks = useMemoryPicks();
  const cardRef = useRef<HTMLDivElement>(null);
  const [saving, setSaving] = useState(false);

  const rate = settings.rateMode === 'live' ? cachedRate() : Number(settings.fixedVndToKrw) || FALLBACK_VND_KRW;

  const stats = useMemo(() => {
    const t = doc?.timeline ?? [];
    const visited = t.filter((i) => i.place && i.place !== '새 일정' && !/출국|귀국/.test(i.place)).length;
    const spentKrw = (doc?.expenses ?? []).reduce((s, e) => s + Number(toKrw(e.amountVnd || '0', rate)), 0);
    const photos = t.reduce((n, i) => n + (i.photos?.length ?? 0), 0)
      + (doc?.diary ?? []).reduce((n, d) => n + (d.photos?.length ?? 0), 0);
    return {
      days: tripDays(project.startDate, project.endDate),
      visited,
      spentKrw: Math.round(spentKrw),
      liked: picks.length,
      diary: (doc?.diary ?? []).length,
      photos,
    };
  }, [doc, project, rate, picks.length]);

  const save = async () => {
    if (!cardRef.current) return;
    setSaving(true);
    try {
      const html2canvas = (await import('html2canvas')).default;
      const canvas = await html2canvas(cardRef.current, { backgroundColor: '#131019', scale: 2, logging: false });
      canvas.toBlob((blob) => {
        if (!blob) return;
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = `${project.name} 요약.png`;
        a.click();
        setTimeout(() => URL.revokeObjectURL(a.href), 1000);
      }, 'image/png');
    } finally {
      setSaving(false);
    }
  };

  const Stat = ({ n, l }: { n: string | number; l: string }) => (
    <div className="rounded-xl bg-white/[0.06] px-2 py-2.5 text-center">
      <div className="font-title text-lg font-bold text-white">{n}</div>
      <div className="text-[10px] text-slate-400">{l}</div>
    </div>
  );

  return (
    <div className="space-y-2">
      <div
        ref={cardRef}
        className="overflow-hidden rounded-2xl border border-white/10"
        style={{ background: 'radial-gradient(120% 80% at 50% 0%, #2a1f2e, #131019 70%)' }}
      >
        <div className="flex flex-col items-center gap-1 px-5 pt-5">
          <CoupleMoose className="w-24" />
          <div className="font-title text-lg font-bold text-white">{project.name}</div>
          <div className="text-[11px] text-slate-400">
            {project.destination} · {project.startDate} ~ {project.endDate}
          </div>
        </div>
        <div className="grid grid-cols-3 gap-1.5 p-4">
          <Stat n={`${stats.days}일`} l="여행 기간" />
          <Stat n={`${stats.visited}곳`} l="다녀온 곳" />
          <Stat n={stats.spentKrw > 0 ? `${commas(stats.spentKrw)}` : '-'} l="총 지출(원)" />
          <Stat n={`${stats.liked}곳`} l="둘 다 좋아한 곳" />
          <Stat n={`${stats.diary}개`} l="한 줄 일기" />
          <Stat n={`${stats.photos}장`} l="추억 사진" />
        </div>
        {picks.length > 0 && (
          <div className="px-4 pb-4">
            <div className="mb-1 text-[10px] font-semibold text-moose-heart">💗 우리가 함께 좋아한 곳</div>
            <div className="text-[12px] leading-relaxed text-slate-200">
              {picks.slice(0, 5).map((p) => p.place).join(' · ')}
              {picks.length > 5 && ` 외 ${picks.length - 5}곳`}
            </div>
          </div>
        )}
        <div className="border-t border-white/5 py-2 text-center text-[9px] text-slate-600">🫎 맘무스 — 큰맘 먹고 떠난 커플 여행</div>
      </div>

      <button
        onClick={save}
        disabled={saving}
        className="btn-heart flex w-full items-center justify-center gap-1.5 rounded-xl py-2.5 text-sm font-semibold disabled:opacity-50"
      >
        {saving ? <Loader2 size={15} className="animate-spin" /> : <Download size={15} />}
        이미지로 저장
      </button>
    </div>
  );
}
