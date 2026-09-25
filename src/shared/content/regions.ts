// Continent / ocean polygons for the map-find minigame (spec 7.2, appendix B, revised in Stage B review round 2).
// The world-atlas land mask (geo.isLand) decides the coastline: a land click is judged against the six continent
// polygons, a sea click against the 3 ocean polygons, then the polar latitude rules (geo.resolveRegion). So the
// polygons may spill generously over the sea (continents) or over land (oceans); what must be exact are the borders
// they share — Ural Mountains–Ural River–Caspian–Caucasus–Bosporus/Dardanelles (Europe/Asia), Suez (Asia/Africa),
// the Panama–Colombia border (North/South America), the Bering Strait (Asia/North America), New Guinea vs. the
// Moluccas and Timor (Oceania/Asia), and Gibraltar / the Danish straits / Malacca / Timor–Australia / 20°E /
// Cape Horn / 146.9°E between the seas. Closed seas (Mediterranean, Black, Caspian, Baltic) lie inside no ocean.
// Longitudes may run past ±180 (geo.pointInPolygon also tries lon ± 360).
import type { ContinentId, RegionId } from '../types';

export type LonLatPoint = readonly [number, number];
export type RegionPolygon = readonly LonLatPoint[];

// ---------------------------------------------------------------- shared borders (land seams), listed once
/** Europe/Asia from the Aegean (triple point with Africa south of Rhodes) to the Kara Sea, south → north. */
const EUROPE_ASIA: readonly LonLatPoint[] = [
  [28.5, 34.0], [27.2, 36.2], [26.7, 37.0], [25.9, 38.2], [25.9, 39.4], [26.2, 39.8], [26.75, 40.2], [27.0, 40.4],
  [27.3, 40.55], [28.0, 40.7], [28.9, 40.85], [29.1, 41.2], [29.3, 41.6], // Dardanelles – Marmara – Bosporus
  [33.5, 43.3], [37.0, 44.2], [38.0, 44.5], // Black Sea to Anapa
  [39.3, 44.1], [40.4, 43.6], [41.5, 43.3], [42.45, 43.35], [43.6, 42.9], [44.5, 42.7], [45.7, 42.4], [46.6, 41.9],
  [47.8, 41.2], [48.6, 41.05], [49.35, 41.0], // Greater Caucasus crest to the Caspian
  [50.0, 41.3], [49.5, 44.5], [51.6, 46.0], [51.7, 47.0], // across the Caspian to the Ural mouth
  [51.6, 48.5], [51.4, 50.0], [51.4, 51.2], [53.0, 51.6], [55.1, 51.75], [57.5, 51.3], [58.6, 51.2], [59.0, 52.5],
  [59.1, 53.5], [59.3, 54.6], // Ural River
  [59.4, 56.5], [59.2, 58.5], [59.3, 60.5], [59.5, 62.0], [60.0, 64.0], [60.3, 65.0], [62.5, 66.2], [64.5, 67.4],
  [66.4, 68.5], // Ural Mountains
  [66.3, 69.3], [65.5, 70.5], [62.0, 73.5], [72.0, 77.0], // Kara Sea: Novaya Zemlya stays in Europe, Yamal in Asia
];
/** Asia/Africa from the Mediterranean triple point to the Gulf of Aden, north → south (Suez, Red Sea, Bab-el-Mandeb). */
const ASIA_AFRICA: readonly LonLatPoint[] = [
  [28.5, 34.0], [32.0, 33.0], [32.3, 31.6], [32.31, 31.2], [32.33, 30.6], [32.37, 29.83], [32.47, 29.6], [32.95, 28.6],
  [33.55, 27.6], [35.5, 25.0], [38.5, 20.5], [41.2, 16.5], [43.35, 12.55], [45.0, 11.9], [51.5, 12.5], [60.0, 5.0],
];
/** Europe/Africa through the Mediterranean, west → east (Gibraltar … south of Crete to the triple point). */
const EUROPE_AFRICA: readonly LonLatPoint[] = [
  [-12.0, 36.0], [-7.0, 35.9], [-5.6, 35.86], [-2.0, 36.3], [0.0, 37.0], [3.0, 37.5], [8.0, 38.0], [9.5, 38.2],
  [11.8, 37.3], [12.3, 36.3], [14.5, 35.5], [18.0, 35.0], [22.0, 34.5], [26.7, 34.5], [28.5, 34.0],
];
/** North/South America: Pacific → Panama–Colombia border → Caribbean (Trinidad stays with South America). */
const NA_SA: readonly LonLatPoint[] = [
  [-82.0, 4.0], [-78.3, 6.9], [-77.88, 7.22], [-77.35, 8.67], [-77.2, 9.2], [-73.0, 13.0], [-65.0, 12.0], [-61.0, 11.5], [-55.0, 15.0],
];
/** Asia/North America: Bering Strait (−169°) then between Chukotka and St Lawrence Island / Nunivak, north → south. */
const ASIA_NA: readonly LonLatPoint[] = [[-169.0, 90.0], [-169.0, 64.1], [-176.0, 64.1], [-179.0, 61.8], [-188.0, 59.5], [-190.0, 55.0]];
/** Asia/Oceania: east of the Philippines, between the Moluccas/Timor and New Guinea/Australia, north → south. */
const ASIA_OCEANIA: readonly LonLatPoint[] = [[132.0, 10.0], [130.2, 3.0], [130.2, -2.2], [131.5, -3.5], [131.0, -6.0], [128.5, -9.0], [124.0, -11.5]];
/** Europe/North America: Denmark Strait and Greenland Sea (Iceland, Jan Mayen, Svalbard → Europe), south → north. */
const EUROPE_NA: readonly LonLatPoint[] = [[-35.0, 60.0], [-27.0, 66.0], [-15.0, 72.0], [-8.0, 81.5], [-8.0, 90.0]];

