
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { 
  Gamepad2, Users, Plus, Play, Sparkles, Trophy, 
  CheckCircle2, XCircle, Clock, Share2, LogOut, ArrowRight, RefreshCw, Crown
} from 'lucide-react';
import { initializeApp, getApps } from 'firebase/app';
import { getDatabase, ref, set, get, update, onValue, remove, push, onDisconnect } from 'firebase/database';
import { runPuterAgent } from '../services/puterCore';

// --- Firebase Configuration ---
const firebaseConfig = {
  apiKey: "AIzaSyAV36X9B0ty7jYwMsqbt-oh-S2tEoMIgeI",
  authDomain: "teacherai-f0aca.firebaseapp.com",
  databaseURL: "https://teacherai-f0aca-default-rtdb.firebaseio.com",
  projectId: "teacherai-f0aca",
  storageBucket: "teacherai-f0aca.firebasestorage.app",
  messagingSenderId: "875867405047",
  appId: "1:875867405047:web:6a0a44f62afa022949f1f2",
  measurementId: "G-LDPJQX67MG"
};

const app = getApps().length ? getApps()[0] : initializeApp(firebaseConfig);
const db = getDatabase(app);

// --- Avatar Configuration ---
const AVATARS = [
  { id: 'tiger', name: 'Tiger', color: '#FF6B35' },
  { id: 'lion', name: 'Lion', color: '#FFB800' },
  { id: 'wolf', name: 'Wolf', color: '#7B8CDE' },
  { id: 'fox', name: 'Fox', color: '#FF8C42' },
  { id: 'frog', name: 'Frog', color: '#4CAF50' },
  { id: 'penguin', name: 'Penguin', color: '#2C3E50' },
  { id: 'unicorn', name: 'Unicorn', color: '#E91E8C' },
  { id: 'bear', name: 'Bear', color: '#8B5E3C' },
  { id: 'panda', name: 'Panda', color: '#F5F5F5' },
  { id: 'butterfly', name: 'Butterfly', color: '#9C27B0' },
  { id: 'dolphin', name: 'Dolphin', color: '#00BCD4' },
  { id: 'eagle', name: 'Eagle', color: '#795548' },
];

