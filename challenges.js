import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
const statusElement = document.getElementById("challenge-status");
const leaderboardElement = document.getElementById("leaderboard");
const entriesElement = document.getElementById("leaderboard-entries");
const nameInput = document.getElementById("challenge-username");
const roomCodeInput = document.getElementById("room-code");
const challengeButtons = [
  document.getElementById("daily-challenge"),
  document.getElementById("create-room"),
  document.querySelector("#join-room-form button")
];

let supabase = null;
let activeChallenge = null;
let leaderboardChannel = null;

if (supabaseUrl && supabaseAnonKey) {
  try {
    supabase = createClient(supabaseUrl, supabaseAnonKey);
    statusElement.textContent = "Choose a challenge or create a room to get started.";
  } catch (error) {
    console.error("Supabase configuration is invalid:", error);
    statusElement.textContent = "Shared challenges could not start because the Supabase URL or anon key is invalid.";
  }
}

if (!supabase) {
  challengeButtons.forEach(button => { button.disabled = true; });
  if (!supabaseUrl || !supabaseAnonKey) {
    statusElement.textContent =
      "Shared challenges are unavailable until the maintainer configures Supabase. Local games still work.";
  }
}

nameInput.value = sessionStorage.getItem("sudokuGuestUsername") || "";
nameInput.addEventListener("change", () => {
  sessionStorage.setItem("sudokuGuestUsername", nameInput.value.trim());
});
roomCodeInput.addEventListener("input", () => {
  roomCodeInput.value = roomCodeInput.value.toUpperCase().replace(/[^A-Z0-9]/g, "");
});

document.getElementById("daily-challenge").addEventListener("click", async () => {
  await runAction(async () => {
    getUsername();
    const date = new Date().toISOString().slice(0, 10);
    const challenge = await getOrCreateDailyChallenge(date);
    await activateChallenge(challenge, `Daily Challenge · ${date} UTC`);
  });
});

document.getElementById("create-room").addEventListener("click", async () => {
  await runAction(async () => {
    const challenge = await createRoom();
    roomCodeInput.value = challenge.room_code;
    await activateChallenge(challenge, `Friend Room · ${challenge.room_code}`);
    setStatus(`Room created. Share code ${challenge.room_code} with friends.`);
  });
});

document.getElementById("join-room-form").addEventListener("submit", async event => {
  event.preventDefault();
  await runAction(async () => {
    getUsername();
    const code = roomCodeInput.value.trim().toUpperCase();
    if (!/^[A-Z0-9]{6}$/.test(code)) {
      throw new Error("Enter a valid 6-character room code.");
    }
    const { data, error } = await supabase
      .from("sudoku_challenges")
      .select("id, challenge_key, room_code, board, solution")
      .eq("room_code", code)
      .maybeSingle();
    if (error) throw error;
    if (!data) throw new Error("That room code was not found. Check the code and try again.");
    await activateChallenge(data, `Friend Room · ${code}`);
  });
});

document.getElementById("refresh-leaderboard").addEventListener("click", () => {
  void refreshLeaderboard();
});

function getUsername() {
  const username = nameInput.value.trim();
  if (!/^[A-Za-z0-9][A-Za-z0-9 _.-]{1,19}$/.test(username)) {
    throw new Error("Choose a 2–20 character username using letters, numbers, spaces, dots, hyphens, or underscores.");
  }
  sessionStorage.setItem("sudokuGuestUsername", username);
  return username;
}

async function runAction(action) {
  if (!supabase) {
    setStatus("Shared challenges are unavailable until the maintainer configures Supabase.");
    return;
  }
  setBusy(true);
  try {
    await action();
  } catch (error) {
    console.error("Challenge action failed:", error);
    setStatus(error.code === "23505"
      ? "That username already has a result in this challenge. Choose another username."
      : error.message || "Could not connect to Supabase. Check your connection and try again.");
  } finally {
    setBusy(false);
  }
}

async function getOrCreateDailyChallenge(date) {
  const key = `daily:${date}`;
  const existing = await findChallenge("challenge_key", key);
  if (existing) return existing;

  const { board, solution } = window.generateSeededPuzzle(key);
  try {
    const { data, error } = await supabase
      .from("sudoku_challenges")
      .insert({ challenge_key: key, board, solution })
      .select("id, challenge_key, room_code, board, solution")
      .single();
    if (error) throw error;
    return data;
  } catch (error) {
    if (error.code !== "23505") throw error;
    const racedChallenge = await findChallenge("challenge_key", key);
    if (!racedChallenge) throw error;
    return racedChallenge;
  }
}

