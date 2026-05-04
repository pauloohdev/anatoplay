import React, {
  createContext,
  useContext,
  useReducer,
  useRef,
  useCallback,
  useEffect,
} from "react";
import { RealtimeChannel } from "@supabase/supabase-js";
import { supabase } from "../../lib/supabase";
import { questions, TOTAL_QUESTIONS } from "../data/questions";

// ─── Scoring ──────────────────────────────────────────────────────────────────
const SCORE_BY_ORDER = [100, 70, 50, 30, 10];
const QUESTION_TIMER_MS = 20_000; // 20 seconds per question

function generateRoomCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  return Array.from({ length: 6 }, () =>
    chars[Math.floor(Math.random() * chars.length)]
  ).join("");
}

// ─── Types ───────────────────────────────────────────────────────────────────

export interface PlayerScore {
  id: string;
  name: string;
  score: number;
  isHost: boolean;
}

export type GameStatus =
  | "idle"
  | "lobby"
  | "question"
  | "answer"
  | "ranking"
  | "finished";

export interface GameState {
  playerId: string;
  playerName: string;
  isHost: boolean;
  roomCode: string;
  gameStatus: GameStatus;
  currentQuestionIndex: number;
  questionStartTime: number;
  selectedAnswer: number | null;
  hasAnswered: boolean;
  isCorrect: boolean | null;
  pointsEarned: number;
  players: PlayerScore[];
  answeredCount: number;
  totalQuestions: number;  // configured per room
  error: string | null;
  isLoading: boolean;
}

type GameAction =
  | {
      type: "SET_IDENTITY";
      payload: {
        id: string;
        name: string;
        isHost: boolean;
        roomCode: string;
      };
    }
  | { type: "SET_STATUS"; payload: GameStatus }
  | {
      type: "QUESTION_START";
      payload: { questionIndex: number; startTime: number; totalQuestions: number };
    }
  | {
      type: "ANSWER_SUBMITTED";
      payload: {
        isCorrect: boolean;
        pointsEarned: number;
        selectedAnswer: number;
      };
    }
  | { type: "PLAYER_ANSWERED"; payload: { count: number } }
  | { type: "UPDATE_PLAYERS"; payload: PlayerScore[] }
  | { type: "SET_ERROR"; payload: string | null }
  | { type: "SET_LOADING"; payload: boolean }
  | { type: "SET_TOTAL_QUESTIONS"; payload: number }
  | { type: "RESET" };

// ─── Broadcast event types ────────────────────────────────────────────────────
// All game logic runs via Supabase Realtime Broadcast — no HTTP/Edge Function calls.

interface PendingAnswer {
  playerId: string;
  playerName: string;
  answerIndex: number;
  timestamp: number;
  isCorrect: boolean;
}

type BroadcastEvent =
  | { type: "QUESTION_START"; questionIndex: number; startTime: number; totalQuestions: number }
  | {
      type: "PLAYER_ANSWER";
      playerId: string;
      playerName: string;
      answerIndex: number;
      timestamp: number;
    }
  | {
      type: "SHOW_ANSWER";
      correctAnswer: number;
      results: Record<string, { isCorrect: boolean; pointsEarned: number }>;
    }
  | { type: "SHOW_RANKING"; players: PlayerScore[] }
  | { type: "GAME_END"; players: PlayerScore[] };

// ─── Reducer ─────────────────────────────────────────────────────────────────

const initialState: GameState = {
  playerId: "",
  playerName: "",
  isHost: false,
  roomCode: "",
  gameStatus: "idle",
  currentQuestionIndex: 0,
  questionStartTime: 0,
  selectedAnswer: null,
  hasAnswered: false,
  isCorrect: null,
  pointsEarned: 0,
  players: [],
  answeredCount: 0,
  totalQuestions: TOTAL_QUESTIONS,
  error: null,
  isLoading: false,
};

