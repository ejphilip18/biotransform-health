# Daily Engagement & Progress Tracking

**Status:** Draft
**Last Updated:** 2026-02-15

---

## Overview

The daily engagement system is what keeps users coming back. It consists of three parts: daily check-ins (30-second mood/energy/sleep logging), a health score (composite metric), and progress tracking (longitudinal biomarker comparison across quarterly uploads). The dashboard ties these together into a daily hub that makes the user's health journey feel tangible.

### Goals

- Daily check-in under 30 seconds (minimal friction)
- Health score that feels meaningful and motivating
- Visual streak counter to build habit
- 90-day countdown to next recommended bloodwork
- Clear before/after when new bloodwork arrives
- Trend charts showing biomarker progression over time

### Non-Goals

- Detailed food logging (too much friction)
- Workout tracking with sets/reps (use a dedicated app)
- Wearable data integration (future)

---

## Core Types

### DailyCheckin

```typescript
interface DailyCheckin {
  _id: Id<"dailyCheckins">;
  userId: Id<"users">;
  date: string;               // ISO date "2026-02-15"
  sleepQuality: 1 | 2 | 3 | 4 | 5;
  sleepHours: number;         // 0-24
  energyLevel: 1 | 2 | 3 | 4 | 5;
  mood: 1 | 2 | 3 | 4 | 5;
  stressLevel: 1 | 2 | 3 | 4 | 5;
  supplementsTaken: boolean;  // did you take your supplements today?
  workoutCompleted: boolean;  // did you work out today?
  notes?: string;             // optional free text
  createdAt: number;
}
```

### HealthScore

```typescript
interface HealthScore {
  overall: number;            // 0-100
  biomarkerScore: number;     // 0-100 (60% weight)
  consistencyScore: number;   // 0-100 (25% weight)
  adherenceScore: number;     // 0-100 (15% weight)
  trend: "improving" | "stable" | "declining";
}
```

---

## Health Score Algorithm

```
overall = (biomarkerScore * 0.60) + (consistencyScore * 0.25) + (adherenceScore * 0.15)
```

### Biomarker Score (60% weight)

Based on the most recent bloodwork results:
- Count biomarkers in each status: optimal, normal, suboptimal, critical
- Score = (optimal * 100 + normal * 75 + suboptimal * 30 + critical * 0) / total_biomarkers
- If no bloodwork uploaded: score = 50 (neutral)

### Consistency Score (25% weight)

Based on check-in streak:
- 7+ consecutive days: 100
- 5-6 days: 85
- 3-4 days: 65
- 1-2 days: 40
- 0 days (missed today): 20
- Never checked in: 0

### Adherence Score (15% weight)

Based on last 7 days of check-ins:
- `supplementsTaken` true rate * 50 + `workoutCompleted` true rate * 50
- If no check-ins: 0

---

## Streak Calculation

A streak is consecutive days with a check-in entry. Calculated by:
1. Get all check-ins for the user sorted by date descending
2. Starting from today, count backwards while dates are consecutive
3. If today has no check-in, the streak is the count from yesterday backwards

Display: "🔥 12 day streak" or "Start your streak today!"

---

## 90-Day Countdown

Based on the most recent bloodwork upload date:
- `nextBloodworkDate = lastUploadDate + 90 days`
- Display as a circular progress ring with days remaining
- When within 7 days: "Time for your next blood test!"
- When overdue: "Your blood test is overdue by X days"
- If no upload exists: "Upload your first blood test to start tracking"

---

## Convex Functions

### Queries

| Function | Purpose | Auth |
| :--- | :--- | :--- |
| `checkins.getToday` | Get today's check-in (if exists) | Yes |
| `checkins.getStreak` | Calculate current streak length | Yes |
| `checkins.getHistory` | Get check-ins for date range | Yes |
| `checkins.getHealthScore` | Calculate composite health score | Yes |

### Mutations

| Function | Purpose | Auth |
| :--- | :--- | :--- |
| `checkins.submit` | Create or update today's check-in | Yes |

---

## Dashboard Widgets

### Health Score Ring
- Large circular gauge 0-100
- Color: green (80+), yellow (50-79), red (<50)
- Trend arrow (improving/stable/declining)
- Tap for breakdown

### Streak Counter
- Fire emoji + number
- "12 day streak" or "Start your streak!"
- Subtle animation on increment

### 90-Day Countdown
- Circular progress ring
- Days remaining
- "Time for bloodwork!" when due

### Biomarker Traffic Lights
- Top 5 biomarkers from last upload
- Green/yellow/red dots with biomarker name and value
- Tap to see full results

### Trend Sparklines
- Tiny line charts for key biomarkers showing change over time
- Only visible after 2+ uploads

### Quick Check-in Card
- If not checked in today: prominent card with "How are you feeling today?"
- If already checked in: "Checked in ✓" with summary

---

## Progress Page (`/progress`)

### Multi-Upload Comparison
- Dropdown to select 2+ uploads to compare
- Side-by-side biomarker table with delta arrows (↑↓→)
- Color-coded: green if improved toward optimal, red if moved away

### Biomarker Trend Charts
- Line chart (Recharts) per biomarker over time
- X-axis: upload dates, Y-axis: value
- Shaded bands for optimal range
- Hover for exact values

### Quarterly Timeline
- Visual timeline showing upload dates
- 90-day intervals marked
- Upcoming bloodwork date highlighted

---

## Design Decisions

### Why 1-5 scale instead of free numeric input?

**Context:** Could ask for exact sleep hours, subjective energy on 1-10, etc.

**Decision:** 1-5 scale for subjective measures is faster (tap one of 5 icons), reduces analysis paralysis, and is sufficient for trend detection. Sleep hours is the only numeric input. The goal is 30-second completion.

### Why not integrate with Apple Health / Google Fit?

**Context:** Could pull sleep, steps, heart rate data automatically.

**Decision:** Adds significant complexity (OAuth, API polling, data normalization) for marginal benefit at this stage. The manual check-in creates an intentional daily touchpoint which builds the habit loop. Wearable integration is a strong future feature.
