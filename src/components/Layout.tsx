import { Undo2, Redo2, Lock } from 'lucide-react';
import { useAppStore, useActiveProject, useCanUndo, useCanRedo } from '../store/useAppStore';
import { useRegisterMe } from '../lib/members';
import { TAB_VIEWS } from '../tabs';
import { Moose } from './Moose';
import ErrorBoundary from './ErrorBoundary';
import BottomNav from './BottomNav';

/** 오늘 기준 D-day 뱃지 텍스트 (기기 로컬 날짜 기준) */
function dday(start?: string, end?: string): string | null {
  if (!start) return null;
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const s = new Date(start + 'T00:00:00');
  const e = new Date((end || start) + 'T00:00:00');
  const diff = Math.round((s.getTime() - today.getTime()) / 86400000);
  if (diff > 0) return `D-${diff}`;
  if (today <= e) return `여행 ${Math.round((today.getTime() - s.getTime()) / 86400000) + 1}일차`;
  return '여행 완료';
}

export default function Layout() {
  const activeTab = useAppStore((s) => s.activeTab);
  const project = useActiveProject();
  const { undo, redo, lock } = useAppStore.getState();
  const canUndo = useCanUndo();
  const canRedo = useCanRedo();
  useRegisterMe(); // 앱을 켠 사람은 이 여행 참여자로 등록 (조용히 보는 상황 방지)

  const View = TAB_VIEWS[activeTab];

  return (
    // 모바일 프레임 컨테이너 — 390~430px 중앙 정렬
    <div className="mx-auto flex h-full w-full max-w-mobile flex-col overflow-hidden bg-moose-night text-slate-100 sm:my-[4vh] sm:h-[92vh] sm:rounded-[28px] sm:shadow-frame sm:ring-1 sm:ring-moose-edge">
      {/* 헤더 (타이틀: Times New Roman + NanumSquare) */}
      <header className="edge flex items-center justify-between border-b border-moose-edge py-2.5">
        <div className="flex min-w-0 items-center gap-2">
          <Moose variant="face" className="h-7 w-7 shrink-0 rounded-full object-cover" alt="" />
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <div className="font-title truncate text-base font-bold">
                {project?.name ?? '맘무스'}
              </div>
              {project && dday(project.startDate, project.endDate) && (
                <span className="shrink-0 rounded-full bg-moose-heart/20 px-1.5 py-0.5 text-[10px] font-bold text-moose-heart">
                  {dday(project.startDate, project.endDate)}
                </span>
              )}
            </div>
            {project && (
              <div className="truncate text-[11px] text-slate-400">
                {project.destination} · {project.startDate}~{project.endDate}
              </div>
            )}
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-1">
          <button
            onClick={undo}
            disabled={!canUndo}
            className="rounded-lg p-2 text-slate-300 disabled:opacity-30"
            aria-label="실행 취소"
          >
            <Undo2 size={18} />
          </button>
          <button
            onClick={redo}
            disabled={!canRedo}
            className="rounded-lg p-2 text-slate-300 disabled:opacity-30"
            aria-label="다시 실행"
          >
            <Redo2 size={18} />
          </button>
          <button onClick={lock} className="rounded-lg p-2 text-slate-300" aria-label="잠금">
            <Lock size={18} />
          </button>
        </div>
      </header>

      {/* 탭 콘텐츠 — key로 리마운트해 CSS fade-in + 탭별 오류 격리 */}
      <main className="pb-tabbar relative flex flex-1 flex-col overflow-y-auto">
        <ErrorBoundary key={activeTab}>
          <div className="flex min-h-0 flex-1 flex-col animate-[fade_.18s_ease] [&>*]:min-h-0 [&>*]:flex-1">
            <View />
          </div>
        </ErrorBoundary>
      </main>

      <BottomNav />
    </div>
  );
}
