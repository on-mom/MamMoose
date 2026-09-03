import { useMemo, useState } from 'react';
import { Copy, ArrowLeftRight } from 'lucide-react';
import { useAppStore } from '../store/useAppStore';
import { cachedRate, toKrw, commas, FALLBACK_VND_KRW } from '../lib/currency';
import { PHRASE_GROUPS } from '../data/phrases';

type Sub = 'phrase' | 'fx';

/** MY › 도구 — 베트남어 회화 + 환율 계산기 (구역 가이드는 일정 탭으로 이동) */
export default function ToolsView() {
  const [sub, setSub] = useState<Sub>('phrase');
  return (
    <div className="space-y-3 overflow-y-auto pb-2">
      <div className="flex gap-1 rounded-lg bg-moose-edge p-1 text-[11px]">
        {([['phrase', '🇻🇳 회화'], ['fx', '💱 환율']] as const).map(([k, l]) => (
          <button
            key={k}
            onClick={() => setSub(k)}
            className={`flex-1 rounded-md py-1.5 ${sub === k ? 'bg-moose-heart text-white' : 'text-slate-400'}`}
          >
            {l}
          </button>
        ))}
      </div>
      {sub === 'phrase' && <Phrasebook />}
      {sub === 'fx' && <FxCalc />}
    </div>
  );
}

function Phrasebook() {
  const [q, setQ] = useState('');
  const groups = useMemo(() => {
    if (!q.trim()) return PHRASE_GROUPS;
    const n = q.trim().toLowerCase();
    return PHRASE_GROUPS
      .map((g) => ({ ...g, items: g.items.filter((p) => (p.ko + p.vi + p.pron).toLowerCase().includes(n)) }))
      .filter((g) => g.items.length);
  }, [q]);

  return (
    <div className="space-y-3">
      <input
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="상황·단어 검색 (택시, 계산…)"
        className="w-full rounded-lg bg-moose-edge px-3 py-2 text-sm text-slate-100 outline-none"
      />
      {groups.map((g) => (
        <div key={g.title}>
          <div className="mb-1.5 px-0.5 text-[11px] font-semibold text-slate-500">{g.title}</div>
          <div className="space-y-1.5">
            {g.items.map((p) => (
              <button
                key={p.vi}
                onClick={() => navigator.clipboard?.writeText(p.vi)}
                className="flex w-full items-center gap-2 rounded-xl border border-white/5 bg-moose-dusk/70 p-2.5 text-left active:bg-white/[0.06]"
              >
                <div className="min-w-0 flex-1">
                  <div className="text-[13px] text-slate-300">{p.ko}</div>
                  <div className="text-sm font-semibold text-white">{p.vi}</div>
                  <div className="text-[11px] text-moose-heart">[{p.pron}]</div>
                </div>
                <Copy size={13} className="shrink-0 text-slate-600" />
              </button>
            ))}
          </div>
        </div>
      ))}
      {groups.length === 0 && <p className="py-8 text-center text-xs text-slate-600">검색 결과가 없어요</p>}
      <p className="text-center text-[10px] text-slate-600">문장을 누르면 베트남어가 복사돼요 (택시 기사에게 보여주기)</p>
    </div>
  );
}

function FxCalc() {
  const settings = useAppStore((s) => s.settings);
  const rate = settings.rateMode === 'live' ? cachedRate() : Number(settings.fixedVndToKrw) || FALLBACK_VND_KRW;
  const [dir, setDir] = useState<'v2k' | 'k2v'>('v2k');
  const [amount, setAmount] = useState('');

  const n = Number(amount.replace(/,/g, '')) || 0;
  const result = dir === 'v2k'
    ? `${commas(toKrw(String(n), rate))} 원`
    : `${commas(Math.round(n / rate))} ₫`;

  const presets = dir === 'v2k'
    ? [50000, 100000, 200000, 500000, 1000000]
    : [5000, 10000, 30000, 50000, 100000];

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <span className="text-sm font-semibold text-white">{dir === 'v2k' ? 'VND → KRW' : 'KRW → VND'}</span>
        <button
          onClick={() => { setDir((d) => (d === 'v2k' ? 'k2v' : 'v2k')); setAmount(''); }}
          className="rounded-lg bg-white/5 p-1.5 text-slate-300"
        >
          <ArrowLeftRight size={13} />
        </button>
        <span className="ml-auto text-[11px] text-slate-500">1 ₫ ≈ {rate.toFixed(5)} 원</span>
      </div>

      <input
        value={amount}
        onChange={(e) => setAmount(e.target.value.replace(/[^\d]/g, ''))}
        inputMode="numeric"
        placeholder={dir === 'v2k' ? '동(₫) 금액' : '원(₩) 금액'}
        className="w-full rounded-xl bg-moose-edge px-4 py-3 text-right text-xl font-bold text-slate-100 outline-none"
      />

      <div className="rounded-xl bg-moose-heart/10 p-4 text-center">
        <div className="text-2xl font-bold text-moose-heart">{result}</div>
      </div>

      <div className="flex flex-wrap gap-1.5">
        {presets.map((v) => (
          <button
            key={v}
            onClick={() => setAmount(String(v))}
            className="rounded-full bg-white/5 px-3 py-1.5 text-xs text-slate-300"
          >
            {commas(v)}{dir === 'v2k' ? '₫' : '원'}
          </button>
        ))}
      </div>
      <p className="text-center text-[10px] text-slate-600">환율 기준은 가계부 설정을 따릅니다 (고정/실시간)</p>
    </div>
  );
}
