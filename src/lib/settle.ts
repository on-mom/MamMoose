// 균등 분할 정산 — 각자 낸 돈 vs 1/N, 최소 송금 조합으로 계산.

export interface Payment { by: string; krw: number }
export interface Transfer { from: string; to: string; krw: number }
export interface Settlement {
  paid: Record<string, number>;
  share: number;
  total: number;
  transfers: Transfer[];
}

export function settle(payments: Payment[], members: string[]): Settlement {
  const people = members.length ? members : [...new Set(payments.map((p) => p.by))];
  const paid: Record<string, number> = {};
  for (const m of people) paid[m] = 0;
  let total = 0;
  for (const p of payments) {
    if (!(p.by in paid)) paid[p.by] = 0; // 멤버 목록에 없는 이름도 포함
    paid[p.by] += p.krw;
    total += p.krw;
  }
  const names = Object.keys(paid);
  const share = names.length ? total / names.length : 0;

  // 잔액: +면 받을 돈, -면 낼 돈
  const bal = names.map((m) => ({ m, v: paid[m] - share }));
  const creditors = bal.filter((x) => x.v > 0.5).sort((a, b) => b.v - a.v);
  const debtors = bal.filter((x) => x.v < -0.5).sort((a, b) => a.v - b.v);

  const transfers: Transfer[] = [];
  let ci = 0;
  let di = 0;
  while (ci < creditors.length && di < debtors.length) {
    const give = Math.min(creditors[ci].v, -debtors[di].v);
    transfers.push({ from: debtors[di].m, to: creditors[ci].m, krw: Math.round(give) });
    creditors[ci].v -= give;
    debtors[di].v += give;
    if (creditors[ci].v <= 0.5) ci++;
    if (debtors[di].v >= -0.5) di++;
  }
  return { paid, share, total, transfers };
}
