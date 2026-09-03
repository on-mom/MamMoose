import { useState } from 'react';
import TimelineView from './TimelineView';
import MapView from './MapView';
import PlacesView from './PlacesView';

type Sub = 'timeline' | 'route' | 'places';
const TABS: [Sub, string][] = [['timeline', '타임라인'], ['route', '동선'], ['places', '장소']];

export default function ScheduleTab() {
  const [sub, setSub] = useState<Sub>('timeline');
  return (
    <div>
      <div className="edge pt-3">
        <div className="flex gap-1 rounded-lg bg-moose-dusk p-1 text-xs">
          {TABS.map(([k, l]) => (
            <button
              key={k}
              onClick={() => setSub(k)}
              className={`flex-1 rounded-md py-1.5 ${sub === k ? 'bg-moose-heart text-white' : 'text-slate-400'}`}
            >
              {l}
            </button>
          ))}
        </div>
      </div>
      {sub === 'timeline' && <TimelineView />}
      {sub === 'route' && <MapView />}
      {sub === 'places' && <PlacesView />}
    </div>
  );
}
