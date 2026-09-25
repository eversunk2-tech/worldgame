// Seoul minigame content (spec appendix A.1; t01/t03/t04 wording and the b02 option revised in Stage B review
// round 2): 8 match pairs, 5 map targets, 2 ordering and 4 fill-in-the-blank items.
import type { MinigameContent } from '../../types';

export const SEOUL_MINIGAMES: MinigameContent = {
  // topic order geo·geo·culture·culture·climate·climate·culture·culture (A.1)
  pairs: [
    { id: 'seoul_p01', cityId: 'seoul', topic: 'geo', left: '서울이 속한 대륙', right: '아시아' },
    { id: 'seoul_p02', cityId: 'seoul', topic: 'geo', left: '서울을 흐르는 강', right: '한강' },
    { id: 'seoul_p03', cityId: 'seoul', topic: 'culture', left: '조선의 궁궐', right: '경복궁' },
    { id: 'seoul_p04', cityId: 'seoul', topic: 'culture', left: '세종대왕이 만든 글자', right: '한글' },
    { id: 'seoul_p05', cityId: 'seoul', topic: 'climate', left: '사계절이 뚜렷한 기후', right: '온대 기후' },
    { id: 'seoul_p06', cityId: 'seoul', topic: 'climate', left: '겨울에 부는 찬 바람', right: '북서풍' },
    { id: 'seoul_p07', cityId: 'seoul', topic: 'culture', left: '우리나라의 명절', right: '설·추석' },
    { id: 'seoul_p08', cityId: 'seoul', topic: 'culture', left: '우리나라 전통 옷', right: '한복' },
  ],
  mapTargets: [
    { id: 'seoul_t01', cityId: 'seoul', prompt: '서울은 어디일까요?', hint: '아시아 대륙 동쪽, 한반도 중부예요', target: { type: 'city', id: 'seoul' } },
    { id: 'seoul_t02', cityId: 'seoul', prompt: '서울이 속한 아시아 대륙을 찾아 보세요', hint: '지도 오른쪽 위의 가장 큰 대륙이에요', target: { type: 'region', id: 'asia' } },
    { id: 'seoul_t03', cityId: 'seoul', prompt: '동해 너머 한반도 동쪽의 넓은 바다, 태평양은 어디일까요?', hint: '지도 오른쪽 끝과 왼쪽 끝에 걸친 가장 넓은 바다예요', target: { type: 'region', id: 'pacific' } },
    { id: 'seoul_t04', cityId: 'seoul', prompt: '중국의 수도 베이징은 어디일까요?', hint: '서울 서쪽, 비행기로 2시간쯤 걸리는 곳이에요', target: { type: 'city', id: 'beijing' } },
    { id: 'seoul_t05', cityId: 'seoul', prompt: '파리가 있는 유럽 대륙은 어디일까요?', hint: '아시아 서쪽, 지도 가운데 위쪽이에요', target: { type: 'region', id: 'europe' } },
  ],
  orders: [
    {
      id: 'seoul_r01', cityId: 'seoul', prompt: '서울에서 가까운 도시부터 순서대로', direction: 'asc',
      items: [
        { label: '베이징', value: 953, note: '953km' },
        { label: '시드니', value: 8330, note: '8,330km' },
        { label: '파리', value: 8965, note: '8,965km' },
        { label: '뉴욕', value: 11052, note: '11,052km' },
      ],
      explanation: '베이징은 950km로 비행기로 2시간, 뉴욕은 11,000km로 14시간쯤 걸려요',
    },
    {
      id: 'seoul_r02', cityId: 'seoul', prompt: '북쪽에 있는 도시부터 순서대로', direction: 'desc',
      items: [
        { label: '파리', value: 48.9, note: '북위 48.9°' },
        { label: '서울', value: 37.6, note: '북위 37.6°' },
        { label: '카이로', value: 30.0, note: '북위 30.0°' },
        { label: '시드니', value: -33.9, note: '남위 33.9°' },
      ],
      explanation: '북위가 높을수록 북쪽이에요. 시드니는 남반구라 남위로 나타내요',
    },
  ],
  // explanation = the completed sentence (A.1)
  blanks: [
    {
      id: 'seoul_b01', cityId: 'seoul', text: '서울은 [0] 대륙의 [1]에 있다.',
      blanks: [
        { answer: '아시아', options: ['유럽', '아시아', '아프리카', '오세아니아'] },
        { answer: '한반도', options: ['한반도', '이베리아반도', '아라비아반도', '인도반도'] },
      ],
      explanation: '서울은 아시아 대륙의 한반도에 있다.',
    },
    {
      id: 'seoul_b02', cityId: 'seoul', text: '서울의 여름에는 [0]에서 덥고 습한 바람이 분다.',
      blanks: [{ answer: '남동쪽', options: ['남동쪽', '북서쪽', '북동쪽', '북쪽'] }],
      explanation: '서울의 여름에는 남동쪽에서 덥고 습한 바람이 분다.',
    },
    {
      id: 'seoul_b03', cityId: 'seoul', text: '[0]이 만든 글자는 [1]이다.',
      blanks: [
        { answer: '세종대왕', options: ['세종대왕', '이순신', '장영실', '정약용'] },
        { answer: '한글', options: ['한글', '한자', '가나', '알파벳'] },
      ],
      explanation: '세종대왕이 만든 글자는 한글이다.',
    },
    {
      id: 'seoul_b04', cityId: 'seoul', text: '서울 가운데를 흐르는 강은 [0]이다.',
      blanks: [{ answer: '한강', options: ['한강', '낙동강', '금강', '나일강'] }],
      explanation: '서울 가운데를 흐르는 강은 한강이다.',
    },
  ],
};
