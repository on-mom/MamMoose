import { useState } from 'react';
import { Trash2 } from 'lucide-react';
import type { EntryComment } from '../types';
import { useMyName } from '../lib/members';

/** 타임라인·장소·맛집·숙소 상세 모달 공용 댓글 스레드 (모달 최하단) */
export default function CommentThread({
  comments = [],
  onAdd,
  onDelete,
}: {
  comments?: EntryComment[];
  onAdd: (text: string) => void;
  onDelete: (id: string) => void;
}) {
  const me = useMyName();
  const [text, setText] = useState('');
  const submit = () => {
    const t = text.trim();
    if (!t) return;
    onAdd(t);
    setText('');
  };

  return (
    <div className="space-y-2 border-t border-white/5 pt-3">
      <div className="text-[11px] font-semibold text-slate-500">
        코멘트{comments.length > 0 && ` · ${comments.length}`}
      </div>
      {comments.map((c) => (
        <div key={c.id} className="flex items-start gap-2 rounded-lg bg-white/[0.03] px-2.5 py-1.5">
          <div className="min-w-0 flex-1">
            <div className="flex items-baseline gap-1.5">
              <span className="text-[11px] font-semibold text-slate-300">{c.author}</span>
              <span className="text-[9px] text-slate-600">
                {new Date(c.at).toLocaleString('ko-KR', { month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit', hour12: false })}
              </span>
            </div>
            <div className="text-[13px] text-slate-100">{c.text}</div>
          </div>
          {c.author === me && (
            <button onClick={() => onDelete(c.id)} className="shrink-0 text-slate-600 hover:text-rose-400">
              <Trash2 size={12} />
            </button>
          )}
        </div>
      ))}
      <div className="flex gap-2">
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && submit()}
          placeholder="코멘트 남기기"
          className="min-w-0 flex-1 rounded-lg bg-moose-edge px-3 py-2 text-sm text-slate-100 outline-none"
        />
        <button
          onClick={submit}
          disabled={!text.trim()}
          className="btn-heart shrink-0 rounded-lg px-3 text-sm font-semibold disabled:opacity-40"
        >
          등록
        </button>
      </div>
    </div>
  );
}
