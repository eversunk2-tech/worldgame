// Seoul city content (v0.2 spec A.1). Map rows are 30 × 40 chars, legend in content/tiles.ts (27 kinds).
import type { CityDef } from '../../types';
import { QUIZ_COUNT, QUIZ_PASS } from '../../constants';

export const SEOUL: CityDef = {
  id: 'seoul',
  name: '서울',
  continent: 'asia',
  theme: { ground: 'grass', road: 'cobble', building: 'hanok', tree: 'round', streetTree: 'plane', water: 'river', wall: 'stone', bgm: 'seoul' },
  landmarks: [
    { id: 'lm_seoul_palace', kind: 'gyeongbokgung', at: { tx: 14, ty: 3 }, w: 6, h: 4, overhang: 1 },
    // 남산타워: 남동쪽 바위 언덕 위, 도달 불가 감상용 (spec 14절 12항)
    { id: 'lm_seoul_tower', kind: 'namsan_tower', at: { tx: 35, ty: 22 }, w: 2, h: 2, overhang: 3 },
  ],
  rows: [
    'RRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRR',
    'RRTTRRRTTRRRRTTTRRRRRRTTTRRRRTTRRRRTTTRR',
    'T......................................T',
    'T..####.......PPPPPP......####.........T',
    'T..####.......PPPPPP......####.....T...T',
    'T..####...==..PPPPPP..==..####.........T',
    'T..####...==..PPPPPP..==..####..T......T',
    'T...*.....==..QQQQQQ..==......*........T',
    'T.........==..QQQQQQ..==...............T',
    'T....l....==.b........==.........T..l..T',
    'E=====================================.T',
    'T.........==..........==...............T',
    'T..####...==..........==..####.........T',
    'T..####...==....T.....==..####.........T',
    'T..####...==..........==..####.....T...T',
    'T=====================================.T',
    'T....b....==...*......==.....b.........T',
    'T~~~~~~~~~BB~~~~~~~~~~BB~~~~~~~~~~~~~~~T',
    'T~~~~~~~~~BB~~~~~~~~~~BB~~~~~~~~~~~~~~~T',
    'T~~~~~~~~~BB~~~~~~~~~~BB~~~~~~~~~~~~~~~T',
    'T~~~~~~~~~BB~~~~~~~~~~BB~~~~~~~~~~~~~~~T',
    'T.........==..........==.........RRRRR.T',
    'T....,....==....,.....==......,..RRPPR.T',
    'T...,,,...==...,,,....==.....,,,.RRPPR.T',
    'T..,,,,,..==..,,,,,...==....,,,,,RRRRR.T',
    'T...,,,...==...,,,....==.....,,,.......T',
    'T....,....==....,.....==......,........T',
    'T...T.....==......T...==.......T...b...T',
    'T......................................T',
    'TTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTT',
  ],
  entrance: { tx: 0, ty: 10 },
  spawn: { tx: 2, ty: 10 },
  spawnFacing: 'right',
  cards: [
    {
      id: 'card_seoul_geo', cityId: 'seoul', topic: 'geo', title: '서울의 지형',
      lines: [
        '아시아 대륙 동쪽 한반도의 중서부에 있다.',
        '한강이 도시 가운데를 동서로 흐른다.',
        '북한산·관악산 등 산으로 둘러싸여 있다.',
        '우리나라 지형은 동쪽이 높고 서쪽이 낮다(동고서저).',
      ],
    },
    {
      id: 'card_seoul_climate', cityId: 'seoul', topic: 'climate', title: '서울의 기후',
      lines: [
        '중위도에 있어 사계절이 뚜렷한 온대 기후이다.',
        '여름은 덥고 습하며 장마와 집중호우로 비가 많이 온다.',
        '겨울은 춥고 건조하며 북서쪽에서 찬 바람이 분다.',
        '여름에는 남동쪽에서 덥고 습한 바람이 분다(계절풍).',
      ],
    },
    {
      id: 'card_seoul_culture', cityId: 'seoul', topic: 'culture', title: '서울의 문화',
      lines: [
        '대한민국의 수도이며 인구는 약 930만 명이다.',
        '조선 시대 궁궐인 경복궁·창덕궁이 있다.',
        '세종대왕이 만든 한글을 쓴다.',
        '한복, 김치·비빔밥, 설·추석 같은 명절이 있다.',
      ],
    },
  ],
  signs: [
    { id: 'sign_seoul_geo', cardId: 'card_seoul_geo', at: { tx: 12, ty: 16 } },
    { id: 'sign_seoul_climate', cardId: 'card_seoul_climate', at: { tx: 20, ty: 9 } },
    { id: 'sign_seoul_culture', cardId: 'card_seoul_culture', at: { tx: 13, ty: 7 } },
  ],
  npcs: [
    {
      id: 'npc_hanbyeol', name: '한별', role: 'guide', at: { tx: 3, ty: 9 }, facing: 'down',
      missionIds: ['m_seoul_quiz'], cardId: 'card_seoul_geo', bubble: '안녕! 서울이야',
      idleText: '서울 구경은 잘 하고 있어? 한강 다리를 건너면 남쪽 들판이 나와.',
    },
    {
      id: 'npc_onyu', name: '온유', role: 'teacher', at: { tx: 17, ty: 8 }, facing: 'down',
      missionIds: ['m_seoul_ox'], bubble: '표지판 읽어 봐',
      idleText: '경복궁 앞 광장이야. 표지판을 읽으면 서울에 대해 더 알 수 있어.',
    },
    {
      id: 'npc_horang', name: '호랑', role: 'guard', at: { tx: 12, ty: 21 }, facing: 'down',
      missionIds: ['m_seoul_defeat'], bubble: '도깨비 조심!',
      idleText: '강 남쪽 들판은 먼지 도깨비가 많으니 조심해.',
    },
  ],
  missions: [
    {
      id: 'm_seoul_quiz', cityId: 'seoul', giverNpcId: 'npc_hanbyeol', title: '서울 지리 퀴즈',
      description: '한별이 내는 서울 퀴즈 5문제 중 4개 이상 맞히기',
      objective: { type: 'minigame', spec: { kind: 'quiz', cityId: 'seoul', count: QUIZ_COUNT, passCount: QUIZ_PASS } },
      rewardPoints: 40,
      acceptText: '서울에 대해 얼마나 아는지 퀴즈를 내 볼게! 표지판을 먼저 읽고 오면 더 쉬울 거야. 준비되면 다시 말 걸어 줘.',
      progressText: '퀴즈에 도전할 준비가 됐어?',
      completeText: '대단해! 서울 박사라고 불러도 되겠는걸. 이제 파리로 가는 길도 곧 열릴 거야.',
      failText: '아깝다! 표지판을 읽고 다시 도전해 봐.',
    },
    {
      id: 'm_seoul_ox', cityId: 'seoul', giverNpcId: 'npc_onyu', title: '서울 OX 퀴즈',
      description: '온유가 내는 OX 퀴즈 5문제 중 4개 이상 맞히기',
      objective: { type: 'minigame', spec: { kind: 'ox', cityId: 'seoul', count: QUIZ_COUNT, passCount: QUIZ_PASS } },
      rewardPoints: 30,
      acceptText: '서울의 기후와 지형에 대해 OX 퀴즈를 내 볼게. 준비되면 다시 말 걸어 줘!',
      progressText: 'OX 퀴즈에 도전해 볼래?',
      completeText: '훌륭해! 서울의 기후를 정확히 알고 있구나.',
      failText: '아깝다! 표지판을 읽고 다시 도전해 봐.',
    },
    {
      id: 'm_seoul_defeat', cityId: 'seoul', giverNpcId: 'npc_horang', title: '먼지 도깨비 소탕',
      description: '강 남쪽 들판의 먼지 도깨비 3마리 처치',
      objective: { type: 'defeat', monsterId: 'dust_dokkaebi', count: 3 },
      rewardPoints: 30,
      acceptText: '강 남쪽 들판에 먼지 도깨비가 늘었어. 3마리만 뿅 하고 없애 줄래? F 키로 공격할 수 있어.',
      progressText: '먼지 도깨비는 아직 남아 있어?',
      completeText: '고마워! 덕분에 들판이 깨끗해졌어.',
    },
  ],
  monsterZones: [
    { monsterId: 'dust_dokkaebi', center: { tx: 5, ty: 24 }, radiusTiles: 3, count: 3 },
    // zone 2 sits on the south tip of the middle grass patch: ring spawns land at (15,26)/(19,26), > 140px from
    // every tile a player stands on while talking to 호랑 (12,21). (spec 6.4 had (16,24); moved after review.)
    { monsterId: 'dust_dokkaebi', center: { tx: 17, ty: 26 }, radiusTiles: 3, count: 2 },
    { monsterId: 'magpie', center: { tx: 30, ty: 24 }, radiusTiles: 3, count: 3 },
  ],
  stampMissionIds: ['m_seoul_quiz', 'm_seoul_ox', 'm_seoul_defeat'],
};
