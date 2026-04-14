'use client';

import { useEffect, useState } from 'react';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts';
import { Scale, Plus, TrendingDown } from 'lucide-react';
import WeeklyDigest from '@/components/WeeklyDigest';
import BadgeShelf from '@/components/BadgeShelf';
import {
  getProfile,
  getWeightEntries,
  getFoodEntries,
  getExerciseEntries,
  addWeightEntry,
  getLast30Days,
  today,
} from '@/lib/storage';
import { UserProfile, WeightEntry } from '@/lib/types';
import { daysUntilGoal, progressPercent } from '@/lib/calculations';

export default function ProgressPage() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [weightEntries, setWeightEntries] = useState<WeightEntry[]>([]);
  const [newWeight, setNewWeight] = useState('');
  const [mounted, setMounted] = useState(false);
  const [calData, setCalData] = useState<{ date: string; label: string; in: number; out: number; net: number }[]>([]);

  const load = () => {
    const p = getProfile();
    setProfile(p);
    setWeightEntries(getWeightEntries());

    if (p) {
      const days = getLast30Days();
      const food = getFoodEntries();
      const exercise = getExerciseEntries();
      const data = days.map(d => {
        const dayFood = food.filter(e => e.date === d);
        const dayEx = exercise.filter(e => e.date === d);
        const totalIn = dayFood.reduce((s, e) => s + e.calories, 0);
        const totalOut = dayEx.reduce((s, e) => s + e.caloriesBurned, 0);
        return {
          date: d,
          label: new Date(d + 'T00:00:00').toLocaleDateString('en-IN', { month: 'short', day: 'numeric' }),
          in: totalIn,
          out: totalOut,
          net: totalIn - totalOut,
        };
      }).filter(d => d.in > 0 || d.out > 0);
      setCalData(data);
    }
  };

  useEffect(() => {
    setMounted(true);
    load();
  }, []);

  const logWeight = () => {
    const w = parseFloat(newWeight);
    if (!w || w < 30 || w > 300) return;
    addWeightEntry({ id: Date.now().toString(), date: today(), weight: w });
    setNewWeight('');
    load();
  };

  if (!mounted || !profile) return null;

  const latestWeight = weightEntries.length > 0 ? weightEntries[weightEntries.length - 1].weight : profile.currentWeight;
  const progress = progressPercent(latestWeight, profile.currentWeight, profile.goalWeight);
  const daysLeft = daysUntilGoal(profile.goalDate);
  const lost = Math.max(0, profile.currentWeight - latestWeight);
  const toGo = Math.max(0, latestWeight - profile.goalWeight);

  const weightChartData = weightEntries.map(e => ({
    date: e.date,
    label: new Date(e.date + 'T00:00:00').toLocaleDateString('en-IN', { month: 'short', day: 'numeric' }),
    weight: e.weight,
  }));

  const daysLogged = calData.length;
  const avgCalories = daysLogged > 0 ? Math.round(calData.reduce((s, d) => s + d.net, 0) / daysLogged) : 0;
  const daysOnTarget = calData.filter(d => d.net <= profile.dailyCalorieTarget).length;

  return (
    <div className="space-y-5">
      <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100">Progress</h1>

      {/* Weekly Digest */}
      <WeeklyDigest profile={profile} />

      {/* Badges */}
      <BadgeShelf profile={profile} />

      {/* Goal summary */}
      <div className="bg-gradient-to-r from-emerald-500 to-teal-500 rounded-2xl p-5 text-white space-y-3">
        <div className="flex justify-between items-start">
          <div>
            <div className="text-sm opacity-80">Weight Goal</div>
            <div className="text-2xl font-bold mt-0.5">{profile.currentWeight}kg → {profile.goalWeight}kg</div>
          </div>
          <div className="text-right">
            <div className="text-sm opacity-80">Days Left</div>
            <div className="text-2xl font-bold">{daysLeft}</div>
          </div>
        </div>
        <div className="space-y-1.5">
          <div className="flex justify-between text-xs opacity-80">
            <span>{progress}% complete</span>
            <span>{lost.toFixed(1)}kg lost · {toGo.toFixed(1)}kg to go</span>
          </div>
          <div className="h-2.5 bg-white/20 rounded-full overflow-hidden">
            <div
              className="h-full bg-white rounded-full transition-all duration-700"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      </div>

      {/* Log weight */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl p-5 shadow-sm">
        <div className="flex items-center gap-2 font-semibold text-gray-700 dark:text-gray-200 mb-4">
          <Scale size={18} className="text-violet-500" />
          Log Today&apos;s Weight
        </div>
        <div className="flex gap-3">
          <input
            type="number"
            step="0.1"
            value={newWeight}
            onChange={e => setNewWeight(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && logWeight()}
            placeholder={`Current: ${latestWeight}kg`}
            className="flex-1 border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-300 dark:focus:ring-emerald-700"
          />
          <button
            onClick={logWeight}
            disabled={!newWeight}
            className="bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 text-white rounded-xl px-4 py-3 flex items-center gap-2 text-sm font-semibold transition-colors"
          >
            <Plus size={16} />
            Log
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 shadow-sm text-center">
          <TrendingDown size={18} className="text-emerald-500 mx-auto mb-1" />
          <div className="text-lg font-bold text-gray-800 dark:text-gray-100">{lost.toFixed(1)}kg</div>
          <div className="text-xs text-gray-400 dark:text-gray-500">Lost</div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 shadow-sm text-center">
          <div className="text-lg font-bold text-gray-800 dark:text-gray-100">{daysOnTarget}</div>
          <div className="text-xs text-gray-400 dark:text-gray-500">Days on Target</div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 shadow-sm text-center">
          <div className="text-lg font-bold text-gray-800 dark:text-gray-100">{avgCalories}</div>
          <div className="text-xs text-gray-400 dark:text-gray-500">Avg Net Cal</div>
        </div>
      </div>

      {/* Weight chart */}
      {weightChartData.length > 1 && (
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-5 shadow-sm">
          <h2 className="font-semibold text-gray-700 dark:text-gray-200 mb-4">Weight Over Time</h2>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={weightChartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.3} />
              <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#9ca3af' }} />
              <YAxis
                domain={[
                  Math.floor(Math.min(...weightChartData.map(d => d.weight)) - 1),
                  Math.ceil(Math.max(...weightChartData.map(d => d.weight)) + 1),
                ]}
                tick={{ fontSize: 11, fill: '#9ca3af' }}
              />
              <Tooltip
                contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151', borderRadius: '12px', color: '#f3f4f6' }}
                formatter={(val) => [`${val}kg`, 'Weight']}
              />
              <ReferenceLine y={profile.goalWeight} stroke="#10b981" strokeDasharray="4 4" label={{ value: 'Goal', position: 'right', fontSize: 11, fill: '#10b981' }} />
              <Line type="monotone" dataKey="weight" stroke="#8b5cf6" strokeWidth={2.5} dot={{ r: 4, fill: '#8b5cf6' }} activeDot={{ r: 6 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Calorie chart */}
      {calData.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-5 shadow-sm">
          <h2 className="font-semibold text-gray-700 dark:text-gray-200 mb-4">Net Calories (Last 30 Days)</h2>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={calData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.3} />
              <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#9ca3af' }} />
              <YAxis tick={{ fontSize: 11, fill: '#9ca3af' }} />
              <Tooltip
                contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151', borderRadius: '12px', color: '#f3f4f6' }}
                formatter={(val) => [`${val} kcal`, 'Net Calories']}
              />
              <ReferenceLine y={profile.dailyCalorieTarget} stroke="#10b981" strokeDasharray="4 4" label={{ value: 'Target', position: 'right', fontSize: 11, fill: '#10b981' }} />
              <Bar dataKey="net" radius={[4, 4, 0, 0]} fill="#6366f1" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {calData.length === 0 && weightChartData.length <= 1 && (
        <div className="text-center py-12 text-gray-400 dark:text-gray-500">
          <div className="text-4xl mb-3">📊</div>
          <div className="font-medium">No data yet</div>
          <div className="text-sm mt-1">Start logging food and weight to see your progress charts</div>
        </div>
      )}
    </div>
  );
}
