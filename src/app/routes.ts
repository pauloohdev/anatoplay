import { createBrowserRouter } from "react-router";
import { Layout } from "./components/Layout";
import LoginPage from "./pages/LoginPage";
import LobbyPage from "./pages/LobbyPage";
import QuestionPage from "./pages/QuestionPage";
import AnswerPage from "./pages/AnswerPage";
import RankingPage from "./pages/RankingPage";
import FinalResultPage from "./pages/FinalResultPage";
import MiniGameHub from "./pages/MiniGameHub";
import IdentifyStructure from "./pages/IdentifyStructure";
import WordMatch from "./pages/WordMatch";

export const router = createBrowserRouter([
  {
    path: "/",
    Component: Layout,
    children: [
      { index: true, Component: LoginPage },
      { path: "lobby", Component: LobbyPage },
      { path: "question", Component: QuestionPage },
      { path: "answer", Component: AnswerPage },
      { path: "ranking", Component: RankingPage },
      { path: "final", Component: FinalResultPage },
      { path: "mini-games", Component: MiniGameHub },
      { path: "mini-games/identify", Component: IdentifyStructure },
      { path: "mini-games/match", Component: WordMatch },
    ],
  },
]);