import { Hono } from "npm:hono@4";
import { cors } from "npm:hono@4/cors";
import { logger } from "npm:hono@4/logger";
import * as kv from "./kv_store.tsx";

const app = new Hono();

// ─── CORS must be registered FIRST to handle OPTIONS preflight before anything else ──
app.use("/*", cors({
  origin: "*",
  allowHeaders: ["Content-Type", "Authorization"],
  allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  exposeHeaders: ["Content-Length"],
  maxAge: 600,
  credentials: false,
}));

// Explicit OPTIONS fallback in case the cors middleware needs extra help
app.options("/*", (c) => {
  return new Response(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
      "Access-Control-Max-Age": "600",
    },
  });
});

app.use("*", logger(console.log));

// Correct answer indices (0-based) for each of the 10 questions
const CORRECT_ANSWERS = [1, 2, 3, 1, 0, 1, 2, 1, 2, 1];
// Points by order of correct answer
const SCORE_BY_ORDER = [100, 70, 50, 30, 10];

function generateCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  return Array.from({ length: 6 }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
}

// ─── CREATE ROOM ──────────────────────────────────────────────────────────────
app.post("/make-server-e27c0db5/rooms", async (c) => {
  try {
    const { hostName, hostId } = await c.req.json();
    if (!hostName || !hostId) {
      return c.json({ error: "hostName and hostId are required" }, 400);
    }

    let code = generateCode();
    for (let i = 0; i < 10; i++) {
      const existing = await kv.get(`nq:room:${code}`);
      if (!existing) break;
      code = generateCode();
    }

    const room = { code, hostId, status: "waiting", createdAt: Date.now() };
    const host = { id: hostId, name: hostName, roomCode: code, score: 0, joinedAt: Date.now(), isHost: true };

    await kv.set(`nq:room:${code}`, JSON.stringify(room));
    await kv.set(`nq:player:${code}:${hostId}`, JSON.stringify(host));

    return c.json({ code, room, player: host });
  } catch (err) {
    console.log("Error creating room:", err);
    return c.json({ error: `Failed to create room: ${err}` }, 500);
  }
});

// ─── JOIN ROOM ────────────────────────────────────────────────────────────────
app.post("/make-server-e27c0db5/rooms/:code/join", async (c) => {
  try {
    const code = c.req.param("code").toUpperCase();
    const { playerName, playerId } = await c.req.json();

    const roomData = await kv.get(`nq:room:${code}`);
    if (!roomData) return c.json({ error: "Sala não encontrada. Verifique o código." }, 404);

    const room = JSON.parse(roomData);
    if (room.status !== "waiting") return c.json({ error: "O jogo já começou." }, 400);

    const existingPlayer = await kv.get(`nq:player:${code}:${playerId}`);
    const player = existingPlayer
      ? JSON.parse(existingPlayer)
      : { id: playerId, name: playerName, roomCode: code, score: 0, joinedAt: Date.now(), isHost: false };

    if (!existingPlayer) {
      await kv.set(`nq:player:${code}:${playerId}`, JSON.stringify(player));
    }

    const playerData = await kv.getByPrefix(`nq:player:${code}:`);
    const players = playerData.map((p: string) => JSON.parse(p));

    return c.json({ room, player, players });
  } catch (err) {
    console.log("Error joining room:", err);
    return c.json({ error: `Failed to join room: ${err}` }, 500);
  }
});

// ─── GET ROOM ─────────────────────────────────────────────────────────────────
app.get("/make-server-e27c0db5/rooms/:code", async (c) => {
  try {
    const code = c.req.param("code").toUpperCase();
    const roomData = await kv.get(`nq:room:${code}`);
    if (!roomData) return c.json({ error: "Room not found" }, 404);

    const room = JSON.parse(roomData);
    const playerData = await kv.getByPrefix(`nq:player:${code}:`);
    const players = playerData.map((p: string) => JSON.parse(p));

    return c.json({ room, players });
  } catch (err) {
    return c.json({ error: `Failed to get room: ${err}` }, 500);
  }
});

// ─── SUBMIT ANSWER ────────────────────────────────────────────────────────────
app.post("/make-server-e27c0db5/rooms/:code/answer", async (c) => {
  try {
    const code = c.req.param("code").toUpperCase();
    const { playerId, playerName, questionIndex, answerIndex } = await c.req.json();

    if (questionIndex < 0 || questionIndex >= CORRECT_ANSWERS.length) {
      return c.json({ error: "Invalid question index" }, 400);
    }

    const correctAnswer = CORRECT_ANSWERS[questionIndex];
    const isCorrect = answerIndex === correctAnswer;

    const answersKey = `nq:answers:${code}:${questionIndex}`;
    const existingData = await kv.get(answersKey);
    const answers = existingData ? JSON.parse(existingData) : [];

    if (answers.some((a: { playerId: string }) => a.playerId === playerId)) {
      return c.json({ error: "Already answered" }, 400);
    }

    const correctSoFar = answers.filter((a: { isCorrect: boolean }) => a.isCorrect).length;
    const pointsEarned = isCorrect
      ? SCORE_BY_ORDER[Math.min(correctSoFar, SCORE_BY_ORDER.length - 1)]
      : 0;

    answers.push({
      playerId,
      playerName,
      answerIndex,
      isCorrect,
      timestamp: Date.now(),
      pointsEarned,
      order: answers.length + 1,
    });
    await kv.set(answersKey, JSON.stringify(answers));

    const playerData = await kv.get(`nq:player:${code}:${playerId}`);
    if (playerData) {
      const player = JSON.parse(playerData);
      player.score += pointsEarned;
      await kv.set(`nq:player:${code}:${playerId}`, JSON.stringify(player));
    }

    return c.json({ isCorrect, pointsEarned, correctAnswer, answeredCount: answers.length });
  } catch (err) {
    console.log("Error submitting answer:", err);
    return c.json({ error: `Failed to submit answer: ${err}` }, 500);
  }
});

// ─── GET PLAYERS (with scores) ────────────────────────────────────────────────
app.get("/make-server-e27c0db5/rooms/:code/players", async (c) => {
  try {
    const code = c.req.param("code").toUpperCase();
    const playerData = await kv.getByPrefix(`nq:player:${code}:`);
    const players = playerData
      .map((p: string) => JSON.parse(p))
      .sort((a: { score: number }, b: { score: number }) => b.score - a.score);

    return c.json({ players });
  } catch (err) {
    return c.json({ error: `Failed to get players: ${err}` }, 500);
  }
});

// ─── HEALTH CHECK ─────────────────────────────────────────────────────────────
app.get("/make-server-e27c0db5/health", (c) => c.json({ status: "ok", ts: Date.now() }));

// Use explicit lambda to preserve Hono's `this` context in Deno.serve
Deno.serve((req) => app.fetch(req));
