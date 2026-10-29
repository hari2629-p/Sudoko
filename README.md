# 🧩 Sudoku Web Game

A fully-featured, mobile-friendly Sudoku puzzle game built with **HTML, CSS, and JavaScript**.

Play randomly generated puzzles, track your time and errors, and enjoy features like difficulty settings, pencil mode, auto new game on completion, and persistent save state(ON WORK)!

---

## 🚀 Features

- 🎲 **Random Puzzle Generator**  
  New Sudoku puzzle every time with a unique solution.

- 🧠 **Difficulty Levels**  
  Choose from Easy, Medium, and Hard based on how many clues are hidden.

- ✏️ **Pencil Mode**  
  Optional mode for note-taking — mark possible numbers lightly.

- ⏱️ **Timer & Error Counter**  
  Track how long you take and how many mistakes you make.

- 🏆 **Fastest Completion Times**
  Save and view your best time for each difficulty. Games completed with a hint do not count.

- 💾 **Save Game Progress**  
  Automatically saves your inputs and continues where you left off even after refresh.

- 📱 **Mobile Responsive**  
  Optimized layout for phones and tablets.

- 🧱 **Clear 3×3 Box Outlines**  
  Thick borders for better visibility and gameplay comfort.

- 🌚 **Dark Mode Toggle**  
  Switch between Dark and Light Mode with ease.

- 🤯 **PWA!!**  
  Works Offline, anywhere, anytime using PWA
---

---

## 🛠️ How to Run

1. Clone or download the repository and install Node.js.
2. Run `npm install`.
3. Run `npm run dev` and open the local URL printed by Vite.

Local Sudoku games work without any configuration. To enable shared challenges,
follow the [Supabase setup](#shared-challenges-supabase-setup) below.

## Shared Challenges: Supabase Setup

The shared daily challenge, friend rooms, and leaderboards use the maintainer's
Supabase project. Contributors and deployments must use their own configured
project; this repository contains no project URL or credentials.

1. The repository maintainer creates a Supabase project and opens its SQL
   Editor.
2. Run [`supabase/schema.sql`](supabase/schema.sql) to create the challenge and
   attempt tables, row-level security policies, indexes, grants, and Realtime
   publication.
3. Copy the tracked [`.env.example`](.env.example) file to `.env.local`:
   ```powershell
   Copy-Item .env.example .env.local
   ```
   In `.env.local`, replace the example values with your project's **Project
   URL** and **anon/publishable key** from **Project Settings → API**:
   ```env
   VITE_SUPABASE_URL=https://YOUR_PROJECT_REF.supabase.co
   VITE_SUPABASE_ANON_KEY=YOUR_SUPABASE_ANON_KEY
   ```
   `.env.example` is a safe template intended to be committed to GitHub; never
   put real project values in it. `.env.local` is ignored by Git and should
   remain private. Never put a `service_role` or secret key in this browser app.
4. Run `npm run dev` to test locally. For a static deployment, run
   `npm run build` and publish the generated `dist/` directory. Set the same
   `VITE_` variables in the deployment's build environment.

The anon key is public in a browser build; RLS is therefore essential. The
included policies allow anyone to read challenges and completed scores, create
daily/friend challenge rows, and submit one score per case-insensitive guest
username per challenge. There is no account system. Scores are client-reported
and puzzles include their solution in the public challenge row so the existing
client-side game can validate moves; this is suitable for casual play, not
tamper-resistant competitive ranking. Do not store private data in these
tables. Supabase Realtime must be enabled for the project; the SQL adds
`challenge_attempts` to its publication so connected leaderboards update when
other players finish.

Daily puzzles are generated deterministically for the UTC date and persisted
once, so all players that day share the same board. Friend rooms store their
board when created; share the displayed six-character code. Only completed
attempts are submitted, and the leaderboard sorts by fastest time followed by
fewest mistakes. A guest username can submit only once per challenge; choose a
different name to play that challenge again.

When Supabase environment variables are absent, shared challenge controls
explain that setup is needed and the normal local game remains available.

---


## 👨‍💻 Built With

- HTML5  
- CSS3 (Responsive Design)  
- JavaScript (Vanilla)

---

## 🙌 Author

Made with ❤️ by [HGP]
