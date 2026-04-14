export interface UserProfile {
  name: string;
  currentWeight: number; // kg
  goalWeight: number; // kg
  height: number; // cm
  age: number;
  gender: 'male' | 'female';
  activityLevel: 'sedentary' | 'light' | 'moderate' | 'active' | 'veryActive';
  goalDate: string; // ISO date string
  dailyCalorieTarget: number;
  setupComplete: boolean;
}

export interface FoodEntry {
  id: string;
  date: string; // YYYY-MM-DD
  time: string; // HH:MM
  description: string;
  calories: number;
  protein?: number;
  carbs?: number;
  fat?: number;
  meal: 'breakfast' | 'lunch' | 'dinner' | 'snack';
}

export interface ExerciseEntry {
  id: string;
  date: string; // YYYY-MM-DD
  time: string; // HH:MM
  description: string;
  caloriesBurned: number;
  durationMinutes: number;
}

export interface WeightEntry {
  id: string;
  date: string; // YYYY-MM-DD
  weight: number; // kg
}

export interface EarnedBadge {
  id: string;
  earnedAt: string; // ISO date
}

export type ChallengeType = 'log_days' | 'hit_target' | 'exercise_days' | 'burn_calories';

export interface WeeklyChallenge {
  weekStart: string; // Monday YYYY-MM-DD
  type: ChallengeType;
  description: string;
  target: number;
  completed: boolean;
}

export interface DayLog {
  date: string;
  foodEntries: FoodEntry[];
  exerciseEntries: ExerciseEntry[];
  totalCaloriesIn: number;
  totalCaloriesBurned: number;
  netCalories: number;
}
