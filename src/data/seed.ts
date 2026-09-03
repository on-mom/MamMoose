// 하노이 참고 데이터(맛집/호텔/명소)는 공개 정보 기반 예시.
// 항공편·날짜·일정·가계부·일기는 전부 가상의 예시 값 (개인정보 아님).
import type { Restaurant, Hotel, Spot, Project, TimelineItem, Todo, Expense, DiaryEntry } from '../types';

export const SEED_RESTAURANTS: Omit<Restaurant, 'id' | 'projectId'>[] = [
  {
    "name": "Phở 10 Lý Quốc Sư",
    "nameKo": "포10 리꾸옥스 (쌀국수)",
    "category": "현지식",
    "area": "올드쿼터",
    "mapUrl": "https://maps.google.com/?q=Pho+10+Ly+Quoc+Su+Hanoi",
    "priceVndText": "180,000~240,000 VND",
    "priceKrwText": "약 10,000~13,000원",
    "priceVndAvg": 210000,
    "note": "깊은 사골 육수 원조 쇠고기 쌀국수",
    "menu": "포 보 따이 (소고기 쌀국수) · 짜꾸어"
  },
  {
    "name": "Bún Chả Đắc Kim",
    "nameKo": "분짜 닥킴",
    "category": "현지식",
    "area": "올드쿼터",
    "mapUrl": "https://maps.google.com/?q=Bun+Cha+Dac+Kim+Hanoi",
    "priceVndText": "160,000~220,000 VND",
    "priceKrwText": "약 9,000~12,000원",
    "priceVndAvg": 190000,
    "note": "숯불 고기 향이 진한 로컬 분짜 전문점",
    "menu": "분짜 세트 · 넴꾸어 (게살 튀김롤)"
  },
  {
    "name": "Bánh Cuốn Bà Hoành",
    "nameKo": "반꾸온 바호아인",
    "category": "현지식",
    "area": "하이바쯩",
    "mapUrl": "https://maps.google.com/?q=Banh+Cuon+Ba+Hoanh+Hanoi",
    "priceVndText": "100,000~140,000 VND",
    "priceKrwText": "약 5,500~7,500원",
    "priceVndAvg": 120000,
    "note": "얇고 쫄깃한 전통 쌀피 쌈(반꾸온)",
    "menu": "반꾸온 농 · 짜 하노이"
  },
  {
    "name": "Chả Cá Thăng Long",
    "nameKo": "짜까 탕롱",
    "category": "현지식",
    "area": "바딘/올드쿼터",
    "mapUrl": "https://maps.google.com/?q=Cha+Ca+Thang+Long+Hanoi",
    "priceVndText": "360,000~440,000 VND",
    "priceKrwText": "약 20,000~24,000원",
    "priceVndAvg": 400000,
    "note": "허브와 함께 볶는 하노이 가물치 구이",
    "menu": "짜까 (가물치 강황·딜 구이) — 단일 메뉴"
  },
  {
    "name": "Bún Ốc Cô Thủy",
    "nameKo": "분옥 꼬투이",
    "category": "현지식",
    "area": "뻐남",
    "mapUrl": "https://maps.google.com/?q=Bun+Oc+Co+Thuy+Hanoi",
    "priceVndText": "90,000~120,000 VND",
    "priceKrwText": "약 5,000~6,500원",
    "priceVndAvg": 105000,
    "note": "시원하고 칼칼한 현지 우렁이 쌀국수",
    "menu": "분옥 농 (뜨거운 우렁이 쌀국수)"
  },
  {
    "name": "Bún Đậu Mắm Tôm Cô Tuyến",
    "nameKo": "분더우맘똠 꼬뚜옌",
    "category": "현지식",
    "area": "항카이",
    "mapUrl": "https://maps.google.com/?q=Bun+Dau+Mam+Tom+Co+Tuyen+Hanoi",
    "priceVndText": "100,000~150,000 VND",
    "priceKrwText": "약 5,500~8,000원",
    "priceVndAvg": 125000,
    "note": "튀긴 두부와 맘똠 새우젓 조합 분짜떠우",
    "menu": "분더우 모둠 (튀긴 두부·순대·분)"
  },
  {
    "name": "Phở Bò Ấu Triệu",
    "nameKo": "포보 어우찌에우",
    "category": "현지식",
    "area": "성요셉 근처",
    "mapUrl": "https://maps.google.com/?q=Pho+Bo+Au+Trieu+Hanoi",
    "priceVndText": "120,000~160,000 VND",
    "priceKrwText": "약 6,500~9,000원",
    "priceVndAvg": 140000,
    "note": "진한 사골 국물의 로컬 골목 쌀국수",
    "menu": "포 보 · 꿔이 (튀긴 빵)"
  },
  {
    "name": "Xôi Yến",
    "nameKo": "쏘이옌 (찰밥)",
    "category": "현지식",
    "area": "올드쿼터",
    "mapUrl": "https://maps.google.com/?q=Xoi+Yen+Hanoi",
    "priceVndText": "100,000~160,000 VND",
    "priceKrwText": "약 5,500~9,000원",
    "priceVndAvg": 130000,
    "note": "고기와 토핑을 얹어 먹는 전통 찰밥(쏘이)",
    "menu": "쏘이 쌉 (모둠 토핑 찰밥)"
  },
  {
    "name": "Bánh Mỳ Phố Cổ",
    "nameKo": "반미 포꼬",
    "category": "현지식",
    "area": "올드쿼터",
    "mapUrl": "https://maps.google.com/?q=Banh+My+Pho+Co+Hanoi",
    "priceVndText": "60,000~100,000 VND",
    "priceKrwText": "약 3,300~5,500원",
    "priceVndAvg": 80000,
    "note": "현지 직장인들이 아침마다 줄 서는 반미",
    "menu": "반미 텁껌 (모둠 반미)"
  },
  {
    "name": "Quán Xới Cơm",
    "nameKo": "꽌 써이껌 (가정식)",
    "category": "현지식",
    "area": "바딘",
    "mapUrl": "https://maps.google.com/?q=Quan+Xoi+Com+Hanoi",
    "priceVndText": "180,000~260,000 VND",
    "priceKrwText": "약 10,000~14,000원",
    "priceVndAvg": 220000,
    "note": "정갈한 베트남 시골 스타일 가정식 백반"
  },
  {
    "name": "Dalcheeni Indian Restaurant",
    "nameKo": "달치니 인도요리",
    "category": "커리",
    "area": "서호",
    "mapUrl": "https://maps.google.com/?q=Dalcheeni+Indian+Restaurant+Hanoi",
    "priceVndText": "650,000~950,000 VND",
    "priceKrwText": "약 36,000~52,000원",
    "priceVndAvg": 800000,
    "note": "서호 뷰를 자랑하는 프리미엄 인도 커리",
    "menu": "탄두리 플래터 · 팔락 파니르"
  },
  {
    "name": "CoCo Ichibanya Hanoi",
    "nameKo": "코코이찌방야 하노이",
    "category": "커리",
    "area": "바딘/롯데",
    "mapUrl": "https://maps.google.com/?q=CoCo+Ichibanya+Lotte+Center+Hanoi",
    "priceVndText": "350,000~500,000 VND",
    "priceKrwText": "약 19,000~27,000원",
    "priceVndAvg": 425000,
    "note": "매운맛 조절 일본 정통 카레 전문점",
    "menu": "로스카츠 카레 (맵기 선택)"
  },
  {
    "name": "Namaste Hanoi",
    "nameKo": "나마스테 하노이",
    "category": "커리",
    "area": "바딘",
    "mapUrl": "https://maps.google.com/?q=Namaste+Hanoi",
    "priceVndText": "450,000~650,000 VND",
    "priceKrwText": "약 25,000~36,000원",
    "priceVndAvg": 550000,
    "note": "하노이에서 가장 오래된 인도 커리 명가",
    "menu": "버터 치킨 · 갈릭 난 · 비리야니"
  },
  {
    "name": "PK Spice Indian Restaurant",
    "nameKo": "PK 스파이스 인도요리",
    "category": "커리",
    "area": "올드쿼터",
    "mapUrl": "https://maps.google.com/?q=PK+Spice+Indian+Restaurant+Hanoi",
    "priceVndText": "350,000~500,000 VND",
    "priceKrwText": "약 19,000~27,000원",
    "priceVndAvg": 425000,
    "note": "바삭한 난과 향신료 조합이 좋은 식당"
  },
  {
    "name": "Ganesh Indian Restaurant",
    "nameKo": "가네쉬 인도요리",
    "category": "커리",
    "area": "서호",
    "mapUrl": "https://maps.google.com/?q=Ganesh+Indian+Restaurant+Hanoi",
    "priceVndText": "500,000~750,000 VND",
    "priceKrwText": "약 27,000~41,000원",
    "priceVndAvg": 625000,
    "note": "주재원 구역 위치 현지 맛 재현 커리"
  },
  {
    "name": "Little India Hanoi",
    "nameKo": "리틀 인디아 하노이",
    "category": "커리",
    "area": "올드쿼터",
    "mapUrl": "https://maps.google.com/?q=Little+India+Hanoi",
    "priceVndText": "300,000~450,000 VND",
    "priceKrwText": "약 16,000~25,000원",
    "priceVndAvg": 375000,
    "note": "담백한 채식 커리와 다양한 난 메뉴"
  },
  {
    "name": "Foodshop 45",
    "nameKo": "푸드샵 45",
    "category": "커리",
    "area": "서호/죽백호",
    "mapUrl": "https://maps.google.com/?q=Foodshop+45+Hanoi",
    "priceVndText": "400,000~600,000 VND",
    "priceKrwText": "약 22,000~33,000원",
    "priceVndAvg": 500000,
    "note": "호숫가에서 맥주와 즐기는 뷰 커리 맛집"
  },
  {
    "name": "Rasm Indian Restaurant",
    "nameKo": "라즘 인도요리",
    "category": "커리",
    "area": "바딘",
    "mapUrl": "https://maps.google.com/?q=Rasm+Indian+Restaurant+Hanoi",
    "priceVndText": "500,000~700,000 VND",
    "priceKrwText": "약 27,000~38,000원",
    "priceVndAvg": 600000,
    "note": "정갈하고 고급스러운 분위기의 커리집"
  },
  {
    "name": "Indian Spice Hanoi",
    "nameKo": "인디안 스파이스 하노이",
    "category": "커리",
    "area": "올드쿼터",
    "mapUrl": "https://maps.google.com/?q=Indian+Spice+Hanoi",
    "priceVndText": "350,000~500,000 VND",
    "priceKrwText": "약 19,000~27,000원",
    "priceVndAvg": 425000,
    "note": "난과 라이스 조합이 알찬 현지 인기 커리"
  },
  {
    "name": "Handi Indian Restaurant",
    "nameKo": "한디 인도요리",
    "category": "커리",
    "area": "서호",
    "mapUrl": "https://maps.google.com/?q=Handi+Indian+Restaurant+Hanoi",
    "priceVndText": "450,000~650,000 VND",
    "priceKrwText": "약 25,000~36,000원",
    "priceVndAvg": 550000,
    "note": "북인도 정통 버터치킨 커리 맛집"
  },
  {
    "name": "카페 자앙 바딘점",
    "nameKo": "카페 자앙 바딘점",
    "category": "카페",
    "area": "바딘",
    "mapUrl": "https://maps.google.com/?q=Cafe+Giang+Hanoi",
    "priceVndText": "70,000~110,000 VND",
    "priceKrwText": "약 3,800~6,000원",
    "priceVndAvg": 90000,
    "note": "원조 에그커피 & 달콤하고 진한 베트남 드립 연유커피"
  },
  {
    "name": "카페 람",
    "nameKo": "카페 람",
    "category": "카페",
    "area": "올드쿼터",
    "mapUrl": "https://maps.google.com/?q=Cafe+Lam+Hanoi",
    "priceVndText": "60,000~100,000 VND",
    "priceKrwText": "약 3,300~5,500원",
    "priceVndAvg": 80000,
    "note": "하노이 3대 고전 카페, 깊은 풍미의 전통 연유커피"
  },
  {
    "name": "메종 마루 서호점",
    "nameKo": "메종 마루 서호점",
    "category": "카페",
    "area": "서호",
    "mapUrl": "https://maps.google.com/?q=Maison+Marou+Tay+Ho+Hanoi",
    "priceVndText": "200,000~350,000 VND",
    "priceKrwText": "약 11,000~19,000원",
    "priceVndAvg": 275000,
    "note": "수제 초콜릿 디저트 및 프리미엄 에스프레소 연유커피"
  },
  {
    "name": "AHA Coffee 꺼우저이점",
    "nameKo": "아하 커피 꺼우저이점",
    "category": "카페",
    "area": "꺼우저이",
    "mapUrl": "https://maps.google.com/?q=AHA+Coffee+Cau+Giay+Hanoi",
    "priceVndText": "60,000~100,000 VND",
    "priceKrwText": "약 3,300~5,500원",
    "priceVndAvg": 80000,
    "note": "현지인들이 노천에 앉아 즐기는 스트리트형 연유커피"
  },
  {
    "name": "Café Phố Cổ",
    "nameKo": "카페 포꼬",
    "category": "카페",
    "area": "올드쿼터",
    "mapUrl": "https://maps.google.com/?q=Cafe+Pho+Co+Hanoi",
    "priceVndText": "80,000~120,000 VND",
    "priceKrwText": "약 4,400~6,500원",
    "priceVndAvg": 100000,
    "note": "옷가게 뒤 숨겨진 호수 뷰 비밀 카페"
  },
  {
    "name": "Cộng Cà Phê",
    "nameKo": "꽁 카페",
    "category": "카페",
    "area": "전역 체인",
    "mapUrl": "https://maps.google.com/?q=Cong+Caphe+Hanoi",
    "priceVndText": "90,000~140,000 VND",
    "priceKrwText": "약 5,000~7,500원",
    "priceVndAvg": 115000,
    "note": "레트로 베트공 컨셉 시그니처 코코넛 커피",
    "menu": "코코넛 커피 (꼿 쓰어 즈어)"
  },
  {
    "name": "Café Thọ",
    "nameKo": "카페 토",
    "category": "카페",
    "area": "바딘",
    "mapUrl": "https://maps.google.com/?q=Cafe+Tho+Hanoi",
    "priceVndText": "60,000~90,000 VND",
    "priceKrwText": "약 3,300~5,000원",
    "priceVndAvg": 75000,
    "note": "지식인들이 오래 찾아온 드립 연유커피"
  },
  {
    "name": "Café Đinh",
    "nameKo": "카페 딘",
    "category": "카페",
    "area": "호안끼엠",
    "mapUrl": "https://maps.google.com/?q=Cafe+Dinh+Hanoi",
    "priceVndText": "60,000~90,000 VND",
    "priceKrwText": "약 3,300~5,000원",
    "priceVndAvg": 75000,
    "note": "호안끼엠 뷰의 빈티지 원조 에그/연유커피",
    "menu": "에그커피 · 에그 코코아"
  },
  {
    "name": "Tranquil Books & Coffee",
    "nameKo": "트랑퀼 북스 앤 커피",
    "category": "카페",
    "area": "바딘/올드쿼터",
    "mapUrl": "https://maps.google.com/?q=Tranquil+Books+Coffee+Hanoi",
    "priceVndText": "90,000~140,000 VND",
    "priceKrwText": "약 5,000~7,500원",
    "priceVndAvg": 115000,
    "note": "고요한 분위기의 핸드드립 연유커피"
  },
  {
    "name": "Cheo Leo Café Hanoi",
    "nameKo": "째오레오 카페",
    "category": "카페",
    "area": "서호 근처",
    "mapUrl": "https://maps.google.com/?q=Cheo+Leo+Cafe+Hanoi",
    "priceVndText": "80,000~120,000 VND",
    "priceKrwText": "약 4,400~6,500원",
    "priceVndAvg": 100000,
    "note": "LP 음악과 함께 잔잔한 호수를 즐기는 곳"
  },
  {
    "name": "Highlands Coffee",
    "nameKo": "하이랜드 커피",
    "category": "카페",
    "area": "전역 체인",
    "mapUrl": "https://maps.google.com/?q=Highlands+Coffee+Hanoi",
    "priceVndText": "80,000~120,000 VND",
    "priceKrwText": "약 4,400~6,500원",
    "priceVndAvg": 100000,
    "note": "베트남 스타벅스, 진한 Phìn Sữa Đá",
    "menu": "핀 쓰어 다 (연유 아이스커피) · 프리즈"
  },
  {
    "name": "The Note Coffee",
    "nameKo": "더 노트 커피",
    "category": "카페",
    "area": "올드쿼터",
    "mapUrl": "https://maps.google.com/?q=The+Note+Coffee+Hanoi",
    "priceVndText": "80,000~130,000 VND",
    "priceKrwText": "약 4,400~7,000원",
    "priceVndAvg": 105000,
    "note": "포스트잇 메모 감성 및 호수 뷰 연유커피",
    "menu": "코코넛 커피 · 포스트잇 남기기"
  },
  {
    "name": "Kafa Café",
    "nameKo": "카파 카페",
    "category": "카페",
    "area": "전역 체인",
    "mapUrl": "https://maps.google.com/?q=Kafa+Cafe+Hanoi",
    "priceVndText": "60,000~100,000 VND",
    "priceKrwText": "약 3,300~5,500원",
    "priceVndAvg": 80000,
    "note": "정통 길거리 스타일 노천 연유커피 전문점"
  },
  {
    "name": "Loading T Café",
    "nameKo": "로딩T 카페",
    "category": "카페",
    "area": "올드쿼터",
    "mapUrl": "https://maps.google.com/?q=Loading+T+Cafe+Hanoi",
    "priceVndText": "90,000~140,000 VND",
    "priceKrwText": "약 5,000~7,500원",
    "priceVndAvg": 115000,
    "note": "빈티지 프랑스 고택 분위기의 에그/연유커피"
  },
  {
    "name": "Café Giảng",
    "nameKo": "카페 지앙",
    "category": "카페",
    "area": "올드쿼터/바딘",
    "mapUrl": "https://maps.google.com/?q=Cafe+Giang+Hanoi",
    "priceVndText": "70,000~110,000 VND",
    "priceKrwText": "약 3,800~6,000원",
    "priceVndAvg": 90000,
    "note": "원조 에그커피 및 진한 드립 연유커피",
    "menu": "카페 쯩 (에그커피) — 원조"
  },
  {
    "name": "Café Lâm",
    "nameKo": "카페 람",
    "category": "카페",
    "area": "올드쿼터",
    "mapUrl": "https://maps.google.com/?q=Cafe+Lam+Hanoi",
    "priceVndText": "60,000~100,000 VND",
    "priceKrwText": "약 3,300~5,500원",
    "priceVndAvg": 80000,
    "note": "3대 고전 카페, 깊은 쌉싸름한 연유커피",
    "menu": "전통 드립 연유커피"
  },
  {
    "name": "AHA Coffee",
    "nameKo": "아하 커피",
    "category": "카페",
    "area": "전역 체인",
    "mapUrl": "https://maps.google.com/?q=AHA+Coffee+Hanoi",
    "priceVndText": "60,000~100,000 VND",
    "priceKrwText": "약 3,300~5,500원",
    "priceVndAvg": 80000,
    "note": "길거리 목욕탕 의자 노천 연유커피 문화"
  },
  {
    "name": "롯데몰 서호",
    "nameKo": "롯데몰 서호",
    "category": "쇼핑몰",
    "area": "서호",
    "mapUrl": "https://maps.google.com/?q=Lotte+Mall+West+Lake+Hanoi",
    "priceVndText": "무료 입장 (쇼핑 별도)",
    "priceKrwText": "-",
    "priceVndAvg": 0,
    "note": "하노이 최대 규모 복합 쇼핑몰, 롯데마트, 아쿠아리움"
  },
  {
    "name": "롯데센터 하노이",
    "nameKo": "롯데센터 하노이",
    "category": "쇼핑몰",
    "area": "바딘",
    "mapUrl": "https://maps.google.com/?q=Lotte+Center+Hanoi",
    "priceVndText": "무료 입장 (전망대 별도)",
    "priceKrwText": "-",
    "priceVndAvg": 0,
    "note": "롯데마트(기념품 사기 최적), 대관람차 전망대 보유"
  },
  {
    "name": "Big C 마트 (GO! Thăng Long)",
    "nameKo": "빅씨 마트 (GO! 탕롱)",
    "category": "쇼핑몰",
    "area": "꺼우저이",
    "mapUrl": "https://maps.google.com/?q=GO!+Thang+Long+Hanoi",
    "priceVndText": "무료 입장 (쇼핑 별도)",
    "priceKrwText": "-",
    "priceVndAvg": 0,
    "note": "현지인들의 대형 복합 쇼핑몰, 로컬 쇼핑 최적"
  },
  {
    "name": "Buffet Sen Tây Hồ",
    "nameKo": "뷔페 센 서호",
    "category": "뷔페",
    "area": "서호",
    "mapUrl": "https://maps.google.com/?q=Buffet+Sen+Tay+Ho+Hanoi",
    "priceVndText": "800,000~1,100,000 VND",
    "priceKrwText": "약 44,000~60,000원",
    "priceVndAvg": 950000,
    "note": "서호 옆 최대 규모 베트남/해산물 뷔페",
    "menu": "베트남 전통 요리 + 해산물 무한"
  },
  {
    "name": "Chef Dũng Seafood Buffet",
    "nameKo": "셰프중 해산물 뷔페",
    "category": "뷔페",
    "area": "꺼우저이",
    "mapUrl": "https://maps.google.com/?q=Chef+Dung+Seafood+Buffet+Hanoi",
    "priceVndText": "900,000~1,200,000 VND",
    "priceKrwText": "약 50,000~66,000원",
    "priceVndAvg": 1050000,
    "note": "현지 상류층 선호 생물 해산물 뷔페"
  },
  {
    "name": "Isushi",
    "nameKo": "이스시 (일식 뷔페)",
    "category": "뷔페",
    "area": "바딘/꺼우저이",
    "mapUrl": "https://maps.google.com/?q=Isushi+Hanoi",
    "priceVndText": "1,000,000~1,300,000 VND",
    "priceKrwText": "약 55,000~71,000원",
    "priceVndAvg": 1150000,
    "note": "일식 스시, 사시미, 롤 무제한 뷔페"
  },
  {
    "name": "Kichi-Kichi",
    "nameKo": "키치키치 (핫팟 뷔페)",
    "category": "뷔페",
    "area": "전역 체인",
    "mapUrl": "https://maps.google.com/?q=Kichi+Kichi+Hanoi",
    "priceVndText": "600,000~800,000 VND",
    "priceKrwText": "약 33,000~44,000원",
    "priceVndAvg": 700000,
    "note": "베트남 젊은층 최애 회전 핫팟 뷔페",
    "menu": "컨베이어 핫팟 (소고기·해산물)"
  },
  {
    "name": "Bay Seafood Buffet",
    "nameKo": "베이 해산물 뷔페",
    "category": "뷔페",
    "area": "서호 근처",
    "mapUrl": "https://maps.google.com/?q=Bay+Seafood+Buffet+Hanoi",
    "priceVndText": "850,000~1,100,000 VND",
    "priceKrwText": "약 47,000~60,000원",
    "priceVndAvg": 975000,
    "note": "깔끔한 분위기의 프리미엄 해산물 뷔페"
  },
  {
    "name": "Poseidon Seafood Buffet",
    "nameKo": "포세이돈 해산물 뷔페",
    "category": "뷔페",
    "area": "꺼우저이",
    "mapUrl": "https://maps.google.com/?q=Poseidon+Seafood+Buffet+Hanoi",
    "priceVndText": "800,000~1,000,000 VND",
    "priceKrwText": "약 44,000~55,000원",
    "priceVndAvg": 900000,
    "note": "쇼핑몰 내 위치한 가성비 해산물 뷔페"
  },
  {
    "name": "Buffet Yoon",
    "nameKo": "뷔페 윤 (한식)",
    "category": "뷔페",
    "area": "미딘",
    "mapUrl": "https://maps.google.com/?q=Buffet+Yoon+Hanoi",
    "priceVndText": "900,000~1,200,000 VND",
    "priceKrwText": "약 50,000~66,000원",
    "priceVndAvg": 1050000,
    "note": "모임 및 비즈니스용 고급 한식/고기 뷔페"
  },
  {
    "name": "Maison Sen Buffet",
    "nameKo": "메종 센 뷔페",
    "category": "뷔페",
    "area": "바딘",
    "mapUrl": "https://maps.google.com/?q=Maison+Sen+Buffet+Hanoi",
    "priceVndText": "800,000~1,050,000 VND",
    "priceKrwText": "약 44,000~58,000원",
    "priceVndAvg": 925000,
    "note": "시내 중심 세련된 베트남 전통 뷔페"
  },
  {
    "name": "KPub - Korean Grill Buffet",
    "nameKo": "케이펍 (한식 구이 뷔페)",
    "category": "뷔페",
    "area": "체인",
    "mapUrl": "https://maps.google.com/?q=KPub+Hanoi",
    "priceVndText": "600,000~800,000 VND",
    "priceKrwText": "약 33,000~44,000원",
    "priceVndAvg": 700000,
    "note": "캐주얼한 한국식 드럼통 구이 뷔페"
  },
  {
    "name": "Lẩu Nấm Murah",
    "nameKo": "러우남 무라 (버섯 핫팟)",
    "category": "뷔페",
    "area": "꺼우저이",
    "mapUrl": "https://maps.google.com/?q=Lau+Nam+Murah+Hanoi",
    "priceVndText": "500,000~700,000 VND",
    "priceKrwText": "약 27,000~38,000원",
    "priceVndAvg": 600000,
    "note": "몸에 좋은 버섯과 소고기 건강 핫팟 뷔페"
  },
  {
    "name": "Santé Bakery",
    "nameKo": "Santé Bakery",
    "category": "베이커리",
    "area": "서호",
    "mapUrl": "https://maps.google.com/?q=Sante+Bakery+Tay+Ho+Hanoi",
    "priceVndText": "150,000~250,000 VND",
    "priceKrwText": "약 8,000~13,500원",
    "priceVndAvg": 200000,
    "note": "프랑스인이 구워내는 정통 크루아상"
  },
  {
    "name": "Bánh Mỳ Mama",
    "nameKo": "반미 마마",
    "category": "베이커리",
    "area": "성요셉 근처",
    "mapUrl": "https://maps.google.com/?q=Banh+My+Mama+Hanoi",
    "priceVndText": "80,000~120,000 VND",
    "priceKrwText": "약 4,400~6,500원",
    "priceVndAvg": 100000,
    "note": "겉바속촉 페이스트리 스타일 반미"
  },
  {
    "name": "Tous Les Jours",
    "nameKo": "뚜레쥬르 하노이",
    "category": "베이커리",
    "area": "전역",
    "mapUrl": "https://maps.google.com/?q=Tous+Les+Jours+Hanoi",
    "priceVndText": "150,000~250,000 VND",
    "priceKrwText": "약 8,000~13,500원",
    "priceVndAvg": 200000,
    "note": "현지 상류층 선호 고급 케이크/디저트",
    "menu": "케이크 · 뱅오쇼콜라"
  },
  {
    "name": "Paris Baguette Hanoi",
    "nameKo": "파리바게뜨 하노이",
    "category": "베이커리",
    "area": "꺼우저이",
    "mapUrl": "https://maps.google.com/?q=Paris+Baguette+Hanoi",
    "priceVndText": "150,000~250,000 VND",
    "priceKrwText": "약 8,000~13,500원",
    "priceVndAvg": 200000,
    "note": "현지화된 다양한 식빵 및 디저트"
  },
  {
    "name": "Chez Maison Bakery",
    "nameKo": "셰 메종 베이커리",
    "category": "베이커리",
    "area": "바딘",
    "mapUrl": "https://maps.google.com/?q=Chez+Maison+Bakery+Hanoi",
    "priceVndText": "120,000~200,000 VND",
    "priceKrwText": "약 6,500~11,000원",
    "priceVndAvg": 160000,
    "note": "유기농 천연 발효종 식사빵 전문점"
  },
  {
    "name": "Tiệm Bánh Caramel Dương Hoa",
    "nameKo": "즈엉호아 카라멜 베이커리",
    "category": "베이커리",
    "area": "올드쿼터",
    "mapUrl": "https://maps.google.com/?q=Tiem+Banh+Caramel+Duong+Hoa+Hanoi",
    "priceVndText": "60,000~100,000 VND",
    "priceKrwText": "약 3,300~5,500원",
    "priceVndAvg": 80000,
    "note": "현지 푸디 1위 푸딩/카라멜 디저트"
  },
  {
    "name": "Jomo Bakery & Cafe",
    "nameKo": "조모 베이커리 카페",
    "category": "베이커리",
    "area": "서호",
    "mapUrl": "https://maps.google.com/?q=Jomo+Bakery+Cafe+Hanoi",
    "priceVndText": "150,000~220,000 VND",
    "priceKrwText": "약 8,000~12,000원",
    "priceVndAvg": 185000,
    "note": "감성 구움과자(휘낭시에/에그타르트)"
  },
  {
    "name": "King Roti",
    "nameKo": "킹 로티",
    "category": "베이커리",
    "area": "올드쿼터",
    "mapUrl": "https://maps.google.com/?q=King+Roti+Hanoi",
    "priceVndText": "50,000~80,000 VND",
    "priceKrwText": "약 2,700~4,400원",
    "priceVndAvg": 65000,
    "note": "갓 구워낸 로컬 모카 번(Roti) 전문점",
    "menu": "갓 구운 모카번"
  },
  {
    "name": "Bánh Ngọt Hongkong",
    "nameKo": "홍콩 케이크",
    "category": "베이커리",
    "area": "하이바쯩",
    "mapUrl": "https://maps.google.com/?q=Banh+Ngot+Hongkong+Hanoi",
    "priceVndText": "80,000~130,000 VND",
    "priceKrwText": "약 4,400~7,000원",
    "priceVndAvg": 105000,
    "note": "촉촉한 홍콩식 에그타르트 및 케이크"
  },
  {
    "name": "Saint Honore Hanoi",
    "nameKo": "생토노레 하노이",
    "category": "베이커리",
    "area": "서호",
    "mapUrl": "https://maps.google.com/?q=Saint+Honore+Hanoi",
    "priceVndText": "180,000~280,000 VND",
    "priceKrwText": "약 10,000~15,500원",
    "priceVndAvg": 230000,
    "note": "정통 프랑스 스타일 브래드 및 페이스트리"
  },
  {
    "name": "타히엔 맥주거리",
    "nameKo": "타히엔 맥주거리",
    "category": "밤문화",
    "area": "올드쿼터",
    "mapUrl": "https://maps.google.com/?q=Ta+Hien+Beer+Street+Hanoi",
    "priceVndText": "150,000~250,000 VND",
    "priceKrwText": "약 8,000~13,500원",
    "priceVndAvg": 200000,
    "note": "목욕탕 의자에 앉아 해바라기씨와 맥주 즐기는 밤 감성"
  },
  {
    "name": "Maison de Tet Decor",
    "nameKo": "메종 드 뗏 데코",
    "category": "맛집/브런치",
    "area": "서호",
    "mapUrl": "https://maps.google.com/?q=Maison+de+Tet+Decor+Hanoi",
    "priceVndText": "350,000~550,000 VND",
    "priceKrwText": "약 19,000~30,000원",
    "priceVndAvg": 450000,
    "note": "외국인이 운영하는 유기농 홈메이드 브런치 & 카페",
    "menu": "유기농 브런치 플래터 · 홈메이드 케이크"
  },
  {
    "name": "분짜 흥리엔",
    "nameKo": "분짜 흥리엔",
    "category": "맛집",
    "area": "바딘",
    "mapUrl": "https://maps.google.com/?q=Bun+Cha+Huong+Lien+Hanoi",
    "priceVndText": "160,000~220,000 VND",
    "priceKrwText": "약 9,000~12,000원",
    "priceVndAvg": 190000,
    "note": "오바마 대통령 방문 분짜 전문점, 숯불 돼지고기와 넴",
    "menu": "오바마 콤보 (분짜 + 넴 + 맥주)"
  },
  {
    "name": "포띤 13 로둑",
    "nameKo": "포띤 13 로둑",
    "category": "맛집",
    "area": "올드쿼터",
    "mapUrl": "https://maps.google.com/?q=Pho+Thin+13+Lo+Duc+Hanoi",
    "priceVndText": "180,000~240,000 VND",
    "priceKrwText": "약 10,000~13,000원",
    "priceVndAvg": 210000,
    "note": "파가 듬뿍 들어간 파쌀국수(Pho Thin) 하노이 원조",
    "menu": "포 보 남 (양지 쌀국수) · 파 듬뿍"
  },
  {
    "name": "반똠 호떠이",
    "nameKo": "반똠 호떠이",
    "category": "맛집",
    "area": "서호",
    "mapUrl": "https://maps.google.com/?q=Banh+Tom+Ho+Tay+Hanoi",
    "priceVndText": "200,000~300,000 VND",
    "priceKrwText": "약 11,000~16,500원",
    "priceVndAvg": 250000,
    "note": "서호 특산물인 새우튀김(반똠) 및 호숫가 로컬 식당",
    "menu": "반똠 (서호 새우튀김) · 분"
  },
  {
    "name": "Pistachio Bistro",
    "nameKo": "피스타치오 비스트로",
    "category": "맛집",
    "area": "바딘",
    "mapUrl": "https://maps.google.com/?q=Pistachio+Bistro+Hanoi",
    "priceVndText": "500,000~800,000 VND",
    "priceKrwText": "약 27,000~44,000원",
    "priceVndAvg": 650000,
    "note": "베트남 이주 프랑스 셰프의 가성비 프렌치 비스트로",
    "menu": "푸아그라 · 스테이크 프리츠"
  },
  {
    "name": "Zaika Indian Restaurant",
    "nameKo": "자이카 인도요리",
    "category": "맛집",
    "area": "꺼우저이",
    "mapUrl": "https://maps.google.com/?q=Zaika+Indian+Restaurant+Hanoi",
    "priceVndText": "450,000~650,000 VND",
    "priceKrwText": "약 25,000~36,000원",
    "priceVndAvg": 550000,
    "note": "인도 셰프가 운영하는 수준 높은 정통 인도 커리",
    "menu": "무르그 마크니 · 치즈 쿨차"
  },
  {
    "name": "반세오 똔득탕",
    "nameKo": "반세오 똔득탕",
    "category": "맛집",
    "area": "꺼우저이",
    "mapUrl": "https://maps.google.com/?q=Banh+Xeo+Ton+Duc+Thang+Cau+Giay",
    "priceVndText": "120,000~180,000 VND",
    "priceKrwText": "약 6,500~10,000원",
    "priceVndAvg": 150000,
    "note": "바삭한 반세오와 넴루이 현지인 맛집",
    "menu": "반세오 · 넴루이 (레몬그라스 꼬치)"
  },
  {
    "name": "Curry King Hanoi",
    "nameKo": "커리 킹 하노이",
    "category": "맛집",
    "area": "올드쿼터",
    "mapUrl": "https://maps.google.com/?q=Curry+King+Hanoi",
    "priceVndText": "300,000~450,000 VND",
    "priceKrwText": "약 16,000~25,000원",
    "priceVndAvg": 375000,
    "note": "정통 향신료 풍미의 인기 인도 커리 전문점",
    "menu": "치킨 티카 마살라 · 마늘 난"
  },
  {
    "name": "꺼우저이 공원",
    "nameKo": "꺼우저이 공원",
    "category": "공원/나들이",
    "area": "꺼우저이",
    "mapUrl": "https://maps.google.com/?q=Cau+Giay+Park+Hanoi",
    "priceVndText": "무료 입장",
    "priceKrwText": "-",
    "priceVndAvg": 0,
    "note": "현지인 가족/커플들의 힐링 산책공원"
  },
  {
    "name": "Bò Tơ Quán Mộc",
    "nameKo": "보떠 꽌목 (암소 구이)",
    "category": "고기류",
    "area": "꺼우저이/바딘",
    "mapUrl": "https://maps.google.com/?q=Bo+To+Quan+Moc+Hanoi",
    "priceVndText": "450,000~650,000 VND",
    "priceKrwText": "약 25,000~36,000원",
    "priceVndAvg": 550000,
    "note": "레트로한 감성의 연한 암소 고기 구이/찜",
    "menu": "보 또 (어린 소) 구이 모둠"
  },
  {
    "name": "Gogi House",
    "nameKo": "고기하우스 하노이",
    "category": "고기류",
    "area": "전역 체인",
    "mapUrl": "https://maps.google.com/?q=Gogi+House+Hanoi",
    "priceVndText": "700,000~1,000,000 VND",
    "priceKrwText": "약 38,000~55,000원",
    "priceVndAvg": 850000,
    "note": "베트남 현지 선호도 1위 숯불 갈비",
    "menu": "양념 LA갈비 · 된장찌개"
  },
  {
    "name": "Thịt Xiên Nướng Bà Ngà",
    "nameKo": "팃씨엔느엉 바응아 (돼지 꼬치)",
    "category": "고기류",
    "area": "동다",
    "mapUrl": "https://maps.google.com/?q=Thit+Xien+Nuong+Ba+Nga+Hanoi",
    "priceVndText": "100,000~160,000 VND",
    "priceKrwText": "약 5,500~9,000원",
    "priceVndAvg": 130000,
    "note": "배달 앱 상위권 길거리 돼지고기 꼬치"
  },
  {
    "name": "Nầm Nướng Gầm Cầu",
    "nameKo": "냠느엉 검꺼우 (곱창 구이)",
    "category": "고기류",
    "area": "올드쿼터",
    "mapUrl": "https://maps.google.com/?q=Nam+Nuong+Gam+Cau+Hanoi",
    "priceVndText": "300,000~450,000 VND",
    "priceKrwText": "약 16,000~25,000원",
    "priceVndAvg": 375000,
    "note": "마가린에 볶아 먹는 포장마차 스타일 구이"
  },
  {
    "name": "Bò Nướng Lạc Trung",
    "nameKo": "보느엉 락쭝 (소고기 구이)",
    "category": "고기류",
    "area": "하이바쯩",
    "mapUrl": "https://maps.google.com/?q=Bo+Nuong+Lac+Trung+Hanoi",
    "priceVndText": "350,000~500,000 VND",
    "priceKrwText": "약 19,000~27,000원",
    "priceVndAvg": 425000,
    "note": "현지 주당들의 양념 소고기 숯불 구이"
  },
  {
    "name": "Lẩu Đức Trọc",
    "nameKo": "러우 득쪽 (샤부샤부)",
    "category": "고기류",
    "area": "꺼우저이",
    "mapUrl": "https://maps.google.com/?q=Lau+Duc+Troc+Hanoi",
    "priceVndText": "400,000~600,000 VND",
    "priceKrwText": "약 22,000~33,000원",
    "priceVndAvg": 500000,
    "note": "고기와 해산물이 푸짐한 샤부샤부/구이"
  },
  {
    "name": "Quán Kẹp thịt nướng BBQ",
    "nameKo": "꽌깹 팃느엉 BBQ",
    "category": "고기류",
    "area": "서호",
    "mapUrl": "https://maps.google.com/?q=Quan+Kep+Thit+Nuong+BBQ+Hanoi",
    "priceVndText": "400,000~550,000 VND",
    "priceKrwText": "약 22,000~30,000원",
    "priceVndAvg": 475000,
    "note": "서호 근처 유행하는 수제 바비큐"
  },
  {
    "name": "Nhà hàng Lộc Vừng",
    "nameKo": "록브응 레스토랑",
    "category": "고기류",
    "area": "서호",
    "mapUrl": "https://maps.google.com/?q=Nha+hang+Loc+Vung+Hanoi",
    "priceVndText": "500,000~750,000 VND",
    "priceKrwText": "약 27,000~41,000원",
    "priceVndAvg": 625000,
    "note": "서호 뷰 정원에서 즐기는 오리/돼지 구이"
  },
  {
    "name": "Vịt Quay Don Duck",
    "nameKo": "빗꾸아이 던덕 (오리구이)",
    "category": "고기류",
    "area": "올드쿼터",
    "mapUrl": "https://maps.google.com/?q=Vit+Quay+Don+Duck+Hanoi",
    "priceVndText": "350,000~500,000 VND",
    "priceKrwText": "약 19,000~27,000원",
    "priceVndAvg": 425000,
    "note": "베트남식 통오리 구이와 오리 냄비",
    "menu": "넓적다리 오리구이 · 오리국수"
  },
  {
    "name": "Yakimono",
    "nameKo": "야키모노 (일식 숯불구이)",
    "category": "고기류",
    "area": "꺼우저이",
    "mapUrl": "https://maps.google.com/?q=Yakimono+Hanoi",
    "priceVndText": "550,000~800,000 VND",
    "priceKrwText": "약 30,000~44,000원",
    "priceVndAvg": 675000,
    "note": "타레 양념의 정통 일식 숯불 구이"
  },
  {
    "name": "Lotte Center Hanoi",
    "nameKo": "롯데센터 하노이",
    "category": "쇼핑몰",
    "area": "바딘",
    "mapUrl": "https://maps.google.com/?q=Lotte%20Center%20Hanoi",
    "priceVndText": "",
    "priceKrwText": "",
    "priceVndAvg": 0,
    "note": "전망대·롯데마트·기념품 쇼핑 최적, 대관람차"
  },
  {
    "name": "Vincom Center Metropolis",
    "nameKo": "빈콤 센터 메트로폴리스",
    "category": "쇼핑몰",
    "area": "바딘",
    "mapUrl": "https://maps.google.com/?q=Vincom%20Center%20Metropolis%20Lieu%20Giai%20Hanoi",
    "priceVndText": "",
    "priceKrwText": "",
    "priceVndAvg": 0,
    "note": "리에우자이 고급 주상복합 쇼핑센터"
  },
  {
    "name": "Vincom Trần Duy Hưng",
    "nameKo": "빈콤 쩐지흥",
    "category": "쇼핑몰",
    "area": "꺼우저이",
    "mapUrl": "https://maps.google.com/?q=Vincom%20Tran%20Duy%20Hung%20Hanoi",
    "priceVndText": "",
    "priceKrwText": "",
    "priceVndAvg": 0,
    "note": "꺼우저이 대형 빈콤 쇼핑몰"
  },
  {
    "name": "MM Mega Market Thăng Long",
    "nameKo": "메가마켓 탕롱점",
    "category": "대형마트",
    "area": "꺼우저이",
    "mapUrl": "https://maps.google.com/?q=MM%20Mega%20Market%20Thang%20Long%20Hanoi",
    "priceVndText": "",
    "priceKrwText": "",
    "priceVndAvg": 0,
    "note": "현지 대형 창고형 마트, 팜반동 거리"
  },
  {
    "name": "Vincom Mega Mall Royal City",
    "nameKo": "빈콤 메가몰 로얄시티",
    "category": "쇼핑몰",
    "area": "탄쑤언",
    "mapUrl": "https://maps.google.com/?q=Vincom%20Mega%20Mall%20Royal%20City%20Hanoi",
    "priceVndText": "",
    "priceKrwText": "",
    "priceVndAvg": 0,
    "note": "지하 대형몰 · 아이스링크·워터파크"
  },
  {
    "name": "Vincom Mega Mall Smart City",
    "nameKo": "빈콤 메가몰 스마트시티",
    "category": "쇼핑몰",
    "area": "남뜨리엠",
    "mapUrl": "https://maps.google.com/?q=Vincom%20Mega%20Mall%20Smart%20City%20Hanoi",
    "priceVndText": "",
    "priceKrwText": "",
    "priceVndAvg": 0,
    "note": "떠이모 빈홈 스마트시티 내 대형몰"
  },
  {
    "name": "AEON Mall Long Biên",
    "nameKo": "이온몰 롱비엔점",
    "category": "쇼핑몰",
    "area": "롱비엔",
    "mapUrl": "https://maps.google.com/?q=AEON%20Mall%20Long%20Bien%20Hanoi",
    "priceVndText": "",
    "priceKrwText": "",
    "priceVndAvg": 0,
    "note": "일본계 대형몰, 이온 슈퍼·푸드코트"
  },
  {
    "name": "Mipec Long Biên",
    "nameKo": "미펙 롱비엔",
    "category": "쇼핑몰",
    "area": "롱비엔",
    "mapUrl": "https://maps.google.com/?q=Mipec%20Long%20Bien%20Hanoi",
    "priceVndText": "",
    "priceKrwText": "",
    "priceVndAvg": 0,
    "note": "롱비엔 복합 쇼핑몰·영화관"
  },
  {
    "name": "TASCO Mall",
    "nameKo": "타스코 몰",
    "category": "쇼핑몰",
    "area": "롱비엔",
    "mapUrl": "https://maps.google.com/?q=TASCO%20Mall%20Viet%20Hung%20Hanoi",
    "priceVndText": "",
    "priceKrwText": "",
    "priceVndAvg": 0,
    "note": "비엣흥 신규 쇼핑몰"
  },
  {
    "name": "AEON Mall Hà Đông",
    "nameKo": "이온몰 하동점",
    "category": "쇼핑몰",
    "area": "하동",
    "mapUrl": "https://maps.google.com/?q=AEON%20Mall%20Ha%20Dong%20Hanoi",
    "priceVndText": "",
    "priceKrwText": "",
    "priceVndAvg": 0,
    "note": "즈엉노이 대형 이온몰"
  },
  {
    "name": "MAC Plaza",
    "nameKo": "MAC 플라자",
    "category": "쇼핑몰",
    "area": "하동",
    "mapUrl": "https://maps.google.com/?q=MAC%20Plaza%20Tran%20Phu%20Ha%20Dong%20Hanoi",
    "priceVndText": "",
    "priceKrwText": "",
    "priceVndAvg": 0,
    "note": "하동 한인타운 중심, 한국 식당·마트 밀집"
  },
  {
    "name": "MM Mega Market Hà Đông",
    "nameKo": "메가마켓 하동점",
    "category": "대형마트",
    "area": "하동",
    "mapUrl": "https://maps.google.com/?q=MM%20Mega%20Market%20Ha%20Dong%20Hanoi",
    "priceVndText": "",
    "priceKrwText": "",
    "priceVndAvg": 0,
    "note": "하동 창고형 대형마트"
  }
];

