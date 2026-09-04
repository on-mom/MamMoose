/**
 * 구역 가이드 — 02 xlsx "지역별 특성" 시트에서 옮겨온 데이터.
 * 각 구역의 한 줄 소개 + 필수 코스·맛집·카페·쇼핑·분위기·놀이시설.
 */
export interface GuideItem { place: string; desc?: string }
export interface AreaGuide {
  id: string;
  name: string;
  en: string;
  intro: string;
  photo?: string;   // 대표 랜드마크 사진 (public/zones) — 있으면 배너
  credit?: string;  // 사진 출처
  mustSee: GuideItem[];
  food: GuideItem[];
  cafe: GuideItem;
  shopping: GuideItem;
  vibe: GuideItem;
  play: GuideItem;
}

export const AREA_GUIDES: AreaGuide[] = [
  {
    id: 'oldq', name: '올드쿼터', en: 'Old Quarter',
    intro: '구시가지 — 역사와 전통이 숨 쉬는 관광 중심지',
    photo: '/zones/oldq.jpg',
    credit: '응옥선 사당 · © Richard Mortel (CC BY 2.0)',
    mustSee: [
      { place: '호안끼엠 호수 주말 차 없는 거리', desc: '현지인 나들이·데이트 명소' },
      { place: '성요셉 성당 & 응옥썬 사당', desc: '외국인 필수 코스 (호안끼엠 호수)' },
    ],
    food: [
      { place: 'Phở Thìn 13 Lò Đúc (파똔 파)', desc: '파가 듬뿍 들어간 파쌀국수 현지 최고 맛집' },
      { place: 'Curry King Hanoi', desc: '올드쿼터 내 향신료 풍미 커리 전문점' },
    ],
    cafe: { place: 'Café Lâm', desc: '하노이 3대 고전 카페 중 하나, 깊고 진한 전통 드립 연유커피' },
    shopping: { place: '동쑤언 시장 (Chợ Đồng Xuân)', desc: '의류·건과일·가방을 흥정하며 사는 대형 전통 재래시장' },
    vibe: { place: '맥주 거리 (Tạ Hiện Street)', desc: '목욕탕 의자에 앉아 해바라기씨와 맥주를 즐기는 올드쿼터의 밤 감성' },
    play: { place: '탕롱 수상인형극장', desc: '베트남 전통 민속 수상인형극 공연장' },
  },
  {
    id: 'badinh', name: '바딘', en: 'Ba Dinh',
    intro: '정치·문화의 중심이자 청린 지대의 고급 주거 구역',
    photo: '/zones/badinh.jpg',
    credit: '호치민 묘소 · © NKSTTSSHNVN (CC BY-SA 4.0)',
    mustSee: [
      { place: '바딘 광장 주변 산책로 · 쭉박(Trúc Bạch) 호수 산책길', desc: '현지인 나들이·데이트 명소' },
      { place: '바딘 광장(호치민 생가/묘소) · 바딘 문묘(하노이 국립대학)', desc: '외국인 필수 코스' },
    ],
    food: [
      { place: 'Bún Chả Hương Liên (분짜 흥리엔)', desc: '오바마 대통령 방문으로 유명, 현지인도 줄 서는 분짜 전문점' },
      { place: 'Pistachio Bistro', desc: '베트남 이주 프랑스 셰프가 운영하는 가성비 프렌치 비스트로' },
    ],
    cafe: { place: 'Café Giang (바딘 지점)', desc: '베트남식 연유커피와 에그커피 원조 브랜드' },
    shopping: { place: '롯데센터 하노이', desc: '기념품·커피·건과일 사기 가장 깨끗하고 편리한 롯데마트' },
    vibe: { place: '판딘풍 거리 (Phan Đình Phùng)', desc: '하노이에서 가장 아름다운 가로수길, 베트남 특유의 감성' },
    play: { place: '하노이 대관람차 · 롯데타워 전망대', desc: '롯데타워 전망대에서 즐기는 하노이 전경' },
  },
  {
    id: 'taiho', name: '서호', en: 'Tay Ho',
    intro: '트렌디한 외국인 주재원 및 고급 부촌 구역',
    photo: '/zones/taiho.jpg',
    credit: '진국사(쩐꾸옥 사원) · © RB Photo (CC BY 4.0)',
    mustSee: [
      { place: '서호 자전거 도로 & 수련 꽃밭 / 노을 스팟 (Hồ Tây)', desc: '현지인 나들이·데이트 명소' },
      { place: '진국사 (Chùa Trấn Quốc)', desc: '하노이에서 가장 오래된 사찰' },
    ],
    food: [
      { place: 'Bánh Tôm Hồ Tây', desc: '서호 특산 새우튀김(반똠)을 서호 풍경 보며 먹는 로컬 식당' },
      { place: 'Maison de Tet Decor', desc: '유기농 홈메이드 브런치 & 해외 풍미 요리 전문점' },
    ],
    cafe: { place: 'Maison Marou Tay Ho', desc: '프리미엄 베트남 카카오 에스프레소 연유커피 및 수제 초콜릿 디저트' },
    shopping: { place: '롯데몰 서호 (Lotte Mall West Lake)', desc: '하노이 최대 규모 쇼핑몰 — 롯데마트·아쿠아리움 결합' },
    vibe: { place: '꽝안 (Quảng An) 산책로', desc: '호숫가 따라 형성된 로맨틱한 베트남·유럽풍 혼합 감성 거리' },
    play: { place: '서호 워터파크 (Công viên Nước Hồ Tây)', desc: '하노이 대표 야외 워터파크 및 유원지' },
  },
  {
    id: 'caugiay', name: '꺼우저이', en: 'Cau Giay',
    intro: '신도시 및 현지 부촌 생활권',
    photo: '/zones/caugiay.jpg',
    credit: 'Keangnam 랜드마크 72 · © Soyoungah (CC BY-SA 3.0)',
    mustSee: [
      { place: '꺼우저이 공원 (Công viên Cầu Giấy)', desc: '현지 가족/커플들의 힐링 스팟' },
      { place: '베트남 민족학 박물관 (Museum of Ethnology)', desc: '베트남 54개 민족 문화 체험' },
    ],
    food: [
      { place: 'Bánh Xèo Tôn Đức Thắng (꺼우저이점)', desc: '바삭한 반세오와 넴루이를 즐기는 로컬 맛집' },
      { place: 'Zaika Indian Restaurant', desc: '이주 인도 셰프가 운영하는 정통 인도 커리 전문점' },
    ],
    cafe: { place: 'AHA Coffee (꺼우저이점)', desc: '현지인들이 노천에 앉아 연유커피를 마시는 스트리트 로컬 체인' },
    shopping: { place: 'Big C 마트 (GO! Thăng Long)', desc: '현지인들이 실제 장을 보는 대형 복합 쇼핑몰 및 마트' },
    vibe: { place: '호앙다오투이 대학가 골목', desc: '현지 대학생·젊은 층의 활기찬 실생활권 풍경' },
    play: { place: 'Keangnam Landmark 72 3D', desc: '랜드마크 타워 내 복합 실내 놀이 공간' },
  },
];
