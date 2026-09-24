// Action / event contracts for the progress reducer (spec 6.11).
import type { CityId, ItemSlot, MinigameResult, MissionStatus } from '../types';

export type Action =
  | { type: 'profile.setName'; name: string }
  | { type: 'city.enter'; cityId: CityId }
  | { type: 'mission.accept'; missionId: string }
  | { type: 'mission.turnIn'; missionId: string }
  | { type: 'mission.minigameResult'; missionId: string; result: MinigameResult }
  | { type: 'monster.defeated'; monsterId: string; cityId: CityId }
  | { type: 'card.read'; cardId: string }
  | { type: 'shop.buy'; itemId: string }
  | { type: 'avatar.equip'; slot: Exclude<ItemSlot, 'furniture'>; itemId: string | null }
  | { type: 'room.place'; itemId: string; gx: number; gy: number }
  | { type: 'room.remove'; itemId: string }
  | { type: 'settings.setMuted'; muted: boolean };

export type ProgressEvent =
  | { type: 'points.changed'; delta: number; points: number; reason: string }
  | { type: 'mission.changed'; missionId: string; status: MissionStatus; count: number }
  | { type: 'city.unlocked'; cityId: CityId }
  | { type: 'city.stamped'; cityId: CityId }
  | { type: 'card.read'; cardId: string; first: boolean }
  | { type: 'item.bought'; itemId: string }
  | { type: 'avatar.changed' }
  | { type: 'room.changed' }
  | { type: 'rank.changed'; rank: string }
  | { type: 'profile.changed'; name: string }
  | { type: 'settings.changed'; muted: boolean }
  | { type: 'rejected'; action: Action['type']; reason: string };