export const SEED_HOTELS: Omit<Hotel, 'id' | 'projectId'>[] = [
  {
    "name": "인터컨티넨탈 하노이 웨스트레이크",
    "grade": "5성급",
    "rating": 4.6,
    "address": "05 P. Từ Hoa, Quảng An, Tây Hồ",
    "priceTotalText": "약 30~34만 원",
    "nearby": "진국사, 서호 호수, 롯데몰 서호",
    "feature": "호수 위 워터빌라, 독보적 휴양지 분위기, 수영장 우수",
    "breakfast": "베트남식/양식 라이브 키친 훌륭, 쌀국수 및 빵 맛집 평가"
  },
  {
    "name": "서머셋 호아빈 하노이",
    "grade": "4성급",
    "rating": 4.5,
    "address": "106 P. Hoàng Quốc Việt, Cầu Giấy",
    "priceTotalText": "약 16~20만 원",
    "nearby": "베트남 민족학 박물관, 꺼우저이 공원",
    "feature": "현지 고급 주거지 위치, 치안 최상, 대형 실내 수영장",
    "breakfast": "가짓수 적당하고 정갈함, 일식/베트남식 위주로 깔끔함"
  },
  {
    "name": "실크 패스 호텔 하노이",
    "grade": "4성급",
    "rating": 4.6,
    "address": "19-21 P. Hàng Bông, Hàng Bông, Hoàn Kiếm",
    "priceTotalText": "약 18~22만 원",
    "nearby": "성요셉 성당, 호안끼엠 호수, 기찻길 골목",
    "feature": "프렌치 앤티크 부티크 감성, 루프탑 수영장 및 자쿠지",
    "breakfast": "가성비 대비 알찬 구성, 베트남 로컬 메뉴 및 과일 신선"
  },
  {
    "name": "윙크 호텔 하노이 미딘",
    "grade": "4성급",
    "rating": 4.6,
    "address": "2 P. Châu Văn Liêm, Mễ Trì, Nam Từ Liêm",
    "priceTotalText": "약 14~18만 원",
    "nearby": "가든 쇼핑센터, 빈콤 메가몰, 경남 타워",
    "feature": "24h Stay(24시간 체류), 스마트 앱 체크인, 모던 힙 감성",
    "breakfast": "뷔페식으로 간단하지만 알찬 구성, 수제 잼 및 커피 호평"
  },
  {
    "name": "로이젠트 파크스 하노이",
    "grade": "4성급",
    "rating": 4.6,
    "address": "288 P. Khuất Duy Tiến, Trung Hoà, Cầu Giấy",
    "priceTotalText": "약 16~20만 원",
    "nearby": "Big C 마트, 꺼우저이 신도시",
    "feature": "일루미나 그룹 운영, 극상의 위생/청결도, 일본식 사우나",
    "breakfast": "일식 정식 스타일 및 정갈한 베트남식, 위생 만족도 높음"
  },
  {
    "name": "락롱 호텔 서호",
    "grade": "4성급",
    "rating": 4.5,
    "address": "683 Đ. Lạc Long Quân, Phú Thượng, Tây Hồ",
    "priceTotalText": "약 14~18만 원",
    "nearby": "롯데몰 서호, 서호 자전거 도로",
    "feature": "서호 고급 주거 구역 위치, 호젓하고 로맨틱한 분위기",
    "breakfast": "가짓수는 적으나 홈메이드 스타일로 깔끔하고 맛있음"
  },
  {
    "name": "A25 프리미엄 황다오투이",
    "grade": "4성급",
    "rating": 4.5,
    "address": "38 P. Hoàng Đạo Thúy, Trung Hoà, Cầu Giấy",
    "priceTotalText": "약 12~16만 원",
    "nearby": "꺼우저이 맛집 타운, 대학가 골목",
    "feature": "압도적 가성비 대비 4성급 시설, 실내 수영장 보유",
    "breakfast": "베트남 로컬식 중심의 알찬 구성, 쌀국수 맛 평가 양호"
  }
];

