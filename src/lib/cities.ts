/** 여행지 선택용 도시 목록 (라벨 → IANA 타임존) */
export const CITY_TZ: { label: string; tz: string }[] = [
  { label: '베트남 · 하노이/호치민', tz: 'Asia/Ho_Chi_Minh' },
  { label: '태국 · 방콕', tz: 'Asia/Bangkok' },
  { label: '한국 · 서울', tz: 'Asia/Seoul' },
  { label: '일본 · 도쿄/오사카', tz: 'Asia/Tokyo' },
  { label: '대만 · 타이베이', tz: 'Asia/Taipei' },
  { label: '싱가포르 · 말레이시아', tz: 'Asia/Singapore' },
  { label: '인도네시아 · 발리', tz: 'Asia/Makassar' },
  { label: '필리핀 · 세부/마닐라', tz: 'Asia/Manila' },
  { label: '홍콩 · 마카오', tz: 'Asia/Hong_Kong' },
  { label: '중국 · 상하이/베이징', tz: 'Asia/Shanghai' },
  { label: '괌 · 사이판', tz: 'Pacific/Guam' },
  { label: '아랍에미리트 · 두바이', tz: 'Asia/Dubai' },
  { label: '튀르키예 · 이스탄불', tz: 'Europe/Istanbul' },
  { label: '유럽 · 파리/로마/베를린', tz: 'Europe/Paris' },
  { label: '영국 · 런던', tz: 'Europe/London' },
  { label: '미국 동부 · 뉴욕', tz: 'America/New_York' },
  { label: '미국 서부 · LA/라스베이거스', tz: 'America/Los_Angeles' },
  { label: '하와이 · 호놀룰루', tz: 'Pacific/Honolulu' },
  { label: '호주 · 시드니', tz: 'Australia/Sydney' },
];

export const tzLabel = (tz: string) => CITY_TZ.find((c) => c.tz === tz)?.label ?? tz;