const AnimalAvatarSVG: React.FC<{ id: string; color: string; size?: number }> = ({ id, color, size = 100 }) => {
  const getAvatarContent = () => {
    switch (id) {
      case 'tiger':
        return (
          <>
            <path d="M20,30 Q30,10 50,10 Q70,10 80,30 L80,70 Q70,90 50,90 Q30,90 20,70 Z" fill="#FF9800" />
            <path d="M25,40 Q35,35 45,40" stroke="black" strokeWidth="2" fill="none" />
            <path d="M55,40 Q65,35 75,40" stroke="black" strokeWidth="2" fill="none" />
            <circle cx="35" cy="50" r="4" fill="black" />
            <circle cx="65" cy="50" r="4" fill="black" />
            <path d="M45,60 L55,60 L50,65 Z" fill="#000" />
            <path d="M40,70 Q50,75 60,70" stroke="black" strokeWidth="2" fill="none" />
            <path d="M20,40 L35,45 M20,55 L35,55 M20,70 L35,65" stroke="black" strokeWidth="3" />
            <path d="M80,40 L65,45 M80,55 L65,55 M80,70 L65,65" stroke="black" strokeWidth="3" />
          </>
        );
      case 'lion':
        return (
          <>
            <circle cx="50" cy="50" r="40" fill="#FFB800" />
            <path d="M50,10 A40,40 0 0,1 50,90 A45,45 0 0,1 50,10" fill="#E67E22" stroke="#D35400" strokeWidth="5" />
            <circle cx="50" cy="50" r="30" fill="#FFB800" />
            <circle cx="40" cy="45" r="3" fill="black" />
            <circle cx="60" cy="45" r="3" fill="black" />
            <path d="M45,55 Q50,60 55,55" fill="none" stroke="black" strokeWidth="2" />
            <path d="M50,20 L50,30 M30,35 L40,40 M70,35 L60,40" stroke="#8E44AD" strokeWidth="2" />
          </>
        );
      case 'wolf':
        return (
          <>
            <path d="M50,20 L20,80 L80,80 Z" fill="#95A5A6" />
            <path d="M20,80 L50,60 L80,80" fill="#7F8C8D" />
            <path d="M35,30 L25,10 L45,25 Z" fill="#95A5A6" />
            <path d="M65,30 L75,10 L55,25 Z" fill="#95A5A6" />
            <circle cx="40" cy="55" r="2.5" fill="white" />
            <circle cx="60" cy="55" r="2.5" fill="white" />
            <circle cx="40" cy="55" r="1" fill="black" />
            <circle cx="60" cy="55" r="1" fill="black" />
            <path d="M48,70 L52,70 L50,75 Z" fill="black" />
          </>
        );
      case 'fox':
        return (
          <>
            <path d="M10,40 L50,90 L90,40 L70,10 L30,10 Z" fill="#E67E22" />
            <path d="M50,90 L10,40 L30,50 Z" fill="white" />
            <path d="M50,90 L90,40 L70,50 Z" fill="white" />
            <circle cx="35" cy="40" r="3" fill="black" />
            <circle cx="65" cy="40" r="3" fill="black" />
            <path d="M48,65 L52,65 L50,68 Z" fill="black" />
          </>
        );
      case 'frog':
        return (
          <>
            <ellipse cx="50" cy="60" rx="40" ry="30" fill="#4CAF50" />
            <circle cx="30" cy="35" r="12" fill="#4CAF50" />
            <circle cx="70" cy="35" r="12" fill="#4CAF50" />
            <circle cx="30" cy="35" r="8" fill="white" />
            <circle cx="70" cy="35" r="8" fill="white" />
            <circle cx="30" cy="35" r="4" fill="black" />
            <circle cx="70" cy="35" r="4" fill="black" />
            <path d="M30,70 Q50,85 70,70" fill="none" stroke="black" strokeWidth="3" strokeLinecap="round" />
          </>
        );
      case 'penguin':
        return (
          <>
            <ellipse cx="50" cy="55" rx="35" ry="40" fill="#2C3E50" />
            <ellipse cx="50" cy="60" rx="25" ry="32" fill="white" />
            <circle cx="40" cy="40" r="3" fill="white" />
            <circle cx="60" cy="40" r="3" fill="white" />
            <circle cx="40" cy="40" r="1.5" fill="black" />
            <circle cx="60" cy="40" r="1.5" fill="black" />
            <path d="M45,50 L55,50 L50,60 Z" fill="#F1C40F" />
          </>
        );
      case 'unicorn':
        return (
          <>
            <path d="M30,30 Q30,80 50,90 Q70,80 70,30 L70,20 Q50,10 30,20 Z" fill="#FDEEF4" />
            <path d="M45,20 L55,20 L50,-5 Z" fill="#FFD700" />
            <path d="M45,5 L55,5 L50,10 Z" fill="#F1C40F" />
            <circle cx="40" cy="40" r="2.5" fill="black" />
            <circle cx="60" cy="40" r="2.5" fill="black" />
            <circle cx="35" cy="55" r="5" fill="#FFC0CB" opacity="0.6" />
            <circle cx="65" cy="55" r="5" fill="#FFC0CB" opacity="0.6" />
            <path d="M30,20 Q20,10 15,30" stroke="#FF69B4" strokeWidth="8" fill="none" />
          </>
        );
      case 'bear':
        return (
          <>
            <circle cx="50" cy="55" r="35" fill="#8B5E3C" />
            <circle cx="25" cy="30" r="12" fill="#8B5E3C" />
            <circle cx="75" cy="30" r="12" fill="#8B5E3C" />
            <circle cx="25" cy="30" r="6" fill="#A0785A" />
            <circle cx="75" cy="30" r="6" fill="#A0785A" />
            <circle cx="50" cy="65" r="15" fill="#A0785A" />
            <circle cx="40" cy="45" r="3" fill="black" />
            <circle cx="60" cy="45" r="3" fill="black" />
            <ellipse cx="50" cy="60" rx="5" ry="3" fill="black" />
          </>
        );
      case 'panda':
        return (
          <>
            <circle cx="50" cy="55" r="35" fill="white" />
            <circle cx="25" cy="30" r="12" fill="#2C3E50" />
            <circle cx="75" cy="30" r="12" fill="#2C3E50" />
            <circle cx="40" cy="45" r="8" fill="#2C3E50" />
            <circle cx="60" cy="45" r="8" fill="#2C3E50" />
            <circle cx="40" cy="45" r="2" fill="white" />
            <circle cx="60" cy="45" r="2" fill="white" />
            <ellipse cx="50" cy="65" rx="4" ry="2" fill="black" />
          </>
        );
      case 'butterfly':
        return (
          <>
            <path d="M50,30 Q20,10 10,40 Q10,70 50,60" fill="#9C27B0" opacity="0.8" />
            <path d="M50,30 Q80,10 90,40 Q90,70 50,60" fill="#9C27B0" opacity="0.8" />
            <path d="M50,60 Q20,50 15,80 Q15,95 50,85" fill="#E91E63" opacity="0.8" />
            <path d="M50,60 Q80,50 85,80 Q85,95 50,85" fill="#E91E63" opacity="0.8" />
            <ellipse cx="50" cy="50" rx="5" ry="30" fill="#4A148C" />
            <circle cx="48" cy="20" r="1.5" fill="black" />
            <circle cx="52" cy="20" r="1.5" fill="black" />
          </>
        );
      case 'dolphin':
        return (
          <>
            <path d="M10,70 Q30,20 80,40 Q95,45 90,60 Q70,60 50,80 Z" fill="#00BCD4" />
            <path d="M80,40 L95,30 L85,45 Z" fill="#00BCD4" />
            <path d="M40,43 L30,30 L45,40 Z" fill="#0097A7" />
            <circle cx="65" cy="45" r="2" fill="black" />
            <path d="M15,75 Q30,70 45,75" fill="white" opacity="0.4" />
          </>
        );
      case 'eagle':
        return (
          <>
            <path d="M20,50 Q50,10 80,50 L50,80 Z" fill="#795548" />
            <path d="M20,50 Q-5,40 10,60 L20,70 Z" fill="#5D4037" />
            <path d="M80,50 Q105,40 90,60 L80,70 Z" fill="#5D4037" />
            <path d="M35,30 Q50,15 65,30 L50,45 Z" fill="white" />
            <circle cx="45" cy="30" r="1.5" fill="black" />
            <circle cx="55" cy="30" r="1.5" fill="black" />
            <path d="M45,40 L55,40 L50,55 Z" fill="#FFD700" />
          </>
        );
      default:
        return <circle cx="50" cy="50" r="40" fill="#CCC" />;
    }
  };

  return (
    <svg viewBox="0 0 100 100" width={size} height={size}>
      <rect width="100" height="100" rx="20" fill={color} />
      {getAvatarContent()}
    </svg>
  );
};

// --- View Component ---
type GameMode = 
  | 'home'
  | 'host_setup'
  | 'host_lobby'
  | 'host_question'
  | 'host_results'
  | 'join_enter'
  | 'join_lobby'
  | 'join_question'
  | 'join_result';

interface GamePlayer {
  id: string;
  name: string;
  avatar: string;
  score: number;
  answers?: Record<string, { questionIndex: number; selectedOption: string; correct: boolean; points: number }>;
}

interface GameState {
  status: 'lobby' | 'active' | 'question' | 'ended';
  currentQuestion: number;
  questionStartTime: number;
  hostId: string;
  questions: Array<{ question: string; options: string[]; answer: string }>;
  players?: Record<string, GamePlayer>;
}