function reducer(state: GameState, action: GameAction): GameState {
  switch (action.type) {
    case "SET_IDENTITY":
      return {
        ...state,
        playerId: action.payload.id,
        playerName: action.payload.name,
        isHost: action.payload.isHost,
        roomCode: action.payload.roomCode,
      };
    case "SET_STATUS":
      return { ...state, gameStatus: action.payload };
    case "QUESTION_START":
      return {
        ...state,
        gameStatus: "question",
        currentQuestionIndex: action.payload.questionIndex,
        questionStartTime: action.payload.startTime,
        totalQuestions: action.payload.totalQuestions,
        selectedAnswer: null,
        hasAnswered: false,
        isCorrect: null,
        pointsEarned: 0,
        answeredCount: 0,
      };
    case "ANSWER_SUBMITTED":
      return {
        ...state,
        hasAnswered: true,
        selectedAnswer: action.payload.selectedAnswer,
        isCorrect: action.payload.isCorrect,
        pointsEarned: action.payload.pointsEarned,
      };
    case "PLAYER_ANSWERED":
      return { ...state, answeredCount: action.payload.count };
    case "UPDATE_PLAYERS":
      return { ...state, players: action.payload };
    case "SET_ERROR":
      return { ...state, error: action.payload };
    case "SET_LOADING":
      return { ...state, isLoading: action.payload };
    case "SET_TOTAL_QUESTIONS":
      return { ...state, totalQuestions: action.payload };
    case "RESET":
      return { ...initialState };
    default:
      return state;
  }
}

// ─── Context ─────────────────────────────────────────────────────────────────

interface GameContextType {
  state: GameState;
  createRoom: (name: string, questionCount?: number) => Promise<string>;
  joinRoom: (name: string, code: string) => Promise<void>;
  startGame: () => void;
  submitAnswer: (answerIndex: number) => Promise<void>;
  leaveGame: () => void;
}

const GameContext = createContext<GameContextType | null>(null);

export function useGame() {
  const ctx = useContext(GameContext);
  if (!ctx) throw new Error("useGame must be used inside GameProvider");
  return ctx;
}

// ─── Provider ─────────────────────────────────────────────────────────────────