export const SEED_SPOTS: Omit<Spot, 'id' | 'projectId'>[] = [
  {
    "name": "성요셉 성당",
    "category": "랜드마크",
    "area": "올드쿼터",
    "tip": "19세기 고딕 양식 성당, 성당 앞 스냅 촬영 필수",
    "nearby": "성당 앞 노천 연유커피 카페"
  },
  {
    "name": "호안끼엠 호수 & 응옥썬 사당",
    "category": "랜드마크",
    "area": "올드쿼터",
    "tip": "하노이의 심장, 붉은 테훅교 산책, 주후에 야경",
    "nearby": "포띤 13 로둑, 카페 람"
  },
  {
    "name": "바딘 광장 & 호치민 묘소",
    "category": "랜드마크",
    "area": "바딘",
    "tip": "베트남 독립 성지, 탁 트인 광장 및 호치민 생가",
    "nearby": "분짜 흥리엔, 카페 자앙"
  },
  {
    "name": "진국사",
    "category": "랜드마크",
    "area": "서호",
    "tip": "하노이 최고 6세기 사찰, 11층 붉은 불탑, 서호 노을 명소",
    "nearby": "반똠 호떠이, 메종 마루 서호점"
  },
  {
    "name": "하노이 문묘",
    "category": "랜드마크",
    "area": "바딘",
    "tip": "베트남 최초의 국립대학(1070년 건립), 지폐 10만동 배경",
    "nearby": "Pistachio Bistro"
  },
  {
    "name": "탕롱 황성",
    "category": "랜드마크",
    "area": "바딘",
    "tip": "유네스코 세계문화유산, 베트남 왕조의 역사 유적지",
    "nearby": "주변 가로수길 카페 타운"
  },
  {
    "name": "하노이 기찻길 골목",
    "category": "랜드마크",
    "area": "올드쿼터 외곽",
    "tip": "민가 사이 통과하는 이색 기차 노선, 노천 카페 스팟",
    "nearby": "주변 로컬 커피숍"
  },
  {
    "name": "호아로 수용소",
    "category": "랜드마크",
    "area": "올드쿼터 근접",
    "tip": "프랑스 식민 시절 역사 박물관 ('하노이 힐튼')",
    "nearby": "Curry King Hanoi"
  },
  {
    "name": "동쑤언 시장",
    "category": "랜드마크/쇼핑",
    "area": "올드쿼터 북부",
    "tip": "3층 규모 최대 재래시장, 의류/잡화/건과일 흥정",
    "nearby": "올드쿼터 길거리 로컬 푸드"
  },
  {
    "name": "롱비엔 다리",
    "category": "랜드마크",
    "area": "올드쿼터 북동쪽",
    "tip": "에펠탑 설계자 귀스타브 에펠의 철교, 스냅 사진 명소",
    "nearby": "홍강 주변 빈티지 카페"
  },
  {
    "name": "하노이 오페라 하우스",
    "category": "랜드마크",
    "area": "프렌치 쿼터",
    "tip": "파리 오페라 하우스 본뜬 르네상스 건물, 외관/야경 추천",
    "nearby": "하이랜드 커피 오페라하우스점"
  },
  {
    "name": "못꼿 사당 (일주사)",
    "category": "랜드마크",
    "area": "바딘",
    "tip": "연꽃 모양의 단일 기둥 사찰, 자식 기원 기도처",
    "nearby": "바딘 광장 산책로"
  },
  {
    "name": "베트남 민족학 박물관",
    "category": "랜드마크/공원",
    "area": "꺼우저이",
    "tip": "54개 소수민족 야외 박물관, 현지 가족 나들이 명소",
    "nearby": "Zaika Indian, 반세오 똔득탕"
  },
  {
    "name": "탕롱 수상인형극장",
    "category": "랜드마크/공연",
    "area": "올드쿼터",
    "tip": "베트남 전통 수상인형극 전용 극장, 전통 음악 공연",
    "nearby": "호안끼엠 호숫가 식당가"
  },
  {
    "name": "서호 쑤언지에우 거리",
    "category": "랜드마크/거리",
    "area": "서호",
    "tip": "트렌디한 라이프스타일 거리, 노천 바 & 루프톱 감성",
    "nearby": "Maison de Tet Decor"
  },
  {
    "name": "Hanoi Museum",
    "category": "랜드마크",
    "area": "남뜨리엠",
    "tip": "역피라미드 형태 건축이 인상적, 베트남 근현대 전시",
    "nearby": "Keangnam Landmark 72"
  },
  {
    "name": "Thiên Đường Bảo Sơn",
    "category": "랜드마크",
    "area": "안카인",
    "tip": "하노이 근교 대형 테마파크·워터파크·동물원",
    "nearby": "An Khánh"
  }
];