/** Pacific/Indian: Tasmania meridian, through Australia, Timor Sea, the Lesser Sundas, Java, Sumatra, Malacca, Kra. */
const PACIFIC_INDIAN: readonly LonLatPoint[] = [
  [146.9, -58.0], [146.9, -43.7], [146.5, -42.0], [146.5, -39.0], [146.0, -35.0], [140.0, -30.0], [130.0, -20.0],
  [127.5, -15.5], [126.58, -13.95], [126.2, -8.8], [125.0, -9.0], [121.0, -8.7], [118.0, -8.6], [116.3, -8.6],
  [115.2, -8.4], [114.0, -8.0], [110.0, -7.3], [106.5, -6.8], [104.5, -5.0], [102.0, -3.0], [103.0, 0.5], [103.5, 1.3],
  [103.5, 2.0], [101.0, 5.0], [99.0, 10.5], [98.5, 15.0],
];
/** Atlantic/Pacific over the Americas (all on land except Cape Horn), south → north. */
const AMERICAS_SPINE: readonly LonLatPoint[] = [
  [-67.3, -58.0], [-67.3, -55.9], [-70.0, -50.0], [-70.0, -30.0], [-75.0, -10.0], [-76.0, 3.0], [-77.0, 7.5], [-78.3, 8.9],
  [-79.5, 9.25], [-81.0, 8.5], [-84.0, 10.5], [-86.5, 13.5], [-89.0, 15.0], [-92.0, 16.5], [-95.0, 17.5], [-100.0, 20.0],
];

const rev = (a: readonly LonLatPoint[]): LonLatPoint[] => [...a].reverse();
const shift = (a: readonly LonLatPoint[], d: number): LonLatPoint[] => a.map(([lon, lat]) => [lon + d, lat] as const);

