import { useState } from 'react';
import { KeyRound } from 'lucide-react';
import { cloudEnabled, signInWith } from '../lib/supabase';
import { Moose } from './Moose';
import PinAuth from './PinAuth';

export default function AuthScreen() {
  const [pinMode, setPinMode] = useState(!cloudEnabled);

  if (pinMode) {
    return (
      <div className="relative h-full">
        <PinAuth />
        {cloudEnabled && (
          <button
            onClick={() => setPinMode(false)}
            className="absolute inset-x-0 bottom-6 mx-auto block w-max text-xs text-slate-500 underline"
          >
            소셜 로그인으로 돌아가기
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="relative flex h-full flex-col items-center justify-center gap-8 overflow-hidden bg-moose-night px-9 text-slate-100">
      <div className="pointer-events-none absolute -top-24 left-1/2 h-72 w-72 -translate-x-1/2 rounded-full bg-moose-heart/20 blur-3xl" />
      <div className="relative flex flex-col items-center gap-3">
        <Moose variant="face" className="w-28 drop-shadow-[0_12px_30px_rgba(238,134,169,0.35)]" />
        <h1 className="font-title text-2xl font-bold tracking-tight">맘무스</h1>
        <p className="text-center text-xs leading-relaxed text-slate-400">
          큰맘 먹고 떠나는 커플 여행<br />로그인하면 동행자와 실시간으로 함께 계획해요
        </p>
      </div>

      <div className="relative w-full max-w-xs space-y-2.5">
        <button
          onClick={() => signInWith('kakao')}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#FEE500] py-3 text-sm font-bold text-[#3a1d1d] active:scale-[0.98]"
        >
          <span className="text-base">💬</span> 카카오로 시작
        </button>
        <button
          onClick={() => signInWith('google')}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-white py-3 text-sm font-bold text-[#1f1a26] active:scale-[0.98]"
        >
          <span className="font-serif text-base">G</span> 구글로 시작
        </button>
      </div>

      <div className="flex w-full max-w-xs items-center gap-3 text-[11px] text-slate-600">
        <span className="h-px flex-1 bg-moose-edge" /> 또는 <span className="h-px flex-1 bg-moose-edge" />
      </div>

      <button
        onClick={() => setPinMode(true)}
        className="flex items-center gap-1.5 text-xs text-slate-400"
      >
        <KeyRound size={13} /> PIN으로 계속 (이 기기에만 저장)
      </button>
    </div>
  );
}
