import type { ReactNode } from 'react';
import { X } from 'lucide-react';

/** 화면 중앙 팝업. 배경은 확실히 불투명한 modal-surface. */
export default function Modal({
  title,
  onClose,
  children,
  footer,
}: {
  title?: ReactNode;
  onClose: () => void;
  children: ReactNode;
  footer?: ReactNode;
}) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-5 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="modal-surface w-full max-w-sm overflow-hidden rounded-3xl animate-[pop_.2s_cubic-bezier(.2,.8,.2,1)]"
        onClick={(e) => e.stopPropagation()}
      >
        {title !== undefined && (
          <div className="flex items-start justify-between gap-2 border-b border-white/5 px-5 pb-3 pt-4">
            <div className="min-w-0">{title}</div>
            <button onClick={onClose} className="-mr-1 -mt-0.5 shrink-0 rounded-full p-1 text-slate-400 hover:bg-white/5">
              <X size={18} />
            </button>
          </div>
        )}
        <div className="max-h-[70vh] overflow-y-auto px-5 py-4">{children}</div>
        {footer && <div className="border-t border-white/5 px-5 py-3">{footer}</div>}
      </div>
    </div>
  );
}

/** 하단에서 올라오는 바텀시트 (모바일 필터 등) */
export function BottomSheet({
  title,
  onClose,
  children,
}: {
  title?: ReactNode;
  onClose: () => void;
  children: ReactNode;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-end bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div
        className="modal-surface max-h-[70vh] w-full overflow-hidden rounded-t-3xl animate-[sheet-up_.24s_cubic-bezier(.2,.8,.2,1)]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-center pb-1 pt-2.5">
          <span className="h-1 w-9 rounded-full bg-white/15" />
        </div>
        {title && (
          <div className="flex items-center justify-between px-5 pb-2">
            <span className="text-sm font-semibold text-white">{title}</span>
            <button onClick={onClose} className="text-slate-400"><X size={16} /></button>
          </div>
        )}
        <div className="max-h-[56vh] overflow-y-auto px-5 pb-6">{children}</div>
      </div>
    </div>
  );
}
