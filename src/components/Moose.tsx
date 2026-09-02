/** 맘무 마스코트. face = 얼굴+컵 클로즈업, full = 전신 */
export function Moose({
  variant = 'face',
  className = '',
  alt = '맘무',
}: {
  variant?: 'face' | 'full';
  className?: string;
  alt?: string;
}) {
  return (
    <img
      src={variant === 'full' ? '/moose-full.png' : '/moose-face.png'}
      alt={alt}
      draggable={false}
      className={`select-none ${className}`}
    />
  );
}

/** 빈 화면용 — 배낭 맘무 + 안내 문구 */
export function MooseEmpty({ line, sub }: { line: string; sub?: string }) {
  return (
    <div className="flex flex-col items-center gap-3 px-6 py-12 text-center">
      <Moose variant="full" className="w-24 opacity-90 drop-shadow-[0_10px_24px_rgba(238,134,169,0.18)]" alt="" />
      <p className="text-sm font-medium text-slate-200">{line}</p>
      {sub && <p className="text-xs text-slate-500">{sub}</p>}
    </div>
  );
}
