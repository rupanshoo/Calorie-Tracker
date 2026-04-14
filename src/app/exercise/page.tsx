'use client';

import { useEffect, useState } from 'react';
import { Trash2, Plus, Flame } from 'lucide-react';
import {
  getExerciseEntriesForDate,
  addExerciseEntry,
  deleteExerciseEntry,
  today,
  formatDate,
} from '@/lib/storage';
import { ExerciseEntry } from '@/lib/types';

const QUICK_EXERCISES = [
  { name: 'Walking (30 min)', calories: 130, duration: 30 },
  { name: 'Running (30 min)', calories: 280, duration: 30 },
  { name: 'Cycling (30 min)', calories: 250, duration: 30 },
  { name: 'Swimming (30 min)', calories: 230, duration: 30 },
  { name: 'Yoga (45 min)', calories: 135, duration: 45 },
  { name: 'Weight Training (45 min)', calories: 200, duration: 45 },
  { name: 'HIIT (20 min)', calories: 240, duration: 20 },
  { name: 'Badminton (45 min)', calories: 280, duration: 45 },
  { name: 'Cricket (60 min)', calories: 250, duration: 60 },
  { name: 'Football (60 min)', calories: 400, duration: 60 },
];

export default function ExercisePage() {
  const [entries, setEntries] = useState<ExerciseEntry[]>([]);
  const [description, setDescription] = useState('');
  const [calories, setCalories] = useState('');
  const [duration, setDuration] = useState('');
  const [mounted, setMounted] = useState(false);
  const [adding, setAdding] = useState(false);

  const load = () => setEntries(getExerciseEntriesForDate(today()));

  useEffect(() => {
    setMounted(true);
    load();
  }, []);

  const save = () => {
    if (!description || !calories) return;
    const entry: ExerciseEntry = {
      id: Date.now().toString(),
      date: today(),
      time: new Date().toTimeString().slice(0, 5),
      description,
      caloriesBurned: parseInt(calories),
      durationMinutes: parseInt(duration) || 0,
    };
    addExerciseEntry(entry);
    setDescription('');
    setCalories('');
    setDuration('');
    setAdding(false);
    load();
  };

  const addQuick = (q: typeof QUICK_EXERCISES[0]) => {
    const entry: ExerciseEntry = {
      id: Date.now().toString(),
      date: today(),
      time: new Date().toTimeString().slice(0, 5),
      description: q.name,
      caloriesBurned: q.calories,
      durationMinutes: q.duration,
    };
    addExerciseEntry(entry);
    load();
  };

  const remove = (id: string) => {
    deleteExerciseEntry(id);
    load();
  };

  const total = entries.reduce((s, e) => s + e.caloriesBurned, 0);

  if (!mounted) return null;

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100">Exercise</h1>
        <div className="text-sm text-gray-500 dark:text-gray-400">{formatDate(today())}</div>
      </div>

      {/* Total burned */}
      <div className="bg-gradient-to-r from-blue-500 to-indigo-500 rounded-2xl p-4 text-white flex justify-between items-center">
        <div>
          <div className="text-sm opacity-80">Burned Today</div>
          <div className="text-3xl font-bold flex items-center gap-2">
            <Flame size={24} />
            {total} kcal
          </div>
        </div>
        <div className="text-right text-sm opacity-80">
          {entries.reduce((s, e) => s + e.durationMinutes, 0)} min total
        </div>
      </div>

      {/* Quick add */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl p-5 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold text-gray-700 dark:text-gray-200">Quick Add</h2>
          <button
            onClick={() => setAdding(a => !a)}
            className="text-sm text-emerald-600 dark:text-emerald-400 flex items-center gap-1 font-medium"
          >
            <Plus size={14} />
            Custom
          </button>
        </div>

        <div className="grid grid-cols-1 gap-2">
          {QUICK_EXERCISES.map(q => (
            <button
              key={q.name}
              onClick={() => addQuick(q)}
              className="flex items-center justify-between text-left px-4 py-3 rounded-xl border border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
            >
              <span className="text-sm text-gray-700 dark:text-gray-300">{q.name}</span>
              <span className="text-sm font-semibold text-blue-500">{q.calories} kcal</span>
            </button>
          ))}
        </div>
      </div>

      {/* Custom exercise form */}
      {adding && (
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-5 shadow-sm space-y-3">
          <h2 className="font-semibold text-gray-700 dark:text-gray-200">Custom Exercise</h2>
          <input
            value={description}
            onChange={e => setDescription(e.target.value)}
            placeholder="Exercise description"
            className="w-full border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-300 dark:focus:ring-emerald-700"
          />
          <div className="grid grid-cols-2 gap-3">
            <input
              type="number"
              value={calories}
              onChange={e => setCalories(e.target.value)}
              placeholder="Calories burned"
              className="border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-300 dark:focus:ring-emerald-700"
            />
            <input
              type="number"
              value={duration}
              onChange={e => setDuration(e.target.value)}
              placeholder="Duration (min)"
              className="border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-300 dark:focus:ring-emerald-700"
            />
          </div>
          <div className="flex gap-3">
            <button
              onClick={save}
              disabled={!description || !calories}
              className="flex-1 bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 text-white rounded-xl py-3 text-sm font-semibold transition-colors"
            >
              Save
            </button>
            <button
              onClick={() => setAdding(false)}
              className="px-4 py-3 border border-gray-200 dark:border-gray-600 rounded-xl text-sm text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Log */}
      {entries.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm overflow-hidden">
          <div className="px-5 py-4 font-semibold text-gray-700 dark:text-gray-200 border-b border-gray-50 dark:border-gray-700">
            Today&apos;s Activity
          </div>
          <div className="divide-y divide-gray-50 dark:divide-gray-700">
            {entries.map(entry => (
              <div key={entry.id} className="flex items-center justify-between px-5 py-3">
                <div>
                  <div className="text-sm text-gray-700 dark:text-gray-300">{entry.description}</div>
                  <div className="text-xs text-gray-400 dark:text-gray-500">
                    {entry.time} · {entry.durationMinutes} min
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sm font-semibold text-blue-500">
                    -{entry.caloriesBurned} kcal
                  </span>
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
        </div>
      )}

      {entries.length === 0 && !adding && (
        <div className="text-center py-8 text-gray-400 dark:text-gray-500">
          <div className="text-4xl mb-3">🏃</div>
          <div className="font-medium">No activity logged today</div>
          <div className="text-sm mt-1">Pick an exercise above or add a custom one</div>
        </div>
      )}
    </div>
  );
}
