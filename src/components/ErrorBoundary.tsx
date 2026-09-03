import { Component, type ErrorInfo, type ReactNode } from 'react';
import { RefreshCw } from 'lucide-react';
import { Moose } from './Moose';

/** 한 탭에서 오류가 나도 앱 전체가 죽지 않도록 격리 */
export default class ErrorBoundary extends Component<
  { children: ReactNode; onReset?: () => void },
  { error: Error | null }
> {
  state = { error: null as Error | null };

  static getDerivedStateFromError(error: Error) {
    return { error };
  }
  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('[ErrorBoundary]', error, info.componentStack);
  }

  render() {
    if (!this.state.error) return this.props.children;
    return (
      <div className="flex h-full flex-col items-center justify-center gap-3 px-8 text-center">
        <Moose variant="full" className="w-24 opacity-90" alt="" />
        <p className="text-sm font-semibold text-slate-200">이 화면에서 문제가 생겼어요</p>
        <p className="text-xs leading-relaxed text-slate-500">
          맘무가 살펴볼게요. 아래 버튼을 누르거나 다른 탭으로 이동해보세요.
        </p>
        <button
          onClick={() => { this.setState({ error: null }); this.props.onReset?.(); }}
          className="btn-heart mt-1 flex items-center gap-1.5 rounded-xl px-4 py-2 text-sm font-semibold"
        >
          <RefreshCw size={14} /> 다시 시도
        </button>
      </div>
    );
  }
}
