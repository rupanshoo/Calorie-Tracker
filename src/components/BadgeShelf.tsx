'use client';

import { useEffect, useState } from 'react';
import { ALL_BADGES, BadgeDef, checkAndAwardBadges } from '@/lib/badges';
import { getEarnedBadges, getFoodEntries, getExerciseEntries, getWeightEntries } from '@/lib/storage';
import { UserProfile, EarnedBadge } from '@/lib/types';

const CATEGORY_LABELS: Record<string, string> = {
  streak: '🔥 Streak',
  weight: '⚖️ Weight',
  target: '🎯 On Target',
  logging: '📝 Logging',
};

export default function BadgeShelf({ profile }: { profile: UserProfile }) {
  const [earned, setEarned] = useState<EarnedBadge[]>([]);
  const [newIds, setNewIds] = useState<string[]>([]);
  const [tooltip, setTooltip] = useState<string | null>(null);

  useEffect(() => {
    const food = getFoodEntries();
    const exercise = getExerciseEntries();
    const weight = getWeightEntries();
    const { earned, newBadgeIds } = checkAndAwardBadges(profile, food, exercise, weight);
    setEarned(earned);
    setNewIds(newBadgeIds);
  }, [profile]);

  const earnedMap = new Map(earned.map(b => [b.id, b]));
  const totalEarned = earned.length;
  const total = ALL_BADGES.length;

  const categories = ['streak', 'weight', 'target', 'logging'] as const;

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-yellow-400 to-orange-400 p-5 text-white flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-2xl">🏆</span>
          <div>
            <div className="font-bold text-base">Achievements</div>
            <div className="text-xs opacity-75">{totalEarned} of {total} unlocked</div>
          </div>
        </div>
        <div className="text-right">
          <div className="text-2xl font-black">{Math.round((totalEarned / total) * 100)}%</div>
          <div className="text-xs opacity-75">complete</div>
        </div>
      </div>

      {/* Progress bar */}
      <div className="h-1.5 bg-orange-100 dark:bg-gray-700">
        <div
          className="h-full bg-gradient-to-r from-yellow-400 to-orange-400 transition-all duration-1000"
          style={{ width: `${(totalEarned / total) * 100}%` }}
        />
      </div>

      <div className="p-5 space-y-6">
        {categories.map(cat => {
          const badges = ALL_BADGES.filter(b => b.category === cat);
          return (
            <div key={cat}>
              <div className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-3">
                {CATEGORY_LABELS[cat]}
              </div>
              <div className="grid grid-cols-4 gap-3">
                {badges.map(badge => {
                  const e = earnedMap.get(badge.id);
                  const isNew = newIds.includes(badge.id);
                  return (
                    <button
                      key={badge.id}
                      onClick={() => setTooltip(tooltip === badge.id ? null : badge.id)}
                      className={`relative flex flex-col items-center gap-1.5 p-3 rounded-2xl transition-all duration-200 ${
                        e
                          ? 'bg-yellow-50 dark:bg-yellow-900/20 border-2 border-yellow-300 dark:border-yellow-700 hover:scale-105'
                          : 'bg-gray-50 dark:bg-gray-700/50 border-2 border-transparent opacity-40 hover:opacity-60'
                      }`}
                    >
                      {isNew && (
                        <span className="absolute -top-1.5 -right-1.5 bg-red-500 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full animate-bounce">
                          NEW
                        </span>
                      )}
                      <span className={`text-2xl ${!e ? 'grayscale' : ''}`}>{badge.icon}</span>
                      <span className={`text-[10px] font-semibold text-center leading-tight ${
                        e ? 'text-gray-700 dark:text-gray-200' : 'text-gray-400 dark:text-gray-500'
                      }`}>
                        {badge.name}
                      </span>
                      {e && (
                        <span className="text-[9px] text-yellow-600 dark:text-yellow-400 font-medium">
                          ✓ Earned
                        </span>
                      )}

                      {/* Tooltip */}
                      {tooltip === badge.id && (
                        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 z-10 w-36 bg-gray-900 dark:bg-gray-700 text-white text-[11px] rounded-xl p-2.5 shadow-xl text-center">
                          <div className="font-semibold mb-0.5">{badge.name}</div>
                          <div className="opacity-80">{badge.description}</div>
                          {e && <div className="mt-1 text-yellow-400 text-[10px]">Earned {new Date(e.earnedAt + 'T00:00:00').toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</div>}
                          <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-gray-900 dark:border-t-gray-700" />
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