const localIso = (d: Date) => {
  const p = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
};

/** 예시 여행 시작일 = 오늘 + 30일 (항상 다가오는 여행처럼 보이도록) */
function sampleDates() {
  const s = new Date(); s.setDate(s.getDate() + 30);
  const e = new Date(s); e.setDate(e.getDate() + 2);
  return { start: localIso(s), end: localIso(e) };
}

/** 가상의 예시 항공편 (실제 항공편 아님) */
export const SAMPLE_FLIGHTS = [
  { label: '출국편', route: 'ICN (09:30) → HAN (12:40)', carrier: '대한항공 KE457' },
  { label: '입국편', route: 'HAN (14:10) → ICN (20:35)', carrier: '대한항공 KE458' },
] as const;

export const SAMPLE_ID = 'hanoi-2026-09'; // 마이그레이션 호환용 고정 id

/** 하노이 예시 여행 — 기본으로는 안 깔림. MY › 여행 "예시 불러오기"로만 추가. */
export function sampleProject(): Project {
  const { start, end } = sampleDates();
  return {
    id: SAMPLE_ID,
    name: '하노이 3일 (예시)',
    destination: '베트남 하노이',
    startDate: start,
    endDate: end,
    timezone: 'Asia/Ho_Chi_Minh', // ICT, UTC+7
    outbound: { date: start, flightNo: 'KE457', depAirport: 'ICN', depTime: '09:30', arrAirport: 'HAN', arrTime: '12:40' },
    inbound: { date: end, flightNo: 'KE458', depAirport: 'HAN', depTime: '14:10', arrAirport: 'ICN', arrTime: '20:35' },
  };
}
/** 하위호환 alias (persist migrate 등에서 참조) — 정적 스냅샷 */
export const HANOI_PROJECT: Project = sampleProject();
export const SEED_PROJECT = HANOI_PROJECT;

