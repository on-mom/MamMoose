import { useEffect, useMemo, useState } from 'react';
import { Copy, ArrowLeftRight, Languages, Plus, X } from 'lucide-react';
import type { Project } from '../types';
import { useAppStore, useActiveProject } from '../store/useAppStore';
import { uid } from '../lib/uid';
import { cachedRate, fetchRate, toKrw, commas, fallbackRate } from '../lib/currency';
import { currencyOf, currencyMeta, langOf, tzLabel } from '../lib/cities';
import { PHRASES, PHRASE_LOC, GROUP_ORDER } from '../data/phrases';
import { packingPreset } from '../data/packing';
import { translateEnabled, translateBatch } from '../lib/translate';

type Sub = 'phrase' | 'fx' | 'pack';
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
        {([['phrase', '🗣️ 회화'], ['fx', '💱 환율'], ['pack', '🎒 짐']] as const).map(([k, l]) => (
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
      {sub === 'pack' && project && <PackingList project={project} />}
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

function PackingList({ project }: { project: Project }) {
  const packing = useAppStore((s) => s.present[s.activeProjectId]?.packing ?? []);
  const mutate = useAppStore((s) => s.mutate);
  const [add, setAdd] = useState('');

  const seed = () => mutate((doc) => {
    const have = new Set((doc.packing ?? []).map((p) => p.label));
    doc.packing = [
      ...(doc.packing ?? []),
      ...packingPreset(project.destination, project.timezone, project.name)
        .filter((it) => !have.has(it.label))
        .map((it) => ({ id: uid(), label: it.label, cat: it.cat, done: false })),
    ];
  });
  const toggle = (id: string) => mutate((doc) => {
    const it = (doc.packing ?? []).find((p) => p.id === id); if (it) it.done = !it.done;
  });
  const remove = (id: string) => mutate((doc) => {
    doc.packing = (doc.packing ?? []).filter((p) => p.id !== id);
  });
  const addItem = () => {
    const label = add.trim(); if (!label) return;
    mutate((doc) => { doc.packing = [...(doc.packing ?? []), { id: uid(), label, cat: '추가', done: false }]; });
    setAdd('');
  };

  const groups = useMemo(() => {
    const by: Record<string, typeof packing> = {};
    for (const it of packing) (by[it.cat || '기타'] ??= []).push(it);
    return Object.entries(by);
  }, [packing]);
  const done = packing.filter((p) => p.done).length;

  if (packing.length === 0) {
    return (
      <div className="flex flex-col items-center gap-3 py-10 text-center">
        <span className="text-4xl">🎒</span>
        <p className="text-sm text-slate-400">{project.destination || '이 여행'} 맞춤 짐 목록을 만들어 드릴게요</p>
        <button onClick={seed} className="btn-heart rounded-xl px-4 py-2 text-sm font-semibold">
          여행지 추천 목록 불러오기
        </button>
        <p className="text-[11px] text-slate-600">불러온 뒤 자유롭게 체크·추가·삭제할 수 있어요</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between text-[11px] text-slate-400">
        <span>{done} / {packing.length} 챙김</span>
        <button onClick={seed} className="text-moose-heart">+ 추천 항목 추가</button>
      </div>
      <div className="h-1.5 overflow-hidden rounded-full bg-white/10">
        <div className="h-full rounded-full bg-moose-heart transition-all" style={{ width: `${(done / packing.length) * 100}%` }} />
      </div>

      {groups.map(([cat, items]) => (
        <div key={cat}>
          <div className="mb-1 px-0.5 text-[11px] font-semibold text-slate-500">{cat}</div>
          <div className="space-y-1">
            {items.map((it) => (
              <div key={it.id} className="flex items-center gap-2 rounded-lg bg-moose-dusk/70 px-3 py-2">
                <button onClick={() => toggle(it.id)} className="flex flex-1 items-center gap-2 text-left">
                  <span className={`flex h-4 w-4 shrink-0 items-center justify-center rounded border ${it.done ? 'border-moose-heart bg-moose-heart text-white' : 'border-white/25'}`}>
                    {it.done && '✓'}
                  </span>
                  <span className={`text-[13px] ${it.done ? 'text-slate-500 line-through' : 'text-slate-100'}`}>{it.label}</span>
                </button>
                <button onClick={() => remove(it.id)} className="shrink-0 text-slate-600 hover:text-rose-400"><X size={13} /></button>
              </div>
            ))}
          </div>
        </div>
      ))}

      <div className="flex gap-2">
        <input
          value={add}
          onChange={(e) => setAdd(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && addItem()}
          placeholder="직접 추가 (예: 커플 잠옷)"
          className="flex-1 rounded-lg bg-moose-edge px-3 py-2 text-sm text-slate-100 outline-none"
        />
        <button onClick={addItem} className="btn-heart shrink-0 rounded-lg px-3"><Plus size={15} /></button>
      </div>
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
