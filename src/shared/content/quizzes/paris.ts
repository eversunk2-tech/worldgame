// Paris quiz pool (spec 6.4): 6 multiple-choice + 5 OX.
import type { QuizItem } from '../../types';

export const PARIS_QUIZ: readonly QuizItem[] = [
  { id: 'paris_c01', cityId: 'paris', topic: 'geo', kind: 'choice', question: '파리가 속한 대륙은?',
    choices: ['유럽', '아시아', '아프리카', '남아메리카'], answer: 0, explanation: '파리는 유럽 대륙 서쪽 프랑스에 있어요' },
  { id: 'paris_c02', cityId: 'paris', topic: 'geo', kind: 'choice', question: '파리 한가운데를 흐르는 강은?',
    choices: ['센강', '템스강', '라인강', '나일강'], answer: 0, explanation: '센강 가운데 시테섬에는 노트르담 대성당이 있어요' },
  { id: 'paris_c03', cityId: 'paris', topic: 'climate', kind: 'choice', question: '파리처럼 여름은 서늘하고 겨울은 온화하며 비가 1년 내내 고르게 오는 기후는?',
    choices: ['서안 해양성 기후', '사막 기후', '열대 우림 기후', '툰드라 기후'], answer: 0, explanation: '대서양에서 불어오는 편서풍 덕분이에요' },
  { id: 'paris_c04', cityId: 'paris', topic: 'culture', kind: 'choice', question: '1889년에 세워진 파리의 상징인 철탑은?',
    choices: ['에펠탑', '피사의 사탑', '빅벤', '자유의 여신상'], answer: 0, explanation: '에펠탑은 높이 약 330m예요' },
  { id: 'paris_c05', cityId: 'paris', topic: 'culture', kind: 'choice', question: '프랑스에서 쓰는 화폐는?',
    choices: ['유로', '달러', '파운드', '원'], answer: 0, explanation: '유로는 유럽의 여러 나라가 함께 쓰는 돈이에요' },
  { id: 'paris_c06', cityId: 'paris', topic: 'culture', kind: 'choice', question: "그림 '모나리자'가 있는 파리의 박물관은?",
    choices: ['루브르 박물관', '대영 박물관', '국립중앙박물관', '메트로폴리탄 박물관'], answer: 0, explanation: '루브르는 세계에서 가장 많은 사람이 찾는 박물관 중 하나예요' },

  { id: 'paris_o01', cityId: 'paris', topic: 'culture', kind: 'ox', question: '파리는 프랑스의 수도이다.',
    answer: true, explanation: '파리는 프랑스의 수도이자 가장 큰 도시예요' },
  { id: 'paris_o02', cityId: 'paris', topic: 'climate', kind: 'ox', question: '파리에는 1년 내내 비가 거의 오지 않는다.',
    answer: false, explanation: '비가 많지는 않지만 1년 내내 고르게 내려요' },
  { id: 'paris_o03', cityId: 'paris', topic: 'geo', kind: 'ox', question: '파리는 높은 산으로 둘러싸인 도시이다.',
    answer: false, explanation: '파리는 넓고 평평한 파리 분지에 있어요' },
  { id: 'paris_o04', cityId: 'paris', topic: 'geo', kind: 'ox', question: '서울이 낮 12시일 때 파리는 아직 새벽이다.',
    answer: true, explanation: '파리는 서울보다 8시간(여름 7시간) 느려요' },
  { id: 'paris_o05', cityId: 'paris', topic: 'climate', kind: 'ox', question: '파리의 겨울은 서울의 겨울보다 따뜻한 편이다.',
    answer: true, explanation: '파리 1월 평균 기온은 약 5°C, 서울은 영하예요' },
];
