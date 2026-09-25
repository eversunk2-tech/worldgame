// 리우데자네이루 minigame content (spec appendix A.6): 8 match pairs, 5 map targets, 2 ordering and 4 fill-in-the-blank items.
import type { MinigameContent } from '../../types';

export const RIO_MINIGAMES: MinigameContent = {
  // A.6 lists no pair topics; assigned by content (geo: 나라·대륙·강·섬·해변·자연, climate: 기후, culture: 나머지)
  pairs: [
    { id: 'rio_p01', cityId: 'rio', topic: 'geo', left: '리우가 있는 나라', right: '브라질' },
    { id: 'rio_p02', cityId: 'rio', topic: 'culture', left: '브라질에서 쓰는 말', right: '포르투갈어' },
    { id: 'rio_p03', cityId: 'rio', topic: 'culture', left: '삼바 춤을 추는 축제', right: '카니발' },
    { id: 'rio_p04', cityId: 'rio', topic: 'culture', left: '코르코바두산 위의 동상', right: '예수상' },
    { id: 'rio_p05', cityId: 'rio', topic: 'geo', left: '리우의 유명한 해변', right: '코파카바나' },
    { id: 'rio_p06', cityId: 'rio', topic: 'culture', left: '브라질의 춤', right: '삼바' },
    { id: 'rio_p07', cityId: 'rio', topic: 'culture', left: '브라질의 수도', right: '브라질리아' },
    { id: 'rio_p08', cityId: 'rio', topic: 'geo', left: '세계에서 가장 넓은 열대 우림', right: '아마존' },
  ],
  mapTargets: [
    { id: 'rio_t01', cityId: 'rio', prompt: '리우데자네이루는 어디일까요?', hint: '남아메리카 동쪽 바닷가예요', target: { type: 'city', id: 'rio' } },
    { id: 'rio_t02', cityId: 'rio', prompt: '리우가 속한 남아메리카 대륙은?', hint: '지도 왼쪽 아래의 대륙이에요', target: { type: 'region', id: 'south_america' } },
    { id: 'rio_t03', cityId: 'rio', prompt: '리우 동쪽의 대서양은?', hint: '남아메리카와 아프리카 사이의 바다예요', target: { type: 'region', id: 'atlantic' } },
    { id: 'rio_t04', cityId: 'rio', prompt: '남아메리카 위에 이어진 북아메리카 대륙은?', hint: '지도 왼쪽 위예요', target: { type: 'region', id: 'north_america' } },
    { id: 'rio_t05', cityId: 'rio', prompt: '대서양 건너 동쪽의 아프리카 대륙은?', hint: '지도 가운데, 남아메리카 오른쪽이에요', target: { type: 'region', id: 'africa' } },
  ],
  // label/value as in A.6; the note under each card (shown after answering) is the value with its unit
  orders: [
    {
      id: 'rio_r01', cityId: 'rio', prompt: '먼저 열린 올림픽부터 순서대로', direction: 'asc',
      items: [
        { label: '서울', value: 1988, note: '1988년' },
        { label: '시드니', value: 2000, note: '2000년' },
        { label: '리우데자네이루', value: 2016, note: '2016년' },
        { label: '파리', value: 2024, note: '2024년' },
      ],
      explanation: '리우 올림픽은 남아메리카에서 처음 열린 올림픽이에요',
    },
    {
      id: 'rio_r02', cityId: 'rio', prompt: '높이가 낮은 것부터 순서대로(산은 바다 위 높이)', direction: 'asc',
      items: [
        { label: '예수상', value: 38, note: '38m' },
        { label: '남산(서울)', value: 270, note: '270m' }, // 국토지리정보원 270.85m (review Stage C M1; A.6 had 243)
        { label: '팡지아수카르', value: 396, note: '396m' },
        { label: '코르코바두산', value: 710, note: '710m' },
      ],
      explanation: '예수상은 코르코바두산(710m) 꼭대기에 서 있어요',
    },
  ],
  // explanation = the completed sentence (A.6)
  blanks: [
    {
      id: 'rio_b01', cityId: 'rio', text: '리우데자네이루는 [0] 대륙의 [1]에 있다.',
      blanks: [
        { answer: '남아메리카', options: ['남아메리카', '북아메리카', '아프리카', '오세아니아'] },
        { answer: '브라질', options: ['브라질', '아르헨티나', '멕시코', '에스파냐'] },
      ],
      explanation: '리우데자네이루는 남아메리카 대륙의 브라질에 있다.',
    },
    {
      id: 'rio_b02', cityId: 'rio', text: '리우는 1년 내내 덥고 습한 [0] 기후이다.',
      blanks: [{ answer: '열대', options: ['열대', '온대', '사막', '한대'] }],
      explanation: '리우는 1년 내내 덥고 습한 열대 기후이다.',
    },
    {
      id: 'rio_b03', cityId: 'rio', text: '브라질에서는 [0]를 쓰고, 매년 [1]이 열린다.',
      blanks: [
        { answer: '포르투갈어', options: ['포르투갈어', '에스파냐어', '영어', '프랑스어'] },
        { answer: '카니발', options: ['카니발', '올림픽', '추석', '할로윈'] },
      ],
      explanation: '브라질에서는 포르투갈어를 쓰고, 매년 카니발이 열린다.',
    },
    {
      id: 'rio_b04', cityId: 'rio', text: '코르코바두산 꼭대기에는 [0]이 서 있다.',
      blanks: [{ answer: '예수상', options: ['예수상', '자유의 여신상', '에펠탑', '개선문'] }],
      explanation: '코르코바두산 꼭대기에는 예수상이 서 있다.',
    },
  ],
};
