import type { NPCDef } from '../types';

export const NPCS: NPCDef[] = [
  { id: 'npc_chief', name: '촌장', pos: { x: 0, y: 0, z: -3 }, color: 0xffb74d, questIds: ['q_slime', 'q_golem'] },
  { id: 'npc_guard', name: '파수꾼', pos: { x: 6, y: 0, z: -3 }, color: 0x7986cb, questIds: ['q_sign'] },
];

export function getNpcDef(id: string): NPCDef | undefined {
  return NPCS.find((n) => n.id === id);
}
