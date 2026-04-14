'use client';

import { useEffect, useState } from 'react';
import {
  getWeeklyChallenge, saveWeeklyChallenge, getCurrentWeekStart,
  getFoodEntries, getExerciseEntries, getThisWeekData,
} from '@/lib/storage';
import { WeeklyChallenge, ChallengeType, UserProfile } from '@/lib/types';
import { isGainMode } from '@/lib/calculations';

const CHALLENGE_OPTIONS: { type: ChallengeType; label: string; icon: string; targets: number[] }[] = [
  { type: 'log_days',      label: 'Log every day',        icon: '📝', targets: [5, 7] },
  { type: 'hit_target',    label: 'Hit calorie target',   icon: '🎯', targets: [3, 5, 7] },
  { type: 'exercise_days', label: 'Exercise this week',   icon: '💪', targets: [2, 3, 5] },
  { type: 'burn_calories', label: 'Burn calories',        icon: '🔥', targets: [500, 1000, 1500] },
];

function buildDescription(type: ChallengeType, target: number): string {
  switch (type) {
    case 'log_days':      return `Log food on ${target} days this week`;
    case 'hit_target':    return `Hit your calorie target ${target} out of 7 days`;
    case 'exercise_days': return `Exercise at least ${target} times this week`;
    case 'burn_calories': return `Burn ${target} cal through exercise this week`;
  }
}

function computeProgress(challenge: WeeklyChallenge, profile: UserProfile): number {
  const weekData = getThisWeekData();
  const exercise = getExerciseEntries().filter(e => e.date >= challenge.weekStart);
  const gainMode = isGainMode(profile);
  const target = profile.dailyCalorieTarget;

  switch (challenge.type) {
    case 'log_days':
      return weekData.filter(d => d.hasData).length;
    case 'hit_target':
      return weekData.filter(d => d.hasData && (gainMode ? d.net >= target : d.net <= target)).length;
    case 'exercise_days': {
      const exDates = new Set(exercise.map(e => e.date));
      return exDates.size;
    }
    case 'burn_calories':
      return exercise.reduce((s, e) => s + e.caloriesBurned, 0);
  }
}

function getProgressUnit(type: ChallengeType, target: number): string {
  switch (type) {
    case 'log_days':      return `/ ${target} days`;
    case 'hit_target':    return `/ ${target} days`;
    case 'exercise_days': return `/ ${target} sessions`;
    case 'burn_calories': return `/ ${target} cal`;
  }
}

const DAY_LABELS = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

