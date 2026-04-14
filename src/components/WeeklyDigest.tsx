'use client';

import { useEffect, useState } from 'react';
import { getLastWeekData, getWeightEntries } from '@/lib/storage';
import { isGainMode } from '@/lib/calculations';
import { UserProfile } from '@/lib/types';

const DAY_LABELS = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

interface DigestData {
  startDate: string;
  endDate: string;
  daysLogged: number;
  daysOnTarget: number;
  avgCalories: number;
  totalBurned: number;
  weightChange: number | null;
  bestDay: { date: string; net: number } | null;
  dayData: { date: string; net: number; calories: number; hasData: boolean }[];
}

function getGrade(daysOnTarget: number, daysLogged: number): { letter: string; color: string; bg: string } {
  if (daysLogged === 0) return { letter: '–', color: 'text-gray-400', bg: 'bg-gray-100 dark:bg-gray-700' };
  const ratio = daysOnTarget / 7;
  if (ratio >= 6 / 7) return { letter: 'A', color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-50 dark:bg-emerald-900/30' };
  if (ratio >= 4 / 7) return { letter: 'B', color: 'text-blue-600 dark:text-blue-400', bg: 'bg-blue-50 dark:bg-blue-900/30' };
  if (ratio >= 2 / 7) return { letter: 'C', color: 'text-yellow-600 dark:text-yellow-400', bg: 'bg-yellow-50 dark:bg-yellow-900/30' };
  return { letter: 'D', color: 'text-red-500', bg: 'bg-red-50 dark:bg-red-900/30' };
}

function getTakeaway(data: DigestData, gainMode: boolean): string {
  if (data.daysLogged === 0) return "No data logged last week. This week, try to log at least 3 days — even partial tracking is better than none.";

  const { daysOnTarget, daysLogged, avgCalories, weightChange } = data;

  if (daysOnTarget >= 6) {
    return weightChange !== null && (gainMode ? weightChange > 0 : weightChange < 0)
      ? `Near-perfect week! You hit your target ${daysOnTarget}/7 days and the scale moved in the right direction. Keep this momentum going.`
      : `Excellent consistency — ${daysOnTarget}/7 days on target. The scale will catch up. Stay patient and keep logging.`;
  }
  if (daysOnTarget >= 4) {
    return `Solid week with ${daysOnTarget}/7 days on target. Focus on the days you missed — what made them harder? Adjust and aim for one more on-target day this week.`;
  }
  if (daysLogged >= 5) {
    return `You tracked ${daysLogged}/7 days which is great. But only ${daysOnTarget} days hit the calorie target. Try meal prepping or planning your biggest meal first.`;
  }
  return `Only ${daysLogged} days tracked last week. Consistency in logging is step one — even over-target days count. Aim for 5+ days logged this week.`;
}

function formatShortDate(date: string): string {
  return new Date(date + 'T00:00:00').toLocaleDateString('en-IN', { month: 'short', day: 'numeric' });
}

export default function WeeklyDigest({ profile }: { profile: UserProfile }) {
  const [data, setData] = useState<DigestData | null>(null);
  const gainMode = isGainMode(profile);
  const target = profile.dailyCalorieTarget;

  useEffect(() => {
    const { startDate, endDate, dayData } = getLastWeekData();
    const weightEntries = getWeightEntries();

    const logsWithData = dayData.filter(d => d.hasData);
    const daysOnTarget = dayData.filter(d => d.hasData && d.net <= target).length;
    const avgCalories = logsWithData.length
      ? Math.round(logsWithData.reduce((s, d) => s + d.net, 0) / logsWithData.length)
      : 0;
    const totalBurned = dayData.reduce((s, d) => s + d.burned, 0);

    // Weight change: compare closest entry before/at startDate vs endDate
    const startWeight = weightEntries.filter(e => e.date <= startDate).at(-1)?.weight ?? null;
    const endWeight = weightEntries.filter(e => e.date <= endDate).at(-1)?.weight ?? null;
    const weightChange = startWeight && endWeight ? Math.round((endWeight - startWeight) * 10) / 10 : null;

    const bestDay = logsWithData.reduce<{ date: string; net: number } | null>((best, d) => {
      if (!best) return { date: d.date, net: d.net };
      return gainMode
        ? (d.net > best.net ? { date: d.date, net: d.net } : best)
        : (d.net < best.net ? { date: d.date, net: d.net } : best);
    }, null);

    setData({ startDate, endDate, daysLogged: logsWithData.length, daysOnTarget, avgCalories, totalBurned, weightChange, bestDay, dayData });
  }, [profile, target, gainMode]);

  if (!data) return null;

  const grade = getGrade(data.daysOnTarget, data.daysLogged);
  const takeaway = getTakeaway(data, gainMode);
  const isMonday = new Date().getDay() === 1;

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-violet-500 to-indigo-500 p-5 text-white">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-lg">📊</span>
              <span className="font-bold text-base">Weekly Digest</span>
              {isMonday && (
                <span className="bg-white/20 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">NEW</span>
              )}
            </div>
            <div className="text-xs opacity-75 mt-0.5">
              {formatShortDate(data.startDate)} – {formatShortDate(data.endDate)}
            </div>
          </div>
          {/* Grade */}
          <div className={`w-16 h-16 rounded-2xl ${grade.bg} flex flex-col items-center justify-center`}>
            <div className={`text-3xl font-black leading-none ${grade.color}`}>{grade.letter}</div>
            <div className="text-[9px] text-gray-500 dark:text-gray-400 font-medium mt-0.5">GRADE</div>
          </div>
        </div>
      </div>

      <div className="p-5 space-y-5">
        {/* Stats row */}
        <div className="grid grid-cols-4 gap-3">
          <div className="text-center">
            <div className="text-xl font-black text-gray-800 dark:text-gray-100">{data.avgCalories}</div>
            <div className="text-[10px] text-gray-400 dark:text-gray-500 leading-tight">avg cal/day</div>
          </div>
          <div className="text-center">
            <div className="text-xl font-black text-gray-800 dark:text-gray-100">{data.daysOnTarget}<span className="text-sm font-normal text-gray-400">/7</span></div>
            <div className="text-[10px] text-gray-400 dark:text-gray-500 leading-tight">on target</div>
          </div>
          <div className="text-center">
            <div className="text-xl font-black text-gray-800 dark:text-gray-100">{data.daysLogged}<span className="text-sm font-normal text-gray-400">/7</span></div>
            <div className="text-[10px] text-gray-400 dark:text-gray-500 leading-tight">days logged</div>
          </div>
          <div className="text-center">
            {data.weightChange !== null ? (
              <>
                <div className={`text-xl font-black ${
                  gainMode
                    ? data.weightChange > 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-500'
                    : data.weightChange < 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-500'
                }`}>
                  {data.weightChange > 0 ? '+' : ''}{data.weightChange}kg
                </div>
                <div className="text-[10px] text-gray-400 dark:text-gray-500 leading-tight">wt change</div>
              </>
            ) : (
              <>
                <div className="text-xl font-black text-gray-300 dark:text-gray-600">–</div>
                <div className="text-[10px] text-gray-400 dark:text-gray-500 leading-tight">wt change</div>
              </>
            )}
          </div>
        </div>

        {/* Day-by-day bar chart */}
        <div>
          <div className="flex items-end justify-between gap-1.5 h-16">
            {data.dayData.map((d, i) => {
              const maxNet = Math.max(...data.dayData.map(x => x.net), target);
              const height = d.hasData ? Math.max(8, Math.round((d.net / maxNet) * 100)) : 0;
              const onTarget = d.hasData && d.net <= target;
              return (
                <div key={d.date} className="flex-1 flex flex-col items-center gap-1">
                  <div className="w-full flex items-end justify-center" style={{ height: 52 }}>
                    {d.hasData ? (
                      <div
                        className={`w-full rounded-t-md transition-all duration-700 ${onTarget ? 'bg-emerald-400 dark:bg-emerald-500' : 'bg-red-400 dark:bg-red-500'}`}
                        style={{ height: `${height}%` }}
                      />
                    ) : (
                      <div className="w-full rounded-t-md bg-gray-100 dark:bg-gray-700" style={{ height: '15%' }} />
                    )}
                  </div>
                  <span className="text-[10px] font-medium text-gray-400 dark:text-gray-500">{DAY_LABELS[i]}</span>
                </div>
              );
            })}
          </div>
          {/* Target line label */}
          <div className="flex items-center gap-2 mt-1.5">
            <div className="w-3 h-0.5 bg-emerald-400 rounded" />
            <span className="text-[10px] text-gray-400 dark:text-gray-500">Green = on target · Red = over target</span>
          </div>
        </div>

        {/* Motivational takeaway */}
        <div className="bg-violet-50 dark:bg-violet-900/20 border border-violet-100 dark:border-violet-800 rounded-xl p-4">
          <div className="text-xs font-bold text-violet-600 dark:text-violet-400 mb-1.5 uppercase tracking-wide">💡 This Week's Takeaway</div>
          <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">{takeaway}</p>
        </div>
      </div>
    </div>
  );
}
