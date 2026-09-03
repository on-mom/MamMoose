import { useEffect, useMemo, useState } from 'react';
import { Plus, Trash2, RefreshCw } from 'lucide-react';
import type { Expense, ExpenseCategory } from '../types';
import { useAppStore, useActiveProject } from '../store/useAppStore';
import { uid } from '../lib/uid';
import { toKrw, commas, cachedRate, fetchVndKrwRate, FALLBACK_VND_KRW } from '../lib/currency';
import { useDebounced } from '../lib/useDebounced';
import { MooseEmpty, Moose } from '../components/Moose';

const CATS: ExpenseCategory[] = ['숙소', '쇼핑', '항공', '식사', '체험', '기타'];

export default function BudgetTab() {
  const project = useActiveProject()!;
  const expenses = useAppStore((s) => s.present[s.activeProjectId]?.expenses ?? []);
  const settings = useAppStore((s) => s.settings);
  const setRate = useAppStore((s) => s.setRate);
  const mutate = useAppStore((s) => s.mutate);
  const patchProject = useAppStore((s) => s.patchProject);

  const [live, setLive] = useState<number>(cachedRate());
  const [syncing, setSyncing] = useState(false);
  const refreshRate = () => {
    setSyncing(true);
    fetchVndKrwRate().then((r) => { setLive(r); setSyncing(false); });
  };
  useEffect(() => { if (settings.rateMode === 'live') refreshRate(); }, []); // eslint-disable-line

  const rate = settings.rateMode === 'live' ? live : Number(settings.fixedVndToKrw) || FALLBACK_VND_KRW;

  const [fCat, setFCat] = useState<string>('전체');
  const [fDate, setFDate] = useState('');

  const rows = useMemo(() => {
    return [...expenses]
      .filter((e) => fCat === '전체' || e.category === fCat)
      .filter((e) => !fDate || e.date === fDate)
      .sort((a, b) => (a.date < b.date ? 1 : -1));
  }, [expenses, fCat, fDate]);

  const totalVnd = rows.reduce((s, e) => s + (Number(e.amountVnd) || 0), 0);
  const totalKrw = rows.reduce((s, e) => s + Number(toKrw(e.amountVnd || '0', rate)), 0);

  // 예산은 (필터 무관) 여행 전체 지출 기준
  const tripTotalKrw = expenses.reduce((s, e) => s + Number(toKrw(e.amountVnd || '0', rate)), 0);
  const budget = project.budgetKrw ?? 0;
  const over = budget > 0 && tripTotalKrw > budget;
  const commitBudget = useDebounced((v: number) => patchProject(project.id, { budgetKrw: v || undefined }), 700);

  const dates = Array.from(new Set(expenses.map((e) => e.date))).sort().reverse();

  const commitEdit = useDebounced((id: string, patch: Partial<Expense>) => {
    mutate((doc) => { const e = doc.expenses.find((x) => x.id === id); if (e) Object.assign(e, patch); });
  }, 1000);

  const remove = (id: string) =>
    mutate((doc) => { doc.expenses = doc.expenses.filter((x) => x.id !== id); });

  return (
    <div className="edge flex h-full flex-col py-3">
      <h2 className="font-title text-xl font-bold text-white">가계부</h2>

      {/* 환율 */}
      <div className="mt-2 flex items-center justify-between rounded-lg bg-moose-dusk/70 px-3 py-2 text-[11px]">
        <div className="flex items-center gap-2 text-slate-400">
          <span>1 VND =</span>
          {settings.rateMode === 'fixed' ? (
            <input
              value={settings.fixedVndToKrw}
              onChange={(e) => setRate({ fixedVndToKrw: e.target.value })}
              className="w-16 rounded bg-moose-edge px-1.5 py-0.5 text-right text-slate-200 outline-none"
            />
          ) : (
            <span className="text-slate-200">{rate.toFixed(5)}</span>
          )}
          <span>KRW</span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setRate({ rateMode: settings.rateMode === 'fixed' ? 'live' : 'fixed' })}
            className="rounded bg-moose-edge px-2 py-0.5 text-slate-300"
          >
            {settings.rateMode === 'fixed' ? '고정' : '실시간'}
          </button>
          {settings.rateMode === 'live' && (
            <button onClick={refreshRate} className="text-slate-400">
              <RefreshCw size={12} className={syncing ? 'animate-spin' : ''} />
            </button>
          )}
        </div>
      </div>

      {/* 예산 */}
      <div className="mt-2 flex items-center justify-between rounded-lg bg-moose-dusk/70 px-3 py-2 text-[11px]">
        <span className="text-slate-400">이 여행 예산 (KRW)</span>
        <input
          key={project.id}
          type="number"
          inputMode="numeric"
          defaultValue={budget || ''}
          onChange={(e) => commitBudget(Number(e.target.value))}
          placeholder="예: 1,500,000"
          className="w-32 rounded bg-moose-edge px-2 py-0.5 text-right text-slate-200 outline-none placeholder:text-slate-600"
        />
      </div>

      <AddForm projectId={project.id} rate={rate} />

      {/* 필터 */}
      <div className="mt-3 flex gap-2 text-xs">
        <select value={fCat} onChange={(e) => setFCat(e.target.value)} className="rounded bg-moose-edge px-2 py-1 text-slate-200 outline-none">
          <option>전체</option>
          {CATS.map((c) => <option key={c}>{c}</option>)}
        </select>
        <select value={fDate} onChange={(e) => setFDate(e.target.value)} className="rounded bg-moose-edge px-2 py-1 text-slate-200 outline-none">
          <option value="">전체 날짜</option>
          {dates.map((d) => <option key={d} value={d}>{d}</option>)}
        </select>
      </div>

      {/* 목록 */}
      <ul className="mt-2 flex-1 space-y-1 overflow-y-auto">
        {rows.map((e) => (
          <li key={e.id} className="rounded-lg bg-moose-dusk/70 px-3 py-2 text-xs">
            <div className="flex items-center justify-between">
              <span className="rounded bg-moose-edge px-1.5 py-0.5 text-[10px] text-slate-300">
                {e.category === '기타' && e.categoryEtc ? e.categoryEtc : e.category}
              </span>
              <span className="text-slate-500">{e.date}</span>
            </div>
            <div className="mt-1 flex items-center gap-2">
              <input
                defaultValue={e.vendor}
                onChange={(ev) => commitEdit(e.id, { vendor: ev.target.value })}
                placeholder="지출처"
                className="min-w-0 flex-1 bg-transparent text-slate-100 outline-none"
              />
              <input
                type="number"
                defaultValue={e.amountVnd}
                onChange={(ev) => commitEdit(e.id, { amountVnd: ev.target.value, amountKrw: toKrw(ev.target.value, rate) })}
                className="w-24 bg-transparent text-right text-slate-100 outline-none"
              />
              <span className="text-slate-500">₫</span>
              <button onClick={() => remove(e.id)} className="text-slate-700 hover:text-rose-400"><Trash2 size={12} /></button>
            </div>
            <div className="text-right text-[11px] text-emerald-400">≈ {commas(toKrw(e.amountVnd || '0', rate))} 원</div>
          </li>
        ))}
        {rows.length === 0 && <li><MooseEmpty line="아직 지출 내역이 없어요" sub="VND로 입력하면 원화로 바로 환산돼요" /></li>}
      </ul>

      {/* 하단 고정 합계 */}
      <div className="mt-2 border-t border-moose-edge pt-2">
        {budget > 0 && (
          <div className="mb-2">
            <div className="h-1.5 overflow-hidden rounded-full bg-white/10">
              <div
                className={`h-full rounded-full ${over ? 'bg-rose-400' : 'bg-moose-heart'}`}
                style={{ width: `${Math.min(100, (tripTotalKrw / budget) * 100)}%` }}
              />
            </div>
            <div className="mt-1 flex justify-between text-[10px] text-slate-500">
              <span>예산 {commas(budget)}원 · 전체 지출 {commas(Math.round(tripTotalKrw))}원</span>
              <span className={over ? 'text-rose-300' : ''}>{Math.round((tripTotalKrw / budget) * 100)}%</span>
            </div>
          </div>
        )}

        {over && (
          <div className="mb-2 flex justify-center">
            <div
              className="flex items-center gap-2 rounded-xl border-2 border-dashed border-moose-heart/70 bg-moose-heart/10 px-3 py-1.5 text-moose-heart animate-[stamp_.4s_cubic-bezier(.2,1.5,.4,1)]"
              style={{ transform: 'rotate(-6deg)' }}
            >
              <Moose variant="face" className="h-7 w-7" alt="" />
              <div className="text-[11px] font-bold leading-tight">
                큰맘 먹고 지른<br />예쁜 지출!
                <span className="ml-1 font-normal opacity-70">+{commas(Math.round(tripTotalKrw - budget))}원</span>
              </div>
            </div>
          </div>
        )}

        <div className="flex items-center justify-between text-sm">
          <span className="text-slate-400">합계 ({rows.length}건)</span>
          <div className="text-right">
            <div className="font-bold text-white">{commas(totalVnd)} ₫</div>
            <div className="text-xs text-emerald-400">≈ {commas(totalKrw)} 원</div>
          </div>
        </div>
      </div>
    </div>
  );
}

