import { useMemo, useRef, useState } from 'react';
import { Trash2, AtSign } from 'lucide-react';
import type { EntryComment } from '../types';
import { useMyName, useMemberNames } from '../lib/members';

/** 타임라인·장소·맛집·숙소 상세 모달 공용 댓글 스레드 (모달 최하단). @멘션 지원. */
export default function CommentThread({
  comments = [],
  onAdd,
  onDelete,
}: {
  comments?: EntryComment[];
  onAdd: (text: string, mentions: string[]) => void;
  onDelete: (id: string) => void;
}) {
  const me = useMyName();
  const members = useMemberNames().filter((m) => m !== me);
  const [text, setText] = useState('');
  const [pick, setPick] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const mentioned = useMemo(
    () => members.filter((m) => text.includes('@' + m)),
    [text, members],
  );

  const submit = () => {
    const t = text.trim();
    if (!t) return;
    onAdd(t, mentioned);
    setText('');
  };

  const addMention = (name: string) => {
    setText((t) => (t ? `${t.replace(/\s*$/, '')} @${name} ` : `@${name} `));
    setPick(false);
    inputRef.current?.focus();
  };

  const render = (c: EntryComment) => {
    // @이름 강조
    const parts = c.text.split(/(@[^\s@]+)/g);
    return parts.map((p, i) =>
      p.startsWith('@') && (c.mentions ?? []).some((m) => p === '@' + m)
        ? <span key={i} className="font-semibold text-moose-heart">{p}</span>
        : <span key={i}>{p}</span>,
    );
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
            <div className="text-[13px] text-slate-100">{render(c)}</div>
          </div>
          {c.author === me && (
            <button onClick={() => onDelete(c.id)} className="shrink-0 text-slate-600 hover:text-rose-400">
              <Trash2 size={12} />
            </button>
          )}
        </div>
      ))}

      {pick && members.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {members.map((m) => (
            <button key={m} onClick={() => addMention(m)} className="rounded-full bg-moose-heart/15 px-2.5 py-1 text-[11px] text-moose-heart">
              @{m}
            </button>
          ))}
        </div>
      )}

      <div className="flex gap-2">
        {members.length > 0 && (
          <button onClick={() => setPick((v) => !v)} className={`shrink-0 rounded-lg px-2 ${pick ? 'bg-moose-heart/20 text-moose-heart' : 'bg-moose-edge text-slate-400'}`}>
            <AtSign size={15} />
          </button>
        )}
        <input
          ref={inputRef}
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && submit()}
          placeholder={members.length ? '코멘트 · @로 멘션' : '코멘트 남기기'}
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
