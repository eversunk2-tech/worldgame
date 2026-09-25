// 뉴욕 minigame content (spec appendix A.4): 8 match pairs, 5 map targets, 2 ordering and 4 fill-in-the-blank items.
import type { MinigameContent } from '../../types';

export const NEWYORK_MINIGAMES: MinigameContent = {
  // A.4 lists no pair topics; assigned by content (geo: 나라·대륙·강·섬·해변·자연, climate: 기후, culture: 나머지)
  pairs: [
    { id: 'newyork_p01', cityId: 'newyork', topic: 'geo', left: '뉴욕이 있는 나라', right: '미국' },
    { id: 'newyork_p02', cityId: 'newyork', topic: 'geo', left: '뉴욕 도심이 있는 섬', right: '맨해튼' },
    { id: 'newyork_p03', cityId: 'newyork', topic: 'geo', left: '맨해튼 한가운데의 공원', right: '센트럴 파크' },
    { id: 'newyork_p04', cityId: 'newyork', topic: 'culture', left: '프랑스가 선물한 동상', right: '자유의 여신상' },
    { id: 'newyork_p05', cityId: 'newyork', topic: 'culture', left: '미국의 화폐', right: '달러' },
    { id: 'newyork_p06', cityId: 'newyork', topic: 'geo', left: '뉴욕 서쪽을 흐르는 강', right: '허드슨강' },
    { id: 'newyork_p07', cityId: 'newyork', topic: 'culture', left: '뉴욕의 길거리 음식', right: '핫도그' },
    { id: 'newyork_p08', cityId: 'newyork', topic: 'culture', left: '미국의 수도', right: '워싱턴 D.C.' },
  ],
  mapTargets: [
    { id: 'newyork_t01', cityId: 'newyork', prompt: '뉴욕은 어디일까요?', hint: '북아메리카 동쪽 바닷가예요', target: { type: 'city', id: 'newyork' } },
    { id: 'newyork_t02', cityId: 'newyork', prompt: '뉴욕이 속한 북아메리카 대륙은?', hint: '지도 왼쪽 위의 큰 대륙이에요', target: { type: 'region', id: 'north_america' } },
    { id: 'newyork_t03', cityId: 'newyork', prompt: '뉴욕 동쪽의 대서양은?', hint: '아메리카와 유럽·아프리카 사이의 바다예요', target: { type: 'region', id: 'atlantic' } },
    { id: 'newyork_t04', cityId: 'newyork', prompt: '북아메리카 아래에 이어진 남아메리카 대륙은?', hint: '지도 왼쪽 아래예요', target: { type: 'region', id: 'south_america' } },
    { id: 'newyork_t05', cityId: 'newyork', prompt: '북아메리카 서쪽의 태평양은?', hint: '지도 왼쪽 끝의 넓은 바다예요', target: { type: 'region', id: 'pacific' } },
  ],
  // label/value as in A.4; the note under each card (shown after answering) is the value with its unit
  orders: [
    {
      id: 'newyork_r01', cityId: 'newyork', prompt: '먼저 만들어진 것부터 순서대로', direction: 'asc',
      items: [
        { label: '브루클린 다리', value: 1883, note: '1883년' },
        { label: '자유의 여신상', value: 1886, note: '1886년' },
        { label: '엠파이어 스테이트 빌딩', value: 1931, note: '1931년' },
        { label: '원 월드 트레이드 센터', value: 2014, note: '2014년' },
      ],
      explanation: '브루클린 다리가 가장 오래됐고, 원 월드 트레이드 센터는 미국에서 가장 높은 건물이에요',
    },
    {
      id: 'newyork_r02', cityId: 'newyork', prompt: '서쪽에 있는 도시부터 순서대로', direction: 'asc',
      items: [
        { label: '뉴욕', value: -74, note: '서경 74°' },
        { label: '리우데자네이루', value: -43, note: '서경 43°' },
        { label: '파리', value: 2, note: '동경 2°' },
        { label: '카이로', value: 31, note: '동경 31°' },
      ],
      explanation: '본초 자오선(경도 0°)을 기준으로 서경은 숫자가 클수록, 동경은 숫자가 작을수록 서쪽이에요',
    },
  ],
  // explanation = the completed sentence (A.4)
  blanks: [
    {
      id: 'newyork_b01', cityId: 'newyork', text: '뉴욕은 [0] 대륙 동쪽, [1] 가에 있다.',
      blanks: [
        { answer: '북아메리카', options: ['북아메리카', '남아메리카', '유럽', '아시아'] },
        { answer: '대서양', options: ['대서양', '태평양', '인도양', '지중해'] },
      ],
      explanation: '뉴욕은 북아메리카 대륙 동쪽, 대서양 가에 있다.',
    },
    {
      id: 'newyork_b02', cityId: 'newyork', text: '뉴욕의 도로는 바둑판처럼 [0] 모양이다.',
      blanks: [{ answer: '격자', options: ['격자', '방사형', '미로', '원'] }],
      explanation: '뉴욕의 도로는 바둑판처럼 격자 모양이다.',
    },
    {
      id: 'newyork_b03', cityId: 'newyork', text: '[0]은 [1]가 미국에 선물한 것이다.',
      blanks: [
        { answer: '자유의 여신상', options: ['자유의 여신상', '예수상', '에펠탑', '개선문'] },
        { answer: '프랑스', options: ['프랑스', '에스파냐', '이탈리아', '러시아'] },
      ],
      explanation: '자유의 여신상은 프랑스가 미국에 선물한 것이다.',
    },
    {
      id: 'newyork_b04', cityId: 'newyork', text: '미국의 수도는 뉴욕이 아니라 [0]이다.',
      blanks: [{ answer: '워싱턴 D.C.', options: ['워싱턴 D.C.', '시카고', '보스턴', '로스앤젤레스'] }],
      explanation: '미국의 수도는 뉴욕이 아니라 워싱턴 D.C.이다.',
    },
  ],
};
