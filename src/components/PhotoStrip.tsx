import { useRef, useState } from 'react';
import { ImagePlus, X, Loader2 } from 'lucide-react';
import { uploadPhoto, deletePhoto } from '../lib/photos';

/** 타임라인·일기 공용 사진 첨부 스트립. */
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
  const [view, setView] = useState<string | null>(null);

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
      <div className="flex flex-wrap gap-1.5">
        {photos.map((url) => (
          <div key={url} className="relative h-16 w-16 overflow-hidden rounded-lg bg-moose-edge">
            <button onClick={() => setView(url)} className="h-full w-full">
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

      {view && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/90 p-4"
          onClick={() => setView(null)}
        >
          <img src={view} alt="" className="max-h-full max-w-full rounded-lg object-contain" />
          <button className="absolute right-4 top-4 rounded-full bg-white/15 p-2 text-white"><X size={18} /></button>
        </div>
      )}
    </div>
  );
}
