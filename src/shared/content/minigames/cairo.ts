// 카이로 minigame content (spec appendix A.3): 8 match pairs, 5 map targets, 2 ordering and 4 fill-in-the-blank items.
import type { MinigameContent } from '../../types';

export const CAIRO_MINIGAMES: MinigameContent = {
  // A.3 lists no pair topics; assigned by content (geo: 나라·대륙·강·섬·해변·자연, climate: 기후, culture: 나머지)
  pairs: [
    { id: 'cairo_p01', cityId: 'cairo', topic: 'geo', left: '카이로가 있는 나라', right: '이집트' },
    { id: 'cairo_p02', cityId: 'cairo', topic: 'geo', left: '카이로 옆을 흐르는 강', right: '나일강' },
    { id: 'cairo_p03', cityId: 'cairo', topic: 'geo', left: '카이로가 속한 대륙', right: '아프리카' },
    { id: 'cairo_p04', cityId: 'cairo', topic: 'culture', left: '파라오의 무덤', right: '피라미드' },
    { id: 'cairo_p05', cityId: 'cairo', topic: 'geo', left: '이집트의 큰 사막', right: '사하라 사막' },
    { id: 'cairo_p06', cityId: 'cairo', topic: 'culture', left: '고대 이집트의 글자', right: '상형 문자' },
    { id: 'cairo_p07', cityId: 'cairo', topic: 'culture', left: '이집트의 음식', right: '코샤리' },
    { id: 'cairo_p08', cityId: 'cairo', topic: 'climate', left: '비가 거의 없는 기후', right: '사막 기후' },
  ],
  mapTargets: [
    { id: 'cairo_t01', cityId: 'cairo', prompt: '카이로는 어디일까요?', hint: '아프리카 북동쪽, 나일강 근처예요', target: { type: 'city', id: 'cairo' } },
    { id: 'cairo_t02', cityId: 'cairo', prompt: '카이로가 속한 아프리카 대륙은?', hint: '지도 가운데, 유럽 아래의 큰 대륙이에요', target: { type: 'region', id: 'africa' } },
    { id: 'cairo_t03', cityId: 'cairo', prompt: '아프리카 동쪽의 인도양은?', hint: '아프리카와 오스트레일리아 사이의 바다예요', target: { type: 'region', id: 'indian' } },
    { id: 'cairo_t04', cityId: 'cairo', prompt: '지중해 건너 북쪽의 유럽 대륙은?', hint: '아프리카 바로 위예요', target: { type: 'region', id: 'europe' } },
    { id: 'cairo_t05', cityId: 'cairo', prompt: '케냐의 수도 나이로비는?', hint: '카이로 남쪽, 아프리카 동쪽 적도 근처예요', target: { type: 'city', id: 'nairobi' } },
  ],
  // label/value as in A.3; the note under each card (shown after answering) is the value with its unit
  orders: [
    {
      id: 'cairo_r01', cityId: 'cairo', prompt: '높이가 낮은 것부터 순서대로', direction: 'asc',
      items: [
        { label: '스핑크스', value: 20, note: '20m' },
        { label: '예수상(리우)', value: 38, note: '38m' },
        { label: '자유의 여신상(뉴욕)', value: 93, note: '93m' },
        { label: '대피라미드', value: 138, note: '138m' },
      ],
      explanation: '대피라미드는 지금도 약 138m로 가장 높아요',
    },
    {
      id: 'cairo_r02', cityId: 'cairo', prompt: '인구가 적은 도시부터 순서대로', direction: 'asc',
      items: [
        { label: '시드니', value: 540, note: '540만 명' },
        { label: '리우데자네이루', value: 620, note: '620만 명' },
        { label: '뉴욕', value: 830, note: '830만 명' },
        { label: '카이로', value: 1000, note: '1,000만 명' },
      ],
      explanation: '카이로는 주변까지 합치면 2,000만 명이 넘는 큰 도시예요',
    },
  ],
  // explanation = the completed sentence (A.3)
  blanks: [
    {
      id: 'cairo_b01', cityId: 'cairo', text: '카이로는 [0] 대륙 북동쪽, [1] 가에 있다.',
      blanks: [
        { answer: '아프리카', options: ['아프리카', '아시아', '유럽', '남아메리카'] },
        { answer: '나일강', options: ['나일강', '센강', '한강', '아마존강'] },
      ],
      explanation: '카이로는 아프리카 대륙 북동쪽, 나일강 가에 있다.',
    },
    {
      id: 'cairo_b02', cityId: 'cairo', text: '카이로는 비가 거의 오지 않는 [0] 기후이다.',
      blanks: [{ answer: '사막', options: ['사막', '온대', '열대', '한대'] }],
      explanation: '카이로는 비가 거의 오지 않는 사막 기후이다.',
    },
    {
      id: 'cairo_b03', cityId: 'cairo', text: '기자의 [0]는 약 4,500년 전 [1]의 무덤으로 지어졌다.',
      blanks: [
        { answer: '피라미드', options: ['피라미드', '스핑크스', '오페라 하우스', '남산타워'] },
        { answer: '파라오', options: ['파라오', '황제', '대통령', '왕비'] },
      ],
      explanation: '기자의 피라미드는 약 4,500년 전 파라오의 무덤으로 지어졌다.',
    },
    {
      id: 'cairo_b04', cityId: 'cairo', text: '이집트에서는 [0]를 쓴다.',
      blanks: [{ answer: '아랍어', options: ['아랍어', '영어', '프랑스어', '포르투갈어'] }],
      explanation: '이집트에서는 아랍어를 쓴다.',
    },
  ],
};
