// 여행지별 최소 참고 데이터 — 구역 가이드 + 대표 스팟/맛집 (공개 정보 기반, 개인정보 아님).
// 사용자 여행의 destination/timezone 으로 매칭. 문서에 저장되지 않는 읽기 전용 데이터.
import { AREA_GUIDES, type AreaGuide } from './zoneGuide';

export interface SeedPlace {
  name: string;       // 원어/영문 (지도 검색용)
  nameKo?: string;    // 한국어 표기
  category: string;
  area: string;
  note?: string;
  menu?: string;
}

export interface RegionData {
  id: string;
  label: string;
  match: RegExp;      // 목적지/여행이름 텍스트에 대해 test (도시 식별)
  tzFallback?: string; // 목적지가 비었거나 매칭 안 될 때만 쓰는 국가 단위 타임존
  zoneGuide: AreaGuide[];
  spots: SeedPlace[];
  restaurants: SeedPlace[];
}

/* ============================ 베트남 하노이 ============================ */
const HANOI: RegionData = {
  id: 'hanoi',
  label: '베트남 하노이',
  match: /하노이|hanoi|호치민|호찌민|다낭|나트랑|호이안|베트남|vietnam|danang|nha ?trang|hoi ?an/i,
  tzFallback: 'Asia/Ho_Chi_Minh',
  zoneGuide: AREA_GUIDES,
  spots: [
    { name: 'St. Joseph Cathedral', nameKo: '성요셉 성당', category: '랜드마크', area: '올드쿼터', note: '19세기 고딕 성당, 앞 광장 스냅 명소' },
    { name: 'Hoan Kiem Lake & Ngoc Son Temple', nameKo: '호안끼엠 호수 & 응옥썬 사당', category: '랜드마크', area: '올드쿼터', note: '하노이의 심장, 붉은 테훅교' },
    { name: "Ho Chi Minh Mausoleum, Ba Dinh Square", nameKo: '바딘 광장 & 호치민 묘소', category: '랜드마크', area: '바딘', note: '베트남 독립 성지' },
    { name: 'Tran Quoc Pagoda', nameKo: '진국사(쩐꾸옥 사원)', category: '랜드마크', area: '서호', note: '6세기 사찰, 서호 노을 명소' },
    { name: 'Temple of Literature Hanoi', nameKo: '하노이 문묘', category: '랜드마크', area: '바딘', note: '베트남 최초 국립대학(1070년)' },
    { name: 'Hanoi Train Street', nameKo: '하노이 기찻길 골목', category: '랜드마크', area: '올드쿼터', note: '민가 사이 기차 노선, 노천 카페' },
    { name: 'Dong Xuan Market', nameKo: '동쑤언 시장', category: '쇼핑', area: '올드쿼터', note: '3층 규모 최대 재래시장' },
  ],
  restaurants: [
    { name: 'Pho 10 Ly Quoc Su', nameKo: '포10 리꾸옥스', category: '현지식', area: '올드쿼터', menu: '소고기 쌀국수', note: '깊은 사골 육수 쌀국수' },
    { name: 'Bun Cha Dac Kim', nameKo: '분짜 닥킴', category: '현지식', area: '올드쿼터', menu: '분짜 세트·넴꾸어', note: '숯불 고기 향 진한 분짜' },
    { name: 'Cha Ca Thang Long', nameKo: '짜까 탕롱', category: '현지식', area: '올드쿼터', menu: '짜까(가물치 강황구이)', note: '허브와 볶는 하노이 가물치 구이' },
    { name: 'Bun Cha Huong Lien', nameKo: '분짜 흥리엔', category: '맛집', area: '바딘', menu: '오바마 콤보', note: '오바마 방문 분짜집' },
    { name: 'Cafe Giang', nameKo: '카페 지앙', category: '카페', area: '올드쿼터', menu: '에그커피', note: '에그커피 원조' },
    { name: 'Cafe Lam', nameKo: '카페 람', category: '카페', area: '올드쿼터', note: '하노이 3대 고전 카페' },
  ],
};

