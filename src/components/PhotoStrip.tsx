import { useEffect, useRef, useState } from 'react';
import { ImagePlus, X, Loader2, ChevronLeft, ChevronRight, Check } from 'lucide-react';
import { uploadPhoto, deletePhoto } from '../lib/photos';

/** 타임라인·일기 공용 사진 첨부 스트립 + 전체보기 갤러리.
 *  기본은 깔끔하게 — 사진을 길게 누르면 삭제·순서 변경 모드. */
export default function PhotoStrip({
  photos = [],
  onChange,
  editable = true,
  max = 6,
}: {
  photos?: string[];
  onChange: (next: string[]) => void;
  editable?: boolean;
  max?: number;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const [idx, setIdx] = useState<number | null>(null); // 전체보기 중인 사진
  const [editing, setEditing] = useState(false);
  const touchX = useRef(0);
  const longTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const longFired = useRef(false);

  const open = idx != null && photos[idx] != null ? idx : null;
  const go = (d: number) =>
    setIdx((i) => (i == null ? i : (i + d + photos.length) % photos.length));

  useEffect(() => {
    if (open == null) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') go(-1);
      else if (e.key === 'ArrowRight') go(1);
      else if (e.key === 'Escape') setIdx(null);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, photos.length]);

  const pick = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = [...(e.target.files ?? [])].slice(0, max - photos.length);
    e.target.value = '';
    if (!files.length) return;
    setBusy(true);
    setErr('');
    const added: string[] = [];
    for (const f of files) {
      try { added.push(await uploadPhoto(f)); }
      catch (x) { setErr((x as Error).message); }
    }
    setBusy(false);
    if (added.length) onChange([...photos, ...added]);
  };

  const remove = async (url: string) => {
    const next = photos.filter((p) => p !== url);
    onChange(next);
    deletePhoto(url);
    if (next.length === 0) setEditing(false);
  };
  const move = (i: number, d: number) => {
    const j = i + d;
    if (j < 0 || j >= photos.length) return;
    const next = [...photos];
    [next[i], next[j]] = [next[j], next[i]];
    onChange(next);
  };

  const startLong = () => {
    if (!editable) return;
    longFired.current = false;
    longTimer.current = setTimeout(() => {
      longFired.current = true;
      setEditing(true);
      navigator.vibrate?.(10);
    }, 450);
  };
  const cancelLong = () => {
    if (longTimer.current) { clearTimeout(longTimer.current); longTimer.current = null; }
  };
  const openViewer = (i: number) => {
    if (longFired.current) { longFired.current = false; return; } // 길게 누른 직후 클릭은 무시
    setIdx(i);
  };

  if (!editable && photos.length === 0) return null;

  return (
    <div>
      {editing && (
        <div className="mb-1 flex items-center justify-between text-[10px] text-slate-500">
          <span>길게 눌러 편집 중 · ◀▶ 순서, ✕ 삭제</span>
          <button onClick={() => setEditing(false)} className="flex items-center gap-1 text-moose-heart">
            <Check size={12} /> 완료
          </button>
        </div>
      )}

      {/* 미리보기 — 여러 장이면 세로 스크롤 */}
      <div className="flex max-h-52 flex-wrap gap-1.5 overflow-y-auto">
        {photos.map((url, i) => (
          <div key={url} className="relative h-16 w-16 overflow-hidden rounded-lg bg-moose-edge">
            <button
              onClick={() => openViewer(i)}
              onPointerDown={startLong}
              onPointerUp={cancelLong}
              onPointerLeave={cancelLong}
              onPointerCancel={cancelLong}
              onContextMenu={(e) => e.preventDefault()}
              className="h-full w-full"
            >
              <img src={url} alt="" className="h-full w-full object-cover" draggable={false} />
            </button>
            {editable && editing && (
              <>
                <button
                  onClick={() => remove(url)}
                  className="absolute right-0.5 top-0.5 rounded-full bg-black/70 p-0.5 text-white"
                >
                  <X size={12} />
                </button>
                <div className="absolute inset-x-0 bottom-0 flex justify-between bg-black/55">
                  <button onClick={() => move(i, -1)} disabled={i === 0} className="px-1 py-0.5 text-white disabled:opacity-25">
                    <ChevronLeft size={13} />
                  </button>
                  <button onClick={() => move(i, 1)} disabled={i === photos.length - 1} className="px-1 py-0.5 text-white disabled:opacity-25">
                    <ChevronRight size={13} />
                  </button>
                </div>
              </>
            )}
          </div>
        ))}
        {editable && !editing && photos.length < max && (
          <button
            onClick={() => inputRef.current?.click()}
            disabled={busy}
            className="flex h-16 w-16 flex-col items-center justify-center gap-0.5 rounded-lg border border-dashed border-white/15 text-slate-500"
          >
            {busy ? <Loader2 size={16} className="animate-spin" /> : <ImagePlus size={16} />}
            <span className="text-[9px]">{busy ? '올리는 중' : '사진'}</span>
          </button>
        )}
      </div>
      {err && <p className="mt-1 text-[10px] text-rose-400">{err}</p>}
      <input ref={inputRef} type="file" accept="image/*" multiple hidden onChange={pick} />

      {/* 전체보기 갤러리 */}
      {open != null && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/90 p-4"
          onClick={() => setIdx(null)}
          onTouchStart={(e) => { touchX.current = e.touches[0].clientX; }}
          onTouchEnd={(e) => {
            const d = e.changedTouches[0].clientX - touchX.current;
            if (Math.abs(d) > 40 && photos.length > 1) go(d < 0 ? 1 : -1);
          }}
        >
          <img
            src={photos[open]}
            alt=""
            className="max-h-full max-w-full rounded-lg object-contain"
            onClick={(e) => e.stopPropagation()}
          />
          <div className="absolute right-4 top-4 rounded-full bg-black/60 px-2 py-0.5 text-xs font-medium text-white">
            {open + 1}/{photos.length}
          </div>
          <button
            onClick={() => setIdx(null)}
            className="absolute left-4 top-4 rounded-full bg-black/60 p-1.5 text-white"
          >
            <X size={16} />
          </button>
          {photos.length > 1 && (
            <>
              <button
                onClick={(e) => { e.stopPropagation(); go(-1); }}
                className="absolute left-2 top-1/2 -translate-y-1/2 rounded-full bg-black/50 p-2 text-white"
              >
                <ChevronLeft size={22} />
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); go(1); }}
                className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full bg-black/50 p-2 text-white"
              >
                <ChevronRight size={22} />
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}
