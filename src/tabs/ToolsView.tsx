import { useEffect, useMemo, useState } from 'react';
import { Copy, ArrowLeftRight, Languages } from 'lucide-react';
import { useAppStore, useActiveProject } from '../store/useAppStore';
import { cachedRate, fetchRate, toKrw, commas, fallbackRate } from '../lib/currency';
import { currencyOf, currencyMeta, langOf, tzLabel } from '../lib/cities';
import { PHRASES, PHRASE_LOC, GROUP_ORDER } from '../data/phrases';
import { translateEnabled, translateBatch } from '../lib/translate';

type Sub = 'phrase' | 'fx';
const gtUrl = (ko: string, tl: string) =>
  `https://translate.google.com/?sl=ko&tl=${tl}&text=${encodeURIComponent(ko)}&op=translate`;

/** MY › 도구 — 여행지 언어 회화 + 환율 계산기 */
export default function ToolsView() {
  const project = useActiveProject();
  const [sub, setSub] = useState<Sub>('phrase');
  const local = currencyOf(project?.timezone, project?.destination);
  const lang = langOf(project?.timezone);
  return (
    <div className="space-y-3 overflow-y-auto pb-2">
      <div className="flex gap-1 rounded-lg bg-moose-edge p-1 text-[11px]">
        {([['phrase', '🗣️ 회화'], ['fx', '💱 환율']] as const).map(([k, l]) => (
          <button
            key={k}
            onClick={() => setSub(k)}
            className={`flex-1 rounded-md py-1.5 ${sub === k ? 'bg-moose-heart text-white' : 'text-slate-400'}`}
          >
            {l}
          </button>
        ))}
      </div>
      {sub === 'phrase' && <Phrasebook lang={lang} tzText={tzLabel(project?.timezone ?? '')} />}
      {sub === 'fx' && <FxCalc local={local} />}
    </div>
  );
}

function Phrasebook({ lang, tzText }: { lang: string; tzText: string }) {
  const [q, setQ] = useState('');
  const loc = PHRASE_LOC[lang];                       // 큐레이션된 언어
  const useApi = !loc && translateEnabled && lang !== 'ko';
  const [api, setApi] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!useApi) return;
    let alive = true;
    translateBatch(PHRASES.map((p) => p.apiKo ?? p.ko), lang).then((out) => {
      if (!alive) return;
      const m: Record<string, string> = {};
      PHRASES.forEach((p, i) => { m[p.id] = out[i]; });
      setApi(m);
    });
    return () => { alive = false; };
  }, [lang, useApi]);

  const native = (id: string): string | undefined => loc?.[id]?.t ?? (useApi ? api[id] : undefined);

  const list = useMemo(() => {
    const n = q.trim().toLowerCase();
    const filtered = n
      ? PHRASES.filter((p) => (p.ko + ' ' + (native(p.id) ?? '') + ' ' + (loc?.[p.id]?.pron ?? '')).toLowerCase().includes(n))
      : PHRASES;
    return GROUP_ORDER.map((g) => ({ title: g, items: filtered.filter((p) => p.group === g) })).filter((x) => x.items.length);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q, loc, api, useApi]);

  const showLink = !loc && !useApi;

  return (
    <div className="space-y-3">
      <input
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="상황·단어 검색 (택시, 계산…)"
        className="w-full rounded-lg bg-moose-edge px-3 py-2 text-sm text-slate-100 outline-none"
      />
      {showLink && (
        <p className="rounded-lg bg-white/[0.04] px-3 py-2 text-[11px] leading-relaxed text-slate-400">
          {tzText || '이 여행지'}의 회화집은 아직 준비 중이에요. 지금은 한국어 문장을 눌러 <b className="text-slate-200">구글 번역</b>으로 바로 확인할 수 있어요.
        </p>
      )}
      {useApi && (
        <p className="rounded-lg bg-white/[0.04] px-3 py-2 text-[11px] text-slate-400">
          구글 번역으로 자동 번역한 문장이에요 (발음 표기는 없음).
        </p>
      )}
      {list.map((g) => (
        <div key={g.title}>
          <div className="mb-1.5 px-0.5 text-[11px] font-semibold text-slate-500">{g.title}</div>
          <div className="space-y-1.5">
            {g.items.map((p) => {
              const t = native(p.id);
              const pron = loc?.[p.id]?.pron;
              return t ? (
                <button
                  key={p.id}
                  onClick={() => navigator.clipboard?.writeText(t)}
                  className="flex w-full items-center gap-2 rounded-xl border border-white/5 bg-moose-dusk/70 p-2.5 text-left active:bg-white/[0.06]"
                >
                  <div className="min-w-0 flex-1">
                    <div className="text-[13px] text-slate-300">{p.ko}</div>
                    <div className="text-sm font-semibold text-white">{t}</div>
                    {pron && <div className="text-[11px] text-moose-heart">[{pron}]</div>}
                  </div>
                  <Copy size={13} className="shrink-0 text-slate-600" />
                </button>
              ) : (
                <a
                  key={p.id}
                  href={gtUrl(p.ko, lang)}
                  target="_blank"
                  rel="noreferrer"
                  className="flex w-full items-center gap-2 rounded-xl border border-white/5 bg-moose-dusk/70 p-2.5 text-left active:bg-white/[0.06]"
                >
                  <span className="min-w-0 flex-1 text-[13px] text-slate-200">{p.ko}</span>
                  <Languages size={14} className="shrink-0 text-moose-heart" />
                </a>
              );
            })}
          </div>
        </div>
      ))}
      {list.length === 0 && <p className="py-8 text-center text-xs text-slate-600">검색 결과가 없어요</p>}
      {(loc || useApi) && <p className="text-center text-[10px] text-slate-600">문장을 누르면 현지어가 복사돼요 (점원·기사에게 보여주기)</p>}
    </div>
  );
}