/** 새 계정/새 앱은 빈 여행으로 시작 (오늘~+2일) */
export function blankProject(): Project {
  const d = new Date();
  const iso = localIso;
  const end = new Date(d); end.setDate(end.getDate() + 2);
  let timezone = 'Asia/Seoul';
  try { timezone = Intl.DateTimeFormat().resolvedOptions().timeZone || timezone; } catch { /* noop */ }
  return {
    id: 'trip-start',
    name: '새 여행',
    destination: '',
    startDate: iso(d),
    endDate: iso(end),
    timezone,
  };
}

/** 항공편 → 타임라인 행 (addProject·patchProject·seed 공용). 항공편 수정 시 자동 갱신됨. */
export function flightTimelineItem(
  leg: 'outbound' | 'inbound',
  f: { flightNo?: string; carrier?: string; depAirport?: string; depTime?: string; arrAirport?: string; arrTime?: string },
): Omit<TimelineItem, 'id' | 'projectId' | 'day' | 'order'> {
  const dir = leg === 'outbound' ? '출국' : '귀국';
  const dep = f.depAirport || '출발';
  const arr = f.arrAirport || '도착';
  const name = f.carrier || f.flightNo || '';
  return {
    startTime: f.depTime || '00:00',
    durationMin: 120,
    place: `${dep} → ${arr} ${dir}${name ? ` (${name})` : ''}`,
    lat: null,
    lng: null,
    memo: f.depTime || f.arrTime ? `${dep} (${f.depTime || '-'}) → ${arr} (${f.arrTime || '-'})` : '',
    flightLeg: leg,
  };
}

