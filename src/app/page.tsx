'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Plus, Zap, Target, UtensilsCrossed, Dumbbell } from 'lucide-react';
import CalorieRing from '@/components/CalorieRing';
import DeficitBank from '@/components/DeficitBank';
import WeeklyChallengeCard from '@/components/WeeklyChallengeCard';
import {
  getProfile,
  getFoodEntriesForDate,
  getExerciseEntriesForDate,
  getLatestWeight,
  calculateStreak,
  today,
  formatDate,
} from '@/lib/storage';
import {
  daysUntilGoal,
  progressPercent,
  motivationalMessage,
  bmi,
  bmiCategory,
  calculateTDEE,
  isGainMode,
} from '@/lib/calculations';
import { UserProfile } from '@/lib/types';

function streakMessage(streak: number): string {
  if (streak >= 30) return 'Legendary! 30+ days!';
  if (streak >= 14) return 'Two weeks strong!';
  if (streak >= 7) return 'One full week!';
  if (streak >= 3) return 'Habit forming!';
  return 'Keep it up!';
}

export default function Dashboard() {
  const router = useRouter();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [consumed, setConsumed] = useState(0);
  const [burned, setBurned] = useState(0);
  const [latestWeight, setLatestWeight] = useState(0);
  const [streak, setStreak] = useState(0);
  const [loggedToday, setLoggedToday] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const p = getProfile();
    if (!p?.setupComplete) { router.push('/settings'); return; }
    setProfile(p);
    const date = today();
    const food = getFoodEntriesForDate(date);
    const exercise = getExerciseEntriesForDate(date);
    setConsumed(food.reduce((s, e) => s + e.calories, 0));
    setBurned(exercise.reduce((s, e) => s + e.caloriesBurned, 0));
    setLatestWeight(getLatestWeight(p.currentWeight));
    const { streak, loggedToday } = calculateStreak();
    setStreak(streak);
    setLoggedToday(loggedToday);
  }, [router]);

  if (!mounted || !profile) return null;

  const net = consumed - burned;
  const target = profile.dailyCalorieTarget;
  const tdee = calculateTDEE(profile);
  const gainMode = isGainMode(profile);
  const daysLeft = daysUntilGoal(profile.goalDate);
  const progress = progressPercent(latestWeight, profile.currentWeight, profile.goalWeight);
  const weightDiff = Math.abs(profile.currentWeight - latestWeight);
  const toGo = Math.abs(latestWeight - profile.goalWeight);
  const currentBmi = bmi(latestWeight, profile.height);
  const remaining = target - net;
  const vsMaintenace = gainMode ? net - tdee : tdee - net;
  const message = motivationalMessage(net, target, tdee, gainMode);

  const bannerColor =
    net === 0 ? 'from-gray-400 to-gray-500'
    : gainMode
      ? net >= target ? 'from-emerald-500 to-teal-500'
        : net >= tdee ? 'from-yellow-500 to-orange-400'
        : 'from-red-500 to-orange-500'
    : net > tdee ? 'from-red-500 to-orange-500'
      : net > target ? 'from-yellow-500 to-orange-400'
      : 'from-emerald-500 to-teal-500';

  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between py-1">
        <div>
          <h1 className="text-xl font-bold text-gray-800 dark:text-gray-100">
            Hey, {profile.name.split(' ')[0]}!
          </h1>
          <p className="text-xs text-gray-400 dark:text-gray-500">{formatDate(today())}</p>
        </div>
        <div className="bg-emerald-50 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-400 text-xs font-semibold px-3 py-1.5 rounded-full flex items-center gap-1.5">
          <Zap size={12} />
          {daysLeft}d to goal
        </div>
      </div>

      {/* ── Bento grid ── */}
      <div className="grid grid-cols-3 gap-3 auto-rows-auto">

        {/* 1. Streak — col 1, spans 2 rows tall */}
        <div className={`row-span-2 rounded-2xl p-5 flex flex-col justify-between shadow-sm ${
          streak === 0 ? 'bg-white dark:bg-gray-800'
          : loggedToday ? 'bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800'
          : 'bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800'
        }`}>
          <div>
            <div className={`text-5xl mb-2 ${streak === 0 ? 'grayscale opacity-30' : ''}`}>🔥</div>
            <div className={`text-5xl font-black leading-none ${streak === 0 ? 'text-gray-300 dark:text-gray-600' : 'text-orange-500'}`}>
              {streak}
            </div>
            <div className="text-sm font-semibold text-gray-500 dark:text-gray-400 mt-1">day streak</div>
          </div>
          <div>
            <div className={`text-xs font-medium leading-snug mb-3 ${
              streak === 0 ? 'text-gray-400 dark:text-gray-500'
              : loggedToday ? 'text-orange-600 dark:text-orange-400'
              : 'text-yellow-600 dark:text-yellow-400'
            }`}>
              {streak === 0 ? 'Log today to start your streak!' : loggedToday ? streakMessage(streak) : "Don't break it — log today!"}
            </div>
            <div className="space-y-2 pt-3 border-t border-black/5 dark:border-white/5">
              <div className="flex justify-between items-center">
                <span className="text-[11px] text-gray-400 dark:text-gray-500">Target</span>
                <span className="text-xs font-bold text-gray-700 dark:text-gray-300">{target} kcal</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-[11px] text-gray-400 dark:text-gray-500">Maintenance</span>
                <span className="text-xs font-bold text-gray-700 dark:text-gray-300">{tdee} kcal</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-[11px] text-gray-400 dark:text-gray-500">BMI</span>
                <span className={`text-xs font-bold ${
                  currentBmi < 18.5 ? 'text-blue-500' : currentBmi < 25 ? 'text-emerald-500' : currentBmi < 30 ? 'text-yellow-500' : 'text-red-500'
                }`}>{currentBmi} — {bmiCategory(currentBmi)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* 2. Calorie Ring — col 2, row 1 */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-5 shadow-sm flex flex-col items-center justify-center">
          <CalorieRing consumed={consumed} burned={burned} target={target} />
        </div>

        {/* 3. Days to goal + weight — col 3, row 1 */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-5 shadow-sm flex flex-col justify-between">
          <div>
            <div className="text-[11px] text-gray-400 dark:text-gray-500 font-medium uppercase tracking-wide">Goal Deadline</div>
            <div className="text-5xl font-black text-gray-800 dark:text-gray-100 leading-none mt-1">{daysLeft}</div>
            <div className="text-sm text-gray-400 dark:text-gray-500 mt-0.5">days left</div>
          </div>
          <div className="pt-3 border-t border-gray-100 dark:border-gray-700 space-y-1.5">
            <div className="flex justify-between items-center">
              <span className="text-[11px] text-gray-400 dark:text-gray-500">Current</span>
              <span className="text-xs font-bold text-gray-700 dark:text-gray-300">{latestWeight} kg</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-[11px] text-gray-400 dark:text-gray-500">Goal</span>
              <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">{profile.goalWeight} kg</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-[11px] text-gray-400 dark:text-gray-500">To go</span>
              <span className="text-xs font-bold text-gray-700 dark:text-gray-300">{toGo.toFixed(1)} kg</span>
            </div>
          </div>
        </div>

        {/* 4. Log buttons — col 2, row 2 */}
        <Link href="/food" className="bg-orange-50 dark:bg-orange-900/30 border border-orange-100 dark:border-orange-900 text-orange-600 dark:text-orange-400 rounded-2xl p-5 flex flex-col items-center justify-center gap-2 hover:bg-orange-100 dark:hover:bg-orange-900/50 transition-colors shadow-sm group">
          <UtensilsCrossed size={28} className="group-hover:scale-110 transition-transform" />
          <div className="text-center">
            <div className="text-sm font-bold">Log Food</div>
            <div className="text-[11px] opacity-70">{consumed > 0 ? `${consumed} kcal today` : 'Nothing logged yet'}</div>
          </div>
          <div className="w-8 h-8 bg-orange-500 rounded-full flex items-center justify-center">
            <Plus size={16} className="text-white" />
          </div>
        </Link>

        {/* 5. Exercise button — col 3, row 2 */}
        <Link href="/exercise" className="bg-blue-50 dark:bg-blue-900/30 border border-blue-100 dark:border-blue-900 text-blue-600 dark:text-blue-400 rounded-2xl p-5 flex flex-col items-center justify-center gap-2 hover:bg-blue-100 dark:hover:bg-blue-900/50 transition-colors shadow-sm group">
          <Dumbbell size={28} className="group-hover:scale-110 transition-transform" />
          <div className="text-center">
            <div className="text-sm font-bold">Log Exercise</div>
            <div className="text-[11px] opacity-70">{burned > 0 ? `${burned} kcal burned` : 'No activity yet'}</div>
          </div>
          <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
            <Plus size={16} className="text-white" />
          </div>
        </Link>

        {/* 6. Motivational banner — full width */}
        <div className={`col-span-3 rounded-2xl p-4 text-white bg-gradient-to-r ${bannerColor} shadow-sm`}>
          <p className="text-sm font-medium leading-relaxed">{message}</p>
          {net > 0 && (
            <div className="flex gap-2 mt-3">
              <div className="flex-1 text-center text-xs font-semibold py-1.5 rounded-xl bg-white/20">
                {gainMode
                  ? remaining <= 0 ? `${Math.abs(remaining)} over target` : `${remaining} still needed today`
                  : remaining >= 0 ? `${remaining} kcal still ok to eat` : `${Math.abs(remaining)} over target`}
              </div>
              <div className={`flex-1 text-center text-xs font-semibold py-1.5 rounded-xl ${vsMaintenace >= 0 ? 'bg-white/20' : 'bg-red-600/40'}`}>
                {vsMaintenace >= 0
                  ? `${vsMaintenace} kcal ${gainMode ? 'surplus' : 'deficit'} vs maintenance`
                  : `${Math.abs(vsMaintenace)} kcal ${gainMode ? 'below' : 'over'} maintenance`}
              </div>
            </div>
          )}
        </div>

        {/* 7. Weight goal — col 1+2 */}
        <div className="col-span-2 bg-white dark:bg-gray-800 rounded-2xl p-5 shadow-sm">
          <div className="flex items-center gap-2 text-sm font-semibold text-gray-600 dark:text-gray-300 mb-4">
            <Target size={15} className="text-emerald-500" />
            Weight Goal Progress
          </div>
          <div className="space-y-3">
            <div className="flex justify-between text-sm text-gray-500 dark:text-gray-400">
              <span>Start: <strong className="text-gray-700 dark:text-gray-200">{profile.currentWeight}kg</strong></span>
              <span>Now: <strong className="text-gray-700 dark:text-gray-200">{latestWeight}kg</strong></span>
              <span>Goal: <strong className="text-emerald-600 dark:text-emerald-400">{profile.goalWeight}kg</strong></span>
            </div>
            <div className="h-4 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-emerald-400 to-emerald-600 rounded-full transition-all duration-700"
                style={{ width: `${progress}%` }}
              />
            </div>
            <div className="flex justify-between text-xs text-gray-400 dark:text-gray-500">
              <span className="text-emerald-600 dark:text-emerald-400 font-semibold">{progress}% complete</span>
              <span>{weightDiff.toFixed(1)}kg {gainMode ? 'gained' : 'lost'} · {toGo.toFixed(1)}kg to go</span>
            </div>
          </div>
        </div>

        {/* 8. Quick stats — col 3 */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-5 shadow-sm flex flex-col justify-center gap-3">
          <div className="text-center">
            <div className="text-[11px] text-gray-400 dark:text-gray-500 uppercase tracking-wide font-medium">BMI</div>
            <div className="text-4xl font-black text-gray-800 dark:text-gray-100 leading-none mt-1">{currentBmi}</div>
            <div className={`text-xs font-semibold mt-1 ${
              currentBmi < 18.5 ? 'text-blue-500' : currentBmi < 25 ? 'text-emerald-500' : currentBmi < 30 ? 'text-yellow-500' : 'text-red-500'
            }`}>{bmiCategory(currentBmi)}</div>
          </div>
        </div>

        {/* 9. Deficit / Surplus Bank — full width */}
        <div className="col-span-3">
          <DeficitBank tdee={tdee} target={target} gainMode={gainMode} />
        </div>

        {/* 10. Weekly Challenge — full width */}
        <div className="col-span-3">
          <WeeklyChallengeCard profile={profile} />
        </div>

        {/* 11. Weekly Digest teaser — full width */}
        <Link href="/progress" className="col-span-3 bg-gradient-to-r from-violet-500 to-indigo-500 rounded-2xl p-4 text-white flex items-center justify-between hover:opacity-90 transition-opacity shadow-sm">
          <div className="flex items-center gap-3">
            <span className="text-2xl">📊</span>
            <div>
              <div className="font-bold text-sm">Weekly Digest</div>
              <div className="text-xs opacity-75">Last week's report card — avg calories, days on target, weight change & takeaway</div>
            </div>
          </div>
          <div className={`text-xs font-bold px-2 py-1 rounded-full bg-white/20 ${new Date().getDay() === 1 ? 'animate-pulse' : ''}`}>
            {new Date().getDay() === 1 ? 'NEW →' : 'View →'}
          </div>
        </Link>

      </div>
    </div>
  );
}
