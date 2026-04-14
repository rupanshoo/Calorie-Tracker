# CalorieTracker

A personal calorie tracking web app with AI-powered food logging, progress charts, gamification, and a motivating dashboard. Built with Next.js and runs entirely in the browser — no account or backend required.

## Features

### Core Tracking
- **AI Food Logging** — Describe a meal in plain English ("2 rotis with dal and sabzi") and get an instant calorie estimate powered by Groq's `llama-3.1-8b-instant`. Tuned to handle Indian home-cooked food accurately.
- **Exercise Logging** — Log workouts with calories burned. Net calories update in real time.
- **Weight Logging** — Track weight over time with a history chart and goal progress bar.

### Dashboard
- **Bento Grid Layout** — Cards arranged in a jigsaw-style grid: streak, calorie ring, days-to-goal, quick-log buttons, motivational banner, weight goal progress, BMI, and more.
- **Calorie Ring** — Visual SVG ring showing calories eaten vs. target, with remaining/over-target indicator.
- **Streak Counter** — Consecutive days with food logged, with motivational copy.
- **Motivational Banner** — Context-aware message based on how close you are to your daily target. Works for both weight-loss and weight-gain goals.
- **Deficit / Surplus Bank** — Animated weekly bar showing cumulative calorie deficit or surplus across the week, with per-day breakdown.

### Gamification
- **Badges & Achievements** — 16 badges across 4 categories (Streak, Weight, On Target, Logging). Unearned badges are greyscale; earned ones are highlighted. Click any badge for a tooltip with description and earn date. Newly earned badges show a "NEW" bounce animation.
- **Weekly Challenge** — Pick a weekly goal (log every day, hit calorie target N days, exercise N times, or burn N calories). Tracks progress with a bar and a day-by-day dot tracker. Resets automatically each Monday.

### Progress Page
- **Weekly Digest** — Report card for last week: letter grade, average calories per day, days on target, days logged, weight change, and a 7-day bar chart. Shows a "NEW" badge on Mondays.
- **Weight Chart** — Line chart of weight over time with goal reference line.
- **Calorie Chart** — Bar chart of net calories for the last 30 days with target reference line.

### UX
- **Dark Mode** — Toggle between light and dark themes. Preference persists across sessions.
- **Works offline** — All data stored in `localStorage`. No login, no server, no data leaves your device.
- **Fully responsive** — Desktop bento grid collapses gracefully on mobile.

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16 (App Router) |
| Language | TypeScript |
| Styling | Tailwind CSS v4 |
| Charts | Recharts |
| Icons | Lucide React |
| AI | Groq API (`llama-3.1-8b-instant`) |
| Storage | Browser `localStorage` |

## Getting Started

### 1. Clone and install

```bash
git clone <your-repo-url>
cd CalorieTracker
npm install
```

### 2. Add your Groq API key

Create a `.env.local` file in the project root:

```
GROQ_API_KEY=your_groq_api_key_here
```

Get a free API key at [console.groq.com](https://console.groq.com). No billing required.

### 3. Run the dev server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### 4. First-time setup

On first launch you'll be taken to the Settings page. Enter your name, current weight, goal weight, height, age, gender, activity level, and goal date. The app calculates your BMR/TDEE using the Mifflin-St Jeor equation and sets a daily calorie target automatically.

## Project Structure

```
src/
  app/
    page.tsx                      # Dashboard (bento grid)
    progress/page.tsx             # Progress charts + badges
    food/page.tsx                 # Food log
    exercise/page.tsx             # Exercise log
    settings/page.tsx             # Profile setup
    api/estimate-calories/
      route.ts                    # Groq API route for AI calorie estimation
  components/
    CalorieRing.tsx               # SVG calorie ring
    DeficitBank.tsx               # Weekly deficit/surplus bar
    WeeklyDigest.tsx              # Last week's report card
    BadgeShelf.tsx                # Achievement badges
    WeeklyChallengeCard.tsx       # Weekly challenge picker + tracker
    Navigation.tsx                # Sidebar (desktop) / bottom bar (mobile)
    ThemeProvider.tsx             # Dark mode context
  lib/
    types.ts                      # TypeScript interfaces
    storage.ts                    # localStorage CRUD helpers
    calculations.ts               # BMR, TDEE, BMI, streak, progress
    badges.ts                     # Badge definitions + award logic
```

## Scripts

```bash
npm run dev     # Start development server
npm run build   # Production build
npm run start   # Start production server
npm run lint    # Run ESLint
```

## Data & Privacy

All data is stored locally in your browser's `localStorage`. Nothing is sent to any server except the text descriptions you type when logging food — those go to Groq for calorie estimation. Clearing your browser data will erase all tracked entries.