/* ============================ 일본 오사카 ============================ */
const OSAKA: RegionData = {
  id: 'osaka',
  label: '일본 오사카',
  match: /오사카|osaka/i,
  zoneGuide: [
    {
      id: 'namba', name: '난바·도톤보리', en: 'Namba / Dotonbori',
      intro: '오사카 최대 번화가 — 먹거리·간판·쇼핑이 한데',
      mustSee: [
        { place: '도톤보리 글리코 간판', desc: '에비스바시 다리에서 인증샷 필수' },
        { place: '호젠지 요코초', desc: '이끼 낀 부동명왕과 좁은 골목 술집거리' },
      ],
      food: [
        { place: '이치란·킨류 라멘', desc: '도톤보리 라멘 격전지' },
        { place: '타코야키 (아카오니·쿠쿠루)', desc: '난바 대표 타코야키' },
      ],
      cafe: { place: '호시노커피 난바', desc: '두툼한 팬케이크와 핸드드립' },
      shopping: { place: '신사이바시스지·난바시티', desc: '드럭스토어·SPA·백화점 밀집' },
      vibe: { place: '아메리카무라', desc: '오사카 젊은이들의 빈티지·스트리트 구역' },
      play: { place: '난바 그랜드 카게츠', desc: '오사카 만담(만자이) 극장' },
    },
    {
      id: 'umeda', name: '우메다·키타', en: 'Umeda / Kita',
      intro: '역·백화점·전망대가 모인 오사카의 관문',
      mustSee: [
        { place: '우메다 스카이빌딩 공중정원', desc: '360도 야경 전망대' },
        { place: '헵파이브 관람차', desc: '빨간 관람차, 오사카역 랜드마크' },
      ],
      food: [
        { place: '오사카 우메다 식당가', desc: '한큐·다이마루 백화점 데파치카' },
        { place: '키타신치', desc: '오사카 최고급 요릿집·바 골목 (밤)' },
      ],
      cafe: { place: '마루후쿠 커피점', desc: '1934년 창업 클래식 킷사텐' },
      shopping: { place: '그랜드프론트 오사카·루쿠아', desc: '오사카역 직결 복합몰' },
      vibe: { place: '나카자키초', desc: '오래된 나가야를 개조한 감성 카페·잡화 골목' },
      play: { place: '헵파이브 관람차 / 우메다 조이폴리스', desc: '실내 놀이시설' },
    },
    {
      id: 'osakajo', name: '오사카성·베이', en: 'Osaka Castle / Bay',
      intro: '역사 유적과 워터프론트 테마파크',
      mustSee: [
        { place: '오사카성 천수각', desc: '봄 벚꽃·가을 단풍 명소' },
        { place: '가이유칸 아쿠아리움', desc: '세계 최대급 수족관, 고래상어' },
      ],
      food: [
        { place: '조노야마 텐만구 근처 오코노미야키', desc: '성 근처 로컬 맛집' },
        { place: '덴포잔 마켓플레이스 나니와쿠이신보요코초', desc: '레트로 푸드코트' },
      ],
      cafe: { place: '스타벅스 오사카성 공원점', desc: '해자 뷰 카페' },
      shopping: { place: '덴포잔 마켓플레이스', desc: '베이 지역 쇼핑몰' },
      vibe: { place: '오사카성 공원 산책로', desc: '조깅·피크닉하는 현지인' },
      play: { place: '유니버설 스튜디오 재팬(USJ)', desc: '베이 지역, 별도 하루 필요' },
    },
  ],
  spots: [
    { name: 'Osaka Castle', nameKo: '오사카성', category: '랜드마크', area: '오사카성', note: '천수각 전망대, 벚꽃 명소' },
    { name: 'Dotonbori Glico Sign', nameKo: '도톤보리 글리코 간판', category: '랜드마크', area: '난바', note: '에비스바시 다리 인증샷' },
    { name: 'Umeda Sky Building Kuchu Teien', nameKo: '우메다 스카이빌딩 공중정원', category: '전망대', area: '우메다', note: '360도 야경' },
    { name: 'Osaka Aquarium Kaiyukan', nameKo: '가이유칸', category: '아쿠아리움', area: '베이', note: '고래상어, 세계 최대급' },
    { name: 'Shitennoji Temple', nameKo: '시텐노지', category: '랜드마크', area: '텐노지', note: '일본 최초 관사 사찰(593년)' },
    { name: 'Universal Studios Japan', nameKo: '유니버설 스튜디오 재팬', category: '테마파크', area: '베이', note: '별도 하루 필요' },
  ],
  restaurants: [
    { name: 'Kinryu Ramen Dotonbori', nameKo: '킨류 라멘 도톤보리', category: '라멘', area: '난바', menu: '돈코츠 라멘', note: '용 간판, 무료 김치·부추' },
    { name: 'Takoyaki Wanaka Sennichimae', nameKo: '타코야키 와나카', category: '분식', area: '난바', menu: '타코야키', note: '난바 대표 타코야키' },
    { name: 'Mizuno Okonomiyaki', nameKo: '미즈노 오코노미야키', category: '오코노미야키', area: '난바', menu: '야마이모야키', note: '도톤보리 노포, 미쉐린 빕구르망' },
    { name: 'Harukoma Sushi Tenjinbashisuji', nameKo: '하루코마 스시', category: '스시', area: '텐진바시', menu: '런치 스시', note: '가성비 줄서는 스시집' },
    { name: 'Marufuku Coffee Senba', nameKo: '마루후쿠 커피', category: '카페', area: '난바', menu: '블렌드 커피', note: '1934년 창업 클래식 킷사텐' },
    { name: '551 Horai Namba', nameKo: '551 호라이', category: '만두', area: '난바', menu: '부타망(고기만두)', note: '오사카 여행 필수 간식' },
  ],
};

