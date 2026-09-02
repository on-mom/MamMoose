import { useState } from 'react';
import TimelineView from './TimelineView';
import MapView from './MapView';

export default function ScheduleTab() {
  const [sub, setSub] = useState<'timeline' | 'route'>('timeline');
  return (
    <div>
      <div className="edge pt-3">
        <div className="flex gap-1 rounded-lg bg-moose-dusk p-1 text-xs">
          <button
            onClick={() => setSub('timeline')}
            className={`flex-1 rounded-md py-1.5 ${sub === 'timeline' ? 'bg-moose-heart text-white' : 'text-slate-400'}`}
          >
            타임라인
          </button>
          <button
            onClick={() => setSub('route')}
            className={`flex-1 rounded-md py-1.5 ${sub === 'route' ? 'bg-moose-heart text-white' : 'text-slate-400'}`}
          >
            동선
          </button>
        </div>
      </div>
      {sub === 'timeline' ? <TimelineView /> : <MapView />}
    </div>
  );
}
