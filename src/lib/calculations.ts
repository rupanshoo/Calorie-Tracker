import { UserProfile } from './types';

const ACTIVITY_MULTIPLIERS = {
  sedentary: 1.2,
  light: 1.375,
  moderate: 1.55,
  active: 1.725,
  veryActive: 1.9,
};

export function isGainMode(profile: UserProfile): boolean {
  return profile.goalWeight > profile.currentWeight;
}

export function calculateBMR(profile: UserProfile): number {
  // Mifflin-St Jeor equation
  const base = 10 * profile.currentWeight + 6.25 * profile.height - 5 * profile.age;
  return profile.gender === 'male' ? base + 5 : base - 161;
}

export function calculateTDEE(profile: UserProfile): number {
  return Math.round(calculateBMR(profile) * ACTIVITY_MULTIPLIERS[profile.activityLevel]);
}

// Returns the daily caloric change needed (positive number — deficit for loss, surplus for gain)
export function calculateDailyChange(profile: UserProfile): number {
  const weightDiff = Math.abs(profile.goalWeight - profile.currentWeight);
  const today = new Date();
  const goalDate = new Date(profile.goalDate);
  const daysLeft = Math.max(1, Math.ceil((goalDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)));
  return Math.round((weightDiff * 7700) / daysLeft);
}

export function suggestedCalorieTarget(profile: UserProfile): number {
  const tdee = calculateTDEE(profile);
  const dailyChange = calculateDailyChange(profile);

  if (isGainMode(profile)) {
    // Gain: eat above maintenance — cap at +500 to minimise fat gain
    return tdee + Math.min(dailyChange, 500);
  } else {
    // Loss: eat below maintenance — floor at 1200/1400 to stay safe
    const min = profile.gender === 'male' ? 1400 : 1200;
    return Math.max(min, tdee - dailyChange);
  }
}

export function daysUntilGoal(goalDate: string): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const goal = new Date(goalDate);
  return Math.max(0, Math.ceil((goal.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)));
}

export function progressPercent(current: number, start: number, goal: number): number {
  if (start === goal) return 100;
  const moved = Math.abs(current - start);
  const total = Math.abs(goal - start);
  return Math.min(100, Math.max(0, Math.round((moved / total) * 100)));
}

export function bmi(weight: number, height: number): number {
  const h = height / 100;
  return Math.round((weight / (h * h)) * 10) / 10;
}

export function bmiCategory(bmiVal: number): string {
  if (bmiVal < 18.5) return 'Underweight';
  if (bmiVal < 25) return 'Normal';
  if (bmiVal < 30) return 'Overweight';
  return 'Obese';
}

export function motivationalMessage(
  netCalories: number,
  target: number,
  tdee: number,
  gainMode: boolean,
): string {
  if (netCalories === 0) return "Log your first meal to get started!";

  const remaining = target - netCalories; // positive = need to eat more (gain) or can still eat (loss)
  const vsMaintenace = netCalories - tdee;  // positive = surplus, negative = deficit

  if (gainMode) {
    // Gain mode — want net > target > TDEE
    if (remaining > 200)
      return `You need ${remaining} more cal to hit your surplus target. Keep eating — you're building!`;
    if (remaining >= 0)
      return `Almost there! Just ${remaining} cal to hit your target for today.`;
    if (vsMaintenace > 0)
      return `You've created a ${vsMaintenace} cal surplus today — right on track for your goal!`;
    return `Over your target by ${Math.abs(remaining)} cal. A little extra won't hurt on a bulk!`;
  } else {
    // Loss mode — want net < target < TDEE
    const deficit = tdee - netCalories;
    if (remaining > 200)
      return `${deficit} cal deficit vs maintenance so far. ${remaining} cal still ok to eat — you're on track!`;
    if (remaining >= 0)
      return `Spot on! ${deficit} cal deficit vs maintenance. Just ${remaining} cal left to round off the day.`;
    if (netCalories < tdee)
      return `Over your target by ${Math.abs(remaining)} cal, but still ${deficit} cal below maintenance — still in deficit. Stay mindful tomorrow.`;
    return `Over maintenance by ${Math.abs(deficit)} cal today. Get back on track tomorrow — one day doesn't break the journey!`;
  }
}
