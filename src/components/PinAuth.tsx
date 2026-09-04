import { useState } from 'react';
import { motion } from 'framer-motion';
import { Delete, Heart } from 'lucide-react';
import { useAppStore } from '../store/useAppStore';
import { Moose } from './Moose';

const PIN_LEN = 6;
const KEYS = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '', '0', 'del'] as const;

export default function PinAuth() {
  const unlock = useAppStore((s) => s.unlock);
  const setPin = useAppStore((s) => s.setPin);
  const hasPin = useAppStore((s) => !!s.settings.pin);

  const [pin, setPinInput] = useState('');
  const [error, setError] = useState(false);
  // 최초 설정: 'new' 입력 → 'confirm' 재입력
  const [phase, setPhase] = useState<'new' | 'confirm'>('new');
  const [firstEntry, setFirstEntry] = useState('');

  const fail = () => {
    setError(true);
    setTimeout(() => { setError(false); setPinInput(''); }, 500);
  };

  const submit = (value: string) => {
    if (hasPin) {
      if (unlock(value)) return;
      fail();
      return;
    }
    // 최초 설정 흐름
    if (phase === 'new') {
      setFirstEntry(value);
      setPhase('confirm');
      setPinInput('');
      return;
    }
    if (value === firstEntry) {
      setPin(value);
      unlock(value);
      return;
    }
    // 확인 불일치 → 처음부터
    setFirstEntry('');
    setPhase('new');
    fail();
  };

  const press = (k: (typeof KEYS)[number]) => {
    if (error) return;
    if (k === 'del') return setPinInput((p) => p.slice(0, -1));
    if (k === '' || pin.length >= PIN_LEN) return;
    const next = pin + k;
    setPinInput(next);
    if (next.length === PIN_LEN) submit(next);
  };

  const caption = hasPin
    ? 'PIN을 입력하세요'
    : phase === 'new'
      ? '이 기기에서 쓸 PIN 6자리를 정하세요'
      : '확인을 위해 한 번 더 입력하세요';

  return (
    <div className="relative flex h-full flex-col items-center justify-center gap-9 overflow-hidden bg-moose-night px-8 text-slate-100">
      <div className="pointer-events-none absolute -top-20 left-1/2 h-64 w-64 -translate-x-1/2 rounded-full bg-moose-heart/15 blur-3xl" />
      <div className="relative flex flex-col items-center gap-2.5">
        <Moose variant="face" className="w-24 drop-shadow-[0_10px_26px_rgba(238,134,169,0.3)]" />
        <h1 className="font-title text-2xl font-bold tracking-tight">맘무스</h1>
        <p className="text-xs text-slate-400">큰맘 먹고 떠나는 커플 여행 · {caption}</p>
      </div>

      {/* PIN 표시 — 하트 뿔이 하나씩 반짝임 */}
      <motion.div
        className="flex gap-3"
        animate={error ? { x: [0, -10, 10, -8, 8, 0] } : { x: 0 }}
        transition={{ duration: 0.45 }}
      >
        {Array.from({ length: PIN_LEN }).map((_, i) => (
          <Heart
            key={i}
            size={22}
            className={
              error
                ? 'fill-rose-600 text-rose-600'
                : i < pin.length
                  ? 'fill-moose-heart text-moose-heart drop-shadow-[0_0_7px_rgba(238,134,169,0.85)]'
                  : 'text-moose-edge'
            }
          />
        ))}
      </motion.div>

      {/* 키패드 */}
      <div className="grid w-full max-w-xs grid-cols-3 gap-3">
        {KEYS.map((k, i) => (
          <button
            key={i}
            disabled={k === ''}
            onClick={() => press(k)}
            className={`flex h-16 items-center justify-center rounded-2xl text-2xl font-medium transition active:scale-95 ${
              k === ''
                ? 'invisible'
                : 'border border-white/5 bg-moose-edge/90 text-slate-100 hover:bg-moose-heart/20'
            }`}
          >
            {k === 'del' ? <Delete size={22} /> : k}
          </button>
        ))}
      </div>

      <p className="h-4 text-xs text-rose-400">
        {error ? (hasPin ? 'PIN이 올바르지 않습니다' : 'PIN이 일치하지 않아요. 다시 정해주세요') : ''}
      </p>
    </div>
  );
}