export default function WeeklyChallengeCard({ profile }: { profile: UserProfile }) {
  const [challenge, setChallenge] = useState<WeeklyChallenge | null>(null);
  const [progress, setProgress] = useState(0);
  const [picking, setPicking] = useState(false);
  const [selectedType, setSelectedType] = useState<ChallengeType>('hit_target');
  const [selectedTarget, setSelectedTarget] = useState(5);
  const [weekData, setWeekData] = useState<{ date: string; net: number; hasData: boolean }[]>([]);

  const load = () => {
    const stored = getWeeklyChallenge();
    const weekStart = getCurrentWeekStart();
    if (stored && stored.weekStart === weekStart) {
      setChallenge(stored);
      setProgress(computeProgress(stored, profile));
    } else {
      setChallenge(null);
    }
    setWeekData(getThisWeekData());
  };

  useEffect(() => { load(); }, [profile]);

  const startChallenge = () => {
    const weekStart = getCurrentWeekStart();
    const c: WeeklyChallenge = {
      weekStart,
      type: selectedType,
      description: buildDescription(selectedType, selectedTarget),
      target: selectedTarget,
      completed: false,
    };
    saveWeeklyChallenge(c);
    setPicking(false);
    load();
  };

  const percent = challenge ? Math.min(100, Math.round((progress / challenge.target) * 100)) : 0;
  const completed = percent >= 100;

  const today = new Date().toISOString().split('T')[0];
  const gainMode = isGainMode(profile);
  const calTarget = profile.dailyCalorieTarget;

  // Per-day status for the visual tracker
  const getDayStatus = (d: { date: string; net: number; hasData: boolean }, type: ChallengeType) => {
    if (d.date > today) return 'future';
    if (!d.hasData) return 'missed';
    switch (type) {
      case 'log_days': return 'done';
      case 'hit_target': return (gainMode ? d.net >= calTarget : d.net <= calTarget) ? 'done' : 'missed';
      case 'exercise_days': {
        const ex = getExerciseEntries().filter(e => e.date === d.date);
        return ex.length > 0 ? 'done' : 'missed';
      }
      case 'burn_calories': return 'done'; // just show logged
    }
  };

  if (picking || !challenge) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm overflow-hidden">
        <div className="bg-gradient-to-r from-pink-500 to-rose-500 p-5 text-white">
          <div className="flex items-center gap-2">
            <span className="text-2xl">⚡</span>
            <div>
              <div className="font-bold">Weekly Challenge</div>
              <div className="text-xs opacity-75">Set a goal for this week</div>
            </div>
          </div>
        </div>
        <div className="p-5 space-y-4">
          <div className="space-y-2">
            {CHALLENGE_OPTIONS.map(opt => (
              <button
                key={opt.type}
                onClick={() => { setSelectedType(opt.type); setSelectedTarget(opt.targets[1]); }}
                className={`w-full text-left px-4 py-3 rounded-xl border transition-colors flex items-center justify-between ${
                  selectedType === opt.type
                    ? 'border-pink-400 bg-pink-50 dark:bg-pink-900/20'
                    : 'border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700/50'
                }`}
              >
                <div className="flex items-center gap-2">
                  <span className="text-lg">{opt.icon}</span>
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-200">{opt.label}</span>
                </div>
                {selectedType === opt.type && (
                  <div className="flex gap-1">
                    {opt.targets.map(t => (
                      <button
                        key={t}
                        onClick={e => { e.stopPropagation(); setSelectedTarget(t); }}
                        className={`text-xs px-2 py-1 rounded-full font-bold transition-colors ${
                          selectedTarget === t
                            ? 'bg-pink-500 text-white'
                            : 'bg-gray-100 dark:bg-gray-600 text-gray-500 dark:text-gray-300'
                        }`}
                      >
                        {t}
                      </button>
                    ))}
                  </div>
                )}
              </button>
            ))}
          </div>

          <div className="bg-pink-50 dark:bg-pink-900/20 rounded-xl px-4 py-2.5 text-sm text-pink-700 dark:text-pink-400 font-medium">
            {buildDescription(selectedType, selectedTarget)}
          </div>

          <div className="flex gap-3">
            <button
              onClick={startChallenge}
              className="flex-1 bg-gradient-to-r from-pink-500 to-rose-500 text-white rounded-xl py-3 text-sm font-bold transition-opacity hover:opacity-90"
            >
              Start Challenge
            </button>
            {challenge && (
              <button onClick={() => setPicking(false)} className="px-4 py-3 border border-gray-200 dark:border-gray-600 rounded-xl text-sm text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700">
                Cancel
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm overflow-hidden">
      {/* Header */}
      <div className={`p-5 text-white bg-gradient-to-r ${completed ? 'from-emerald-500 to-teal-500' : 'from-pink-500 to-rose-500'}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-2xl">{completed ? '🏆' : '⚡'}</span>
            <div>
              <div className="font-bold">Weekly Challenge</div>
              <div className="text-xs opacity-75">{challenge.description}</div>
            </div>
          </div>
          <button
            onClick={() => setPicking(true)}
            className="text-[11px] bg-white/20 hover:bg-white/30 px-2.5 py-1 rounded-full font-medium transition-colors"
          >
            Change
          </button>
        </div>
      </div>

      <div className="p-5 space-y-4">
        {/* Progress */}
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-2xl font-black text-gray-800 dark:text-gray-100">
              {progress}
              <span className="text-sm font-normal text-gray-400 dark:text-gray-500 ml-1">
                {getProgressUnit(challenge.type, challenge.target)}
              </span>
            </span>
            <span className={`text-sm font-bold ${completed ? 'text-emerald-600 dark:text-emerald-400' : 'text-pink-500'}`}>
              {completed ? 'Completed! 🎉' : `${percent}%`}
            </span>
          </div>
          <div className="h-3 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-700 ${completed ? 'bg-gradient-to-r from-emerald-400 to-teal-500' : 'bg-gradient-to-r from-pink-400 to-rose-500'}`}
              style={{ width: `${percent}%` }}
            />
          </div>
        </div>

        {/* Day tracker (for day-based challenges) */}
        {(challenge.type === 'log_days' || challenge.type === 'hit_target' || challenge.type === 'exercise_days') && (
          <div className="flex justify-between">
            {weekData.map((d, i) => {
              const status = getDayStatus(d, challenge.type);
              return (
                <div key={d.date} className="flex flex-col items-center gap-1.5">
                  <span className="text-[10px] text-gray-400 dark:text-gray-500 font-medium">{DAY_LABELS[i]}</span>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                    status === 'done' ? 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400'
                    : status === 'missed' ? 'bg-red-100 dark:bg-red-900/40 text-red-400'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-300 dark:text-gray-600'
                  }`}>
                    {status === 'done' ? '✓' : status === 'missed' ? '✗' : '·'}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Motivational sub-text */}
        <div className={`text-xs font-medium rounded-xl px-3 py-2 ${
          completed
            ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400'
            : percent >= 50
            ? 'bg-pink-50 dark:bg-pink-900/20 text-pink-700 dark:text-pink-400'
            : 'bg-gray-50 dark:bg-gray-700 text-gray-500 dark:text-gray-400'
        }`}>
          {completed
            ? "Challenge complete! You crushed it this week."
            : percent >= 75 ? "Almost there — don't stop now!"
            : percent >= 50 ? "Over halfway — great momentum!"
            : percent >= 25 ? "Good start — keep building on it."
            : "Every day counts. Start today!"}
        </div>
      </div>
    </div>
  );
}
