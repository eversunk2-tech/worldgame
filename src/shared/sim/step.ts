// Single entry point: runs every system in a fixed order for one tick.
import type { Command, GameState, SimEvent } from '../types';
import { playerSim } from './playerSim';
import { monsterSim } from './monsterSim';
import { combatSim } from './combatSim';
import { questSim } from './questSim';
import { levelSim } from './levelSim';

export function stepSimulation(state: GameState, cmd: Command, dt: number): SimEvent[] {
  const events: SimEvent[] = [];
  playerSim(state, cmd, dt, events);
  monsterSim(state, cmd, dt, events);
  combatSim(state, cmd, dt, events);   // → monster:killed, player:xp
  questSim(state, cmd, dt, events);    // ← monster:killed → player:xp
  levelSim(state, cmd, dt, events);    // ← player:xp
  state.tick++;
  state.time += dt;
  return events;
}

export const EMPTY_COMMAND: Readonly<Command> = Object.freeze({
  move: Object.freeze({ x: 0, z: 0 }), jump: false, attack: false, interact: false,
});
