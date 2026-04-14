'use client';

import { useEffect, useState, useRef } from 'react';
import { getThisWeekData } from '@/lib/storage';

interface Props {
  tdee: number;
  target: number;
  gainMode: boolean;
}

const DAY_LABELS = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

function useCountUp(to: number, duration = 900) {
  const [val, setVal] = useState(0);
  const toRef = useRef(to);
  toRef.current = to;

  useEffect(() => {
    if (to === 0) { setVal(0); return; }
    const start = performance.now();
    const tick = (now: number) => {
      const progress = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setVal(Math.round(toRef.current * eased));
      if (progress < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }, [to, duration]);

  return val;
}

export default function DeficitBank({ tdee, target, gainMode }: Props) {
  const [weekData, setWeekData] = useState<{ date: string; net: number; hasData: boolean }[]>([]);
  const [barWidth, setBarWidth] = useState(0);
  const today = new Date().toISOString().split('T')[0];

  // For loss: daily contribution = tdee - net (how much deficit created)
  // For gain: daily contribution = net - tdee (how much surplus created)
  const getDayContribution = (net: number) =>
    gainMode ? Math.max(0, net - tdee) : Math.max(0, tdee - net);

  // Weekly goal = |target - tdee| × 7
  const dailyGoal = Math.abs(target - tdee);
  const weeklyGoal = dailyGoal * 7;

  useEffect(() => {
    const data = getThisWeekData();
    setWeekData(data);
    setTimeout(() => {
      const daysElapsed = data.filter(d => d.date <= today).length;
      const logged = data.filter(d => d.hasData && d.date <= today);
      const actual = logged.reduce((s, d) => s + getDayContribution(d.net), 0);
      setBarWidth(Math.min(100, Math.max(0, Math.round((actual / weeklyGoal) * 100))));
    }, 50);
  }, [tdee, target, today, gainMode]);

  const daysElapsed = weekData.filter(d => d.date <= today).length;
  const logged = weekData.filter(d => d.hasData && d.date <= today);
  const actual = logged.reduce((s, d) => s + getDayContribution(d.net), 0);
  const neededSoFar = dailyGoal * daysElapsed;
  const bank = actual - neededSoFar;
  const ahead = bank >= 0;

  const animatedActual = useCountUp(actual);
  const animatedBank = useCountUp(Math.abs(bank));

  const label = gainMode ? 'Surplus Bank' : 'Deficit Bank';
  const icon = gainMode ? '💪' : '🏦';
  const unitLabel = gainMode ? 'surplus' : 'deficit';

  const fillColor = ahead
    ? 'from-emerald-400 to-teal-500'
    : barWidth > 50
    ? 'from-yellow-400 to-orange-400'
    : 'from-red-400 to-orange-500';

  // For each day: green = good progress (deficit for loss, surplus for gain), red = wrong direction
  const isDayGood = (d: { net: number; hasData: boolean }) => {
    if (!d.hasData) return false;
    return gainMode ? d.net > tdee : d.net < tdee;
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl p-5 shadow-sm space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 font-semibold text-gray-700 dark:text-gray-200">
          <span className="text-xl">{icon}</span>
          {label}
        </div>
        <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${
          ahead
            ? 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-400'
            : 'bg-red-100 dark:bg-red-900/40 text-red-600 dark:text-red-400'
        }`}>
          {ahead ? `+${animatedBank} ahead` : `${animatedBank} behind`}
        </span>
      </div>

      {/* Progress bar */}
      <div className="space-y-1.5">
        <div className="flex justify-between text-xs text-gray-400 dark:text-gray-500">
          <span>{animatedActual} cal {unitLabel} banked</span>
          <span>{weeklyGoal} cal weekly goal</span>
        </div>
        <div className="h-4 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full bg-gradient-to-r ${fillColor} transition-all duration-1000 ease-out relative`}
            style={{ width: `${barWidth}%` }}
          >
            <div className="absolute inset-0 overflow-hidden rounded-full">
              <div className="absolute inset-y-0 -left-full w-1/2 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-shimmer" />
            </div>
          </div>
        </div>
        <div className="flex justify-between text-xs text-gray-400 dark:text-gray-500">
          <span>Week progress: {barWidth}%</span>
          <span>Day {daysElapsed} of 7</span>
        </div>
      </div>

      {/* Day indicators */}
      <div className="flex justify-between">
        {weekData.map((d, i) => {
          const isPast = d.date < today;
          const isToday = d.date === today;
          const isFuture = d.date > today;
          const good = isDayGood(d);
          const contribution = d.hasData ? getDayContribution(d.net) : 0;

          return (
            <div key={d.date} className="flex flex-col items-center gap-1.5">
              <span className="text-[10px] font-medium text-gray-400 dark:text-gray-500">
                {DAY_LABELS[i]}
              </span>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-300 ${
                isFuture
                  ? 'bg-gray-100 dark:bg-gray-700 text-gray-300 dark:text-gray-600'
                  : isToday && !d.hasData
                  ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-500 border-2 border-yellow-400 border-dashed'
                  : good
                  ? 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400'
                  : d.hasData
                  ? 'bg-red-100 dark:bg-red-900/40 text-red-500'
                  : isPast
                  ? 'bg-gray-200 dark:bg-gray-700 text-gray-400'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-300'
              }`}>
                {isFuture ? '·' : isToday && !d.hasData ? '?' : good ? '✓' : d.hasData ? '✗' : '–'}
              </div>
              {!isFuture && d.hasData && contribution > 0 && (
                <span className="text-[9px] text-gray-400 dark:text-gray-500">
                  +{contribution}
                </span>
              )}
            </div>
          );
        })}
      </div>

      {/* Summary message */}
      <div className={`rounded-xl px-4 py-2.5 text-sm font-medium ${
        ahead
          ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400'
          : 'bg-orange-50 dark:bg-orange-900/20 text-orange-700 dark:text-orange-400'
      }`}>
        {ahead
          ? gainMode
            ? `You're ${animatedBank} cal ahead on your surplus — great bulk progress!`
            : `You're ${animatedBank} cal ahead of schedule — you can afford a slightly bigger meal today!`
          : gainMode
          ? `${animatedBank} cal short on surplus — eat a bit more over the next ${7 - daysElapsed} days.`
          : `${animatedBank} cal behind schedule — tighten up the next ${7 - daysElapsed} days to stay on track.`}
      </div>
    </div>
  );
}
