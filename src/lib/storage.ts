import { UserProfile, FoodEntry, ExerciseEntry, WeightEntry, EarnedBadge, WeeklyChallenge } from './types';

const KEYS = {
  PROFILE: 'ct_profile',
  FOOD: 'ct_food',
  EXERCISE: 'ct_exercise',
  WEIGHT: 'ct_weight',
  BADGES: 'ct_badges',
  CHALLENGE: 'ct_challenge',
};

function get<T>(key: string): T | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function set<T>(key: string, value: T): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(key, JSON.stringify(value));
}

// Profile
export function getProfile(): UserProfile | null {
  return get<UserProfile>(KEYS.PROFILE);
}

export function saveProfile(profile: UserProfile): void {
  set(KEYS.PROFILE, profile);
}

// Food entries
export function getFoodEntries(): FoodEntry[] {
  return get<FoodEntry[]>(KEYS.FOOD) ?? [];
}

export function addFoodEntry(entry: FoodEntry): void {
  const entries = getFoodEntries();
  entries.push(entry);
  set(KEYS.FOOD, entries);
}

export function deleteFoodEntry(id: string): void {
  const entries = getFoodEntries().filter(e => e.id !== id);
  set(KEYS.FOOD, entries);
}

export function getFoodEntriesForDate(date: string): FoodEntry[] {
  return getFoodEntries().filter(e => e.date === date);
}

// Exercise entries
export function getExerciseEntries(): ExerciseEntry[] {
  return get<ExerciseEntry[]>(KEYS.EXERCISE) ?? [];
}

export function addExerciseEntry(entry: ExerciseEntry): void {
  const entries = getExerciseEntries();
  entries.push(entry);
  set(KEYS.EXERCISE, entries);
}

export function deleteExerciseEntry(id: string): void {
  const entries = getExerciseEntries().filter(e => e.id !== id);
  set(KEYS.EXERCISE, entries);
}

export function getExerciseEntriesForDate(date: string): ExerciseEntry[] {
  return getExerciseEntries().filter(e => e.date === date);
}

// Weight entries
export function getWeightEntries(): WeightEntry[] {
  return get<WeightEntry[]>(KEYS.WEIGHT) ?? [];
}

export function addWeightEntry(entry: WeightEntry): void {
  const entries = getWeightEntries();
  // Replace if same date
  const idx = entries.findIndex(e => e.date === entry.date);
  if (idx >= 0) entries[idx] = entry;
  else entries.push(entry);
  entries.sort((a, b) => a.date.localeCompare(b.date));
  set(KEYS.WEIGHT, entries);
}

export function getLatestWeight(fallback: number): number {
  const entries = getWeightEntries();
  if (entries.length === 0) return fallback;
  return entries[entries.length - 1].weight;
}

// Badges
export function getEarnedBadges(): EarnedBadge[] {
  return get<EarnedBadge[]>(KEYS.BADGES) ?? [];
}

export function saveEarnedBadges(badges: EarnedBadge[]): void {
  set(KEYS.BADGES, badges);
}

// Weekly Challenge
export function getWeeklyChallenge(): WeeklyChallenge | null {
  return get<WeeklyChallenge>(KEYS.CHALLENGE);
}

export function saveWeeklyChallenge(challenge: WeeklyChallenge): void {
  set(KEYS.CHALLENGE, challenge);
}

export function getCurrentWeekStart(): string {
  const now = new Date();
  const day = now.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  const monday = new Date(now);
  monday.setDate(now.getDate() + diff);
  monday.setHours(0, 0, 0, 0);
  return monday.toISOString().split('T')[0];
}

// Date helpers
export function today(): string {
  return new Date().toISOString().split('T')[0];
}

export function formatDate(date: string): string {
  return new Date(date + 'T00:00:00').toLocaleDateString('en-IN', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });
}

export function calculateStreak(): { streak: number; loggedToday: boolean } {
  const entries = getFoodEntries();
  const loggedDates = new Set(entries.map(e => e.date));
  const todayStr = today();
  const loggedToday = loggedDates.has(todayStr);

  let streak = 0;
  const cursor = new Date();

  // If today isn't logged yet, start checking from yesterday
  if (!loggedToday) cursor.setDate(cursor.getDate() - 1);

  while (true) {
    const dateStr = cursor.toISOString().split('T')[0];
    if (loggedDates.has(dateStr)) {
      streak++;
      cursor.setDate(cursor.getDate() - 1);
    } else {
      break;
    }
  }

  return { streak, loggedToday };
}

export function getLastWeekData(): {
  startDate: string;
  endDate: string;
  dayData: { date: string; net: number; calories: number; burned: number; hasData: boolean }[];
} {
  const now = new Date();
  const dayOfWeek = now.getDay(); // 0=Sun
  const daysToLastMonday = (dayOfWeek === 0 ? 6 : dayOfWeek - 1) + 7;
  const lastMonday = new Date(now);
  lastMonday.setDate(now.getDate() - daysToLastMonday);
  lastMonday.setHours(0, 0, 0, 0);

  const food = getFoodEntries();
  const exercise = getExerciseEntries();

  const dayData = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(lastMonday);
    d.setDate(lastMonday.getDate() + i);
    const date = d.toISOString().split('T')[0];
    const dayFood = food.filter(e => e.date === date);
    const dayEx = exercise.filter(e => e.date === date);
    const calories = dayFood.reduce((s, e) => s + e.calories, 0);
    const burned = dayEx.reduce((s, e) => s + e.caloriesBurned, 0);
    return { date, calories, burned, net: calories - burned, hasData: dayFood.length > 0 };
  });

  return {
    startDate: dayData[0].date,
    endDate: dayData[6].date,
    dayData,
  };
}

export function getThisWeekData(): { date: string; net: number; hasData: boolean }[] {
  const now = new Date();
  const dayOfWeek = now.getDay();
  const monday = new Date(now);
  monday.setDate(now.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1));
  monday.setHours(0, 0, 0, 0);

  const food = getFoodEntries();
  const exercise = getExerciseEntries();

  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    const date = d.toISOString().split('T')[0];
    const dayFood = food.filter(e => e.date === date);
    const dayEx = exercise.filter(e => e.date === date);
    const net = dayFood.reduce((s, e) => s + e.calories, 0) - dayEx.reduce((s, e) => s + e.caloriesBurned, 0);
    return { date, net, hasData: dayFood.length > 0 };
  });
}

export function getLast30Days(): string[] {
  const days: string[] = [];
  for (let i = 29; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    days.push(d.toISOString().split('T')[0]);
  }
  return days;
}
