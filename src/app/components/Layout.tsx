import { Outlet, useLocation, useNavigate } from "react-router";
import { useEffect } from "react";
import { CustomCursor } from "./CustomCursor";
import { GrainOverlay } from "./GrainOverlay";
import { useGame } from "../context/GameContext";
import { GameProvider } from "../context/GameContext";
import { GameAudioProvider, GameAudioSync } from "../context/GameAudioContext";

// Maps game status to route
const STATUS_TO_ROUTE: Record<string, string> = {
  idle: "/",
  lobby: "/lobby",
  question: "/question",
  answer: "/answer",
  ranking: "/ranking",
  finished: "/final",
};

function NavigationController() {
  const { state } = useGame();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (location.pathname.startsWith("/mini-games")) return;
    const target = STATUS_TO_ROUTE[state.gameStatus] ?? "/";
    if (location.pathname !== target) {
      navigate(target, { replace: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.gameStatus]);

  return null;
}

export function Layout() {
  return (
    <GameProvider>
      <GameAudioProvider>
        <LayoutInner />
      </GameAudioProvider>
    </GameProvider>
  );
}

function LayoutInner() {
  return (
    <div
      className="relative min-h-screen w-full overflow-hidden"
      style={{ background: "#0e0f13", cursor: "none" }}
    >
      {/* Subtle warm ambient — barely visible, no color blobs */}
      <div
        className="fixed inset-0 pointer-events-none z-0"
        style={{
          background:
            "radial-gradient(ellipse 80% 50% at 50% -10%, rgba(124,111,247,0.07) 0%, transparent 60%)",
        }}
      />

      <GrainOverlay />
      <CustomCursor />
      <GameAudioSync />
      <NavigationController />

      <div className="relative z-10 min-h-screen">
        <Outlet />
      </div>

      <style>{`
        * { cursor: none !important; }
      `}</style>
    </div>
  );
}