export function GameProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(reducer, initialState);

  const channelRef = useRef<RealtimeChannel | null>(null);
  const stateRef = useRef(state);
  stateRef.current = state;

  const hostTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ── Host-only answer tracking refs ──────────────────────────────────────
  const pendingAnswersRef = useRef<PendingAnswer[]>([]);
  // Host-authoritative player scores Map<playerId, PlayerScore>
  const playerScoresRef = useRef<Map<string, PlayerScore>>(new Map());
  // Per-question answered counter for non-host clients
  const localAnsweredCountRef = useRef(0);
  // Host's configured question count for this room
  const roomTotalQuestionsRef = useRef<number>(TOTAL_QUESTIONS);

  const clearHostTimer = () => {
    if (hostTimerRef.current) {
      clearTimeout(hostTimerRef.current);
      hostTimerRef.current = null;
    }
  };

  // ─── Broadcast helper ─────────────────────────────────────────────────────

  const broadcast = useCallback((event: BroadcastEvent) => {
    channelRef.current?.send({
      type: "broadcast",
      event: "GAME_EVENT",
      payload: event,
    });
  }, []);

  // ─── Host: finalize round & broadcast SHOW_ANSWER ─────────────────────────

  const finalizeRound = useCallback(() => {
    const qIndex = stateRef.current.currentQuestionIndex;
    const correctAnswer = questions[qIndex].correct;
    const answers = pendingAnswersRef.current;

    // Sort correct answers by timestamp (first correct = highest points)
    const correctInOrder = answers
      .filter((a) => a.isCorrect)
      .sort((a, b) => a.timestamp - b.timestamp);

    const results: Record<
      string,
      { isCorrect: boolean; pointsEarned: number }
    > = {};

    for (const answer of answers) {
      const orderIdx = correctInOrder.findIndex(
        (a) => a.playerId === answer.playerId
      );
      const pts = answer.isCorrect
        ? SCORE_BY_ORDER[Math.min(orderIdx, SCORE_BY_ORDER.length - 1)]
        : 0;

      results[answer.playerId] = { isCorrect: answer.isCorrect, pointsEarned: pts };

      // Accumulate score in host-side map
      const existing = playerScoresRef.current.get(answer.playerId);
      if (existing) {
        playerScoresRef.current.set(answer.playerId, {
          ...existing,
          score: existing.score + pts,
        });
      } else {
        // Player appeared mid-game
        playerScoresRef.current.set(answer.playerId, {
          id: answer.playerId,
          name: answer.playerName,
          score: pts,
          isHost: false,
        });
      }
    }

    broadcast({ type: "SHOW_ANSWER", correctAnswer, results });
  }, [broadcast]);

  // Keep a ref so the closure in handleBroadcastEvent is always fresh
  const finalizeRoundRef = useRef(finalizeRound);
  finalizeRoundRef.current = finalizeRound;

  // ─── Handle incoming Broadcast events ─────────────────────────────────────

  const handleBroadcastEvent = useCallback(
    (event: BroadcastEvent) => {
      const s = stateRef.current;

      switch (event.type) {
        // ── New question ────────────────────────────────────────────────────
        case "QUESTION_START": {
          clearHostTimer();
          localAnsweredCountRef.current = 0;

          if (s.isHost) {
            pendingAnswersRef.current = []; // reset for this question
          }

          dispatch({
            type: "QUESTION_START",
            payload: {
              questionIndex: event.questionIndex,
              startTime: event.startTime,
              totalQuestions: event.totalQuestions,
            },
          });

          // Host auto-advances when timer expires
          if (s.isHost) {
            const elapsed = Date.now() - event.startTime;
            const remaining = Math.max(QUESTION_TIMER_MS - elapsed, 500);
            hostTimerRef.current = setTimeout(() => {
              finalizeRoundRef.current();
            }, remaining);
          }
          break;
        }

        // ── Player submitted an answer ──────────────────────────────────────
        case "PLAYER_ANSWER": {
          if (s.isHost) {
            // Deduplicate
            const already = pendingAnswersRef.current.some(
              (a) => a.playerId === event.playerId
            );
            if (already) break;

            const isCorrect =
              event.answerIndex ===
              questions[stateRef.current.currentQuestionIndex].correct;

            pendingAnswersRef.current.push({
              playerId: event.playerId,
              playerName: event.playerName,
              answerIndex: event.answerIndex,
              timestamp: event.timestamp,
              isCorrect,
            });

            dispatch({
              type: "PLAYER_ANSWERED",
              payload: { count: pendingAnswersRef.current.length },
            });

            // If all players answered → finalize early
            const total = stateRef.current.players.length;
            if (
              total > 0 &&
              pendingAnswersRef.current.length >= total
            ) {
              clearHostTimer();
              setTimeout(() => finalizeRoundRef.current(), 800);
            }
          } else {
            // Non-host: track approximate count
            localAnsweredCountRef.current += 1;
            dispatch({
              type: "PLAYER_ANSWERED",
              payload: { count: localAnsweredCountRef.current },
            });
          }
          break;
        }

        // ── Host reveals correct answer + per-player results ────────────────
        case "SHOW_ANSWER": {
          clearHostTimer();

          // Update my own result if I answered
          const myResult = event.results[s.playerId];
          if (myResult && s.hasAnswered) {
            dispatch({
              type: "ANSWER_SUBMITTED",
              payload: {
                isCorrect: myResult.isCorrect,
                pointsEarned: myResult.pointsEarned,
                selectedAnswer: s.selectedAnswer ?? -1,
              },
            });
          }

          dispatch({ type: "SET_STATUS", payload: "answer" });

          // Host: after 6s → broadcast rankings
          if (s.isHost) {
            hostTimerRef.current = setTimeout(() => {
              const players = Array.from(playerScoresRef.current.values()).sort(
                (a, b) => b.score - a.score
              );
              broadcast({ type: "SHOW_RANKING", players });
            }, 6_000);
          }
          break;
        }

        // ── Rankings screen ─────────────────────────────────────────────────
        case "SHOW_RANKING": {
          clearHostTimer();
          dispatch({ type: "UPDATE_PLAYERS", payload: event.players });
          dispatch({ type: "SET_STATUS", payload: "ranking" });

          // Host: advance to next question or end game after 5s
          if (s.isHost) {
            hostTimerRef.current = setTimeout(() => {
              const nextIndex = stateRef.current.currentQuestionIndex + 1;
              pendingAnswersRef.current = [];
              localAnsweredCountRef.current = 0;

              if (nextIndex >= roomTotalQuestionsRef.current) {
                const players = Array.from(
                  playerScoresRef.current.values()
                ).sort((a, b) => b.score - a.score);
                broadcast({ type: "GAME_END", players });
              } else {
                broadcast({
                  type: "QUESTION_START",
                  questionIndex: nextIndex,
                  startTime: Date.now(),
                  totalQuestions: roomTotalQuestionsRef.current,
                });
              }
            }, 5_000);
          }
          break;
        }

        // ── Game over ───────────────────────────────────────────────────────
        case "GAME_END": {
          clearHostTimer();
          dispatch({ type: "UPDATE_PLAYERS", payload: event.players });
          dispatch({ type: "SET_STATUS", payload: "finished" });
          break;
        }
      }
    },
    [broadcast]
  );

  // Always-fresh ref so setupChannel never goes stale
  const handleBroadcastEventRef = useRef(handleBroadcastEvent);
  handleBroadcastEventRef.current = handleBroadcastEvent;

  // ─── Setup Supabase Realtime channel ──────────────────────────────────────

  const setupChannel = useCallback(
    (
      roomCode: string,
      playerId: string,
      playerName: string,
      isHost: boolean
    ) => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }

      const channel = supabase.channel(`nq:game:${roomCode}`, {
        config: {
          broadcast: { self: true }, // sender also receives own broadcasts
          presence: { key: playerId },
        },
      });

      // Broadcast: game events
      channel.on("broadcast", { event: "GAME_EVENT" }, ({ payload }) => {
        handleBroadcastEventRef.current(payload as BroadcastEvent);
      });

      // Presence: track who's online + their names
      channel.on("presence", { event: "sync" }, () => {
        const presenceState = channel.presenceState<{
          name: string;
          isHost: boolean;
        }>();

        const onlinePlayers: PlayerScore[] = Object.entries(presenceState).flatMap(
          ([key, presences]) =>
            presences.map((p) => ({
              id: key,
              name: p.name,
              isHost: p.isHost,
              // Preserve accumulated score from host map or local state
              score:
                playerScoresRef.current.get(key)?.score ??
                stateRef.current.players.find((pl) => pl.id === key)?.score ??
                0,
            }))
        );

        dispatch({ type: "UPDATE_PLAYERS", payload: onlinePlayers });

        // Host: register new joiners in score map
        if (isHost) {
          for (const p of onlinePlayers) {
            if (!playerScoresRef.current.has(p.id)) {
              playerScoresRef.current.set(p.id, { ...p, score: 0 });
            }
          }
        }
      });

      channel.subscribe(async (status) => {
        if (status === "SUBSCRIBED") {
          await channel.track({ name: playerName, isHost });
        }
      });

      channelRef.current = channel;
    },
    [] // uses only refs — no state deps needed
  );

  // ─── Public actions ───────────────────────────────────────────────────────

  const createRoom = useCallback(
    async (name: string, questionCount: number = TOTAL_QUESTIONS): Promise<string> => {
      dispatch({ type: "SET_LOADING", payload: true });
      dispatch({ type: "SET_ERROR", payload: null });

      try {
        const playerId = crypto.randomUUID();
        const code = generateRoomCode();

        // Store configured question count for this room
        roomTotalQuestionsRef.current = Math.min(questionCount, TOTAL_QUESTIONS);

        // Initialize host score tracking
        playerScoresRef.current = new Map([
          [playerId, { id: playerId, name, isHost: true, score: 0 }],
        ]);
        pendingAnswersRef.current = [];
        localAnsweredCountRef.current = 0;

        dispatch({
          type: "SET_IDENTITY",
          payload: { id: playerId, name, isHost: true, roomCode: code },
        });
        dispatch({ type: "SET_TOTAL_QUESTIONS", payload: roomTotalQuestionsRef.current });
        dispatch({
          type: "UPDATE_PLAYERS",
          payload: [{ id: playerId, name, isHost: true, score: 0 }],
        });
        dispatch({ type: "SET_STATUS", payload: "lobby" });

        setupChannel(code, playerId, name, true);
        return code;
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Erro ao criar sala";
        dispatch({ type: "SET_ERROR", payload: msg });
        throw err;
      } finally {
        dispatch({ type: "SET_LOADING", payload: false });
      }
    },
    [setupChannel]
  );

  const joinRoom = useCallback(
    async (name: string, code: string): Promise<void> => {
      dispatch({ type: "SET_LOADING", payload: true });
      dispatch({ type: "SET_ERROR", payload: null });

      try {
        const playerId = crypto.randomUUID();
        const upperCode = code.toUpperCase().trim();

        localAnsweredCountRef.current = 0;

        dispatch({
          type: "SET_IDENTITY",
          payload: { id: playerId, name, isHost: false, roomCode: upperCode },
        });
        dispatch({ type: "SET_STATUS", payload: "lobby" });

        setupChannel(upperCode, playerId, name, false);
      } catch (err) {
        const msg =
          err instanceof Error ? err.message : "Erro ao entrar na sala";
        dispatch({ type: "SET_ERROR", payload: msg });
        throw err;
      } finally {
        dispatch({ type: "SET_LOADING", payload: false });
      }
    },
    [setupChannel]
  );

  const startGame = useCallback(() => {
    if (!stateRef.current.isHost) return;
    pendingAnswersRef.current = [];
    localAnsweredCountRef.current = 0;
    broadcast({
      type: "QUESTION_START",
      questionIndex: 0,
      startTime: Date.now(),
      totalQuestions: roomTotalQuestionsRef.current,
    });
  }, [broadcast]);

  const submitAnswer = useCallback(
    async (answerIndex: number): Promise<void> => {
      const s = stateRef.current;
      if (s.hasAnswered) return;

      const isCorrect = answerIndex === questions[s.currentQuestionIndex].correct;

      // Optimistic update — real points come from SHOW_ANSWER
      dispatch({
        type: "ANSWER_SUBMITTED",
        payload: { isCorrect, pointsEarned: 0, selectedAnswer: answerIndex },
      });

      // Broadcast answer to host (and all clients via self:true)
      broadcast({
        type: "PLAYER_ANSWER",
        playerId: s.playerId,
        playerName: s.playerName,
        answerIndex,
        timestamp: Date.now(),
      });
    },
    [broadcast]
  );

  const leaveGame = useCallback(() => {
    clearHostTimer();
    pendingAnswersRef.current = [];
    playerScoresRef.current = new Map();
    localAnsweredCountRef.current = 0;
    if (channelRef.current) {
      supabase.removeChannel(channelRef.current);
      channelRef.current = null;
    }
    dispatch({ type: "RESET" });
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      clearHostTimer();
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
      }
    };
  }, []);

  return (
    <GameContext.Provider
      value={{ state, createRoom, joinRoom, startGame, submitAnswer, leaveGame }}
    >
      {children}
    </GameContext.Provider>
  );
}