'use client';

interface CalorieRingProps {
  consumed: number;
  burned: number;
  target: number;
}

export default function CalorieRing({ consumed, burned, target }: CalorieRingProps) {
  const net = consumed - burned;
  const percent = Math.min(100, Math.max(0, (net / target) * 100));
  const radius = 70;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (percent / 100) * circumference;

  const color = percent > 110 ? '#ef4444' : percent > 90 ? '#f59e0b' : '#10b981';
  const remaining = Math.max(0, target - net);

  return (
    <div className="flex flex-col items-center gap-3">
      <div className="relative w-44 h-44">
        <svg className="w-full h-full -rotate-90" viewBox="0 0 160 160">
          <circle cx="80" cy="80" r={radius} fill="none" stroke="currentColor" strokeWidth="14" className="text-gray-100 dark:text-gray-700" />
          <circle
            cx="80"
            cy="80"
            r={radius}
            fill="none"
            stroke={color}
            strokeWidth="14"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            strokeLinecap="round"
            style={{ transition: 'stroke-dashoffset 0.6s ease, stroke 0.3s ease' }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-3xl font-bold text-gray-800 dark:text-gray-100">{net}</span>
          <span className="text-xs text-gray-500 dark:text-gray-400">net kcal</span>
        </div>
      </div>
      <div className="grid grid-cols-3 gap-4 text-center text-sm">
        <div>
          <div className="font-semibold text-orange-500">{consumed}</div>
          <div className="text-gray-400 dark:text-gray-500 text-xs">eaten</div>
        </div>
        <div>
          <div className="font-semibold text-blue-500">{burned}</div>
          <div className="text-gray-400 dark:text-gray-500 text-xs">burned</div>
        </div>
        <div>
          <div className="font-semibold text-emerald-600">{remaining}</div>
          <div className="text-gray-400 dark:text-gray-500 text-xs">left</div>
        </div>
      </div>
    </div>
  );
}
