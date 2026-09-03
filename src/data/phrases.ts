/** 하노이 여행 베트남어 미니 회화 — 한국어 / 베트남어 / 한글 발음 */
export interface Phrase { ko: string; vi: string; pron: string }
export interface PhraseGroup { title: string; items: Phrase[] }

export const PHRASE_GROUPS: PhraseGroup[] = [
  {
    title: '기본',
    items: [
      { ko: '안녕하세요', vi: 'Xin chào', pron: '신 짜오' },
      { ko: '감사합니다', vi: 'Cảm ơn', pron: '깜 언' },
      { ko: '죄송합니다 / 실례합니다', vi: 'Xin lỗi', pron: '신 로이' },
      { ko: '네 / 아니요', vi: 'Vâng / Không', pron: '벙 / 콤' },
      { ko: '얼마예요?', vi: 'Bao nhiêu tiền?', pron: '바오 니에우 띠엔' },
      { ko: '너무 비싸요', vi: 'Đắt quá', pron: '닫 꽈' },
      { ko: '깎아 주세요', vi: 'Giảm giá đi', pron: '잠 자 디' },
      { ko: '괜찮아요', vi: 'Không sao', pron: '콤 사오' },
    ],
  },
  {
    title: '택시 · 그랩',
    items: [
      { ko: '여기로 가주세요', vi: 'Cho tôi đến đây', pron: '쩌 또이 덴 더이' },
      { ko: '미터기 켜주세요', vi: 'Bật đồng hồ đi', pron: '벋 돔 호 디' },
      { ko: '여기서 세워주세요', vi: 'Dừng ở đây', pron: '증 어 더이' },
      { ko: '공항까지 얼마예요?', vi: 'Đến sân bay bao nhiêu?', pron: '덴 선 바이 바오 니에우' },
      { ko: '노이바이 공항', vi: 'Sân bay Nội Bài', pron: '선 바이 노이 바이' },
      { ko: '호안끼엠 호수', vi: 'Hồ Hoàn Kiếm', pron: '호 호안 끼엠' },
    ],
  },
  {
    title: '식당 · 카페',
    items: [
      { ko: '메뉴 주세요', vi: 'Cho tôi xem thực đơn', pron: '쩌 또이 셈 특 던' },
      { ko: '이거 주세요', vi: 'Cho tôi cái này', pron: '쩌 또이 까이 나이' },
      { ko: '안 맵게 해주세요', vi: 'Không cay', pron: '콤 까이' },
      { ko: '고수 빼주세요', vi: 'Không rau mùi', pron: '콤 자우 무이' },
      { ko: '계산해 주세요', vi: 'Tính tiền', pron: '띤 띠엔' },
      { ko: '맛있어요', vi: 'Ngon quá', pron: '응온 꽈' },
      { ko: '아이스 커피', vi: 'Cà phê đá', pron: '까 페 다' },
      { ko: '물 한 병', vi: 'Một chai nước', pron: '몯 짜이 느억' },
    ],
  },
  {
    title: '숫자',
    items: [
      { ko: '1 / 2 / 3', vi: 'một / hai / ba', pron: '몯 / 하이 / 바' },
      { ko: '4 / 5 / 6', vi: 'bốn / năm / sáu', pron: '본 / 남 / 사우' },
      { ko: '7 / 8 / 9 / 10', vi: 'bảy / tám / chín / mười', pron: '바이 / 땀 / 찐 / 므어이' },
      { ko: '천 (1,000)', vi: 'nghìn', pron: '응인' },
      { ko: '만 (10,000)', vi: 'mười nghìn', pron: '므어이 응인' },
      { ko: '십만 (100,000)', vi: 'trăm nghìn', pron: '짬 응인' },
    ],
  },
  {
    title: '도움 요청',
    items: [
      { ko: '도와주세요', vi: 'Giúp tôi với', pron: '줍 또이 버이' },
      { ko: '화장실 어디예요?', vi: 'Nhà vệ sinh ở đâu?', pron: '냐 베 신 어 더우' },
      { ko: '병원 / 약국', vi: 'Bệnh viện / Nhà thuốc', pron: '벤 비엔 / 냐 투옥' },
      { ko: '경찰을 불러주세요', vi: 'Gọi công an giúp tôi', pron: '거이 꽁 안 줍 또이' },
      { ko: '길을 잃었어요', vi: 'Tôi bị lạc đường', pron: '또이 비 락 드엉' },
      { ko: '한국 대사관', vi: 'Đại sứ quán Hàn Quốc', pron: '다이 스 꽌 한 꾸옥' },
    ],
  },
];