/* ============================ 일본 도쿄 ============================ */
const TOKYO: RegionData = {
  id: 'tokyo',
  label: '일본 도쿄',
  match: /도쿄|동경|tokyo|하코네|요코하마|가마쿠라|hakone|yokohama|kamakura/i,
  zoneGuide: [
    {
      id: 'shibuya', name: '시부야·하라주쿠', en: 'Shibuya / Harajuku',
      intro: '도쿄 젊음의 중심 — 스크램블·패션·카페',
      mustSee: [
        { place: '시부야 스크램블 교차로', desc: '스타벅스 2층·시부야 스카이에서 조망' },
        { place: '메이지 신궁', desc: '하라주쿠 옆 도심 숲 신사' },
      ],
      food: [
        { place: '우오베이 스시 (회전초밥)', desc: '시부야 가성비 터치패널 초밥' },
        { place: '이치란·아후리 라멘', desc: '시부야 라멘 대표' },
      ],
      cafe: { place: '블루보틀·아라비카 (하라주쿠)', desc: '스페셜티 커피' },
      shopping: { place: '시부야 스크램블 스퀘어·다케시타 거리', desc: '패션·잡화·기념품' },
      vibe: { place: '캣스트리트', desc: '하라주쿠~시부야 잇는 감성 산책로' },
      play: { place: '시부야 스카이', desc: '옥상 전망대, 예약 권장' },
    },
    {
      id: 'shinjuku', name: '신주쿠', en: 'Shinjuku',
      intro: '세계 최대 역 + 밤 문화 + 정원',
      mustSee: [
        { place: '도쿄도청 전망대', desc: '무료 야경 전망대' },
        { place: '신주쿠 교엔', desc: '넓은 정원, 봄 벚꽃 명소' },
      ],
      food: [
        { place: '오모이데요코초', desc: '전후 분위기 꼬치구이 골목' },
        { place: '멘야 무사시·후운지', desc: '츠케멘 명가' },
      ],
      cafe: { place: '4/4 시소 커피', desc: '신주쿠 스페셜티' },
      shopping: { place: '이세탄·빅카메라·돈키호테', desc: '백화점·전자·잡화' },
      vibe: { place: '골든가이', desc: '좁은 골목 미니 바 200여 개' },
      play: { place: 'VR ZONE / 신주쿠 극장가', desc: '실내 오락' },
    },
    {
      id: 'asakusa', name: '아사쿠사·우에노', en: 'Asakusa / Ueno',
      intro: '도쿄의 옛 정취 — 절·시장·박물관',
      mustSee: [
        { place: '센소지 & 나카미세 거리', desc: '도쿄 최고(最古) 사찰, 카미나리몬' },
        { place: '도쿄 스카이트리', desc: '634m 전망 타워, 아사쿠사에서 도보권' },
      ],
      food: [
        { place: '아사쿠사 몬자·텐동', desc: '나카미세 주변 노포' },
        { place: '우에노 아메요코 시장', desc: '길거리 해산물·카이센동' },
      ],
      cafe: { place: '가마쿠라 커피·시로쿠마 (아사쿠사)', desc: '레트로 킷사' },
      shopping: { place: '나카미세 거리·갓파바시 도구거리', desc: '기념품·주방용품' },
      vibe: { place: '스미다 강변 산책', desc: '스카이트리·야카타부네 뷰' },
      play: { place: '우에노 동물원 / 국립박물관', desc: '가족 단위 코스' },
    },
  ],
  spots: [
    { name: 'Senso-ji Temple', nameKo: '센소지', category: '랜드마크', area: '아사쿠사', note: '도쿄 최고 사찰, 카미나리몬·나카미세' },
    { name: 'Shibuya Scramble Crossing', nameKo: '시부야 스크램블 교차로', category: '랜드마크', area: '시부야', note: '세계에서 가장 붐비는 횡단보도' },
    { name: 'Meiji Jingu Shrine', nameKo: '메이지 신궁', category: '랜드마크', area: '하라주쿠', note: '도심 속 숲 신사' },
    { name: 'Tokyo Skytree', nameKo: '도쿄 스카이트리', category: '전망대', area: '아사쿠사', note: '634m, 아사쿠사 도보권' },
    { name: 'teamLab Planets Toyosu', nameKo: '팀랩 플래닛', category: '전시', area: '도요스', note: '몰입형 디지털 아트, 예약 필수' },
    { name: 'Shinjuku Gyoen', nameKo: '신주쿠 교엔', category: '공원', area: '신주쿠', note: '봄 벚꽃 명소' },
  ],
  restaurants: [
    { name: 'Ichiran Shibuya', nameKo: '이치란 시부야', category: '라멘', area: '시부야', menu: '돈코츠 라멘', note: '1인 부스 라멘' },
    { name: 'Uobei Shibuya Dogenzaka', nameKo: '우오베이 시부야', category: '스시', area: '시부야', menu: '터치패널 회전초밥', note: '가성비 갑' },
    { name: 'Fuunji Shinjuku', nameKo: '후운지', category: '츠케멘', area: '신주쿠', menu: '토리파이탄 츠케멘', note: '줄서는 츠케멘 명가' },
    { name: 'Omoide Yokocho', nameKo: '오모이데 요코초', category: '이자카야', area: '신주쿠', menu: '야키토리', note: '전후 분위기 꼬치 골목' },
    { name: 'Bic Camera / Don Quijote', nameKo: '', category: '', area: '', note: '' },
    { name: 'Kagari Ginza', nameKo: '카가리 긴자', category: '라멘', area: '긴자', menu: '토리파이탄 소바', note: '미쉐린 라멘, 예약 앱' },
  ].filter((r) => r.name && r.category),
};