// 예시 타임라인 — 가상의 항공편 + 대표 명소 몇 곳 (개인정보 아님)
export const SEED_TIMELINE: Omit<TimelineItem, 'id' | 'projectId'>[] = [
  { day: 1, order: 0, startTime: '09:30', durationMin: 190, place: 'ICN → HAN 출국 (KE457)', lat: null, lng: null, memo: 'ICN (09:30) → HAN (12:40)', flightLeg: 'outbound' },
  { day: 1, order: 1, startTime: '15:00', durationMin: 60, place: '호안끼엠 호수 & 응옥썬 사당', lat: null, lng: null, memo: '붉은 테훅교에서 사진' },
  { day: 1, order: 2, startTime: '18:30', durationMin: 90, place: '타히엔 맥주거리', lat: null, lng: null, memo: '저녁 겸 야시장 구경' },
  { day: 2, order: 0, startTime: '10:00', durationMin: 90, place: '바딘 광장 & 호치민 묘소', lat: null, lng: null, memo: '' },
  { day: 2, order: 1, startTime: '14:00', durationMin: 120, place: '서호 · 진국사', lat: null, lng: null, memo: '노을 시간대 추천' },
  { day: 3, order: 0, startTime: '10:00', durationMin: 90, place: '동쑤언 시장 · 기념품', lat: null, lng: null, memo: '' },
  { day: 3, order: 1, startTime: '14:10', durationMin: 385, place: 'HAN → ICN 귀국 (KE458)', lat: null, lng: null, memo: 'HAN (14:10) → ICN (20:35)', flightLeg: 'inbound' },
];

