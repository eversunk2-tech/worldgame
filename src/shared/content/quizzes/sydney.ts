// 시드니 quiz pool (spec appendix A.5): 6 multiple-choice + 5 OX.
import type { QuizItem } from '../../types';

export const SYDNEY_QUIZ: readonly QuizItem[] = [
  { id: 'sydney_c01', cityId: 'sydney', topic: 'geo', kind: 'choice', question: '시드니가 속한 대륙은?',
    choices: ['오세아니아', '아시아', '아프리카', '남아메리카'], answer: 0, explanation: '시드니는 오세아니아 대륙 오스트레일리아 남동쪽 바닷가에 있어요' },
  { id: 'sydney_c02', cityId: 'sydney', topic: 'geo', kind: 'choice', question: '시드니 항구에 있는 돛 모양 지붕의 건물은?',
    choices: ['오페라 하우스', '루브르 박물관', '경복궁', '피라미드'], answer: 0, explanation: '1973년에 완성된 오페라 하우스는 세계 문화유산이에요' },
  { id: 'sydney_c03', cityId: 'sydney', topic: 'climate', kind: 'choice', question: '시드니에서 12월은 어떤 계절일까요?',
    choices: ['여름', '겨울', '봄', '가을'], answer: 0, explanation: '남반구는 계절이 우리나라와 반대라 크리스마스가 여름이에요' },
  { id: 'sydney_c04', cityId: 'sydney', topic: 'climate', kind: 'choice', question: '서울이 낮 12시일 때 시드니(호주 겨울)는 몇 시일까요?',
    choices: ['오후 1시', '오전 11시', '밤 12시', '새벽 4시'], answer: 0, explanation: '시드니는 서울보다 1시간(호주 여름에는 2시간) 빨라요' },
  { id: 'sydney_c05', cityId: 'sydney', topic: 'culture', kind: 'choice', question: '오스트레일리아의 수도는?',
    choices: ['캔버라', '시드니', '멜버른', '브리즈번'], answer: 0, explanation: '시드니는 가장 큰 도시지만 수도는 캔버라예요' },
  { id: 'sydney_c06', cityId: 'sydney', topic: 'culture', kind: 'choice', question: '오스트레일리아를 대표하는 동물이 아닌 것은?',
    choices: ['판다', '캥거루', '코알라', '오리너구리'], answer: 0, explanation: '판다는 중국에 살아요. 캥거루·코알라·오리너구리는 오스트레일리아를 대표하는 동물이에요' },

  { id: 'sydney_o01', cityId: 'sydney', topic: 'geo', kind: 'ox', question: '시드니는 오스트레일리아 남동쪽 바닷가에 있다.',
    answer: true, explanation: '시드니는 태평양 쪽 바닷가에 있는 항구 도시예요' },
  { id: 'sydney_o02', cityId: 'sydney', topic: 'geo', kind: 'ox', question: '오스트레일리아 대륙의 한가운데에는 큰 사막이 있다.',
    answer: true, explanation: '안쪽은 건조한 사막(아웃백)이라 사람들은 대부분 바닷가에 살아요' },
  { id: 'sydney_o03', cityId: 'sydney', topic: 'climate', kind: 'ox', question: '시드니의 겨울은 서울의 겨울보다 따뜻하다.',
    answer: true, explanation: '7월 평균 기온이 약 13°C로 눈이 거의 오지 않아요' },
  { id: 'sydney_o04', cityId: 'sydney', topic: 'culture', kind: 'ox', question: '오스트레일리아 원주민을 애버리지니라고 부른다.',
    answer: true, explanation: '부메랑과 디저리두는 원주민 문화예요' },
  { id: 'sydney_o05', cityId: 'sydney', topic: 'climate', kind: 'ox', question: '시드니 사람들은 12월에 눈 내리는 크리스마스를 보낸다.',
    answer: false, explanation: '12월은 여름이라 해변에서 크리스마스를 즐겨요' },
];
