import { useMemo, useRef, useState } from 'react';
import { Trash2 } from 'lucide-react';
import type { EntryComment } from '../types';
import { useMyName, useMentionNames } from '../lib/members';

/** 타임라인·장소·맛집·숙소 상세 모달 공용 댓글 스레드 (모달 최하단). 인스타식 @멘션. */
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
  const names = useMentionNames();
  const [text, setText] = useState('');
  const [caret, setCaret] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  // 커서 바로 앞의 "@단어" 조각 → 있으면 자동완성 목록 표시
  const token = useMemo(() => {
    const m = text.slice(0, caret).match(/(?:^|\s)@([^\s@]*)$/);
    return m ? m[1] : null;
  }, [text, caret]);
  const suggest = useMemo(() => {
    if (token == null) return [];
    const q = token.toLowerCase();
    return names.filter((n) => n.toLowerCase().includes(q)).slice(0, 6);
  }, [token, names]);

  const mentioned = useMemo(
    () => names.filter((n) => new RegExp(`(?:^|\\s)@${escapeRe(n)}(?=\\s|$)`).test(text)),
    [text, names],
  );

  const sync = (el: HTMLInputElement) => { setText(el.value); setCaret(el.selectionStart ?? el.value.length); };

  const choose = (name: string) => {
    const before = text.slice(0, caret).replace(/@([^\s@]*)$/, `@${name} `);
    const next = before + text.slice(caret);
    setText(next);
    const pos = before.length;
    requestAnimationFrame(() => {
      const el = inputRef.current;
      if (!el) return;
      el.focus();
      el.setSelectionRange(pos, pos);
      setCaret(pos);
    });
  };

  const submit = () => {
    const t = text.trim();
    if (!t) return;
    onAdd(t, mentioned);
    setText('');
    setCaret(0);
  };

  const render = (c: EntryComment) => {
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

      <div className="relative flex gap-2">
        {/* @자동완성 (인스타식) */}
        {suggest.length > 0 && (
          <div className="modal-surface absolute bottom-full left-0 z-30 mb-1 w-48 overflow-hidden rounded-xl">
            {suggest.map((n) => (
              <button
                key={n}
                onMouseDown={(e) => { e.preventDefault(); choose(n); }}
                className="flex w-full items-center gap-2 px-3 py-2 text-left text-[13px] text-slate-100 hover:bg-white/5"
              >
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-moose-heart/20 text-[12px] font-bold text-moose-heart">
                  {n.slice(0, 1)}
                </span>
                {n}
              </button>
            ))}
          </div>
        )}
        <input
          ref={inputRef}
          value={text}
          onChange={(e) => sync(e.currentTarget)}
          onKeyUp={(e) => setCaret(e.currentTarget.selectionStart ?? 0)}
          onClick={(e) => setCaret(e.currentTarget.selectionStart ?? 0)}
          onKeyDown={(e) => {
            if (e.key !== 'Enter') return;
            e.preventDefault();
            if (suggest.length > 0) choose(suggest[0]);
            else submit();
          }}
          placeholder={names.length ? '코멘트 · @로 멘션' : '코멘트 남기기'}
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

const escapeRe = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
