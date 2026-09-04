# Compassed4Kids

A sibling of [Compassed](../NudgeNow), rebuilt around a smaller problem. Compassed
watches which of *your* goals have gone quiet. This one answers a question a
parent asks out loud every evening: **did the homework actually get done?**

A kid opens the family tablet, taps their face, and sees the three or four
things they owe today. Every tap lands on a parent's dashboard the moment it
happens, in another room, on another device, without anyone refreshing
anything.

```bash
npm install
cp .env.example .env   # then fill in your Supabase project URL + anon key
npm run dev
```

Run [`supabase/schema.sql`](supabase/schema.sql) once in your Supabase project's
SQL editor before first use. First run is empty, Settings → **Load a sample
family** fills it with two kids, eight activities, and three weeks of history
if you would rather see it working before typing anything in.

## Two apps, one dataset

The app has two faces, and which one you get is a mode, not a login.

**Kid mode** is everything a child sees. Pick your face, see your list, tap a
thing when you finish it. No navigation, no history, no percentages, no way to
reach the settings. The only text to read is an activity name and their own
name. Nothing on the screen is smaller than a thumb.

**The parent side** is behind the account password, and it is where activities
are set up, the week is reviewed, and the feed is read. It is sticky per device:
the kitchen tablet reopens into kid mode, your phone reopens into the dashboard.

A four-digit **parent PIN** (Settings) is asked for when leaving kid mode. It is
a speed bump to keep a younger sibling out of the settings, the account
password is the real boundary, and the PIN never pretends otherwise.

## How a parent finds out

Completions are written to Supabase and echoed back over Realtime, so a check-off
appears on every open dashboard within a moment of the tap. If the tab is in the
background and you have granted permission, it also raises a desktop
notification. Nothing is scheduled, queued, or emailed, there is no delivery
step to fail silently.

The **feed** is the notification history, and it is nothing but completion rows,
newest first. Nothing in it is generated on the parent's side, which is what
makes it worth trusting as a record of the week. Rows that arrived since you
last opened it are marked unread; opening the feed marks them read but keeps
this visit's highlights visible so you can see what was new.

## What it counts, and what it refuses to count

Each activity is set for **named weekdays**, homework on school days, Kumon
every day, reading every night. On a day you leave off, an activity never
appears and can never be "missed". Kumon on a Sunday is only late if Sunday was
one of the days you asked for.

Most things are a plain check-off, because the honest answer to "did it happen"
for a nine-year-old is yes or no. Two things families actually count get
numbers: minutes and worksheets (also pages, problems, chapters). When one of
those is tapped, the kid gets a single big stepper, pre-set to the target, so
the common case is one confirm.

**Partial credit is real credit.** A kid who read for twelve of their twenty
minutes did the thing: the checkbox is theirs and the streak survives. The
shortfall shows as a number next to it, not as a failure. A child learning that
the app calls them a liar is a worse outcome than a soft twenty minutes.

## Streaks that a bad Tuesday cannot wreck

A kid's streak counts consecutive days they finished **everything asked of
them**. Two rules keep it fair:

- **Today never breaks it.** An unfinished list at 4pm is a day in progress, not
  a failure. Only a finished day can end a streak.
- **Free days are neutral.** A Saturday with nothing scheduled neither builds
  the streak nor breaks it, it is skipped.

The same applies per activity, so weekends do not break a school-days-only
homework streak.

## The one list that reports an absence

Everything else in the app reports something that happened. **Still owed** is
the exception, and it is deliberately conservative:

- **Yesterday's** misses are settled facts and always appear.
- **Today's** appear only after an evening cutoff you choose (default 5pm).

Ask before then and the answer is "the day isn't over", which is both true and
the difference between a useful list and an app that nags at 3pm.

## Where the data lives

One Supabase account per family, held by a grown-up. Kids never sign in, they
pick their name on the kid screen, which is exactly why the parent side is what
carries the password.

Each kid, activity, and completion is one row with its object kept as-is in a
jsonb `data` column, so [`src/lib/model.js`](src/lib/model.js) stays the single
source of truth for shape and there is no parallel SQL schema drifting out of
sync. Row level security scopes every table to `auth.uid()`, including over
Realtime. Deleting a kid cascades to their activities and completions.

Settings → **Export backup** writes a portable JSON file; **Import** replaces
the account's data with it.

## Layout

```
src/
  lib/
    model.js      kid / activity / completion shapes, weekdays, measures
    stats.js      everything derived, status, streaks, feed, "still owed"
    date.js       local-day keys; nothing is ever bucketed by UTC
    db.js         Supabase reads, writes, and the Realtime subscription
    icons.jsx     avatar + activity icon sets, stored as short string ids
    sample.js     the demo family, seeded by name so it is reproducible
    storage.js    JSON backup export/import
  components/     Modal, KidCard, ActivityRow, DayDots, ProgressRing, editors…
  views/          ParentDashboard, KidDetail, FeedView, KidMode, SettingsView
  App.jsx         auth, state, mutations, and the two shells
  styles.css      design tokens + every class in the app
```

Only three things are ever stored: a kid, an activity, and a completion. Today's
status, every streak, the feed, and the "still owed" list are all read back out
of completion rows at render time. A parent can never be shown a "done" that no
kid produced.
