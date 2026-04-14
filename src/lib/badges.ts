import { UserProfile, FoodEntry, ExerciseEntry, WeightEntry, EarnedBadge } from './types';
import { getEarnedBadges, saveEarnedBadges, today } from './storage';
import { isGainMode } from './calculations';

export interface BadgeDef {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: 'streak' | 'weight' | 'target' | 'logging';
}

export const ALL_BADGES: BadgeDef[] = [
  // Streak
  { id: 'streak_3',   name: 'On a Roll',       description: 'Log food 3 days in a row',          icon: '🔥', category: 'streak' },
  { id: 'streak_7',   name: 'Week Warrior',     description: '7-day logging streak',               icon: '⚡', category: 'streak' },
  { id: 'streak_14',  name: 'Two Week Titan',   description: '14-day logging streak',              icon: '💥', category: 'streak' },
  { id: 'streak_30',  name: 'Monthly Master',   description: '30-day logging streak',              icon: '👑', category: 'streak' },

  // Weight
  { id: 'weight_first',  name: 'First Weigh-In',  description: 'Log your first weight entry',      icon: '⚖️', category: 'weight' },
  { id: 'weight_half',   name: 'Half Kilo Club',  description: 'Move 0.5kg toward your goal',      icon: '📉', category: 'weight' },
  { id: 'weight_one',    name: 'One Kilo Club',   description: 'Move 1kg toward your goal',        icon: '🏅', category: 'weight' },
  { id: 'weight_half_goal', name: 'Halfway Hero', description: 'Reached 50% of your goal',         icon: '🎯', category: 'weight' },
  { id: 'weight_goal',   name: 'Goal Crusher',   description: 'Reached your target weight!',       icon: '🏆', category: 'weight' },

  // On Target
  { id: 'target_first', name: 'Bullseye',        description: 'First day hitting your calorie target', icon: '🎯', category: 'target' },
  { id: 'target_5',     name: '5 Days Strong',   description: '5 days on target total',            icon: '🌟', category: 'target' },
  { id: 'target_10',    name: 'Perfect Ten',     description: '10 days on target total',           icon: '💫', category: 'target' },
  { id: 'target_20',    name: 'Precision Pro',   description: '20 days on target total',           icon: '🔮', category: 'target' },

  // Logging
  { id: 'log_first',  name: 'First Log',         description: 'Log your very first meal',          icon: '📝', category: 'logging' },
  { id: 'log_10',     name: 'Consistent Logger', description: 'Log food on 10 different days',     icon: '📅', category: 'logging' },
  { id: 'log_30',     name: 'Habit Formed',      description: 'Log food on 30 different days',     icon: '🧠', category: 'logging' },
];

function computeCurrentStreak(foodEntries: FoodEntry[]): number {
  const loggedDates = new Set(foodEntries.map(e => e.date));
  const todayStr = today();
  let streak = 0;
  const cursor = new Date();
  if (!loggedDates.has(todayStr)) cursor.setDate(cursor.getDate() - 1);
  while (true) {
    const d = cursor.toISOString().split('T')[0];
    if (loggedDates.has(d)) { streak++; cursor.setDate(cursor.getDate() - 1); }
    else break;
  }
  return streak;
}

export function checkAndAwardBadges(
  profile: UserProfile,
  foodEntries: FoodEntry[],
  exerciseEntries: ExerciseEntry[],
  weightEntries: WeightEntry[],
): { earned: EarnedBadge[]; newBadgeIds: string[] } {
  const existing = getEarnedBadges();
  const earnedIds = new Set(existing.map(b => b.id));
  const newBadgeIds: string[] = [];

  const streak = computeCurrentStreak(foodEntries);
  const loggedDates = new Set(foodEntries.map(e => e.date));
  const daysLogged = loggedDates.size;
  const gainMode = isGainMode(profile);
  const startWeight = profile.currentWeight;
  const latestWeight = weightEntries.length > 0 ? weightEntries[weightEntries.length - 1].weight : startWeight;
  const moved = gainMode ? latestWeight - startWeight : startWeight - latestWeight;
  const goalDiff = Math.abs(profile.goalWeight - startWeight);

  const daysOnTarget = [...loggedDates].filter(date => {
    const net = foodEntries.filter(e => e.date === date).reduce((s, e) => s + e.calories, 0)
              - exerciseEntries.filter(e => e.date === date).reduce((s, e) => s + e.caloriesBurned, 0);
    return gainMode ? net >= profile.dailyCalorieTarget : net <= profile.dailyCalorieTarget;
  }).length;

  const checks: Record<string, boolean> = {
    streak_3:      streak >= 3,
    streak_7:      streak >= 7,
    streak_14:     streak >= 14,
    streak_30:     streak >= 30,
    weight_first:  weightEntries.length > 0,
    weight_half:   moved >= 0.5,
    weight_one:    moved >= 1,
    weight_half_goal: goalDiff > 0 && moved >= goalDiff * 0.5,
    weight_goal:   goalDiff > 0 && moved >= goalDiff,
    target_first:  daysOnTarget >= 1,
    target_5:      daysOnTarget >= 5,
    target_10:     daysOnTarget >= 10,
    target_20:     daysOnTarget >= 20,
    log_first:     daysLogged >= 1,
    log_10:        daysLogged >= 10,
    log_30:        daysLogged >= 30,
  };

  const todayStr = today();
  const updated = [...existing];

  for (const [id, earned] of Object.entries(checks)) {
    if (earned && !earnedIds.has(id)) {
      updated.push({ id, earnedAt: todayStr });
      newBadgeIds.push(id);
    }
  }

  if (newBadgeIds.length > 0) saveEarnedBadges(updated);

  return { earned: updated, newBadgeIds };
}
