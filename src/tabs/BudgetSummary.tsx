import { useMemo, useRef, useState } from 'react';
import { Download, Loader2 } from 'lucide-react';
import { useActiveProject, useAppStore } from '../store/useAppStore';
import { useMemberNames } from '../lib/members';
import { settle } from '../lib/settle';
import { saveNodeAsPng } from '../lib/saveImage';
import { toKrw, commas, cachedRate, fallbackRate } from '../lib/currency';
import { currencyOf } from '../lib/cities';

const tripDays = (s: string, e: string) =>
  Math.max(1, Math.round((Date.parse(e) - Date.parse(s)) / 86400000) + 1);

const CAT_EMOJI: Record<string, string> = {
  숙소: '🏨', 식사: '🍽️', 쇼핑: '🛍️', 항공: '✈️', 체험: '🎟️', 기타: '📌',
};

/** 가계부 요약 카드 — 여행 후 지출 회고·정산 기록용. 이미지로 저장. */
export default function BudgetSummary() {
  const project = useActiveProject()!;
  const doc = useAppStore((s) => s.present[s.activeProjectId]);
  const settings = useAppStore((s) => s.settings);
  const members = useMemberNames();
  const cardRef = useRef<HTMLDivElement>(null);
  const [saving, setSaving] = useState(false);

  const local = currencyOf(project.timezone, project.destination);
  const useFixed = settings.rateMode === 'fixed' && local === 'VND';
  const rate = local === 'KRW' ? 1
    : useFixed ? (Number(settings.fixedVndToKrw) || fallbackRate('VND'))
    : (cachedRate(local) || fallbackRate(local));

  const data = useMemo(() => {
    const exp = doc?.expenses ?? [];
    const krwOf = (v: string) => Number(toKrw(v || '0', rate));
    const total = exp.reduce((s, e) => s + krwOf(e.amountVnd), 0);
    const byCat: Record<string, number> = {};
    for (const e of exp) {
      const key = e.category === '기타' && e.categoryEtc ? e.categoryEtc : e.category;
      byCat[key] = (byCat[key] ?? 0) + krwOf(e.amountVnd);
    }
    const cats = Object.entries(byCat).sort((a, b) => b[1] - a[1]);
    const top = [...exp].sort((a, b) => krwOf(b.amountVnd) - krwOf(a.amountVnd))[0];
    const days = tripDays(project.startDate, project.endDate);
    const payments = exp.filter((e) => e.paidBy).map((e) => ({ by: e.paidBy!, krw: krwOf(e.amountVnd) }));
    const s = members.length >= 2 ? settle(payments, members) : null;
    return {
      total: Math.round(total), cats, top, topKrw: top ? Math.round(krwOf(top.amountVnd)) : 0,
      perDay: Math.round(total / days), count: exp.length, s,
    };
  }, [doc, project, rate, members]);

  const save = async () => {
    if (!cardRef.current) return;
    setSaving(true);
    try { await saveNodeAsPng(cardRef.current, `${project.name} 가계부.png`); }
    finally { setSaving(false); }
  };

  if (data.count === 0) {
    return <p className="py-10 text-center text-xs text-slate-500">아직 가계부에 기록된 지출이 없어요</p>;
  }

  const maxCat = data.cats[0]?.[1] || 1;

  return (
    <div className="space-y-2">
      <div
        ref={cardRef}
        className="overflow-hidden rounded-2xl border border-white/10"
        style={{ background: 'radial-gradient(120% 80% at 50% 0%, #1f2a26, #131019 70%)' }}
      >
        <div className="px-5 pt-5 text-center">
          <div className="text-[11px] text-slate-400">{project.name} · 가계부 요약</div>
          <div className="mt-1 font-title text-2xl font-bold text-white">{commas(data.total)}원</div>
          <div className="text-[11px] text-slate-500">
            {data.count}건 · 하루 평균 {commas(data.perDay)}원
          </div>
        </div>

        <div className="space-y-1.5 px-5 py-4">
          {data.cats.map(([cat, amt]) => (
            <div key={cat}>
              <div className="flex justify-between text-[11px]">
                <span className="text-slate-300">{CAT_EMOJI[cat] ?? '•'} {cat}</span>
                <span className="text-slate-400">{commas(Math.round(amt))}원 · {Math.round((amt / data.total) * 100)}%</span>
              </div>
              <div className="mt-0.5 h-1.5 overflow-hidden rounded-full bg-white/10">
                <div className="h-full rounded-full bg-moose-heart" style={{ width: `${(amt / maxCat) * 100}%` }} />
              </div>
            </div>
          ))}
        </div>

        {data.top && (
          <div className="mx-5 mb-3 rounded-xl bg-white/[0.06] px-3 py-2 text-[11px]">
            <span className="text-slate-500">가장 큰 지출 · </span>
            <span className="text-slate-200">{data.top.vendor || data.top.category}</span>
            <span className="float-right font-semibold text-white">{commas(data.topKrw)}원</span>
          </div>
        )}

        {data.s && data.s.transfers.length > 0 && (
          <div className="mx-5 mb-4 rounded-xl border border-moose-heart/30 bg-moose-heart/10 px-3 py-2.5">
            <div className="mb-1 text-[10px] font-semibold text-moose-heart">💸 정산</div>
            {data.s.transfers.map((t, i) => (
              <div key={i} className="text-[12px] text-slate-100">
                {t.from} → {t.to} <b className="float-right">{commas(t.krw)}원</b>
              </div>
            ))}
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
