import { useEffect, useRef, useState } from 'react';
import { ImagePlus, X, Loader2, ChevronLeft, ChevronRight } from 'lucide-react';
import { uploadPhoto, deletePhoto } from '../lib/photos';

/** 타임라인·일기 공용 사진 첨부 스트립 + 전체보기 갤러리. */
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
  const [idx, setIdx] = useState<number | null>(null); // 전체보기 중인 사진 index
  const touchX = useRef(0);

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
    onChange(photos.filter((p) => p !== url));
    deletePhoto(url);
  };

  if (!editable && photos.length === 0) return null;

  return (
    <div>
      {/* 미리보기 — 여러 장이면 세로 스크롤 */}
      <div className="flex max-h-52 flex-wrap gap-1.5 overflow-y-auto">
        {photos.map((url, i) => (
          <div key={url} className="relative h-16 w-16 overflow-hidden rounded-lg bg-moose-edge">
            <button onClick={() => setIdx(i)} className="h-full w-full">
              <img src={url} alt="" className="h-full w-full object-cover" />
            </button>
            {editable && (
              <button
                onClick={() => remove(url)}
                className="absolute right-0.5 top-0.5 rounded-full bg-black/60 p-0.5 text-white"
              >
                <X size={11} />
              </button>
            )}
          </div>
        ))}
        {editable && photos.length < max && (
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

          {/* 순번 배지 */}
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
