// 시드니 minigame content (spec appendix A.5): 8 match pairs, 5 map targets, 2 ordering and 4 fill-in-the-blank items.
import type { MinigameContent } from '../../types';

export const SYDNEY_MINIGAMES: MinigameContent = {
  // A.5 lists no pair topics; assigned by content (geo: 나라·대륙·강·섬·해변·자연, climate: 기후, culture: 나머지)
  pairs: [
    { id: 'sydney_p01', cityId: 'sydney', topic: 'geo', left: '시드니가 있는 나라', right: '오스트레일리아' },
    { id: 'sydney_p02', cityId: 'sydney', topic: 'geo', left: '시드니가 속한 대륙', right: '오세아니아' },
    { id: 'sydney_p03', cityId: 'sydney', topic: 'culture', left: '돛 모양 지붕 건물', right: '오페라 하우스' },
    { id: 'sydney_p04', cityId: 'sydney', topic: 'culture', left: '시드니 항구의 다리', right: '하버 브리지' },
    { id: 'sydney_p05', cityId: 'sydney', topic: 'geo', left: '시드니의 유명한 해변', right: '본다이' },
    { id: 'sydney_p06', cityId: 'sydney', topic: 'culture', left: '주머니에 새끼를 키우는 동물', right: '캥거루' },
    { id: 'sydney_p07', cityId: 'sydney', topic: 'culture', left: '오스트레일리아의 수도', right: '캔버라' },
    { id: 'sydney_p08', cityId: 'sydney', topic: 'culture', left: '오스트레일리아 원주민', right: '애버리지니' },
  ],
  mapTargets: [
    { id: 'sydney_t01', cityId: 'sydney', prompt: '시드니는 어디일까요?', hint: '오스트레일리아 남동쪽 바닷가예요', target: { type: 'city', id: 'sydney' } },
    { id: 'sydney_t02', cityId: 'sydney', prompt: '시드니가 속한 오세아니아 대륙은?', hint: '지도 오른쪽 아래의 대륙이에요', target: { type: 'region', id: 'oceania' } },
    { id: 'sydney_t03', cityId: 'sydney', prompt: '시드니 동쪽의 태평양은?', hint: '오스트레일리아와 아메리카 사이의 넓은 바다예요', target: { type: 'region', id: 'pacific' } },
    { id: 'sydney_t04', cityId: 'sydney', prompt: '오스트레일리아 서쪽의 인도양은?', hint: '아프리카와 오스트레일리아 사이의 바다예요', target: { type: 'region', id: 'indian' } },
    { id: 'sydney_t05', cityId: 'sydney', prompt: '오스트레일리아 북쪽의 아시아 대륙은?', hint: '지도 오른쪽 위의 가장 큰 대륙이에요', target: { type: 'region', id: 'asia' } },
  ],
  // label/value as in A.5; the note under each card (shown after answering) is the value with its unit
  orders: [
    {
      id: 'sydney_r01', cityId: 'sydney', prompt: '남쪽에 있는 도시부터 순서대로', direction: 'asc',
      items: [
        { label: '시드니', value: -33.9, note: '남위 33.9°' },
        { label: '리우데자네이루', value: -22.9, note: '남위 22.9°' },
        { label: '카이로', value: 30, note: '북위 30.0°' },
        { label: '파리', value: 48.9, note: '북위 48.9°' },
      ],
      explanation: '남반구 도시는 남위로 나타내요. 시드니와 리우는 남반구예요',
    },
    {
      id: 'sydney_r02', cityId: 'sydney', prompt: '시드니의 계절을 12월부터 순서대로', direction: 'asc',
      items: [
        { label: '여름', value: 1, note: '12~2월' },
        { label: '가을', value: 2, note: '3~5월' },
        { label: '겨울', value: 3, note: '6~8월' },
        { label: '봄', value: 4, note: '9~11월' },
      ],
      explanation: '남반구는 12월이 여름이고 6월이 겨울이에요',
    },
  ],
  // explanation = the completed sentence (A.5)
  blanks: [
    {
      id: 'sydney_b01', cityId: 'sydney', text: '시드니는 [0] 대륙의 [1]에 있다.',
      blanks: [
        { answer: '오세아니아', options: ['오세아니아', '아시아', '유럽', '남아메리카'] },
        { answer: '오스트레일리아', options: ['오스트레일리아', '뉴질랜드', '인도네시아', '캐나다'] },
      ],
      explanation: '시드니는 오세아니아 대륙의 오스트레일리아에 있다.',
    },
    {
      id: 'sydney_b02', cityId: 'sydney', text: '시드니는 [0]에 있어 12월이 [1]이다.',
      blanks: [
        { answer: '남반구', options: ['남반구', '북반구', '적도', '북극'] },
        { answer: '여름', options: ['여름', '겨울', '봄', '가을'] },
      ],
      explanation: '시드니는 남반구에 있어 12월이 여름이다.',
    },
    {
      id: 'sydney_b03', cityId: 'sydney', text: '돛 모양 지붕의 [0]는 시드니 항구에 있다.',
      blanks: [{ answer: '오페라 하우스', options: ['오페라 하우스', '하버 브리지', '피라미드', '남산타워'] }],
      explanation: '돛 모양 지붕의 오페라 하우스는 시드니 항구에 있다.',
    },
    {
      id: 'sydney_b04', cityId: 'sydney', text: '오스트레일리아의 수도는 시드니가 아니라 [0]이다.',
      blanks: [{ answer: '캔버라', options: ['캔버라', '멜버른', '퍼스', '브리즈번'] }],
      explanation: '오스트레일리아의 수도는 시드니가 아니라 캔버라이다.',
    },
  ],
};
