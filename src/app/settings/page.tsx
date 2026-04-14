'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Save, User, Target, Activity } from 'lucide-react';
import { getProfile, saveProfile } from '@/lib/storage';
import { suggestedCalorieTarget, calculateTDEE } from '@/lib/calculations';
import { UserProfile } from '@/lib/types';

const ACTIVITY_OPTIONS = [
  { value: 'sedentary', label: 'Sedentary', desc: 'Little or no exercise' },
  { value: 'light', label: 'Light', desc: '1–3 days/week' },
  { value: 'moderate', label: 'Moderate', desc: '3–5 days/week' },
  { value: 'active', label: 'Active', desc: '6–7 days/week' },
  { value: 'veryActive', label: 'Very Active', desc: 'Physical job or 2x/day' },
];

const DEFAULT_PROFILE: UserProfile = {
  name: '',
  currentWeight: 80,
  goalWeight: 75,
  height: 171,
  age: 30,
  gender: 'male',
  activityLevel: 'sedentary',
  goalDate: '2026-06-30',
  dailyCalorieTarget: 1650,
  setupComplete: false,
};

export default function SettingsPage() {
  const router = useRouter();
  const [form, setForm] = useState<UserProfile>(DEFAULT_PROFILE);
  const [saved, setSaved] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const p = getProfile();
    if (p) setForm(p);
  }, []);

  const update = (key: keyof UserProfile, value: string | number | boolean) => {
    setForm(prev => {
      const next = { ...prev, [key]: value };
      if (['currentWeight', 'goalWeight', 'height', 'age', 'gender', 'activityLevel', 'goalDate'].includes(key)) {
        next.dailyCalorieTarget = suggestedCalorieTarget(next);
      }
      return next;
    });
  };

  const save = () => {
    const profile: UserProfile = { ...form, setupComplete: true };
    saveProfile(profile);
    setSaved(true);
    setTimeout(() => {
      setSaved(false);
      router.push('/');
    }, 1500);
  };

  if (!mounted) return null;

  const tdee = calculateTDEE(form);

  return (
    <div className="space-y-5">
      <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100">
        {form.setupComplete ? 'Settings' : 'Welcome! Set Up Your Profile'}
      </h1>

      {!form.setupComplete && (
        <div className="bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-2xl p-4 text-emerald-700 dark:text-emerald-400 text-sm">
          Let&apos;s set up your profile to personalise your calorie targets. Your data stays on your device.
        </div>
      )}

      {/* Personal Info */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl p-5 shadow-sm space-y-4">
        <div className="flex items-center gap-2 font-semibold text-gray-700 dark:text-gray-200">
          <User size={18} className="text-emerald-500" />
          Personal Info
        </div>

        <div className="space-y-3">
          <div>
            <label className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">Your Name</label>
            <input
              value={form.name}
              onChange={e => update('name', e.target.value)}
              placeholder="e.g. Rishi"
              className="mt-1 w-full border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-300 dark:focus:ring-emerald-700"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">Age</label>
              <input
                type="number"
                value={form.age}
                onChange={e => update('age', parseInt(e.target.value))}
                className="mt-1 w-full border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-300 dark:focus:ring-emerald-700"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">Gender</label>
              <select
                value={form.gender}
                onChange={e => update('gender', e.target.value as 'male' | 'female')}
                className="mt-1 w-full border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-300 dark:focus:ring-emerald-700"
              >
                <option value="male">Male</option>
                <option value="female">Female</option>
              </select>
            </div>
          </div>

          <div>
            <label className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">Height (cm)</label>
            <input
              type="number"
              value={form.height}
              onChange={e => update('height', parseInt(e.target.value))}
              className="mt-1 w-full border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-300 dark:focus:ring-emerald-700"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">Current Weight (kg)</label>
              <input
                type="number"
                step="0.1"
                value={form.currentWeight}
                onChange={e => update('currentWeight', parseFloat(e.target.value))}
                className="mt-1 w-full border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-300 dark:focus:ring-emerald-700"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">Goal Weight (kg)</label>
              <input
                type="number"
                step="0.1"
                value={form.goalWeight}
                onChange={e => update('goalWeight', parseFloat(e.target.value))}
                className="mt-1 w-full border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-300 dark:focus:ring-emerald-700"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Goal */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl p-5 shadow-sm space-y-4">
        <div className="flex items-center gap-2 font-semibold text-gray-700 dark:text-gray-200">
          <Target size={18} className="text-orange-500" />
          Goal & Timeline
        </div>
        <div>
          <label className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">Target Date</label>
          <input
            type="date"
            value={form.goalDate}
            onChange={e => update('goalDate', e.target.value)}
            min={new Date().toISOString().split('T')[0]}
            className="mt-1 w-full border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-300 dark:focus:ring-emerald-700"
          />
        </div>
      </div>

      {/* Activity */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl p-5 shadow-sm space-y-4">
        <div className="flex items-center gap-2 font-semibold text-gray-700 dark:text-gray-200">
          <Activity size={18} className="text-blue-500" />
          Activity Level
        </div>
        <div className="space-y-2">
          {ACTIVITY_OPTIONS.map(opt => (
            <button
              key={opt.value}
              onClick={() => update('activityLevel', opt.value as UserProfile['activityLevel'])}
              className={`w-full text-left flex items-center justify-between px-4 py-3 rounded-xl border transition-colors ${
                form.activityLevel === opt.value
                  ? 'border-emerald-400 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400'
                  : 'border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700/50'
              }`}
            >
              <span className="font-medium text-sm">{opt.label}</span>
              <span className="text-xs text-gray-400 dark:text-gray-500">{opt.desc}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Calorie target summary */}
      <div className="bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600 rounded-2xl p-5 space-y-3">
        <div className="font-semibold text-gray-700 dark:text-gray-200 text-sm">Your Calculated Targets</div>
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-3 text-center">
            <div className="text-xl font-bold text-gray-800 dark:text-gray-100">{tdee}</div>
            <div className="text-xs text-gray-400 dark:text-gray-500">Maintenance calories/day</div>
          </div>
          <div className="bg-emerald-50 dark:bg-emerald-900/20 rounded-xl p-3 text-center">
            <div className="text-xl font-bold text-emerald-700 dark:text-emerald-400">{form.dailyCalorieTarget}</div>
            <div className="text-xs text-gray-400 dark:text-gray-500">Your daily target</div>
          </div>
        </div>
        <div>
          <label className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
            Daily Calorie Target (editable)
          </label>
          <input
            type="number"
            value={form.dailyCalorieTarget}
            onChange={e => setForm(prev => ({ ...prev, dailyCalorieTarget: parseInt(e.target.value) }))}
            className="mt-1 w-full border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-300 dark:focus:ring-emerald-700"
          />
        </div>
        <p className="text-xs text-gray-400 dark:text-gray-500">
          A deficit of {tdee - form.dailyCalorieTarget} kcal/day will help you reach your goal.
        </p>
      </div>

      {/* Save */}
      <button
        onClick={save}
        disabled={!form.name}
        className={`w-full py-4 rounded-2xl text-base font-bold flex items-center justify-center gap-2 transition-all ${
          saved
            ? 'bg-green-500 text-white'
            : 'bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 text-white'
        }`}
      >
        <Save size={18} />
        {saved ? 'Saved! Redirecting...' : 'Save Profile'}
      </button>
    </div>
  );
}