const TeacherGamesView: React.FC = () => {
  const isAr = document.documentElement.lang === 'ar';
  const tx = (ar: string, en: string) => isAr ? ar : en;

  const [mode, setMode] = useState<GameMode>('home');
  const [gameId, setGameId] = useState('');
  const [gameState, setGameState] = useState<GameState | null>(null);
  
  // Host Setup
  const [lessonName, setLessonName] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [questions, setQuestions] = useState<GameState['questions']>([]);
  
  // Join Setup
  const [nickname, setNickname] = useState('');
  const [selectedAvatar, setSelectedAvatar] = useState(AVATARS[0].id);
  const [error, setError] = useState('');
  const [hasJoined, setHasJoined] = useState(false);

  const playerId = useRef(crypto.randomUUID());
  const [scorePopup, setScorePopup] = useState<{ points: number; show: boolean }>({ points: 0, show: false });
  const [timeLeft, setTimeLeft] = useState(20);
  const timerInterval = useRef<NodeJS.Timeout | null>(null);

  // Initial Join Link Check
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const joinId = urlParams.get('join');
    if (joinId) {
      setGameId(joinId);
      setMode('join_enter');
    }
  }, []);

  // Timer logic for active question
  useEffect(() => {
    if ((mode === 'host_question' || mode === 'join_question') && gameState?.status === 'question' && gameState.questionStartTime) {
      const updateTimer = () => {
        const elapsed = (Date.now() - gameState.questionStartTime) / 1000;
        const remaining = Math.max(0, 20 - elapsed);
        setTimeLeft(remaining);
        if (remaining <= 0 && timerInterval.current) {
          clearInterval(timerInterval.current);
        }
      };
      updateTimer();
      timerInterval.current = setInterval(updateTimer, 100);
    } else if (timerInterval.current) {
      clearInterval(timerInterval.current);
    }
    return () => { if (timerInterval.current) clearInterval(timerInterval.current); };
  }, [mode, gameState]);

  // Main Sync Effect
  useEffect(() => {
    if (!gameId) return;
    const gameRef = ref(db, `games/${gameId}`);
    const unsubscribe = onValue(gameRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        setGameState(data);
        
        // Transition internal modes based on status
        if (mode.startsWith('join_') && hasJoined) {
          if (data.status === 'lobby') setMode('join_lobby');
          else if (data.status === 'question') setMode('join_question');
          else if (data.status === 'ended') setMode('join_result');
        }
      } else if (mode === 'host_lobby' || mode === 'host_question' || mode === 'host_results') {
        // Host was in a game and it was deleted
        resetToHome();
      } else if (mode.startsWith('join_') && hasJoined) {
        // Student was in a game and it was deleted
        setError(tx('تم إغلاق الغرفة.', 'Room has been closed.'));
        resetToHome();
      }
    });

    return () => unsubscribe();
  }, [gameId, hasJoined, mode]);

  const resetToHome = () => {
    setMode('home');
    setGameId('');
    setGameState(null);
    setQuestions([]);
    setError('');
    setHasJoined(false);
  };

  // --- Host Actions ---

  const generateAIQuiz = async () => {
    if (!lessonName) return;
    setIsGenerating(true);
    setError('');
    try {
      const systemPrompt = `You are a JSON quiz generator. 
Output ONLY a valid JSON array, nothing else.
No markdown, no backticks, no text before or after.
Exactly this format:
[{"question":"...","options":["A) ...","B) ...","C) ...","D) ..."],"answer":"A"}]
Generate exactly 10 questions. Answer field must be A, B, C, or D only.`;

      const userPrompt = `Topic: ${lessonName}
Language: ${isAr ? 'Arabic' : 'English'}
Return only the JSON array.`;

      const res = await runPuterAgent(
        userPrompt, 
        undefined, 
        undefined, 
        isAr ? 'ar' : 'en', 
        false, 
        systemPrompt
      );

      const rawText: string = (res.text || (typeof res === 'string' ? res : '')) as string;
      
      // محاولة استخراج JSON بطرق متعددة
      let parsed = null;
      
      // طريقة 1: مباشرة
      try {
        parsed = JSON.parse(rawText.trim());
      } catch {}
      
      // طريقة 2: استخراج array بـ regex
      if (!parsed) {
        const match = rawText.match(/\[[\s\S]*\]/);
        if (match) {
          try { parsed = JSON.parse(match[0]); } catch {}
        }
      }
      
      // طريقة 3: تنظيف backticks
      if (!parsed) {
        const cleaned = rawText
          .replace(/```json/gi, '')
          .replace(/```/g, '')
          .trim();
        try { parsed = JSON.parse(cleaned); } catch {}
      }

      if (!parsed || !Array.isArray(parsed) || parsed.length === 0) {
        throw new Error(`Invalid response: ${rawText.substring(0, 200)}`);
      }

      setQuestions(parsed);
      setMode('host_lobby');
      startHostGame(parsed);

    } catch (err: any) {
      console.error('Quiz generation error:', err);
      // Detailed error reporting for debugging
      setError(`ERROR: ${err?.message || err?.toString() || 'unknown'} | RAW: ${JSON.stringify(err).substring(0, 300)}`);
    } finally {
      setIsGenerating(false);
    }
  };

  const startHostGame = async (gameQuestions: GameState['questions']) => {
    const id = Math.floor(100000 + Math.random() * 900000).toString();
    const newGame: GameState = {
      status: 'lobby',
      currentQuestion: 0,
      questionStartTime: 0,
      hostId: playerId.current,
      questions: gameQuestions,
    };
    try {
      await set(ref(db, `games/${id}`), newGame);
      setGameId(id);
      setGameState(newGame);
    } catch (err) {
      setError(tx('فشل في إنشاء الغرفة.', 'Failed to create room.'));
    }
  };

  const nextQuestion = async () => {
    if (!gameState) return;
    const isLast = gameState.currentQuestion >= gameState.questions.length - 1;
    if (isLast) {
      await update(ref(db, `games/${gameId}`), { status: 'ended' });
      setMode('host_results');
    } else {
      await update(ref(db, `games/${gameId}`), {
        status: 'question',
        currentQuestion: gameState.currentQuestion + 1,
        questionStartTime: Date.now()
      });
      setMode('host_question');
    }
  };

  const hostStartGameTrigger = async () => {
    await update(ref(db, `games/${gameId}`), {
      status: 'question',
      currentQuestion: 0,
      questionStartTime: Date.now()
    });
    setMode('host_question');
  };

  const endGame = async () => {
    await remove(ref(db, `games/${gameId}`));
    resetToHome();
  };

  // --- Student Actions ---

  const joinGame = async () => {
    if (!gameId || !nickname) return;
    setError('');
    try {
      const roomRef = ref(db, `games/${gameId}`);
      const snapshot = await get(roomRef);
      if (!snapshot.exists()) {
        setError(tx('رقم الغرفة غير صحيح.', 'Invalid Game ID.'));
        return;
      }
      
      const playerRef = ref(db, `games/${gameId}/players/${playerId.current}`);
      const playerData: GamePlayer = {
        id: playerId.current,
        name: nickname,
        avatar: selectedAvatar,
        score: 0
      };
      await set(playerRef, playerData);
      onDisconnect(playerRef).remove();
      setHasJoined(true);
      setMode('join_lobby');
    } catch (err: any) {
      console.error('Join error:', err);
      setError(tx(`فشل في الانضمام: ${err.message}`, `Failed to join: ${err.message}`));
    }
  };

  const submitAnswer = async (option: string) => {
    if (!gameState || gameState.status !== 'question') return;
    const qIdx = gameState.currentQuestion;
    const q = gameState.questions[qIdx];
    const player = gameState.players?.[playerId.current];
    
    // Prevent double answering
    if (player?.answers?.[qIdx]) return;

    const selectedIdx = option.charAt(0); // A, B, C, D
    const isCorrect = selectedIdx === q.answer;
    
    const calculatePoints = (questionStartTime: number): number => {
      const elapsed = (Date.now() - questionStartTime) / 1000;
      const maxPoints = 1000;
      const minPoints = 100;
      const timeLimit = 20;
      if (elapsed >= timeLimit) return minPoints;
      return Math.round(maxPoints - ((maxPoints - minPoints) / timeLimit) * elapsed);
    };

    const points = isCorrect ? calculatePoints(gameState.questionStartTime) : 0;
    
    if (isCorrect) {
      setScorePopup({ points, show: true });
      setTimeout(() => setScorePopup({ points: 0, show: false }), 2000);
    }

    const answerData = {
      questionIndex: qIdx,
      selectedOption: option,
      correct: isCorrect,
      points: points
    };

    await set(ref(db, `games/${gameId}/players/${playerId.current}/answers/${qIdx}`), answerData);
    await update(ref(db, `games/${gameId}/players/${playerId.current}`), {
      score: (player?.score || 0) + points
    });
  };

  // --- Render Helpers ---

  const currentQuestionsCount = gameState?.questions.length || 0;
  const currentQ = gameState?.questions[gameState.currentQuestion];
  const sortedPlayers = useMemo(() => {
    if (!gameState?.players) return [];
    return Object.values(gameState.players).sort((a, b) => b.score - a.score);
  }, [gameState?.players]);

  const playerRank = useMemo(() => {
    return sortedPlayers.findIndex(p => p.id === playerId.current) + 1;
  }, [sortedPlayers]);

  const playerAnsweredCount = useMemo(() => {
    if (!gameState?.players) return 0;
    return Object.values(gameState.players).filter(p => p.answers?.[gameState.currentQuestion]).length;
  }, [gameState?.players, gameState?.currentQuestion]);

  return (
    <div className="flex-1 w-full max-w-5xl mx-auto flex flex-col items-center justify-center py-10 px-4">
      <style>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          20% { transform: translateX(-10px); }
          40% { transform: translateX(10px); }
          60% { transform: translateX(-10px); }
          80% { transform: translateX(10px); }
        }
        @keyframes floatUp {
          0% { opacity: 1; transform: translateY(0); }
          100% { opacity: 0; transform: translateY(-60px); }
        }
        @keyframes flipCorrect {
          0% { transform: rotateY(0deg); background-color: inherit; }
          50% { transform: rotateY(180deg); }
          100% { transform: rotateY(360deg); background-color: #059669; }
        }
        .animate-shake { animation: shake 0.4s ease-in-out; }
        .animate-float-up { animation: floatUp 2s forwards; }
        .flip-correct { animation: flipCorrect 0.7s forwards; }
        .perspective-1000 { perspective: 1000px; }
        .preserve-3d { transform-style: preserve-3d; }
      `}</style>

      {/* --- Error Display --- */}
      {error && (
        <div className="fixed top-24 left-1/2 -translate-x-1/2 z-[100] bg-red-500 text-white px-6 py-3 rounded-2xl font-bold shadow-2xl flex items-center gap-3 animate-in slide-in-from-top-4">
          <XCircle className="w-5 h-5" />
          {error}
          <button onClick={() => setError('')} className="ml-4 opacity-50 hover:opacity-100">×</button>
        </div>
      )}

      {/* --- Home View --- */}
      {mode === 'home' && (
        <div className="w-full text-center space-y-12 animate-in fade-in duration-600">
          <div className="space-y-4">
            <div className="inline-flex p-4 bg-indigo-600/10 rounded-3xl border border-indigo-500/20 mb-4">
              <Gamepad2 className="w-12 h-12 text-indigo-400" />
            </div>
            <h1 className="text-4xl md:text-6xl font-black text-white tracking-tighter uppercase leading-tight">
              {tx('العاب المعلم', 'Teacher Games')}
            </h1>
            <p className="text-slate-400 text-sm md:text-lg max-w-xl mx-auto font-bold uppercase tracking-widest leading-relaxed">
              {tx('العاب تعليمية تنافسية مع طلابك في الوقت الفعلي', 'Competitive educational games with your students in real time')}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-3xl mx-auto drop-shadow-2xl h-64 md:h-80 perspective-1000">
            <button 
              onClick={() => setMode('host_setup')}
              className="group preserve-3d relative bg-white/5 border border-white/10 hover:border-emerald-500/50 rounded-[2.5rem] p-10 flex flex-col items-center justify-center gap-6 transition-all hover:scale-105 active:scale-95"
            >
              <div className="p-5 bg-emerald-500/10 rounded-2xl text-emerald-400 group-hover:scale-110 transition-transform">
                <Crown className="w-10 h-10" />
              </div>
              <span className="text-xl font-black text-white uppercase tracking-widest">{tx('أنا المعلم (مستضيف)', 'I am the Teacher (Host)')}</span>
            </button>
            <button 
              onClick={() => setMode('join_enter')}
              className="group preserve-3d relative bg-white/5 border border-white/10 hover:border-indigo-500/50 rounded-[2.5rem] p-10 flex flex-col items-center justify-center gap-6 transition-all hover:scale-105 active:scale-95"
            >
              <div className="p-5 bg-indigo-500/10 rounded-2xl text-indigo-400 group-hover:scale-110 transition-transform">
                <Users className="w-10 h-10" />
              </div>
              <span className="text-xl font-black text-white uppercase tracking-widest">{tx('أنا طالب (لاعب)', 'I am a Student (Player)')}</span>
            </button>
          </div>
        </div>
      )}

      {/* --- Host Setup --- */}
      {mode === 'host_setup' && (
        <div className="w-full max-w-2xl bg-white/5 border border-white/10 p-10 md:p-14 rounded-[3rem] backdrop-blur-xl animate-in slide-in-from-bottom-6 duration-600">
          <div className="flex items-center gap-4 mb-10">
            <div className="p-3 bg-emerald-500/20 text-emerald-400 rounded-2xl">
              <Sparkles className="w-6 h-6" />
            </div>
            <h2 className="text-2xl font-black text-white uppercase">{tx('تجهيز اللعبة الممتعة', 'Setup Fun Game')}</h2>
          </div>

          <div className="space-y-10">
            <div className="space-y-4">
              <label className="text-[10px] font-black text-emerald-400 uppercase tracking-widest">{tx('اسم الدرس / الموضوع', 'LESSON NAME / TOPIC')}</label>
              <input 
                type="text" 
                value={lessonName}
                onChange={(e) => setLessonName(e.target.value)}
                placeholder={tx('مثال: الكواكب، الحرب العالمية الثانية...', 'e.g. Planets, WW2...')}
                className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-white focus:outline-none focus:border-emerald-500/50 transition-all font-bold"
              />
            </div>

            <div className="flex gap-4">
               <button 
                 onClick={generateAIQuiz}
                 disabled={isGenerating || !lessonName}
                 className="flex-1 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white py-5 rounded-3xl font-black text-sm uppercase tracking-widest transition-all flex items-center justify-center gap-3 shadow-xl shadow-emerald-900/20"
               >
                 {isGenerating ? <RefreshCw className="animate-spin" /> : <Sparkles />}
                 {isGenerating ? tx('جاري التوليد...', 'Generating...') : tx('توليد بالذكاء الاصطناعي', 'AI Generate')}
               </button>
            </div>
            
            <button onClick={resetToHome} className="w-full text-slate-500 hover:text-white font-bold uppercase text-[10px] tracking-widest py-2 transition-colors">{tx('العودة', 'Back')}</button>
          </div>
        </div>
      )}

      {/* --- Host Lobby --- */}
      {mode === 'host_lobby' && (
        <div className="w-full h-full flex flex-col items-center gap-10 animate-in fade-in duration-600">
          <div className="text-center space-y-6">
            <span className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.3em]">{tx('انضم الآن باستخدام الرمز', 'Join now using the code')}</span>
            <div className="text-8xl md:text-9xl font-black text-white text-shadow-glow animate-pulse tracking-tighter">
              {gameId}
            </div>
            <div className="flex justify-center gap-4">
              <button 
                 className="flex items-center gap-2 px-6 py-3 bg-white/5 border border-white/10 rounded-2xl text-slate-300 hover:text-white transition-all text-xs font-bold font-black"
                 onClick={() => {
                   const url = `${window.location.origin}${window.location.pathname}?join=${gameId}`;
                   navigator.clipboard.writeText(url);
                 }}
              >
                <Share2 className="w-4 h-4" />
                {tx('نسخ رابط الانضمام', 'Copy Invite Link')}
              </button>
            </div>
          </div>

          <div className="w-full max-w-4xl bg-white/5 border border-white/10 rounded-[3rem] p-10 flex flex-col gap-6 flex-1 min-h-[400px]">
             <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                   <Users className="text-indigo-400" />
                   <h3 className="text-xl font-black text-white uppercase tracking-widest">{tx('اللاعبون في الانتظار', 'Players in Lobby')}</h3>
                </div>
                <div className="px-4 py-2 bg-indigo-600/20 text-indigo-400 rounded-full font-black text-sm">
                   {sortedPlayers.length} {tx('لاعبين', 'Players')}
                </div>
             </div>

             <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-6">
                {sortedPlayers.map((player, idx) => (
                  <div 
                    key={player.id} 
                    className="flex flex-col items-center gap-3 animate-in slide-in-from-bottom-4"
                    style={{ animationDelay: `${idx * 100}ms` }}
                  >
                    <div className="p-2 bg-white/5 rounded-3xl border border-white/10 shadow-lg">
                       <AnimalAvatarSVG id={player.avatar} color={AVATARS.find(a => a.id === player.avatar)?.color || '#333'} size={60} />
                    </div>
                    <span className="text-xs font-black text-white uppercase tracking-widest text-center truncate w-full px-2">{player.name}</span>
                  </div>
                ))}
             </div>

             {sortedPlayers.length === 0 && (
                <div className="flex-1 flex flex-col items-center justify-center opacity-20">
                   <Users className="w-20 h-20 mb-4" />
                   <p className="font-bold uppercase tracking-widest">{tx('بانتظار دخول الطلاب...', 'Waiting for students...')}</p>
                </div>
             )}
          </div>

          <button 
            disabled={sortedPlayers.length === 0}
            onClick={hostStartGameTrigger}
            className="w-full max-w-sm bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white py-6 rounded-3xl font-black text-sm uppercase tracking-[0.3em] shadow-2xl transition-all active:scale-95 flex items-center justify-center gap-4"
          >
            <Play fill="currentColor" />
            {tx('ابدأ اللعبة الآن', 'Start Game')}
          </button>
        </div>
      )}

      {/* --- Join Step: Enter ID --- */}
      {mode === 'join_enter' && (
        <div className="w-full max-w-sm space-y-12 animate-in fade-in duration-600">
           <div className="text-center space-y-4">
              <h2 className="text-4xl font-black text-white uppercase tracking-tighter">{tx('انضم للتحدي', 'Join Challenge')}</h2>
              <p className="text-slate-500 font-bold uppercase tracking-widest text-[10px]">{tx('أدخل كود اللعبة المكون من 6 أرقام', 'Enter the 6-digit game code')}</p>
           </div>
           
           <div className="space-y-6">
              <input 
                type="text" 
                maxLength={6}
                value={gameId}
                onChange={(e) => setGameId(e.target.value)}
                placeholder="000000"
                className="w-full bg-white/5 border border-white/10 rounded-[2.5rem] py-8 text-center text-5xl font-black tracking-[0.2em] text-white focus:outline-none focus:border-indigo-500 transition-all placeholder:opacity-20"
              />

              <div className="space-y-4">
                <input 
                  type="text" 
                  value={nickname}
                  onChange={(e) => setNickname(e.target.value)}
                  placeholder={tx('لقبك في اللعبة', 'Your game nickname')}
                  className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-white focus:outline-none focus:border-indigo-500 transition-all font-bold text-center"
                />
              </div>

              <div className="grid grid-cols-4 gap-3 bg-white/5 p-4 rounded-[2rem] border border-white/10">
                 {AVATARS.map((avatar) => (
                    <button 
                      key={avatar.id}
                      onClick={() => setSelectedAvatar(avatar.id)}
                      className={`p-2 rounded-2xl transition-all hover:scale-110 active:scale-90 ${selectedAvatar === avatar.id ? 'bg-indigo-600 ring-2 ring-indigo-400' : 'bg-white/5'}`}
                    >
                      <AnimalAvatarSVG id={avatar.id} color={avatar.color} size={40} />
                    </button>
                 ))}
              </div>

              <button 
                onClick={joinGame}
                disabled={!gameId || !nickname}
                className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white py-6 rounded-3xl font-black text-sm uppercase tracking-widest transition-all shadow-xl shadow-indigo-900/40 flex items-center justify-center gap-3"
              >
                 <ArrowRight />
                 {tx('دخول الغرفة', 'Join Room')}
              </button>
           </div>
           
           <button onClick={resetToHome} className="w-full text-slate-500 hover:text-white font-bold uppercase text-[10px] tracking-widest py-2 transition-colors">{tx('العودة والرئيسية', 'Back Home')}</button>
        </div>
      )}

      {/* --- Join Lobby --- */}
      {mode === 'join_lobby' && (
        <div className="w-full text-center space-y-12 animate-in fade-in duration-600">
           <div className="space-y-6">
              <div className="relative inline-block">
                 <div className="p-10 bg-indigo-600/10 rounded-full border border-indigo-500/20 animate-pulse">
                    <AnimalAvatarSVG id={selectedAvatar} color={AVATARS.find(a => a.id === selectedAvatar)?.color || '#333'} size={120} />
                 </div>
                 <div className="absolute -bottom-2 -right-2 bg-emerald-500 text-white p-3 rounded-2xl shadow-xl shadow-emerald-500/20">
                    <CheckCircle2 className="w-6 h-6" />
                 </div>
              </div>
              <h2 className="text-3xl font-black text-white uppercase tracking-widest">{nickname}</h2>
              <div className="px-6 py-3 bg-white/5 border border-white/5 rounded-full inline-block">
                 <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em]">{tx('تم الانضمام للغرفة', 'Joined Room')} {gameId}</span>
              </div>
           </div>

           <div className="space-y-4 animate-bounce">
              <Loader2 className="w-10 h-10 text-indigo-400 mx-auto animate-spin" />
              <p className="text-xl font-black text-white uppercase tracking-widest">{tx('بانتظار المعلم لبدء اللعبة...', 'Waiting for host to start...')}</p>
           </div>
        </div>
      )}

      {/* --- Question View --- */}
      {(mode === 'host_question' || mode === 'join_question') && gameState?.status === 'question' && (
        <div className="w-full max-w-4xl space-y-10 animate-in slide-in-from-bottom-10 duration-600">
           {/* Header Stats */}
           <div className="flex justify-between items-end px-4">
              <div className="space-y-1">
                 <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{tx('التقدم', 'PROGRESS')}</span>
                 <p className="text-lg font-black text-white uppercase">{tx('السؤال', 'Question')} {gameState.currentQuestion + 1} / {gameState.questions.length}</p>
              </div>
              {mode.startsWith('join_') && (
                <div className="text-right space-y-1">
                   <span className="text-[10px] font-black text-emerald-500 uppercase tracking-widest">{tx('نقاطك', 'YOUR SCORE')}</span>
                   <p className="text-lg font-black text-white">{gameState.players?.[playerId.current]?.score || 0}</p>
                </div>
              )}
              {mode.startsWith('host_') && (
                 <div className="text-right space-y-1">
                    <span className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">{tx('الإجابات', 'RESPONSES')}</span>
                    <p className="text-lg font-black text-white">{playerAnsweredCount} / {sortedPlayers.length}</p>
                 </div>
              )}
           </div>

           <div className="relative h-2 w-full bg-white/5 rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-emerald-500 to-indigo-500 transition-all duration-300" 
                style={{ width: `${((gameState.currentQuestion + (mode.startsWith('join_') && gameState.players?.[playerId.current]?.answers?.[gameState.currentQuestion] ? 1 : 0)) / gameState.questions.length) * 100}%` }}
              />
           </div>

           {/* Question Card */}
           <div className="bg-white/5 border border-white/10 p-10 md:p-14 rounded-[3rem] text-center space-y-10 shadow-2xl backdrop-blur-xl group perspective-1000">
              <div className="absolute -top-6 left-1/2 -translate-x-1/2 flex items-center gap-3 px-6 py-3 bg-indigo-600 rounded-2xl shadow-xl shadow-indigo-600/30">
                 <Clock className="w-4 h-4 text-white" />
                 <span className="text-lg font-black text-white">{Math.ceil(timeLeft)}s</span>
              </div>

              <h3 className="text-2xl md:text-4xl font-black text-white leading-tight uppercase">
                {currentQ?.question}
              </h3>

              {/* Progress Bar/Timer Detail */}
              <div className="h-3 w-full bg-white/5 rounded-full overflow-hidden">
                 <div 
                   className={`h-full transition-all duration-150 ${timeLeft > 10 ? 'bg-emerald-500' : timeLeft > 5 ? 'bg-yellow-500' : 'bg-red-500'}`}
                   style={{ width: `${(timeLeft / 20) * 100}%` }}
                 />
              </div>

              {/* Answers - Student Mode */}
              {mode === 'join_question' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                   {currentQ?.options.map((opt, i) => {
                      const ans = gameState.players?.[playerId.current]?.answers?.[gameState.currentQuestion];
                      const isSelected = ans?.selectedOption === opt;
                      const hasAnswered = !!ans;
                      return (
                        <button
                          key={i}
                          disabled={hasAnswered || timeLeft <= 0}
                          onClick={() => submitAnswer(opt)}
                          className={`
                            relative h-20 md:h-24 px-8 rounded-2xl font-black uppercase tracking-widest text-sm transition-all flex items-center justify-between group overflow-hidden
                            ${isSelected ? 'bg-indigo-600 text-white shadow-[0_0_30px_rgba(99,102,241,0.5)]' : hasAnswered ? 'bg-white/5 text-slate-500 scale-95 opacity-50' : 'bg-white/5 hover:bg-white/10 text-white border border-white/5 hover:border-indigo-400/30 hover:-translate-y-1'}
                          `}
                        >
                           <span className="relative z-10">{opt}</span>
                           <div className="relative z-10 w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center font-black">
                              {['A','B','C','D'][i]}
                           </div>
                           {/* Click Ripple Background */}
                        </button>
                      );
                   })}
                </div>
              )}

              {/* Status - Join Screen After Answer */}
              {mode === 'join_question' && gameState.players?.[playerId.current]?.answers?.[gameState.currentQuestion] && (
                 <div className="p-6 rounded-3xl bg-indigo-600/10 border border-indigo-500/20 text-indigo-400 animate-pulse font-black uppercase text-xl">
                   {tx('بانتظار إجابة باقي اللاعبين...', 'Waiting for others to answer...')}
                 </div>
              )}

              {/* Host Control Side */}
              {mode === 'host_question' && (
                 <div className="flex flex-col gap-6">
                    <div className="grid grid-cols-2 gap-4 opacity-50">
                       {currentQ?.options.map((opt, i) => (
                          <div key={i} className="p-6 bg-white/5 rounded-2xl border border-white/5 text-slate-400 text-xs font-black uppercase">{opt}</div>
                       ))}
                    </div>
                    
                    <button 
                      onClick={nextQuestion}
                      className="group bg-indigo-600 hover:bg-indigo-500 text-white py-6 rounded-3xl font-black text-sm uppercase tracking-widest shadow-xl transition-all overflow-hidden flex items-center justify-center gap-4 mt-4"
                    >
                       {tx('السؤال التالي', 'Next Question')}
                       <ArrowRight className="group-hover:translate-x-2 transition-transform" />
                    </button>
                 </div>
              )}
           </div>

           {/* Score Popup for students */}
           {scorePopup.show && (
              <div className="fixed top-1/2 left-1/2 -translate-x-1/2 z-[200] pointer-events-none text-emerald-400 text-8xl font-black animate-float-up text-shadow-glow">
                 +{scorePopup.points}
              </div>
           )}
        </div>
      )}

      {/* --- Results View (End Game) --- */}
      {(mode === 'host_results' || mode === 'join_result' || (gameState?.status === 'ended')) && (
        <div className="w-full max-w-4xl space-y-12 animate-in zoom-in duration-600">
           <div className="text-center space-y-4 mb-20 relative">
              <div className="inline-flex p-5 bg-yellow-500/10 rounded-full border border-yellow-400/20 mb-4">
                 <Trophy className="w-12 h-12 text-yellow-400 animate-bounce" />
              </div>
              <h2 className="text-5xl md:text-7xl font-black text-white uppercase tracking-tighter">{tx('المنصة النهائية', 'The Podium')}</h2>
           </div>

           {/* Top 3 Podium */}
           <div className="flex items-end justify-center gap-4 sm:gap-10 mb-20 h-64 md:h-80">
              {/* 2nd Place */}
              {sortedPlayers[1] && (
                <div className="flex flex-col items-center gap-4 animate-in slide-in-from-bottom-20 delay-200">
                   <div className="relative">
                      <div className="p-1 bg-slate-400 rounded-full">
                         <div className="bg-slate-800 p-2 rounded-full border-4 border-slate-400">
                            <AnimalAvatarSVG id={sortedPlayers[1].avatar} color={AVATARS.find(a => a.id === sortedPlayers[1].avatar)?.color || '#333'} size={60} />
                         </div>
                      </div>
                      <div className="absolute -top-3 -right-3 w-8 h-8 rounded-full bg-slate-400 text-slate-900 font-bold flex items-center justify-center border-2 border-white/10 shadow-lg">2</div>
                   </div>
                   <div className="w-24 md:w-32 bg-gradient-to-b from-slate-400/40 to-transparent h-40 rounded-t-3xl border-x border-t border-slate-400/20 p-4 text-center">
                      <span className="text-xs font-black text-white uppercase truncate block w-full">{sortedPlayers[1].name}</span>
                      <span className="text-sm font-black text-slate-400">{sortedPlayers[1].score}</span>
                   </div>
                </div>
              )}

              {/* 1st Place */}
              {sortedPlayers[0] && (
                <div className="flex flex-col items-center gap-4 animate-in slide-in-from-bottom-28">
                   <div className="relative">
                      <div className="p-1.5 bg-yellow-400 rounded-full shadow-[0_0_30px_rgba(251,191,36,0.6)]">
                         <div className="bg-slate-900 p-3 rounded-full border-4 border-yellow-400">
                            <AnimalAvatarSVG id={sortedPlayers[0].avatar} color={AVATARS.find(a => a.id === sortedPlayers[0].avatar)?.color || '#333'} size={80} />
                         </div>
                      </div>
                      <div className="absolute -top-4 -right-4 w-10 h-10 rounded-full bg-yellow-400 text-slate-900 font-bold text-xl flex items-center justify-center border-2 border-white shadow-xl">1</div>
                   </div>
                   <div className="w-32 md:w-44 bg-gradient-to-b from-yellow-400/40 to-transparent h-56 rounded-t-[3rem] border-x border-t border-yellow-400/20 p-6 text-center">
                      <span className="text-base font-black text-white uppercase truncate block w-full mb-1">{sortedPlayers[0].name}</span>
                      <span className="text-xl font-black text-yellow-400">{sortedPlayers[0].score}</span>
                   </div>
                </div>
              )}

              {/* 3rd Place */}
              {sortedPlayers[2] && (
                <div className="flex flex-col items-center gap-4 animate-in slide-in-from-bottom-16 delay-400">
                   <div className="relative">
                      <div className="p-1 bg-amber-700 rounded-full">
                         <div className="bg-slate-900 p-2 rounded-full border-4 border-amber-700">
                            <AnimalAvatarSVG id={sortedPlayers[2].avatar} color={AVATARS.find(a => a.id === sortedPlayers[2].avatar)?.color || '#333'} size={50} />
                         </div>
                      </div>
                      <div className="absolute -top-2 -right-2 w-7 h-7 rounded-full bg-amber-700 text-white font-bold flex items-center justify-center border-2 border-white/10 shadow-lg">3</div>
                   </div>
                   <div className="w-20 md:w-28 bg-gradient-to-b from-amber-700/40 to-transparent h-32 rounded-t-3xl border-x border-t border-amber-700/20 p-4 text-center">
                      <span className="text-[10px] font-black text-white uppercase truncate block w-full">{sortedPlayers[2].name}</span>
                      <span className="text-xs font-black text-amber-700">{sortedPlayers[2].score}</span>
                   </div>
                </div>
              )}
           </div>

           {/* Detailed Table */}
           <div className="w-full bg-white/5 border border-white/10 rounded-[2.5rem] overflow-hidden drop-shadow-2xl">
              <table className="w-full text-left font-bold uppercase text-[10px] tracking-widest">
                 <thead className="bg-white/5 border-b border-white/5">
                    <tr>
                       <th className="px-8 py-5 text-slate-500 font-black">{tx('الرتبة', 'RANK')}</th>
                       <th className="px-8 py-5 text-slate-500 font-black">{tx('اللاعب', 'PLAYER')}</th>
                       <th className="px-8 py-5 text-slate-500 font-black hidden md:table-cell">{tx('الإجابات', 'ACCURACY')}</th>
                       <th className="px-8 py-5 text-right text-emerald-400 font-black">{tx('النتيجة', 'SCORE')}</th>
                    </tr>
                 </thead>
                 <tbody className="divide-y divide-white/5">
                    {sortedPlayers.map((p, i) => {
                      const totalCorrect = p.answers ? Object.values(p.answers).filter(a => a.correct).length : 0;
                      return (
                        <tr key={p.id} className={`group hover:bg-white/5 transition-colors ${p.id === playerId.current ? 'bg-indigo-600/10' : ''}`}>
                           <td className="px-8 py-6 font-black text-white text-lg">#{i + 1}</td>
                           <td className="px-8 py-6">
                              <div className="flex items-center gap-4">
                                 <AnimalAvatarSVG id={p.avatar} color={AVATARS.find(a => a.id === p.avatar)?.color || '#333'} size={40} />
                                 <span className="text-sm text-white">{p.name} {p.id === playerId.current && <span className="text-indigo-400 ml-2">({tx('أنت', 'You')})</span>}</span>
                              </div>
                           </td>
                           <td className="px-8 py-6 hidden md:table-cell">
                              <div className="flex items-center gap-2">
                                 <div className="flex-1 max-w-[100px] h-1.5 bg-white/10 rounded-full overflow-hidden">
                                    <div className="h-full bg-emerald-500" style={{ width: `${(totalCorrect / currentQuestionsCount) * 100}%` }} />
                                 </div>
                                 <span className="text-emerald-500">{totalCorrect}/{currentQuestionsCount}</span>
                              </div>
                           </td>
                           <td className="px-8 py-6 text-right font-black text-lg text-white">{p.score}</td>
                        </tr>
                      );
                    })}
                 </tbody>
              </table>
           </div>

           {/* Final Buttons */}
           <div className="flex flex-col sm:flex-row gap-4 pt-10">
              {mode.startsWith('host_') ? (
                <button 
                  onClick={endGame}
                  className="flex-1 bg-red-600 hover:bg-red-700 text-white py-6 rounded-3xl font-black text-sm uppercase tracking-widest flex items-center justify-center gap-3 transition-all active:scale-95 shadow-xl shadow-red-900/20"
                >
                  <LogOut />
                  {tx('إنهاء اللعبة للجميع', 'End Game for All')}
                </button>
              ) : (
                <button 
                  onClick={resetToHome}
                  className="flex-1 bg-white/5 border border-white/10 hover:border-white/20 text-white py-6 rounded-3xl font-black text-sm uppercase tracking-widest flex items-center justify-center gap-3 transition-all active:scale-95 shadow-xl"
                >
                  <LogOut />
                  {tx('خروج للرئيسية', 'Back to Home')}
                </button>
              )}
           </div>
        </div>
      )}

      {/* --- Global Styles Overlays --- */}
      <div className="fixed bottom-10 left-10 opacity-10 pointer-events-none select-none hidden lg:block">
         <Gamepad2 className="w-64 h-64 text-white -rotate-12" />
      </div>

    </div>
  );
};

export default TeacherGamesView;

interface Loader2Props extends React.SVGProps<SVGSVGElement> {}
const Loader2: React.FC<Loader2Props> = (props) => (
  <svg
    {...props}
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M21 12a9 9 0 1 1-6.219-8.56" />
  </svg>
);