/* ============================ 일본 후쿠오카 ============================ */
const FUKUOKA: RegionData = {
  id: 'fukuoka',
  label: '일본 후쿠오카',
  match: /후쿠오카|하카타|기타큐슈|fukuoka|hakata|dazaifu|다자이후/i,
  zoneGuide: [
    {
      id: 'hakata', name: '하카타·나카스', en: 'Hakata / Nakasu',
      intro: '규슈의 관문 — 돈코츠 라멘과 포장마차의 본고장',
      mustSee: [
        { place: '나카스 야타이(포장마차) 거리', desc: '강변 밤 포장마차, 후쿠오카 상징' },
        { place: '캐널시티 하카타', desc: '운하가 흐르는 복합몰, 분수쇼' },
      ],
      food: [
        { place: '잇푸도·신신 라멘', desc: '하카타 돈코츠 라멘 대표' },
        { place: '모츠나베 (오오야마·라쿠텐치)', desc: '곱창전골, 후쿠오카 명물' },
      ],
      cafe: { place: '레크 커피(REC COFFEE)', desc: '후쿠오카 대표 스페셜티' },
      shopping: { place: '하카타역 · 캐널시티 · 텐진 지하상가', desc: '기념품·SPA·잡화' },
      vibe: { place: '나카스 강변', desc: '밤이 되면 네온과 포장마차' },
      play: { place: '보스 이존 후쿠오카 / 팀랩 포레스트', desc: '실내 체험' },
    },
    {
      id: 'tenjin', name: '텐진·다이묘', en: 'Tenjin / Daimyo',
      intro: '후쿠오카 최대 상업지구 + 힙한 골목',
      mustSee: [
        { place: '아크로스 후쿠오카 스텝가든', desc: '건물 전체가 계단식 정원' },
        { place: '오호리 공원', desc: '큰 호수와 산책로, 스타벅스' },
      ],
      food: [
        { place: '다이묘 우동·야키토리', desc: '골목 로컬 맛집' },
        { place: '텐진 이토킨(우동)', desc: '고보텐 우동' },
      ],
      cafe: { place: 'MANU COFFEE 다이묘', desc: '늦게까지 여는 감성 카페' },
      shopping: { place: '텐진 파르코·다이묘 편집숍', desc: '패션·빈티지' },
      vibe: { place: '다이묘 뒷골목', desc: '개성 있는 바·카페 밀집' },
      play: { place: '후쿠오카 타워 / 마리존', desc: '베이 지역 데이트' },
    },
  ],
  spots: [
    { name: 'Canal City Hakata', nameKo: '캐널시티 하카타', category: '쇼핑몰', area: '하카타', note: '운하·분수쇼가 있는 복합몰' },
    { name: 'Nakasu Yatai Street', nameKo: '나카스 야타이 거리', category: '밤문화', area: '나카스', note: '강변 포장마차, 후쿠오카 상징' },
    { name: 'Ohori Park', nameKo: '오호리 공원', category: '공원', area: '텐진', note: '호수 산책로, 스타벅스' },
    { name: 'Fukuoka Tower', nameKo: '후쿠오카 타워', category: '전망대', area: '베이', note: '234m, 야경' },
    { name: 'Dazaifu Tenmangu', nameKo: '다자이후 텐만구', category: '랜드마크', area: '다자이후', note: '학문의 신, 근교 당일치기' },
  ],
  restaurants: [
    { name: 'Ippudo Daimyo Honten', nameKo: '잇푸도 다이묘 본점', category: '라멘', area: '다이묘', menu: '시로마루 모토아지', note: '하카타 돈코츠 본점' },
    { name: 'Shin Shin Tenjin', nameKo: '신신 텐진', category: '라멘', area: '텐진', menu: '돈코츠 라멘', note: '현지인 줄서는 라멘' },
    { name: 'Motsunabe Oyama Honten', nameKo: '모츠나베 오오야마', category: '전골', area: '하카타', menu: '모츠나베(곱창전골)', note: '후쿠오카 명물' },
    { name: 'Hakata Issou', nameKo: '하카타 잇소', category: '라멘', area: '하카타', menu: '돈코츠 라멘', note: '진한 국물, 하카타역 근처' },
    { name: 'REC COFFEE Yakuin', nameKo: '레크 커피 야쿠인', category: '카페', area: '야쿠인', menu: '핸드드립', note: '후쿠오카 대표 스페셜티' },
  ],
};

