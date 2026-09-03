import { Heart } from 'lucide-react';

/**
 * "하트 뿔 맞댄 두 맘무" — 추억함 헤더.
 * 기존 마스코트 이미지 2개를 서로 기대게 배치 + 가운데 하트.
 * (전용 일러스트 시안이 나오면 이 컴포넌트만 교체)
 */
export default function CoupleMoose({ className = '' }: { className?: string }) {
  return (
    <div className={`relative flex items-end justify-center ${className}`}>
      <img
        src="/moose-face.png"
        alt=""
        className="h-16 w-16 -mr-2 rounded-full object-cover"
        style={{ transform: 'rotate(-12deg)' }}
      />
      <span className="relative z-10 -mb-1 rounded-full bg-moose-heart p-1.5 text-white shadow-lg">
        <Heart size={14} fill="currentColor" />
      </span>
      <img
        src="/moose-face.png"
        alt=""
        className="h-16 w-16 -ml-2 rounded-full object-cover"
        style={{ transform: 'rotate(12deg) scaleX(-1)' }}
      />
    </div>
  );
}