function FxCalc({ local }: { local: string }) {
  const settings = useAppStore((s) => s.settings);
  const lm = currencyMeta(local);
  const [live, setLive] = useState<number>(cachedRate(local));
  const useFixed = settings.rateMode === 'fixed' && local === 'VND';
  useEffect(() => {
    setLive(cachedRate(local));
    if (!useFixed && local !== 'KRW') fetchRate(local).then(setLive);
  }, [local]); // eslint-disable-line
  const rate = local === 'KRW' ? 1
    : useFixed ? (Number(settings.fixedVndToKrw) || fallbackRate('VND'))
    : (live || fallbackRate(local));
  const [dir, setDir] = useState<'l2k' | 'k2l'>('l2k');
  const [amount, setAmount] = useState('');

  const n = Number(amount.replace(/,/g, '')) || 0;
  const result = dir === 'l2k'
    ? `${commas(toKrw(String(n), rate))} 원`
    : `${commas(Math.round(n / rate))} ${lm.symbol}`;

  const presets = dir === 'l2k'
    ? (rate < 1 ? [50000, 100000, 200000, 500000, 1000000] : rate < 50 ? [1000, 5000, 10000, 50000, 100000] : [10, 50, 100, 500, 1000])
    : [5000, 10000, 30000, 50000, 100000];

  if (local === 'KRW') {
    return <p className="py-10 text-center text-xs text-slate-500">이 여행은 원화(₩)를 써서 환율 계산이 필요 없어요</p>;
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <span className="text-sm font-semibold text-white">{dir === 'l2k' ? `${local} → KRW` : `KRW → ${local}`}</span>
        <button
          onClick={() => { setDir((d) => (d === 'l2k' ? 'k2l' : 'l2k')); setAmount(''); }}
          className="rounded-lg bg-white/5 p-1.5 text-slate-300"
        >
          <ArrowLeftRight size={13} />
        </button>
        <span className="ml-auto text-[11px] text-slate-500">1 {lm.symbol} ≈ {rate < 1 ? rate.toFixed(5) : rate.toFixed(2)} 원</span>
      </div>

      <input
        value={amount}
        onChange={(e) => setAmount(e.target.value.replace(/[^\d]/g, ''))}
        inputMode="numeric"
        placeholder={dir === 'l2k' ? `${lm.name}(${lm.symbol}) 금액` : '원(₩) 금액'}
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
            {commas(v)}{dir === 'l2k' ? lm.symbol : '원'}
          </button>
        ))}
      </div>
      <p className="text-center text-[10px] text-slate-600">환율 기준은 가계부 설정을 따릅니다 (고정/실시간)</p>
    </div>
  );
}