/** 예시 할 일 */
export const SEED_TODOS: Omit<Todo, 'id' | 'projectId'>[] = [
  { text: '여권 유효기간 6개월 이상 확인', done: true, priority: 'high', order: 1 },
  { text: '유심/이심 준비', done: false, priority: 'mid', order: 2 },
  { text: '그랩(Grab) 앱 설치 · 결제카드 등록', done: false, priority: 'mid', order: 3 },
  { text: '더위·비 대비 (우산, 얇은 겉옷)', done: false, priority: 'low', order: 4 },
];

/** 예시 지출 (가상 금액). dayOffset = 여행 n일차(0-base) */
export const SEED_EXPENSES: (Omit<Expense, 'id' | 'projectId' | 'date'> & { dayOffset: number })[] = [
  { dayOffset: 0, category: '식사', vendor: '쌀국수 점심', amountVnd: '180000', amountKrw: '9800' },
  { dayOffset: 0, category: '기타', categoryEtc: '교통', vendor: '공항 → 시내 그랩', amountVnd: '350000', amountKrw: '19000' },
  { dayOffset: 2, category: '쇼핑', vendor: '기념품 (커피·견과)', amountVnd: '600000', amountKrw: '32500' },
];

/** 예시 한 줄 일기. dayOffset = 여행 n일차(0-base) */
export const SEED_DIARY: (Omit<DiaryEntry, 'id' | 'projectId' | 'date' | 'createdAt'> & { dayOffset: number })[] = [
  { dayOffset: 0, author: '예시', text: '호안끼엠 호수 야경이 생각보다 훨씬 예뻤다', mood: '😍' },
];

/** 예시 여행 시작일 기준 n일차 날짜 (YYYY-MM-DD). 시간대 영향 없도록 정오 기준. */
export function sampleDayIso(start: string, dayOffset: number): string {
  const d = new Date(start + 'T12:00:00');
  d.setDate(d.getDate() + dayOffset);
  const p = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}
