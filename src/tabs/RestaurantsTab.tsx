import PlacesView from './PlacesView';

/** 탐색 탭 — 관광지·맛집·숙소를 검색으로 한 번에. */
export default function RestaurantsTab() {
  return (
    <div className="flex h-full flex-col">
      <PlacesView embedded />
    </div>
  );
}
