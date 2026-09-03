import { useState } from 'react';
import TimelineView from './TimelineView';
import MapView from './MapView';
import ZoneGuideView from './ZoneGuideView';

type Sub = 'timeline' | 'route' | 'guide';
const TABS: [Sub, string][] = [['timeline', '타임라인'], ['route', '동선'], ['guide', '구역 가이드']];

export default function ScheduleTab() {
  const [sub, setSub] = useState<Sub>('timeline');
  return (
    <div className="flex h-full flex-col">
      <div className="min-h-0 flex-1">
        {sub === 'timeline' ? <TimelineView /> : sub === 'route' ? <MapView /> : <ZoneGuideView />}
      </div>
      {/* 하단 고정 전환 바 (엄지 접근) */}
      <div className="edge shrink-0 border-t border-moose-edge bg-moose-night/95 py-2 backdrop-blur">
        <div className="flex gap-1 rounded-lg bg-moose-dusk p-1 text-xs">
          {TABS.map(([k, l]) => (
            <button
              key={k}
              onClick={() => setSub(k)}
              className={`flex-1 rounded-md py-2 ${sub === k ? 'bg-moose-heart text-white' : 'text-slate-400'}`}
            >
              {l}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