/* ============================ 태국 방콕 ============================ */
const BANGKOK: RegionData = {
  id: 'bangkok',
  label: '태국 방콕',
  match: /방콕|bangkok|파타야|아유타야|pattaya|ayutthaya/i,
  zoneGuide: [
    {
      id: 'sukhumvit', name: '수쿰빗', en: 'Sukhumvit',
      intro: '외국인·젊은층의 중심 — BTS 따라 쇼핑·나이트라이프',
      mustSee: [
        { place: '터미널21', desc: '층마다 다른 도시 컨셉 쇼핑몰' },
        { place: '벤차키티 공원', desc: '스카이워크와 호수, 도심 오아시스' },
      ],
      food: [
        { place: '쏨분 씨푸드', desc: '뿌팟퐁커리(게 카레) 유명' },
        { place: '수쿰빗 소이 38 야시장', desc: '길거리 음식 (야간)' },
      ],
      cafe: { place: 'Roots·Roast (엠쿼티어)', desc: '방콕 스페셜티 대표' },
      shopping: { place: '엠쿼티어·엠포리움·터미널21', desc: 'BTS 프롬퐁·아쏙 직결' },
      vibe: { place: '통러(Thonglor)', desc: '방콕의 청담동, 힙한 바·카페' },
      play: { place: '루프탑 바 (옥타브·above eleven)', desc: '수쿰빗 야경' },
    },
    {
      id: 'oldtown', name: '올드타운·라따나꼬신', en: 'Old Town / Rattanakosin',
      intro: '왕궁과 사원이 모인 방콕의 역사 심장',
      mustSee: [
        { place: '왓 프라깨우 & 왕궁', desc: '에메랄드 불상, 복장 규정 있음' },
        { place: '왓 아룬 (새벽 사원)', desc: '차오프라야 강 건너 노을 명소' },
      ],
      food: [
        { place: '팁싸마이 팟타이', desc: '방콕 대표 팟타이 노포' },
        { place: '나이몽 허이텅', desc: '미쉐린 굴전(허이텅)' },
      ],
      cafe: { place: 'The Bar Upstairs / 온눗 커피', desc: '올드타운 감성 카페' },
      shopping: { place: '빠끄롱 꽃시장·타차 야시장', desc: '재래시장·수공예' },
      vibe: { place: '차오프라야 강변 · 카오산로드', desc: '보트 투어와 배낭여행 거리' },
      play: { place: '아시아티크 더 리버프론트', desc: '강변 야시장 + 관람차' },
    },
    {
      id: 'siam', name: '시암·칫롬', en: 'Siam / Chit Lom',
      intro: '방콕 최대 쇼핑 허브',
      mustSee: [
        { place: '에라완 사당', desc: '4면불, 소원 명소' },
        { place: '짐 톰슨 하우스', desc: '전통 타이 가옥 박물관' },
      ],
      food: [
        { place: '반쿤매·쏨탐 누아', desc: '시암 근처 태국 가정식' },
        { place: '아이콘시암 쑥시암 푸드홀', desc: '실내 수상시장 컨셉' },
      ],
      cafe: { place: 'Factory Coffee (파야타이)', desc: '월드 바리스타 챔피언 카페' },
      shopping: { place: '시암 파라곤·센트럴월드·MBK', desc: '럭셔리~로컬 다 있음' },
      vibe: { place: '시암 스퀘어', desc: '태국 10~20대 문화 중심' },
      play: { place: '시라이프 방콕 오션월드', desc: '시암 파라곤 지하 아쿠아리움' },
    },
  ],
  spots: [
    { name: 'Wat Arun', nameKo: '왓 아룬(새벽 사원)', category: '랜드마크', area: '올드타운', note: '차오프라야 강변 노을 명소' },
    { name: 'The Grand Palace Bangkok', nameKo: '왕궁 & 왓 프라깨우', category: '랜드마크', area: '올드타운', note: '복장 규정(어깨·무릎 가리기)' },
    { name: 'Wat Pho', nameKo: '왓 포(와불사원)', category: '랜드마크', area: '올드타운', note: '46m 와불상, 타이 마사지 발상지' },
    { name: 'ICONSIAM', nameKo: '아이콘시암', category: '쇼핑몰', area: '강변', note: '실내 수상시장·분수쇼' },
    { name: 'Chatuchak Weekend Market', nameKo: '짜뚜짝 주말시장', category: '쇼핑', area: '짜뚜짝', note: '주말만, 15,000개 점포' },
    { name: 'Asiatique The Riverfront', nameKo: '아시아티크', category: '야시장', area: '강변', note: '관람차·강변 야시장 (야간)' },
  ],
  restaurants: [
    { name: 'Som Tam Nua Siam Square', nameKo: '쏨탐 누아', category: '태국식', area: '시암', menu: '쏨탐·까이텃(닭튀김)', note: '시암 줄서는 쏨탐집' },
    { name: 'Thipsamai Pad Thai', nameKo: '팁싸마이 팟타이', category: '태국식', area: '올드타운', menu: '꿍쏫 팟타이', note: '방콕 대표 팟타이 노포' },
    { name: 'Somboon Seafood', nameKo: '쏨분 씨푸드', category: '해산물', area: '수쿰빗', menu: '뿌팟퐁커리', note: '게 카레의 원조' },
    { name: 'Nai Mong Hoi Thod', nameKo: '나이몽 허이텅', category: '태국식', area: '차이나타운', menu: '허이텅(굴전)', note: '미쉐린 빕구르망' },
    { name: 'Roast The EmQuartier', nameKo: '로스트', category: '카페', area: '수쿰빗', menu: '브런치·커피', note: '엠쿼티어 브런치 카페' },
    { name: 'After You Dessert Cafe', nameKo: '애프터 유', category: '디저트', area: '시암', menu: '시부야 허니토스트·빙수', note: '태국 국민 디저트 체인' },
  ],
};

export const REGIONS: RegionData[] = [HANOI, OSAKA, TOKYO, FUKUOKA, BANGKOK];

/**
 * 여행지 데이터 찾기.
 * 1순위: 목적지·여행이름 텍스트로 도시 식별 (오사카/도쿄 구분).
 * 2순위: 목적지가 비었을 때만 국가 단위 타임존 fallback (예: 베트남).
 */
export function regionFor(destination?: string, timezone?: string, tripName?: string): RegionData | null {
  const text = `${destination ?? ''} ${tripName ?? ''}`.trim();
  if (text) {
    const hit = REGIONS.find((r) => r.match.test(text));
    if (hit) return hit;
  }
  if (timezone) {
    const hit = REGIONS.find((r) => r.tzFallback === timezone);
    if (hit) return hit;
  }
  return null;
}
