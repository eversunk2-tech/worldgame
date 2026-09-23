import type { QuestDef } from '../types';

export const QUESTS: QuestDef[] = [
  {
    id: 'q_slime', title: '슬라임 소탕', description: '동쪽 들판의 슬라임 3마리를 처치한다.',
    giverNpcId: 'npc_chief',
    objective: { type: 'kill', monsterTypeId: 'slime', count: 3 }, rewardXp: 60,
    acceptText: '동쪽 들판에 슬라임이 늘었네. 3마리만 정리해 주게.',
    progressText: '슬라임은 아직 남아 있나?',
    completeText: '수고했네! 이제 마을이 좀 조용해지겠군.',
  },
  {
    id: 'q_sign', title: '언덕 표지판', description: '북쪽 언덕 꼭대기의 표지판까지 올라간다.',
    giverNpcId: 'npc_guard',
    objective: { type: 'reach', reachPointId: 'hill_sign' }, rewardXp: 50,
    acceptText: '북쪽 언덕 꼭대기에 표지판이 있어. 점프로 두 단을 올라가 확인하고 와.',
    progressText: '언덕 꼭대기 노란 링까지 가 봤어?',
    completeText: '거기까지 올라갔다니, 발이 꽤 빠르군.',
  },
  {
    id: 'q_golem', title: '골렘 토벌', description: '서쪽 들판의 골렘 2마리를 처치한다.',
    giverNpcId: 'npc_chief',
    objective: { type: 'kill', monsterTypeId: 'golem', count: 2 }, rewardXp: 150,
    prerequisiteQuestId: 'q_slime',
    acceptText: '서쪽에 골렘이 나타났네. 위험하니 조심해서 2마리만 처치해 주게.',
    progressText: '골렘은 만만치 않지. 무리하지 말게.',
    completeText: '골렘까지 물리치다니! 자네는 진짜 영웅이야.',
  },
];

export const QUEST_MAP: Record<string, QuestDef> = Object.fromEntries(QUESTS.map((q) => [q.id, q]));

export function getQuestDef(id: string): QuestDef | undefined {
  return QUEST_MAP[id];
}