function AddForm({ projectId, rate }: { projectId: string; rate: number }) {
  const mutate = useAppStore((s) => s.mutate);
  const today = new Date().toISOString().slice(0, 10);
  const [f, setF] = useState({ date: today, category: '식사' as ExpenseCategory, categoryEtc: '', vendor: '', amount: '' });
  const [cur, setCur] = useState<'VND' | 'KRW'>('VND');

  // 입력 통화와 무관하게 저장은 VND 원금 + KRW 환산 둘 다
  const n = Number(f.amount) || 0;
  const vnd = cur === 'VND' ? n : Math.round(n / rate);
  const krw = cur === 'VND' ? Number(toKrw(String(n), rate)) : n;

  const submit = () => {
    if (!f.amount || !f.vendor.trim()) return;
    mutate((doc) => {
      doc.expenses.push({
        id: uid(), projectId,
        date: f.date, category: f.category,
        categoryEtc: f.category === '기타' ? f.categoryEtc.trim() : undefined,
        vendor: f.vendor.trim(),
        amountVnd: String(vnd),
        amountKrw: String(krw),
      });
    });
    setF({ ...f, vendor: '', amount: '', categoryEtc: '' });
  };

  return (
    <div className="mt-3 space-y-2 card border-0 p-3 text-xs">
      <div className="flex gap-2">
        <input type="date" value={f.date} onChange={(e) => setF({ ...f, date: e.target.value })}
          className="rounded bg-moose-edge px-2 py-1.5 text-slate-100 outline-none" />
        <select value={f.category} onChange={(e) => setF({ ...f, category: e.target.value as ExpenseCategory })}
          className="flex-1 rounded bg-moose-edge px-2 py-1.5 text-slate-100 outline-none">
          {CATS.map((c) => <option key={c}>{c}</option>)}
        </select>
      </div>
      {f.category === '기타' && (
        <input value={f.categoryEtc} onChange={(e) => setF({ ...f, categoryEtc: e.target.value })}
          placeholder="카테고리 직접 입력" className="w-full rounded bg-moose-edge px-2 py-1.5 text-slate-100 outline-none" />
      )}
      <input value={f.vendor} onChange={(e) => setF({ ...f, vendor: e.target.value })}
        placeholder="지출처" className="w-full rounded bg-moose-edge px-2 py-1.5 text-slate-100 outline-none" />
      <div className="flex items-center gap-2">
        <select
          value={cur}
          onChange={(e) => setCur(e.target.value as 'VND' | 'KRW')}
          className="shrink-0 rounded bg-moose-edge px-2 py-1.5 font-semibold text-slate-100 outline-none"
        >
          <option value="VND">₫ 동</option>
          <option value="KRW">₩ 원</option>
        </select>
        <input type="number" inputMode="numeric" value={f.amount} onChange={(e) => setF({ ...f, amount: e.target.value })}
          placeholder={cur === 'VND' ? '금액 (VND)' : '금액 (원)'} className="flex-1 rounded bg-moose-edge px-2 py-1.5 text-right text-slate-100 outline-none" />
        <button onClick={submit} className="rounded btn-heart rounded-xl px-3 py-1.5 font-semibold"><Plus size={14} /></button>
      </div>
      {f.amount && (
        <div className="text-right text-[11px] text-emerald-400">
          {cur === 'VND' ? `≈ ${commas(krw)} 원` : `≈ ${commas(vnd)} ₫`}
        </div>
      )}
    </div>
  );
}
