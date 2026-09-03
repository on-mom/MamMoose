import type { Libraries } from '@react-google-maps/api';

/** useJsApiLoader 공용 옵션 — 같은 id('gmaps')는 모든 호출이 동일 옵션이어야 함.
 *  배열은 모듈 상수로 고정 (렌더마다 새 참조면 로더가 경고). */
export const GMAPS_LIBRARIES: Libraries = ['places'];
export const GMAPS_LANGUAGE = 'ko';
export const GMAPS_LOADER_ID = 'gmaps';
