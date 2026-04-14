'use client';

import { useEffect, useState, useRef } from 'react';
import { Loader2, Trash2, Sparkles, ChevronDown, ChevronUp } from 'lucide-react';
import {
  getFoodEntriesForDate,
  addFoodEntry,
  deleteFoodEntry,
  today,
  formatDate,
} from '@/lib/storage';
import { FoodEntry } from '@/lib/types';

const MEALS = ['breakfast', 'lunch', 'dinner', 'snack'] as const;
type Meal = typeof MEALS[number];

const MEAL_COLORS: Record<Meal, string> = {
  breakfast: 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800 text-yellow-700 dark:text-yellow-400',
  lunch: 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800 text-green-700 dark:text-green-400',
  dinner: 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-400',
  snack: 'bg-purple-50 dark:bg-purple-900/20 border-purple-200 dark:border-purple-800 text-purple-700 dark:text-purple-400',
};

export default function FoodPage() {
  const [entries, setEntries] = useState<FoodEntry[]>([]);
  const [description, setDescription] = useState('');
  const [meal, setMeal] = useState<Meal>('lunch');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [preview, setPreview] = useState<{ calories: number; protein?: number; carbs?: number; fat?: number; notes?: string } | null>(null);
  const [expanded, setExpanded] = useState<Record<Meal, boolean>>({ breakfast: true, lunch: true, dinner: true, snack: true });
  const [mounted, setMounted] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const load = () => setEntries(getFoodEntriesForDate(today()));

  useEffect(() => {
    setMounted(true);
    load();
  }, []);

  const estimateCalories = async () => {
    if (!description.trim()) return;
    setLoading(true);
    setError('');
    setPreview(null);
    try {
      const res = await fetch('/api/estimate-calories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ description }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setPreview(data);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to estimate calories');
    } finally {
      setLoading(false);
    }
  };

  const saveEntry = () => {
    if (!preview) return;
    const entry: FoodEntry = {
      id: Date.now().toString(),
      date: today(),
      time: new Date().toTimeString().slice(0, 5),
      description,
      calories: preview.calories,
      protein: preview.protein,
      carbs: preview.carbs,
      fat: preview.fat,
      meal,
    };
    addFoodEntry(entry);
    setDescription('');
    setPreview(null);
    load();
    inputRef.current?.focus();
  };

  const remove = (id: string) => {
    deleteFoodEntry(id);
    load();
  };

  const total = entries.reduce((s, e) => s + e.calories, 0);
  const byMeal = (m: Meal) => entries.filter(e => e.meal === m);

  if (!mounted) return null;

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100">Food Log</h1>
        <div className="text-sm text-gray-500 dark:text-gray-400">{formatDate(today())}</div>
      </div>

      {/* AI Food Entry */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl p-5 shadow-sm space-y-4">
        <div className="flex items-center gap-2 text-sm font-semibold text-gray-700 dark:text-gray-200">
          <Sparkles size={16} className="text-emerald-500" />
          AI Calorie Estimator
        </div>
        <p className="text-xs text-gray-400 dark:text-gray-500">
          Describe what you ate in plain English — e.g. &quot;2 rotis with dal and a cup of chaas&quot;
        </p>

        <div className="space-y-3">
          <input
            ref={inputRef}
            value={description}
            onChange={e => setDescription(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && estimateCalories()}
            placeholder="What did you eat?"
            className="w-full border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-300 dark:focus:ring-emerald-700"
          />

          <div className="flex gap-2">
            {MEALS.map(m => (
              <button
                key={m}
                onClick={() => setMeal(m)}
                className={`capitalize text-xs px-3 py-1.5 rounded-full border font-medium transition-colors ${
                  meal === m
                    ? 'bg-emerald-500 text-white border-emerald-500'
                    : 'bg-gray-50 dark:bg-gray-700 text-gray-500 dark:text-gray-400 border-gray-200 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-600'
                }`}
              >
                {m}
              </button>
            ))}
          </div>

          <button
            onClick={estimateCalories}
            disabled={loading || !description.trim()}
            className="w-full bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl py-3 text-sm font-semibold flex items-center justify-center gap-2 transition-colors"
          >
            {loading ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />}
            {loading ? 'Estimating...' : 'Estimate Calories'}
          </button>
        </div>

        {error && <p className="text-red-500 text-sm bg-red-50 dark:bg-red-900/20 rounded-xl px-4 py-3">{error}</p>}

        {preview && (
          <div className="bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-xl p-4 space-y-3">
            <div>
              <div className="text-3xl font-bold text-emerald-700 dark:text-emerald-400">{preview.calories} kcal</div>
              {preview.notes && <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">{preview.notes}</div>}
            </div>
            {(preview.protein || preview.carbs || preview.fat) && (
              <div className="grid grid-cols-3 gap-2 text-center text-sm">
                <div className="bg-white dark:bg-gray-700 rounded-lg p-2">
                  <div className="font-bold text-red-500">{preview.protein}g</div>
                  <div className="text-xs text-gray-400 dark:text-gray-500">Protein</div>
                </div>
                <div className="bg-white dark:bg-gray-700 rounded-lg p-2">
                  <div className="font-bold text-yellow-500">{preview.carbs}g</div>
                  <div className="text-xs text-gray-400 dark:text-gray-500">Carbs</div>
                </div>
                <div className="bg-white dark:bg-gray-700 rounded-lg p-2">
                  <div className="font-bold text-blue-500">{preview.fat}g</div>
                  <div className="text-xs text-gray-400 dark:text-gray-500">Fat</div>
                </div>
              </div>
            )}
            <button
              onClick={saveEntry}
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl py-2.5 text-sm font-semibold transition-colors"
            >
              Save to Log
            </button>
          </div>
        )}
      </div>

      {/* Daily total */}
      <div className="bg-gradient-to-r from-orange-400 to-red-400 rounded-2xl p-4 text-white flex justify-between items-center">
        <div>
          <div className="text-sm opacity-80">Total Today</div>
          <div className="text-3xl font-bold">{total} kcal</div>
        </div>
        <div className="text-right text-sm opacity-80">
          {entries.length} item{entries.length !== 1 ? 's' : ''} logged
        </div>
      </div>

      {/* Meals breakdown */}
      {MEALS.map(m => {
        const mealEntries = byMeal(m);
        if (mealEntries.length === 0) return null;
        const mealTotal = mealEntries.reduce((s, e) => s + e.calories, 0);
        const isExpanded = expanded[m];

        return (
          <div key={m} className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm overflow-hidden">
            <button
              onClick={() => setExpanded(p => ({ ...p, [m]: !p[m] }))}
              className="w-full flex items-center justify-between px-5 py-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
            >
              <div className="flex items-center gap-2">
                <span className={`capitalize text-sm font-semibold px-2.5 py-1 rounded-full border ${MEAL_COLORS[m]}`}>
                  {m}
                </span>
                <span className="text-gray-500 dark:text-gray-400 text-sm">{mealTotal} kcal</span>
              </div>
              {isExpanded ? <ChevronUp size={16} className="text-gray-400" /> : <ChevronDown size={16} className="text-gray-400" />}
            </button>

            {isExpanded && (
              <div className="divide-y divide-gray-50 dark:divide-gray-700">
                {mealEntries.map(entry => (
                  <div key={entry.id} className="flex items-center justify-between px-5 py-3">
                    <div className="flex-1 min-w-0">
                      <div className="text-sm text-gray-700 dark:text-gray-300 truncate">{entry.description}</div>
                      <div className="text-xs text-gray-400 dark:text-gray-500">{entry.time}</div>
                    </div>
                    <div className="flex items-center gap-3 ml-3">
                      <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">{entry.calories} kcal</span>
                      <button
                        onClick={() => remove(entry.id)}
                        className="text-gray-300 dark:text-gray-600 hover:text-red-400 transition-colors"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      })}

      {entries.length === 0 && (
        <div className="text-center py-12 text-gray-400 dark:text-gray-500">
          <div className="text-4xl mb-3">🥗</div>
          <div className="font-medium">No food logged today</div>
          <div className="text-sm mt-1">Describe your meal above to get started</div>
        </div>
      )}
    </div>
  );
}
