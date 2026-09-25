// Paris minigame content (spec appendix A.2): 8 match pairs, 5 map targets, 2 ordering and 4 fill-in-the-blank items.
import type { MinigameContent } from '../../types';

export const PARIS_MINIGAMES: MinigameContent = {
  // A.2 lists no topics for the Paris pairs; assigned by content (geo: 대륙·강·언덕, climate: 기후, culture: 나머지)
  pairs: [
    { id: 'paris_p01', cityId: 'paris', topic: 'geo', left: '파리가 속한 대륙', right: '유럽' },
    { id: 'paris_p02', cityId: 'paris', topic: 'geo', left: '파리를 흐르는 강', right: '센강' },
    { id: 'paris_p03', cityId: 'paris', topic: 'culture', left: '1889년에 세운 철탑', right: '에펠탑' },
    { id: 'paris_p04', cityId: 'paris', topic: 'culture', left: '모나리자가 있는 곳', right: '루브르 박물관' },
    { id: 'paris_p05', cityId: 'paris', topic: 'culture', left: '프랑스의 화폐', right: '유로' },
    { id: 'paris_p06', cityId: 'paris', topic: 'climate', left: '비가 고르게 오는 기후', right: '서안 해양성 기후' },
    { id: 'paris_p07', cityId: 'paris', topic: 'culture', left: '프랑스의 빵', right: '바게트' },
    { id: 'paris_p08', cityId: 'paris', topic: 'geo', left: '파리의 언덕', right: '몽마르트르' },
  ],
  mapTargets: [
    { id: 'paris_t01', cityId: 'paris', prompt: '파리는 어디일까요?', hint: '유럽 대륙 서쪽이에요', target: { type: 'city', id: 'paris' } },
    { id: 'paris_t02', cityId: 'paris', prompt: '파리가 속한 유럽 대륙은?', hint: '아시아 서쪽, 지도 가운데 위쪽이에요', target: { type: 'region', id: 'europe' } },
    { id: 'paris_t03', cityId: 'paris', prompt: '파리 서쪽의 큰 바다, 대서양은?', hint: '유럽·아프리카와 아메리카 사이의 바다예요', target: { type: 'region', id: 'atlantic' } },
    { id: 'paris_t04', cityId: 'paris', prompt: '지중해 건너 남쪽의 아프리카 대륙은?', hint: '유럽 바로 아래, 지도 가운데예요', target: { type: 'region', id: 'africa' } },
    { id: 'paris_t05', cityId: 'paris', prompt: '영국의 수도 런던은?', hint: '파리 북서쪽, 바다 건너 섬나라예요', target: { type: 'city', id: 'london' } },
  ],
  orders: [
    {
      id: 'paris_r01', cityId: 'paris', prompt: '먼저 지어진 것부터 순서대로', direction: 'asc',
      items: [
        { label: '노트르담 대성당', value: 1163, note: '1163년(짓기 시작)' },
        { label: '개선문', value: 1836, note: '1836년' },
        { label: '에펠탑', value: 1889, note: '1889년' },
        { label: '루브르 유리 피라미드', value: 1989, note: '1989년' },
      ],
      // A.2 gives no explanation for r01: composed from the item values only
      explanation: '노트르담 대성당(1163년 짓기 시작) → 개선문(1836년) → 에펠탑(1889년) → 루브르 유리 피라미드(1989년) 순서예요',
    },
    {
      // standard-time differences (spec 14.11: 표준시 기준 + 서머타임 괄호 병기; revised in Stage B review round 2)
      id: 'paris_r02', cityId: 'paris', prompt: '서울과 시차가 작은 도시부터(표준시 기준)', direction: 'asc',
      items: [
        { label: '시드니', value: 1, note: '1시간 빠름(호주 여름 2시간)' },
        { label: '카이로', value: 7, note: '7시간 느림(이집트 여름 6시간)' },
        { label: '파리', value: 8, note: '8시간 느림(유럽 여름 7시간)' },
        { label: '뉴욕', value: 14, note: '14시간 느림(미국 여름 13시간)' },
      ],
      explanation: '동쪽으로 갈수록 시간이 빨라요. 표준시로 시드니는 서울보다 1시간 빠르고(호주 여름에는 2시간), 뉴욕은 14시간 느려요(미국 여름에는 13시간).',
    },
  ],
  // explanation = the completed sentence (A.2)
  blanks: [
    {
      id: 'paris_b01', cityId: 'paris', text: '파리는 [0] 대륙에 있는 [1]의 수도이다.',
      blanks: [
        { answer: '유럽', options: ['유럽', '아시아', '아프리카', '북아메리카'] },
        { answer: '프랑스', options: ['프랑스', '영국', '독일', '이탈리아'] },
      ],
      explanation: '파리는 유럽 대륙에 있는 프랑스의 수도이다.',
    },
    {
      id: 'paris_b02', cityId: 'paris', text: '파리의 기후는 대서양과 [0]의 영향을 받는 [1] 기후이다.',
      blanks: [
        { answer: '편서풍', options: ['편서풍', '계절풍', '무역풍', '태풍'] },
        { answer: '서안 해양성', options: ['서안 해양성', '사막', '열대 우림', '툰드라'] },
      ],
      explanation: '파리의 기후는 대서양과 편서풍의 영향을 받는 서안 해양성 기후이다.',
    },
    {
      id: 'paris_b03', cityId: 'paris', text: '1889년에 세운 [0]은 파리의 상징이다.',
      blanks: [{ answer: '에펠탑', options: ['에펠탑', '빅벤', '피사의 사탑', '다보탑'] }],
      explanation: '1889년에 세운 에펠탑은 파리의 상징이다.',
    },
    {
      id: 'paris_b04', cityId: 'paris', text: '프랑스에서는 화폐로 [0]를 쓴다.',
      // 원 → 루피: every option now takes 를, so the particle no longer rules one out (review Stage C L5)
      blanks: [{ answer: '유로', options: ['유로', '달러', '파운드', '루피'] }],
      explanation: '프랑스에서는 화폐로 유로를 쓴다.',
    },
  ],
};
