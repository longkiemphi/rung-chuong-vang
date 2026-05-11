/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, useRef, useMemo } from 'react';
import { 
  Bell, 
  Settings, 
  Play, 
  BookOpen, 
  ChevronLeft, 
  Plus, 
  Trash2, 
  Save, 
  Download, 
  Upload,
  CheckCircle2,
  XCircle,
  Timer,
  Home,
  Trophy,
  AlertCircle,
  RotateCcw
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import confetti from 'canvas-confetti';

// --- Types ---

enum Screen {
  LOADING,
  HOME,
  GAME,
  ADMIN,
  VICTORY,
  GAME_OVER,
  TUTORIAL
}

interface Question {
  id: string;
  subject: string;
  topic: string;
  question: string;
  options: {
    A: string;
    B: string;
    C: string;
    D: string;
  };
  correctAnswer: 'A' | 'B' | 'C' | 'D';
  difficulty: number;
}

interface AppSettings {
  title: string;
  subtitle: string;
  colors: {
    background: string;
    primary: string;
    text: string;
    success: string;
    danger: string;
  };
}

interface Participant {
  id: number;
  status: 'alive' | 'eliminated';
}

// --- Constants ---

const SUBJECTS = [
  'Kiến thức chung',
  'Khoa học',
  'Văn học',
  'Lịch sử',
  'Địa lý',
  'Văn hóa Việt Nam',
  'Tiếng Anh'
];

// No hardcoded questions — import via CSV in Admin screen

const DEFAULT_SETTINGS: AppSettings = {
  title: 'Rung Chuông Vàng',
  subtitle: 'Hội thi lực lượng tham gia bảo vệ an ninh, trật tự ở cơ sở giỏi trên địa bàn tỉnh Đồng Tháp (lần thứ I) năm 2026',
  colors: {
    background: 'linear-gradient(to bottom, #1e3c72, #2a5298, #7e22ce)',
    primary: '#fbbf24',
    text: '#ffffff',
    success: '#22c55e',
    danger: '#ef4444'
  }
};

// --- GameScreen Component (extracted to prevent re-mount flicker) ---

interface GameScreenProps {
  participants: Participant[];
  totalParticipantsCount: number;
  settings: AppSettings;
  currentQuestionIdx: number;
  sortedQuestions: Question[];
  currentQuestion: Question | undefined;
  timer: number;
  timerDuration: number;
  showAnswer: boolean;
  onGoHome: () => void;
  onToggleParticipant: (id: number) => void;
  onShowAnswer: () => void;
  onSetTimer: (seconds: number) => void;
  onNextQuestion: () => void;
  onEndGame: (type: 'victory' | 'game_over') => void;
}

function GameScreen({
  participants,
  totalParticipantsCount,
  settings,
  currentQuestionIdx,
  sortedQuestions,
  currentQuestion,
  timer,
  timerDuration,
  showAnswer,
  onGoHome,
  onToggleParticipant,
  onShowAnswer,
  onSetTimer,
  onNextQuestion,
  onEndGame
}: GameScreenProps) {
  const aliveCount = participants.filter(p => p.status === 'alive').length;

  // Calculate grid columns based on total participants
  const gridCols = totalParticipantsCount <= 20 ? 'grid-cols-5' :
                   totalParticipantsCount <= 50 ? 'grid-cols-7' : 'grid-cols-10';

  return (
    <div className="flex flex-col w-full h-full px-6 pb-6 pt-24 text-white overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={onGoHome}
          className="flex items-center gap-2 bg-white/10 hover:bg-white/20 px-4 py-2 rounded-xl transition-all"
        >
          <ChevronLeft /> Về trang chủ
        </button>

        <div className="flex items-center gap-8">
          <div className="text-center">
            <h2 className="text-3xl font-bold text-yellow-400">{settings.title}</h2>
            <p className="text-sm opacity-80">Câu {currentQuestionIdx + 1} / {sortedQuestions.length}</p>
          </div>
          <div className="bg-white/10 backdrop-blur-md px-6 py-2 rounded-2xl border border-white/20 text-center min-w-[200px]">
            <p className="text-xs uppercase tracking-widest opacity-70">Thí sinh còn lại</p>
            <p className="text-3xl font-black text-yellow-400">{aliveCount} / {participants.length}</p>
          </div>
        </div>

        <div className="w-24"></div> {/* Spacer for symmetry */}
      </div>

      {/* Main Game Layout */}
      <div className="flex gap-6 h-[80%]">
        {/* Left: Participant Grid */}
        <div className="w-1/3 bg-black/20 backdrop-blur-sm rounded-3xl p-6 border border-white/10 overflow-auto">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <CheckCircle2 size={18} className="text-green-400" /> Sơ đồ thí sinh
          </h3>
          <div className={`grid ${gridCols} gap-2`}>
            {participants.map(p => (
              <motion.div
                key={p.id}
                whileHover={{ scale: 1.1 }}
                onClick={() => onToggleParticipant(p.id)}
                className={`
                  aspect-square flex items-center justify-center rounded-lg font-bold text-sm cursor-pointer transition-all border
                  ${p.status === 'alive'
                    ? 'bg-green-500/80 border-green-400 text-white shadow-[0_0_10px_rgba(34,197,94,0.3)]'
                    : 'bg-red-900/30 border-red-900/50 text-white/30'
                  }
                `}
              >
                {p.id}
              </motion.div>
            ))}
          </div>
        </div>

        {/* Right: Question Area */}
        <div className="flex-1 flex flex-col gap-6">
          <div className="flex-1 bg-white/10 backdrop-blur-md rounded-3xl p-10 border border-white/10 flex flex-col items-center justify-center relative overflow-hidden">
            {/* Question Timer */}
            <div className="absolute top-6 right-6">
              <div className={`
                relative flex items-center justify-center w-24 h-24 rounded-full border-4 transition-all duration-300
                ${timer <= 3 ? 'border-red-500 text-red-500 animate-pulse' : 'border-yellow-400 text-yellow-400'}
              `}>
                <div className="text-4xl font-black">{timer}</div>
                <Timer className="absolute -bottom-2 -right-2 bg-blue-900 p-1 rounded-full border border-white/20" size={24} />
              </div>
            </div>

            {/* Question Content */}
            {currentQuestion ? (
              <div className="w-full text-center space-y-12">
                <div className="space-y-4">
                  <span className="bg-yellow-400 text-blue-900 px-4 py-1 rounded-full text-sm font-bold uppercase tracking-wider">
                    {currentQuestion.topic || currentQuestion.subject}
                  </span>
                  <h2 className="text-4xl font-bold leading-tight">{currentQuestion.question}</h2>
                </div>

                <div className="grid grid-cols-2 gap-6 w-full">
                  {['A', 'B', 'C', 'D'].map(key => {
                    const isCorrect = key === currentQuestion.correctAnswer;
                    const optionText = currentQuestion.options[key as 'A'|'B'|'C'|'D'];
                    return (
                      <div
                        key={key}
                        className={`
                          relative text-left p-6 rounded-2xl border-2 transition-all text-xl font-medium
                          ${showAnswer && isCorrect
                            ? 'bg-green-500 border-green-300 scale-105 shadow-[0_0_20px_rgba(34,197,94,0.5)]'
                            : 'bg-white/5 border-white/10'
                          }
                        `}
                      >
                        <span className={`
                          inline-flex items-center justify-center w-10 h-10 rounded-lg mr-4 font-black
                          ${showAnswer && isCorrect ? 'bg-white text-green-600' : 'bg-yellow-400 text-blue-900'}
                        `}>
                          {key}
                        </span>
                        {optionText}
                        {showAnswer && isCorrect && <CheckCircle2 className="absolute top-4 right-4 text-white" />}
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : (
              <div className="text-center font-bold text-2xl opacity-50">
                Vui lòng thêm câu hỏi trong phần Quản trị
              </div>
            )}
          </div>

          {/* Controls */}
          <div className="flex gap-4">
            <button
              onClick={onShowAnswer}
              className="flex-1 bg-purple-600 hover:bg-purple-700 py-5 rounded-2xl font-bold text-xl shadow-lg transition-all flex items-center justify-center gap-2"
            >
              <CheckCircle2 /> Hiển thị đáp án
            </button>
            <button
              onClick={() => onSetTimer(timerDuration)}
              className="bg-blue-600 hover:bg-blue-700 px-8 rounded-2xl font-bold text-xl flex items-center justify-center"
              title="Bắt đầu đếm ngược"
            >
              <Play className="fill-white" />
            </button>
            {aliveCount <= 1 ? (
              <button
                onClick={() => onEndGame(aliveCount === 1 ? 'victory' : 'game_over')}
                className="flex-1 bg-green-500 hover:bg-green-600 text-white py-5 rounded-2xl font-bold text-xl shadow-lg transition-all flex items-center justify-center gap-2"
              >
                <Trophy /> Tổng kết kết quả
              </button>
            ) : (
              <button
                onClick={onNextQuestion}
                disabled={currentQuestionIdx === sortedQuestions.length - 1}
                className={`
                  flex-1 py-5 rounded-2xl font-bold text-xl shadow-lg transition-all flex items-center justify-center gap-2
                  ${currentQuestionIdx === sortedQuestions.length - 1 ? 'bg-gray-600 cursor-not-allowed opacity-50' : 'bg-yellow-400 text-blue-900 hover:bg-yellow-500'}
                `}
              >
                Câu tiếp theo <ChevronLeft className="rotate-180" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// --- App Component ---

export default function App() {
  const [screen, setScreen] = useState<Screen>(Screen.LOADING);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [currentQuestionIdx, setCurrentQuestionIdx] = useState(0);
  const [timer, setTimer] = useState(10);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [showAnswer, setShowAnswer] = useState(false);
  const [totalParticipantsCount, setTotalParticipantsCount] = useState(50);
  const [timerDuration, setTimerDuration] = useState(10);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const bgMusicRef = useRef<HTMLAudioElement | null>(null);
  
  // Loading Simulation
  useEffect(() => {
    const savedQuestions = localStorage.getItem('rcv_questions');
    const savedSettings = localStorage.getItem('rcv_settings');
    const savedCount = localStorage.getItem('rcv_participant_count');
    
    if (savedQuestions) setQuestions(JSON.parse(savedQuestions));
    
    if (savedSettings) setSettings(JSON.parse(savedSettings));
    
    if (savedCount) setTotalParticipantsCount(parseInt(savedCount));

    const savedDuration = localStorage.getItem('rcv_timer_duration');
    if (savedDuration) setTimerDuration(parseInt(savedDuration));

    const timer = setTimeout(() => {
      setScreen(Screen.HOME);
    }, 1500);
    return () => clearTimeout(timer);
  }, []);

  // Save changes to localStorage
  useEffect(() => {
    if (questions.length > 0) {
      localStorage.setItem('rcv_questions', JSON.stringify(questions));
    }
  }, [questions]);

  useEffect(() => {
    localStorage.setItem('rcv_settings', JSON.stringify(settings));
  }, [settings]);

  useEffect(() => {
    localStorage.setItem('rcv_participant_count', totalParticipantsCount.toString());
  }, [totalParticipantsCount]);

  useEffect(() => {
    localStorage.setItem('rcv_timer_duration', timerDuration.toString());
  }, [timerDuration]);

  // Countdown beep sound
  const playBeep = (isUrgent: boolean) => {
    try {
      if (!audioCtxRef.current) {
        audioCtxRef.current = new AudioContext();
      }
      const ctx = audioCtxRef.current;
      const oscillator = ctx.createOscillator();
      const gainNode = ctx.createGain();
      oscillator.connect(gainNode);
      gainNode.connect(ctx.destination);
      oscillator.type = 'sine';
      oscillator.frequency.value = isUrgent ? 880 : 600;
      gainNode.gain.value = 0.3;
      gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.2);
      oscillator.start(ctx.currentTime);
      oscillator.stop(ctx.currentTime + 0.2);
    } catch (_) { /* audio not supported */ }
  };

  // Background Music Logic
  useEffect(() => {
    bgMusicRef.current = new Audio('/sonican-news-music-information-epic-30-seconds-471012.mp3');
    bgMusicRef.current.volume = 0.5;
  }, []);

  useEffect(() => {
    if (isTimerRunning) {
      if (bgMusicRef.current) {
        bgMusicRef.current.currentTime = 0;
        bgMusicRef.current.play().catch(() => {});
      }
    } else {
      if (bgMusicRef.current) {
        bgMusicRef.current.pause();
      }
    }
  }, [isTimerRunning]);

  // Timer Logic
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isTimerRunning && timer > 0) {
      interval = setInterval(() => {
        setTimer(prev => {
          const next = prev - 1;
          if (next > 0) playBeep(next <= 3);
          return next;
        });
      }, 1000);
    } else if (timer === 0) {
      setIsTimerRunning(false);
      // Play dramatic "time's up" buzzer
      try {
        if (!audioCtxRef.current) audioCtxRef.current = new AudioContext();
        const ctx = audioCtxRef.current;
        const now = ctx.currentTime;

        // Layer 1: Rising sweep
        const osc1 = ctx.createOscillator();
        const gain1 = ctx.createGain();
        osc1.connect(gain1);
        gain1.connect(ctx.destination);
        osc1.type = 'sawtooth';
        osc1.frequency.setValueAtTime(400, now);
        osc1.frequency.exponentialRampToValueAtTime(1200, now + 0.3);
        gain1.gain.setValueAtTime(0.25, now);
        gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.5);
        osc1.start(now);
        osc1.stop(now + 0.5);

        // Layer 2: Two short staccato hits
        [0, 0.15].forEach(offset => {
          const osc = ctx.createOscillator();
          const g = ctx.createGain();
          osc.connect(g);
          g.connect(ctx.destination);
          osc.type = 'square';
          osc.frequency.value = 800;
          g.gain.setValueAtTime(0.2, now + offset);
          g.gain.exponentialRampToValueAtTime(0.001, now + offset + 0.1);
          osc.start(now + offset);
          osc.stop(now + offset + 0.12);
        });

        // Layer 3: Final long tone (chord)
        [523, 659, 784].forEach(freq => {
          const osc = ctx.createOscillator();
          const g = ctx.createGain();
          osc.connect(g);
          g.connect(ctx.destination);
          osc.type = 'sine';
          osc.frequency.value = freq;
          g.gain.setValueAtTime(0.15, now + 0.35);
          g.gain.exponentialRampToValueAtTime(0.001, now + 1.5);
          osc.start(now + 0.35);
          osc.stop(now + 1.5);
        });
      } catch (_) {}
    }
    return () => clearInterval(interval);
  }, [isTimerRunning, timer]);

  // Handle manual transition to Victory or Game Over
  const handleEndGame = (type: 'victory' | 'game_over') => {
    if (type === 'victory') {
      try {
        const victoryAudio = new Audio('/victory-chime.mp3');
        victoryAudio.volume = 0.7;
        victoryAudio.play();
      } catch (_) {}
      setScreen(Screen.VICTORY);
    } else {
      setScreen(Screen.GAME_OVER);
    }
  };

  // Initialize participants for a new game
  const startNewGame = () => {
    const initialParticipants: Participant[] = Array.from({ length: totalParticipantsCount }, (_, i) => ({
      id: i + 1,
      status: 'alive'
    }));
    setParticipants(initialParticipants);
    setCurrentQuestionIdx(0);
    setTimer(timerDuration);
    setIsTimerRunning(false);
    setShowAnswer(false);
    setScreen(Screen.GAME);
  };

  // Helper: Sort questions by difficulty
  const sortedQuestions = useMemo(() => {
    return [...questions].sort((a, b) => a.difficulty - b.difficulty);
  }, [questions]);

  const currentQuestion = sortedQuestions[currentQuestionIdx];

  // --- Handlers ---

  const toggleParticipant = (id: number) => {
    setParticipants(prev => prev.map(p => 
      p.id === id ? { ...p, status: p.status === 'alive' ? 'eliminated' : 'alive' } : p
    ));
  };

  const setQuestionTimer = (seconds: number) => {
    setTimer(seconds);
    setIsTimerRunning(true);
  };

  const nextQuestion = () => {
    if (currentQuestionIdx < sortedQuestions.length - 1) {
      setCurrentQuestionIdx(prev => prev + 1);
      setTimer(timerDuration);
      setIsTimerRunning(false);
      setShowAnswer(false);
    }
  };

  // --- Export/Import CSV ---

  const parseCSVLine = (line: string): string[] => {
    const result: string[] = [];
    let current = '';
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      if (inQuotes) {
        if (char === '"' && line[i + 1] === '"') {
          current += '"';
          i++;
        } else if (char === '"') {
          inQuotes = false;
        } else {
          current += char;
        }
      } else {
        if (char === '"') {
          inQuotes = true;
        } else if (char === ',') {
          result.push(current.trim());
          current = '';
        } else {
          current += char;
        }
      }
    }
    result.push(current.trim());
    return result;
  };

  const downloadTemplate = () => {
    const header = 'Môn học,Chủ đề,Câu hỏi,Đáp án A,Đáp án B,Đáp án C,Đáp án D,Đáp án đúng,Độ khó';
    const sample = '"Kiến thức chung","Văn hóa","Tỉnh nào sau đây được mệnh danh là Đất Sen Hồng?","An Giang","Tiền Giang","Đồng Tháp","Vĩnh Long","C","1"';
    const csvContent = '\uFEFF' + header + '\n' + sample + '\n';
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'RungChuongVang_Template.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  const exportData = () => {
    if (questions.length === 0) {
      alert("Không có câu hỏi nào để xuất!");
      return;
    }
    const header = 'Môn học,Chủ đề,Câu hỏi,Đáp án A,Đáp án B,Đáp án C,Đáp án D,Đáp án đúng,Độ khó';
    const escapeCSV = (str: string) => `"${str.replace(/"/g, '""')}"`;
    const rows = questions.map(q => [
      escapeCSV(q.subject),
      escapeCSV(q.topic || ''),
      escapeCSV(q.question),
      escapeCSV(q.options.A),
      escapeCSV(q.options.B),
      escapeCSV(q.options.C),
      escapeCSV(q.options.D),
      escapeCSV(q.correctAnswer),
      q.difficulty.toString()
    ].join(','));
    
    const csvContent = '\uFEFF' + header + '\n' + rows.join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Danh_sach_cau_hoi_${new Date().toISOString().slice(0,10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      const lines = text.split(/\r?\n/).filter(line => line.trim() !== '');
      if (lines.length < 2) return; // need header + at least 1 row

      const headers = parseCSVLine(lines[0]);
      const findCol = (keywords: string[]) => headers.findIndex(h => keywords.some(k => h.toLowerCase().includes(k.toLowerCase())));

      const colSubject = findCol(['Môn học', 'môn học']);
      const colTopic = findCol(['Chủ đề', 'chủ đề']);
      const colQuestion = findCol(['Câu hỏi', 'câu hỏi']);
      const colA = findCol(['Đáp án A', 'đáp án a']);
      const colB = findCol(['Đáp án B', 'đáp án b']);
      const colC = findCol(['Đáp án C', 'đáp án c']);
      const colD = findCol(['Đáp án D', 'đáp án d']);
      const colAnswer = findCol(['Đáp án đúng', 'đáp án đúng']);
      const colDifficulty = findCol(['Độ khó', 'độ khó']);

      const importedQuestions: Question[] = [];
      for (let i = 1; i < lines.length; i++) {
        const cols = parseCSVLine(lines[i]);
        if (cols.length < 5) continue; // skip malformed rows

        const answerValue = (cols[colAnswer] || 'A').trim().toUpperCase();
        importedQuestions.push({
          id: Date.now().toString() + i,
          subject: cols[colSubject] || 'Kiến thức chung',
          topic: cols[colTopic] || '',
          question: cols[colQuestion] || '',
          options: {
            A: cols[colA] || '',
            B: cols[colB] || '',
            C: cols[colC] || '',
            D: cols[colD] || ''
          },
          correctAnswer: (['A', 'B', 'C', 'D'].includes(answerValue) ? answerValue : 'A') as 'A'|'B'|'C'|'D',
          difficulty: parseInt(cols[colDifficulty] || '1') || 1
        });
      }

      setQuestions(prev => [...prev, ...importedQuestions]);
    };
    reader.readAsText(file, 'UTF-8');
    // Reset input so same file can be re-imported
    e.target.value = '';
  };


  // --- Sub-components for Screens ---

  const LoadingScreen = () => (
    <div className="flex flex-col items-center justify-center w-full h-full text-white">
      <div className="w-16 h-16 border-4 border-yellow-400 border-t-transparent rounded-full animate-spin mb-4"></div>
      <p className="text-xl font-medium">Đang tải dữ liệu...</p>
    </div>
  );

  const HomeScreen = () => (
    <div className="flex flex-col items-center justify-center w-full h-full text-white text-center px-4">
      <motion.div 
        initial={{ y: -50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="mb-8"
      >
        <Bell className="w-48 h-48 text-yellow-400 bell-shake cursor-pointer" />
      </motion.div>
      
      <motion.h1 
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="text-6xl font-bold mb-4 drop-shadow-lg"
      >
        {settings.title}
      </motion.h1>
      
      <motion.p 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="text-2xl max-w-4xl opacity-90 mb-12 italic leading-relaxed"
      >
        {settings.subtitle}
      </motion.p>
      
      <div className="flex flex-col gap-4 w-full max-w-md">
        <motion.button 
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={startNewGame}
          className="flex items-center justify-center gap-3 bg-yellow-400 text-blue-900 py-4 px-8 rounded-2xl font-bold text-xl shadow-xl hover:bg-yellow-500 transition-all"
        >
          <Play className="fill-blue-900" />
          🕹 Bắt đầu thi đấu
        </motion.button>
        
        <div className="grid grid-cols-2 gap-4">
          <motion.button 
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setScreen(Screen.ADMIN)}
            className="flex items-center justify-center gap-2 bg-blue-600/80 backdrop-blur-sm text-white py-4 px-4 rounded-2xl font-semibold text-lg border border-white/20 shadow-xl"
          >
            <Settings size={20} />
            ⚙ Quản trị
          </motion.button>
          
          <motion.button 
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setScreen(Screen.TUTORIAL)}
            className="flex items-center justify-center gap-2 bg-purple-600/80 backdrop-blur-sm text-white py-4 px-4 rounded-2xl font-semibold text-lg border border-white/20 shadow-xl"
          >
            <BookOpen size={20} />
            📖 Hướng dẫn
          </motion.button>
        </div>
      </div>
    </div>
  );

  const AdminScreen = () => {
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editForm, setEditForm] = useState<Question | null>(null);
    const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

    const startEditing = (q: Question) => {
      setEditingId(q.id);
      setEditForm({ ...q });
    };

    const createNew = () => {
      const newQ: Question = {
        id: Date.now().toString(),
        subject: SUBJECTS[0],
        topic: '',
        question: '',
        options: { A: '', B: '', C: '', D: '' },
        correctAnswer: 'A',
        difficulty: 1
      };
      setQuestions(prev => [...prev, newQ]);
      startEditing(newQ);
    };

    const saveEdit = () => {
      if (!editForm) return;
      setQuestions(prev => prev.map(q => q.id === editForm.id ? editForm : q));
      setEditingId(null);
      setEditForm(null);
    };

    const deleteQuestion = (id: string) => {
      if (deleteConfirm === id) {
        setQuestions(prev => prev.filter(q => q.id !== id));
        setDeleteConfirm(null);
        if (editingId === id) {
          setEditingId(null);
          setEditForm(null);
        }
      } else {
        setDeleteConfirm(id);
      }
    };

    return (
      <div className="flex flex-col w-full h-full px-8 pb-8 pt-24 text-white overflow-hidden">
        <div className="flex justify-between items-center mb-8">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setScreen(Screen.HOME)}
              className="bg-white/10 hover:bg-white/20 p-3 rounded-xl"
            >
              <ChevronLeft size={24} />
            </button>
            <h1 className="text-3xl font-bold">Quản trị hệ thống</h1>
          </div>
          
          <div className="flex gap-4">
            <button 
              onClick={exportData}
              className="flex items-center gap-2 bg-green-600 hover:bg-green-700 px-5 py-3 rounded-xl font-medium transition-all"
            >
              <Save size={18} /> Xuất CSV
            </button>
            <button 
              onClick={downloadTemplate}
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 px-5 py-3 rounded-xl font-medium transition-all"
            >
              <Download size={18} /> Tải file mẫu
            </button>
            <div className="relative">
              <input 
                type="file" 
                accept=".csv" 
                onChange={handleFileUpload}
                className="absolute inset-0 opacity-0 cursor-pointer"
              />
              <button className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700 px-5 py-3 rounded-xl font-medium transition-all">
                <Upload size={18} /> Import CSV
              </button>
            </div>
            <button 
              onClick={createNew}
              className="flex items-center gap-2 bg-yellow-400 text-blue-900 hover:bg-yellow-500 px-5 py-3 rounded-xl font-bold transition-all"
            >
              <Plus size={18} /> Thêm câu hỏi
            </button>
          </div>
        </div>

        <div className="flex gap-8 flex-1 overflow-hidden">
          {/* Left Column: List */}
          <div className="w-1/2 flex flex-col gap-4 overflow-hidden">
            <div className="flex items-center justify-between px-2">
              <h2 className="text-xl font-bold opacity-80">Danh sách câu hỏi ({questions.length})</h2>
              <div className="flex items-center gap-3 bg-white/10 px-4 py-2 rounded-xl">
                <span className="text-sm">Tổng thí sinh:</span>
                <input 
                  type="number"
                  min="5"
                  max="100"
                  value={totalParticipantsCount}
                  onChange={(e) => setTotalParticipantsCount(parseInt(e.target.value) || 0)}
                  className="bg-transparent border-none focus:ring-0 w-16 text-center font-bold text-yellow-400"
                />
              </div>
              <div className="flex items-center gap-3 bg-white/10 px-4 py-2 rounded-xl">
                <Timer size={16} className="text-yellow-400" />
                <span className="text-sm">Thời gian (giây):</span>
                <input 
                  type="number"
                  min="5"
                  max="120"
                  value={timerDuration}
                  onChange={(e) => setTimerDuration(parseInt(e.target.value) || 10)}
                  className="bg-transparent border-none focus:ring-0 w-16 text-center font-bold text-yellow-400"
                />
              </div>
            </div>
            
            <div className="flex-1 overflow-y-auto space-y-3 pr-2 custom-scrollbar">
              {sortedQuestions.map((q, idx) => (
                <div 
                  key={q.id}
                  onClick={() => startEditing(q)}
                  className={`
                    p-4 rounded-2xl border transition-all cursor-pointer group flex items-center justify-between
                    ${editingId === q.id ? 'bg-yellow-400/20 border-yellow-400' : 'bg-white/5 border-white/10 hover:bg-white/10'}
                  `}
                >
                  <div className="flex items-center gap-4 flex-1 overflow-hidden">
                    <span className="flex-shrink-0 w-8 h-8 rounded-full bg-white/10 flex items-center justify-center font-bold text-xs">
                      {idx + 1}
                    </span>
                    <div className="flex-1 truncate">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-[10px] uppercase font-bold text-yellow-400 bg-yellow-400/10 px-2 py-0.5 rounded">
                          {q.subject}
                        </span>
                        <span className="text-[10px] uppercase font-bold text-white/50">
                          Độ khó: {q.difficulty}
                        </span>
                      </div>
                      <p className="font-medium truncate">{q.question || 'Chưa nội dung...'}</p>
                    </div>
                  </div>
                  
                  <button 
                    onClick={(e) => { e.stopPropagation(); deleteQuestion(q.id); }}
                    className={`
                      p-2 rounded-lg transition-all flex items-center gap-2
                      ${deleteConfirm === q.id ? 'bg-red-500 text-white' : 'text-white/30 hover:text-red-400 hover:bg-red-400/10'}
                    `}
                  >
                    {deleteConfirm === q.id ? <span className="text-xs font-bold whitespace-nowrap">Xác nhận?</span> : null}
                    <Trash2 size={18} />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Right Column: Editor */}
          <div className="flex-1 bg-white/10 backdrop-blur-md rounded-3xl p-8 border border-white/10 overflow-y-auto custom-scrollbar">
            {editForm ? (
              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-sm font-semibold opacity-60">Môn học</label>
                    <select 
                      value={editForm.subject}
                      onChange={e => setEditForm({...editForm, subject: e.target.value})}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-yellow-400 transition-all text-white"
                    >
                      {SUBJECTS.map(s => <option key={s} value={s} className='bg-blue-900'>{s}</option>)}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-semibold opacity-60">Chủ đề</label>
                    <input 
                      type="text"
                      value={editForm.topic}
                      placeholder="VD: Văn hóa, Lịch sử 12..."
                      onChange={e => setEditForm({...editForm, topic: e.target.value})}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-yellow-400 transition-all"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-semibold opacity-60">Câu hỏi</label>
                  <textarea 
                    value={editForm.question}
                    onChange={e => setEditForm({...editForm, question: e.target.value})}
                    rows={4}
                    placeholder="Nhập nội dung câu hỏi..."
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-yellow-400 transition-all resize-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-x-6 gap-y-4">
                  {['A', 'B', 'C', 'D'].map(key => (
                    <div key={key} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <label className="text-sm font-semibold opacity-60">Đáp án {key}</label>
                        {editForm.correctAnswer === key && <span className="text-[10px] bg-green-500/20 text-green-400 px-2 rounded font-bold">ĐÚNG</span>}
                      </div>
                      <input 
                        type="text"
                        value={editForm.options[key as 'A'|'B'|'C'|'D']}
                        onChange={e => setEditForm({
                          ...editForm, 
                          options: {...editForm.options, [key]: e.target.value}
                        })}
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-yellow-400 transition-all"
                      />
                    </div>
                  ))}
                </div>

                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-sm font-semibold opacity-60">Đáp án chính xác</label>
                    <select 
                      value={editForm.correctAnswer}
                      onChange={e => setEditForm({...editForm, correctAnswer: e.target.value as any})}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-yellow-400 transition-all text-white"
                    >
                      {['A', 'B', 'C', 'D'].map(v => <option key={v} value={v} className='bg-blue-900'>Đáp án {v}</option>)}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-semibold opacity-60">Độ khó (1 - 30)</label>
                    <input 
                      type="number"
                      min="1"
                      max="30"
                      value={editForm.difficulty}
                      onChange={e => setEditForm({...editForm, difficulty: parseInt(e.target.value) || 1})}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-yellow-400 transition-all"
                    />
                  </div>
                </div>

                <div className="flex gap-4 pt-4">
                  <button 
                    onClick={saveEdit}
                    className="flex-1 bg-yellow-400 text-blue-900 py-4 rounded-2xl font-bold text-lg shadow-lg hover:bg-yellow-500 transition-all flex items-center justify-center gap-2"
                  >
                    <Save size={20} /> Lưu câu hỏi
                  </button>
                  <button 
                    onClick={() => { setEditingId(null); setEditForm(null); }}
                    className="flex-1 bg-white/5 hover:bg-white/10 py-4 rounded-2xl font-bold text-lg border border-white/10 transition-all"
                  >
                    Hủy bỏ
                  </button>
                </div>
              </div>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-center space-y-6 opacity-40">
                <Settings size={80} />
                <div>
                  <p className="text-2xl font-bold">Trình chỉnh sửa</p>
                  <p>Chọn một câu hỏi từ danh sách để bắt đầu chỉnh sửa hoặc thêm mới.</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  const VictoryScreen = () => {
    useEffect(() => {
      const duration = 5 * 1000;
      const animationEnd = Date.now() + duration;
      const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 0 };

      const randomInRange = (min: number, max: number) => Math.random() * (max - min) + min;

      const interval: any = setInterval(() => {
        const timeLeft = animationEnd - Date.now();
        if (timeLeft <= 0) return clearInterval(interval);

        const particleCount = 50 * (timeLeft / duration);
        confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 } });
        confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 } });
      }, 250);

      return () => clearInterval(interval);
    }, []);

    return (
      <div className="flex flex-col items-center justify-center w-full h-full text-white text-center p-8">
        <motion.div
          animate={{ scale: [1, 1.2, 1], rotate: [0, 5, -5, 0] }}
          transition={{ repeat: Infinity, duration: 0.5 }}
          className="mb-8"
        >
          <Bell className="w-64 h-64 text-yellow-400 bell-shake-fast drop-shadow-[0_0_50px_rgba(251,191,36,0.5)]" />
        </motion.div>
        
        <motion.div
           initial={{ y: 50, opacity: 0 }}
           animate={{ y: 0, opacity: 1 }}
           className="space-y-6"
        >
          <h1 className="text-7xl font-black text-transparent bg-clip-text bg-gradient-to-r from-yellow-200 via-yellow-400 to-yellow-600 drop-shadow-xl">
            CHÚC MỪNG!
          </h1>
          <p className="text-3xl font-bold tracking-wide">Bạn đã Rung Chuông Vàng thành công!</p>
          
          <div className="pt-12">
            <button 
              onClick={() => setScreen(Screen.HOME)}
              className="bg-white/10 hover:bg-white/20 backdrop-blur-md border border-white/20 text-white px-12 py-5 rounded-3xl font-black text-2xl shadow-2xl transition-all flex items-center gap-4 mx-auto"
            >
              <RotateCcw size={32} className="text-yellow-400" />
              CHƠI LẠI
            </button>
          </div>
        </motion.div>
      </div>
    );
  };

  const GameOverScreen = () => {
    return (
      <div className="flex flex-col items-center justify-center w-full h-full text-white text-center p-8">
        <motion.div
          animate={{ scale: [1, 1.1, 1], rotate: [0, 2, -2, 0] }}
          transition={{ repeat: Infinity, duration: 2 }}
          className="mb-8"
        >
          <XCircle className="w-64 h-64 text-red-500 drop-shadow-[0_0_50px_rgba(239,68,68,0.5)]" />
        </motion.div>
        
        <motion.div
           initial={{ y: 50, opacity: 0 }}
           animate={{ y: 0, opacity: 1 }}
           className="space-y-6"
        >
          <h1 className="text-7xl font-black text-transparent bg-clip-text bg-gradient-to-r from-red-300 via-red-500 to-red-700 drop-shadow-xl">
            RẤT TIẾC!
          </h1>
          <p className="text-3xl font-bold tracking-wide">Không còn thí sinh nào trên sàn thi đấu!</p>
          
          <div className="pt-12">
            <button 
              onClick={() => setScreen(Screen.HOME)}
              className="bg-white/10 hover:bg-white/20 backdrop-blur-md border border-white/20 text-white px-12 py-5 rounded-3xl font-black text-2xl shadow-2xl transition-all flex items-center gap-4 mx-auto"
            >
              <RotateCcw size={32} className="text-red-400" />
              CHƠI LẠI
            </button>
          </div>
        </motion.div>
      </div>
    );
  };

  const TutorialScreen = () => {
    const steps = [
      {
        title: "Bắt đầu cuộc thi",
        content: "Hệ thống sẽ hiển thị các câu hỏi theo độ khó tăng dần. Mỗi câu hỏi có 10 giây để trả lời. Người dẫn chương trình điều khiển bộ đếm ngược bằng nút 'Rotate'."
      },
      {
        title: "Loại thí sinh",
        content: "Trong quá trình thi, nếu thí sinh trả lời sai, người quản trị click vào ô số thứ tự tương ứng trong sơ đồ để chuyển trạng thái sang màu đỏ (bị loại)."
      },
      {
        title: "Hiển thị đáp án",
        content: "Sau khi hết thời gian, hãy nhấn 'Hiển thị đáp án' để công bố kết quả đúng. Thí sinh còn lại trên sàn đấu sẽ tiếp tục bước sang câu hỏi kế tiếp."
      },
      {
        title: "Cứu trợ & Quản trị",
        content: "Người quản trị có thể chủ động đưa thí sinh quay lại sàn đấu bằng cách click vào ô đã bị loại. Bạn cũng có thể quản lý, import/export câu hỏi từ Excel."
      },
      {
        title: "Chiến thắng",
        content: "Người cuối cùng còn trụ lại sau câu hỏi cuối cùng sẽ được vinh danh Rung Chuông Vàng. Hiệu ứng pháo giấy và chuông vàng sẽ xuất hiện."
      }
    ];

    return (
      <div className="flex flex-col w-full h-full px-12 pb-12 pt-28 text-white overflow-hidden">
        <div className="flex items-center gap-6 mb-12">
          <button 
            onClick={() => setScreen(Screen.HOME)}
            className="bg-white/10 hover:bg-white/20 p-4 rounded-2xl"
          >
            <ChevronLeft size={32} />
          </button>
          <h1 className="text-5xl font-black italic">Hướng dẫn cách chơi</h1>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 overflow-y-auto pr-4 custom-scrollbar">
          {steps.map((step, idx) => (
            <motion.div 
              key={idx}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: idx * 0.1 }}
              className="bg-white/5 backdrop-blur-md rounded-3xl p-8 border border-white/10 hover:bg-white/10 transition-all group"
            >
              <div className="w-16 h-16 rounded-2xl bg-yellow-400 text-blue-900 flex items-center justify-center text-3xl font-black mb-6 group-hover:scale-110 transition-transform">
                {idx + 1}
              </div>
              <h3 className="text-2xl font-bold mb-4 text-yellow-400">{step.title}</h3>
              <p className="text-lg opacity-80 leading-relaxed">{step.content}</p>
            </motion.div>
          ))}
          
          <div className="flex items-center justify-center h-full p-8">
            <button 
              onClick={startNewGame}
              className="w-full bg-gradient-to-r from-yellow-400 to-yellow-600 text-blue-900 p-8 rounded-3xl font-black text-2xl shadow-2xl hover:scale-105 transition-all flex items-center justify-center gap-4"
            >
              <Play fill="currentColor" size={32} /> BẮT ĐẦU CHƠI NGAY!
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div 
      className="w-full h-full relative"
      style={{ background: settings.colors.background }}
    >
      <AnimatePresence mode="wait">
        <motion.div
          key={screen}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full h-full"
        >
          {screen === Screen.LOADING && <LoadingScreen />}
          {screen === Screen.HOME && <HomeScreen />}
          {screen === Screen.GAME && <GameScreen
            participants={participants}
            totalParticipantsCount={totalParticipantsCount}
            settings={settings}
            currentQuestionIdx={currentQuestionIdx}
            sortedQuestions={sortedQuestions}
            currentQuestion={currentQuestion}
            timer={timer}
            timerDuration={timerDuration}
            showAnswer={showAnswer}
            onGoHome={() => setScreen(Screen.HOME)}
            onToggleParticipant={toggleParticipant}
            onShowAnswer={() => setShowAnswer(true)}
            onSetTimer={setQuestionTimer}
            onNextQuestion={nextQuestion}
            onEndGame={handleEndGame}
          />}
          {screen === Screen.ADMIN && <AdminScreen />}
          {screen === Screen.VICTORY && <VictoryScreen />}
          {screen === Screen.GAME_OVER && <GameOverScreen />}
          {screen === Screen.TUTORIAL && <TutorialScreen />}
        </motion.div>
      </AnimatePresence>

      {/* Decorative gradient overlay */}
      <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(circle_at_50%_50%,rgba(255,255,255,0.05),transparent)] mix-blend-overlay"></div>

      {/* Global Header Logo */}
      <div className="absolute top-6 left-6 z-50 flex items-center gap-4 pointer-events-none">
        <img 
          src="/huy-hieu-cand.jpg" 
          alt="CAND Logo" 
          className="w-16 h-16 object-contain rounded-full shadow-[0_0_15px_rgba(255,255,255,0.3)] bg-white p-1"
        />
        <div className="flex flex-col text-white font-bold drop-shadow-md text-left">
          <span className="text-sm uppercase tracking-wider opacity-90">Công an tỉnh Đồng Tháp</span>
          <span className="text-lg uppercase text-yellow-400">Công an xã Thanh Bình</span>
        </div>
      </div>
    </div>
  );
}
