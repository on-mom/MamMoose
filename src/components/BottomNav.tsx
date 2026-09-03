import { CalendarDays, Search, CheckSquare, Wallet, User } from 'lucide-react';
import type { TabKey } from '../types';
import { useAppStore } from '../store/useAppStore';

const TABS: { key: TabKey; label: string; Icon: typeof CalendarDays }[] = [
  { key: 'schedule', label: '일정', Icon: CalendarDays },
  { key: 'restaurants', label: '탐색', Icon: Search },
  { key: 'todo', label: 'Todo', Icon: CheckSquare },
  { key: 'budget', label: '가계부', Icon: Wallet },
  { key: 'my', label: 'MY', Icon: User },
];

export default function BottomNav() {
  const activeTab = useAppStore((s) => s.activeTab);
  const setTab = useAppStore((s) => s.setTab);

  return (
    <nav
      className="absolute inset-x-0 bottom-0 z-40 flex border-t border-moose-edge bg-moose-night/95 backdrop-blur"
      style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
    >
      {TABS.map(({ key, label, Icon }) => {
        const active = key === activeTab;
        return (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`flex flex-1 flex-col items-center gap-0.5 py-2.5 text-[11px] transition ${
              active ? 'text-moose-heart' : 'text-slate-500'
            }`}
          >
            <Icon size={22} strokeWidth={active ? 2.4 : 1.8} />
            {label}
          </button>
        );
      })}
    </nav>
  );
}