export const REGIONS: Readonly<Record<RegionId, RegionPolygon>> = {
  asia: [
    [72, 90], [191, 90], ...shift(ASIA_NA.slice(1), 360), // Bering seam (as 191°…170°)
    [155, 40], [145, 30], [135, 22], ...ASIA_OCEANIA, [100, -12], [80, -5], ...rev(ASIA_AFRICA),
    ...EUROPE_ASIA,
  ],
  europe: [
    [-8, 90], [72, 90], ...rev(EUROPE_ASIA), ...rev(EUROPE_AFRICA), [-30, 45], ...EUROPE_NA.slice(0, -1),
  ],
  africa: [
    [-25, 36], ...EUROPE_AFRICA, ...ASIA_AFRICA.slice(1), [60, -40], [-25, -40],
  ],
  north_america: [
    ...ASIA_NA, [-150, 40], [-125, 20], [-100, 5], ...NA_SA, [-40, 20], [-40, 50], ...EUROPE_NA,
  ],
  south_america: [
    ...NA_SA, [-25, 5], [-25, -58], [-90, -58], [-90, 4],
  ],
  oceania: [
    ...ASIA_OCEANIA, [110, -11.5], [110, -48], [180, -52], [215, -30], [215, 26], [180, 26], [145, 18],
  ],
  pacific: [
    ...PACIFIC_INDIAN, [100, 25], [120, 45], [135, 57], [145, 61], [155, 63], [170, 66.5], [188, 66.5], [190.5, 66.0],
    [192.5, 65.8], [195, 65.3], [205, 62], [225, 60], [240, 50], [245, 35], [252, 31], [256, 25],
    ...shift(rev(AMERICAS_SPINE), 360),
  ],
  atlantic: [
    ...AMERICAS_SPINE, [-102, 30], [-95, 38], [-85, 45], [-75, 50], [-70, 55], [-64.6, 60.3], [-66, 62.5], [-67, 68],
    [16, 68], [12, 64], [11.5, 60], [11.0, 59.2], [10.6, 57.75], [9.9, 57.0], [9.3, 55.5], [9.4, 54.4], [8, 52], [3, 48],
    [-1, 44], [-3, 42.5], [-5.6, 36.2], [-5.6, 35.5], [-5, 30], [0, 15], [5, 10], [11, 3], [15, -10], [20, -34.8], [20, -58],
  ],
  indian: [
    [20, -58], [20, -34.8], [25, -25], [30, -10], [35, 5], [36, 15], [32, 25], [32.4, 29.8], [33.5, 29.5], [35, 30.5],
    [40, 32], [45, 32], [50, 31.5], [55, 30], [60, 27], [70, 26], [80, 22], [90, 24], [95, 20], ...rev(PACIFIC_INDIAN),
  ],
  arctic: [[-180, 68], [180, 68], [180, 90], [-180, 90]],
  southern: [[-180, -90], [180, -90], [180, -58], [-180, -58]],
};

/** Land clicks are judged against these, in this order. */
export const CONTINENT_REGION_IDS: readonly ContinentId[] = ['asia', 'europe', 'africa', 'north_america', 'south_america', 'oceania'];
/** Sea clicks are judged against these; arctic/southern follow by latitude (geo.resolveRegion). */
export const OCEAN_REGION_IDS: readonly RegionId[] = ['pacific', 'atlantic', 'indian'];
export const REGION_IDS: readonly RegionId[] = [...CONTINENT_REGION_IDS, ...OCEAN_REGION_IDS, 'arctic', 'southern'];

/** Latitude rules for sea outside the 3 ocean polygons: lat ≥ 68 → arctic, lat ≤ −58 → southern. */
export const ARCTIC_MIN_LAT = 68;
export const SOUTHERN_MAX_LAT = -58;

export const REGION_NAMES: Readonly<Record<RegionId, string>> = {
  asia: '아시아', europe: '유럽', africa: '아프리카', north_america: '북아메리카', south_america: '남아메리카', oceania: '오세아니아',
  pacific: '태평양', atlantic: '대서양', indian: '인도양', arctic: '북극해', southern: '남극해',
};

export function isRegionId(id: unknown): id is RegionId {
  return typeof id === 'string' && (REGION_IDS as readonly string[]).includes(id);
}

export function isContinentRegion(id: RegionId): id is ContinentId {
  return (CONTINENT_REGION_IDS as readonly RegionId[]).includes(id);
}