async function findChallenge(column, value) {
  const { data, error } = await supabase
    .from("sudoku_challenges")
    .select("id, challenge_key, room_code, board, solution")
    .eq(column, value)
    .maybeSingle();
  if (error) throw error;
  return data;
}

async function createRoom() {
  getUsername();
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  for (let attempt = 0; attempt < 5; attempt++) {
    const randomBytes = crypto.getRandomValues(new Uint8Array(6));
    const code = Array.from(randomBytes, value => alphabet[value % alphabet.length]).join("");
    const { board, solution } = window.generatePuzzle();
    const { data, error } = await supabase
      .from("sudoku_challenges")
      .insert({ challenge_key: `room:${code}`, room_code: code, board, solution })
      .select("id, challenge_key, room_code, board, solution")
      .single();
    if (!error) return data;
    if (error.code !== "23505") throw error;
  }
  throw new Error("Could not reserve a unique room code. Please try again.");
}

async function activateChallenge(challenge, label) {
  const username = getUsername();
  activeChallenge = { id: challenge.id, label, username };
  leaderboardElement.hidden = false;
  document.getElementById("leaderboard-label").textContent = label;
  window.startSharedChallenge(challenge.board, challenge.solution, result => {
    void submitResult(result);
  });
  setStatus(`Playing ${label}. Your result is recorded when you finish.`);
  await refreshLeaderboard();
  subscribeToLeaderboard(challenge.id);
}

async function submitResult(result) {
  if (!activeChallenge) return;
  const { error } = await supabase.from("challenge_attempts").insert({
    challenge_id: activeChallenge.id,
    username: activeChallenge.username,
    elapsed_seconds: result.elapsedSeconds,
    mistakes: result.mistakes
  });
  if (error) {
    setStatus(error.code === "23505"
      ? "This username already has a result for this challenge. Use a different username next time."
      : "Puzzle completed, but the result could not be saved. Check your connection and refresh the leaderboard.");
    console.error("Could not save challenge result:", error);
    return;
  }
  setStatus("Your completed result was added to the leaderboard.");
  await refreshLeaderboard();
}

async function refreshLeaderboard() {
  if (!activeChallenge) return;
  const { data, error } = await supabase
    .from("challenge_attempts")
    .select("username, elapsed_seconds, mistakes")
    .eq("challenge_id", activeChallenge.id)
    .order("elapsed_seconds", { ascending: true })
    .order("mistakes", { ascending: true })
    .limit(50);
  if (error) {
    console.error("Could not load challenge leaderboard:", error);
    setStatus("Could not load the leaderboard. Check your connection and try again.");
    return;
  }

  entriesElement.replaceChildren();
  if (data.length === 0) {
    const empty = document.createElement("li");
    empty.className = "leaderboard-empty";
    empty.textContent = "No completed attempts yet. Be the first!";
    entriesElement.appendChild(empty);
    return;
  }
  data.forEach((entry, index) => {
    const item = document.createElement("li");
    const identity = document.createElement("span");
    const details = document.createElement("span");
    identity.textContent = `${index + 1}. ${entry.username}`;
    details.textContent = `${formatTime(entry.elapsed_seconds)} · ${entry.mistakes} ${entry.mistakes === 1 ? "mistake" : "mistakes"}`;
    item.append(identity, details);
    entriesElement.appendChild(item);
  });
}

function subscribeToLeaderboard(challengeId) {
  if (leaderboardChannel) void supabase.removeChannel(leaderboardChannel);
  leaderboardChannel = supabase
    .channel(`leaderboard-${challengeId}`)
    .on("postgres_changes", {
      event: "*",
      schema: "public",
      table: "challenge_attempts",
      filter: `challenge_id=eq.${challengeId}`
    }, () => { void refreshLeaderboard(); })
    .subscribe(status => {
      if (status === "CHANNEL_ERROR" || status === "TIMED_OUT") {
        setStatus("Live leaderboard updates are unavailable. Use Refresh to check for new results.");
      }
    });
}

function formatTime(seconds) {
  return `${String(Math.floor(seconds / 60)).padStart(2, "0")}:${String(seconds % 60).padStart(2, "0")}`;
}

function setBusy(isBusy) {
  challengeButtons.forEach(button => { button.disabled = isBusy || !supabase; });
  roomCodeInput.disabled = isBusy;
  nameInput.disabled = isBusy;
  document.getElementById("refresh-leaderboard").disabled = isBusy;
}

function setStatus(message) {
  statusElement.textContent = message;
}
