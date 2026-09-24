// Avatar cosmetics + furniture catalogue (spec 6.6). `shape` drives placeholder drawing.
import type { ItemDef, ItemSlot } from '../types';

export const ITEMS: readonly ItemDef[] = [
  { id: 'body_light', slot: 'body', name: '밝은 피부', price: 0, color: 0xffe0bd, shape: 'body', default: true },
  { id: 'body_tan', slot: 'body', name: '건강한 피부', price: 0, color: 0xd9a066, shape: 'body' },

  { id: 'hair_short_black', slot: 'hair', name: '짧은 검정 머리', price: 0, color: 0x222222, shape: 'short', default: true },
  { id: 'hair_long_brown', slot: 'hair', name: '긴 갈색 머리', price: 25, color: 0x6d4c2f, shape: 'long' },
  { id: 'hair_curly_red', slot: 'hair', name: '곱슬 빨강 머리', price: 30, color: 0xc0392b, shape: 'curly' },
  { id: 'hair_pony_blue', slot: 'hair', name: '파란 포니테일', price: 30, color: 0x3a6fd8, shape: 'pony' },

  { id: 'top_tshirt_blue', slot: 'top', name: '파란 티셔츠', price: 0, color: 0x3d7bd6, shape: 'tshirt', default: true },
  { id: 'top_hoodie_green', slot: 'top', name: '초록 후드티', price: 30, color: 0x3fa34d, shape: 'hoodie' },
  { id: 'top_hanbok', slot: 'top', name: '한복', price: 40, color: 0xe63e62, shape: 'hanbok' },
  { id: 'top_mariniere', slot: 'top', name: '마리니에르(프랑스 줄무늬 셔츠)', price: 40, color: 0x1f3c88, shape: 'stripes' },

  { id: 'hat_cap_red', slot: 'hat', name: '빨간 야구 모자', price: 30, color: 0xd62828, shape: 'cap' },
  { id: 'hat_gat', slot: 'hat', name: '갓', price: 40, color: 0x1a1a1a, shape: 'gat' },
  { id: 'hat_beret', slot: 'hat', name: '베레모', price: 40, color: 0x5a6fa8, shape: 'beret' }, // v0.2 review: lighter navy so it reads against dark hair/backgrounds
  { id: 'hat_crown', slot: 'hat', name: '황금 왕관', price: 60, color: 0xffc300, shape: 'crown' },

  { id: 'fur_chair', slot: 'furniture', name: '의자', price: 20, color: 0xb5651d, shape: 'chair', size: { w: 1, h: 1 } },
  { id: 'fur_plant', slot: 'furniture', name: '화분', price: 20, color: 0x4caf50, shape: 'plant', size: { w: 1, h: 1 } },
  { id: 'fur_rug', slot: 'furniture', name: '러그', price: 30, color: 0xc2185b, shape: 'rug', size: { w: 2, h: 2 } },
  { id: 'fur_desk', slot: 'furniture', name: '책상', price: 40, color: 0x8d6e63, shape: 'desk', size: { w: 2, h: 1 } },
  { id: 'fur_bookshelf', slot: 'furniture', name: '책장', price: 45, color: 0x795548, shape: 'bookshelf', size: { w: 1, h: 2 } },
  { id: 'fur_bed', slot: 'furniture', name: '침대', price: 60, color: 0x64b5f6, shape: 'bed', size: { w: 2, h: 1 } },
  { id: 'fur_souvenir_seoul', slot: 'furniture', name: '남산타워 모형', price: 0, color: 0xeeeeee, shape: 'tower', size: { w: 1, h: 1 }, unlockStamp: 'seoul' },
  { id: 'fur_souvenir_paris', slot: 'furniture', name: '에펠탑 모형', price: 0, color: 0x8d6e63, shape: 'eiffel', size: { w: 1, h: 1 }, unlockStamp: 'paris' },
];

const BY_ID: Record<string, ItemDef> = Object.fromEntries(ITEMS.map((i) => [i.id, i]));

export function getItem(id: string): ItemDef | undefined {
  return BY_ID[id];
}

export function itemsForSlot(slot: ItemSlot): ItemDef[] {
  return ITEMS.filter((i) => i.slot === slot);
}

export const DEFAULT_ITEMS: readonly ItemDef[] = ITEMS.filter((i) => i.default);
/** Items every new game owns: defaults + free non-souvenir items. */
export const STARTER_ITEM_IDS: readonly string[] = ITEMS.filter((i) => i.price === 0 && !i.unlockStamp).map((i) => i.id);

export function defaultForSlot(slot: Exclude<ItemSlot, 'furniture'>): string {
  const item = ITEMS.find((i) => i.slot === slot && i.default);
  if (!item) throw new Error(`No default item for slot ${slot}`);
  return item.id;
}
