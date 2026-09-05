import { useState, useEffect, useRef, useCallback } from 'react';
import { Play, Pause, RotateCcw, Trophy, Volume2, VolumeX, Sparkles, ChevronDown, ChevronUp, Gamepad2 } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from './Card';
import Button from './Button';
import { useTheme } from '../context/ThemeContext';
import { getSnakeHighScore, saveSnakeHighScore } from '../api/odontologoService';
import { authService } from '../api/authService';

const GRID_SIZE = 20;
const CANVAS_SIZE = 400; // 400x400 internal resolution, scaled via CSS
const CELL_SIZE = CANVAS_SIZE / GRID_SIZE; // 20px per cell

const DIFFICULTIES = {
  facil: { name: 'Tranqui', speed: 130, points: 1 },
  normal: { name: 'Normal', speed: 95, points: 2 },
  rapido: { name: 'Pro', speed: 65, points: 3 },
};

// Web Audio API sintetizador de sonidos retro
const playSoundEffect = (type, enabled) => {
  if (!enabled) return;
  try {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return;
    const ctx = new AudioContext();

    if (type === 'eat') {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(520, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.1);
      gain.gain.setValueAtTime(0.15, ctx.currentTime);
      gain.gain.linearRampToValueAtTime(0.01, ctx.currentTime + 0.1);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.1);
    } else if (type === 'golden') {
      [523, 659, 783, 1046].forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, ctx.currentTime + idx * 0.05);
        gain.gain.setValueAtTime(0.12, ctx.currentTime + idx * 0.05);
        gain.gain.linearRampToValueAtTime(0.01, ctx.currentTime + idx * 0.05 + 0.08);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(ctx.currentTime + idx * 0.05);
        osc.stop(ctx.currentTime + idx * 0.05 + 0.08);
      });
    } else if (type === 'gameover') {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(320, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(110, ctx.currentTime + 0.35);
      gain.gain.setValueAtTime(0.2, ctx.currentTime);
      gain.gain.linearRampToValueAtTime(0.01, ctx.currentTime + 0.35);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.35);
    }
  } catch {
    // Si el navegador bloquea audio sin interacción previa
  }
};

const SnakeGame = () => {
  const { isDark } = useTheme();
  const [desplegado, setDesplegado] = useState(true);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [isGameOver, setIsGameOver] = useState(false);
  const [difficulty, setDifficulty] = useState('normal');
  const [score, setScore] = useState(0);
  const [teethEaten, setTeethEaten] = useState(0);
  const [soundEnabled, setSoundEnabled] = useState(true);

  // Clave de almacenamiento local por odontólogo (con fallback)
  const user = authService.getUserData();
  const storageKey = user?.id ? `odonloop-snake-highscore_${user.id}` : 'odonloop-snake-highscore';

  const [highScore, setHighScore] = useState(() => {
    try {
      const userStored = localStorage.getItem(storageKey);
      const genericStored = localStorage.getItem('odonloop-snake-highscore');
      return parseInt(userStored || genericStored || '0', 10);
    } catch {
      return 0;
    }
  });

  // Sincronizar el récord con el backend de Django
  useEffect(() => {
    let isMounted = true;
    const syncHighScore = async () => {
      try {
        const res = await getSnakeHighScore();
        if (isMounted && res && typeof res.high_score === 'number') {
          const backendScore = res.high_score;
          setHighScore((currentLocal) => {
            if (backendScore > currentLocal) {
              try {
                localStorage.setItem(storageKey, backendScore.toString());
              } catch {}
              return backendScore;
            } else if (currentLocal > backendScore && currentLocal > 0) {
              // Sincronizar récord local previo al backend
              saveSnakeHighScore(currentLocal);
            }
            return currentLocal;
          });
        }
      } catch (err) {
        console.error('Error al sincronizar récord con backend:', err);
      }
    };

    syncHighScore();
    return () => {
      isMounted = false;
    };
  }, [storageKey]);

  const canvasRef = useRef(null);
  const gameLoopRef = useRef(null);

  // Estado del juego en refs para animación fluida sin stale closures
  const snakeRef = useRef([
    { x: 10, y: 10 },
    { x: 9, y: 10 },
    { x: 8, y: 10 },
  ]);
  const dirRef = useRef({ x: 1, y: 0 });
  const nextDirRef = useRef({ x: 1, y: 0 });
  const foodRef = useRef({ x: 15, y: 10, isGolden: false });
  const goldenTimerRef = useRef(null);

  // Generar comida que no colisione con el cuerpo
  const generateFood = useCallback((isGolden = false) => {
    let newX, newY;
    let collision;
    do {
      newX = Math.floor(Math.random() * GRID_SIZE);
      newY = Math.floor(Math.random() * GRID_SIZE);
      collision = snakeRef.current.some((seg) => seg.x === newX && seg.y === newY);
    } while (collision);

    return { x: newX, y: newY, isGolden };
  }, []);

  // Iniciar partida
  const startGame = () => {
    snakeRef.current = [
      { x: 10, y: 10 },
      { x: 9, y: 10 },
      { x: 8, y: 10 },
    ];
    dirRef.current = { x: 1, y: 0 };
    nextDirRef.current = { x: 1, y: 0 };
    foodRef.current = generateFood(false);
    setScore(0);
    setTeethEaten(0);
    setIsGameOver(false);
    setIsPaused(false);
    setIsPlaying(true);
  };

  // Pausar / Reanudar
  const togglePause = () => {
    if (!isPlaying || isGameOver) return;
    setIsPaused((prev) => !prev);
  };

  // Cambio de dirección seguro (evita ir en sentido contrario de inmediato)
  const changeDirection = useCallback(
    (newDir) => {
      const cur = dirRef.current;
      if (newDir.x !== 0 && cur.x === -newDir.x) return;
      if (newDir.y !== 0 && cur.y === -newDir.y) return;
      nextDirRef.current = newDir;
    },
    []
  );

  // Manejador de teclado
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!desplegado) return;

      const keys = ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'KeyW', 'KeyS', 'KeyA', 'KeyD', 'Space'];
      if (keys.includes(e.code)) {
        // Prevenir scroll en la pantalla cuando se juega
        if (isPlaying && !isGameOver) {
          e.preventDefault();
        }
      }

      if (e.code === 'Space') {
        if (!isPlaying) startGame();
        else togglePause();
        return;
      }

      if (!isPlaying || isPaused || isGameOver) return;

      switch (e.code) {
        case 'ArrowUp':
        case 'KeyW':
          changeDirection({ x: 0, y: -1 });
          break;
        case 'ArrowDown':
        case 'KeyS':
          changeDirection({ x: 0, y: 1 });
          break;
        case 'ArrowLeft':
        case 'KeyA':
          changeDirection({ x: -1, y: 0 });
          break;
        case 'ArrowRight':
        case 'KeyD':
          changeDirection({ x: 1, y: 0 });
          break;
        default:
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown, { passive: false });
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isPlaying, isPaused, isGameOver, desplegado, changeDirection]);

  // Loop del juego
  useEffect(() => {
    if (!isPlaying || isPaused || isGameOver) {
      if (gameLoopRef.current) clearInterval(gameLoopRef.current);
      return;
    }

    const interval = DIFFICULTIES[difficulty].speed;

    gameLoopRef.current = setInterval(() => {
      // 1. Actualizar dirección
      dirRef.current = nextDirRef.current;
      const curHead = snakeRef.current[0];
      const newHead = {
        x: curHead.x + dirRef.current.x,
        y: curHead.y + dirRef.current.y,
      };

      // 2. Colisión con paredes
      if (
        newHead.x < 0 ||
        newHead.x >= GRID_SIZE ||
        newHead.y < 0 ||
        newHead.y >= GRID_SIZE
      ) {
        handleGameOver();
        return;
      }

      // 3. Colisión consigo misma
      if (snakeRef.current.some((seg) => seg.x === newHead.x && seg.y === newHead.y)) {
        handleGameOver();
        return;
      }

      // 4. Comer diente
      const ateFood = newHead.x === foodRef.current.x && newHead.y === foodRef.current.y;
      const isGolden = foodRef.current.isGolden;

      const newSnake = [newHead, ...snakeRef.current];

      if (ateFood) {
        const addedPoints = isGolden ? DIFFICULTIES[difficulty].points * 5 : DIFFICULTIES[difficulty].points;
        setScore((prev) => {
          const updated = prev + addedPoints;
          if (updated > highScore) {
            setHighScore(updated);
            try {
              localStorage.setItem(storageKey, updated.toString());
            } catch {}
            saveSnakeHighScore(updated);
          }
          return updated;
        });

        const newCount = teethEaten + 1;
        setTeethEaten(newCount);

        playSoundEffect(isGolden ? 'golden' : 'eat', soundEnabled);

        // Cada 5 muelas comidas, probabilidad de muela dorada
        if (newCount % 5 === 0 && !isGolden) {
          foodRef.current = generateFood(true);
          // La muela dorada expira en 6 segundos si no se come
          if (goldenTimerRef.current) clearTimeout(goldenTimerRef.current);
          goldenTimerRef.current = setTimeout(() => {
            if (foodRef.current.isGolden) {
              foodRef.current = generateFood(false);
            }
          }, 6000);
        } else {
          foodRef.current = generateFood(false);
        }
      } else {
        newSnake.pop(); // Quitar cola
      }

      snakeRef.current = newSnake;
      draw();
    }, interval);

    return () => {
      if (gameLoopRef.current) clearInterval(gameLoopRef.current);
    };
  }, [isPlaying, isPaused, isGameOver, difficulty, highScore, soundEnabled, teethEaten, generateFood]);

  const handleGameOver = () => {
    setIsGameOver(true);
    setIsPlaying(false);
    playSoundEffect('gameover', soundEnabled);
    if (gameLoopRef.current) clearInterval(gameLoopRef.current);
  };

  // Renderizado en canvas
  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Fondo del tablero
    ctx.fillStyle = isDark ? '#090d16' : '#f1f5f9';
    ctx.fillRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);

    // Rejilla sutil
    ctx.strokeStyle = isDark ? 'rgba(255, 255, 255, 0.03)' : 'rgba(0, 0, 0, 0.04)';
    ctx.lineWidth = 1;
    for (let i = 0; i <= GRID_SIZE; i++) {
      ctx.beginPath();
      ctx.moveTo(i * CELL_SIZE, 0);
      ctx.lineTo(i * CELL_SIZE, CANVAS_SIZE);
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(0, i * CELL_SIZE);
      ctx.lineTo(CANVAS_SIZE, i * CELL_SIZE);
      ctx.stroke();
    }

    // Dibujar Comida (Diente o Diente Dorado)
    const food = foodRef.current;
    const fx = food.x * CELL_SIZE + CELL_SIZE / 2;
    const fy = food.y * CELL_SIZE + CELL_SIZE / 2;

    ctx.save();
    ctx.font = `${CELL_SIZE * 0.9}px sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    if (food.isGolden) {
      // Resplandor para el diente dorado
      ctx.shadowColor = '#f59e0b';
      ctx.shadowBlur = 12;
      ctx.fillText('✨🦷', fx, fy);
    } else {
      ctx.fillText('🦷', fx, fy);
    }
    ctx.restore();

    // Dibujar Serpiente
    const snake = snakeRef.current;
    snake.forEach((segment, index) => {
      const sx = segment.x * CELL_SIZE;
      const sy = segment.y * CELL_SIZE;
      const isHead = index === 0;

      ctx.save();
      if (isHead) {
        // Cabeza con gradiente esmeralda/cyan
        const grad = ctx.createLinearGradient(sx, sy, sx + CELL_SIZE, sy + CELL_SIZE);
        grad.addColorStop(0, '#10b981');
        grad.addColorStop(1, '#06b6d4');
        ctx.fillStyle = grad;
        ctx.shadowColor = 'rgba(16, 185, 129, 0.4)';
        ctx.shadowBlur = 6;
      } else {
        // Cuerpo con degradado suave
        const ratio = index / snake.length;
        ctx.fillStyle = isDark
          ? `rgba(52, 211, 153, ${0.9 - ratio * 0.4})`
          : `rgba(16, 185, 129, ${0.95 - ratio * 0.4})`;
      }

      // Esquinas redondeadas
      const radius = isHead ? 6 : 4;
      ctx.beginPath();
      ctx.roundRect(sx + 1, sy + 1, CELL_SIZE - 2, CELL_SIZE - 2, radius);
      ctx.fill();

      // Ojos en la cabeza
      if (isHead) {
        ctx.fillStyle = '#ffffff';
        const dir = dirRef.current;
        let eye1 = { x: sx + 5, y: sy + 5 };
        let eye2 = { x: sx + 15, y: sy + 5 };

        if (dir.x === 1) {
          eye1 = { x: sx + 13, y: sy + 5 };
          eye2 = { x: sx + 13, y: sy + 15 };
        } else if (dir.x === -1) {
          eye1 = { x: sx + 7, y: sy + 5 };
          eye2 = { x: sx + 7, y: sy + 15 };
        } else if (dir.y === 1) {
          eye1 = { x: sx + 5, y: sy + 13 };
          eye2 = { x: sx + 15, y: sy + 13 };
        }

        ctx.beginPath();
        ctx.arc(eye1.x, eye1.y, 2.5, 0, Math.PI * 2);
        ctx.arc(eye2.x, eye2.y, 2.5, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#0f172a';
        ctx.beginPath();
        ctx.arc(eye1.x, eye1.y, 1.2, 0, Math.PI * 2);
        ctx.arc(eye2.x, eye2.y, 1.2, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.restore();
    });
  }, [isDark]);

  // Dibujar en el canvas al montar o cambiar de tema
  useEffect(() => {
    draw();
  }, [draw]);

  return (
    <div className="mb-8 animate-fadeIn">
      <Card className="border border-emerald-500/30 overflow-hidden shadow-xl">
        {/* Cabecera del juego con botón plegable */}
        <div
          onClick={() => setDesplegado(!desplegado)}
          className="p-5 sm:p-6 bg-gradient-to-r from-emerald-950/60 via-slate-900/60 to-teal-950/60 dark:from-emerald-950/60 dark:via-slate-900/60 dark:to-teal-950/60 cursor-pointer flex items-center justify-between transition-colors hover:bg-emerald-950/40"
        >
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
              <Gamepad2 className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg sm:text-xl font-bold text-white">Snake Odontológico</h2>
                <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 uppercase tracking-wider">
                  Break Odonto
                </span>
              </div>
              <p className="text-xs text-slate-300 dark:text-slate-400 mt-0.5">
                ¡Tomate un descanso entre consultas! Atrapá muelitas 🦷 para sumar puntos y batir tu récord.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800/80 border border-slate-700/60 text-amber-300 font-bold text-xs">
              <Trophy className="w-3.5 h-3.5 text-amber-400" />
              <span>Récord: {highScore}</span>
            </div>
            <button
              type="button"
              className="p-2 text-slate-400 hover:text-white rounded-lg transition-colors"
              aria-label={desplegado ? 'Ocultar juego' : 'Mostrar juego'}
            >
              {desplegado ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Contenido interactivo */}
        {desplegado && (
          <CardContent className="p-6 sm:p-8">
            <div className="flex flex-col lg:flex-row items-center justify-center gap-8">
              {/* Contenedor del Tablero */}
              <div className="relative flex flex-col items-center">
                {/* Panel de Puntuación */}
                <div className="w-full flex items-center justify-between mb-3 px-2 text-xs font-semibold">
                  <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300">
                    <span>🦷 Muelitas: <strong className="text-emerald-500 font-bold">{teethEaten}</strong></span>
                    <span className="text-slate-400">|</span>
                    <span>Puntos: <strong className="text-blue-500 font-bold text-sm">{score}</strong></span>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setSoundEnabled(!soundEnabled)}
                      className={`p-1.5 rounded-lg transition-colors ${
                        soundEnabled
                          ? 'text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/10'
                          : 'text-slate-400 hover:bg-slate-500/10'
                      }`}
                      title={soundEnabled ? 'Silenciar sonidos' : 'Activar sonidos'}
                    >
                      {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
                    </button>
                    <div className="flex items-center gap-1 text-amber-500 font-bold">
                      <Trophy className="w-4 h-4" />
                      <span>{highScore}</span>
                    </div>
                  </div>
                </div>

                {/* Canvas con overlay interactivo */}
                <div className="relative rounded-2xl overflow-hidden border-2 border-slate-300 dark:border-slate-800 shadow-2xl bg-slate-900">
                  <canvas
                    ref={canvasRef}
                    width={CANVAS_SIZE}
                    height={CANVAS_SIZE}
                    className="w-[300px] h-[300px] sm:w-[360px] sm:h-[360px] block"
                  />

                  {/* Overlay cuando no está jugando */}
                  {!isPlaying && !isGameOver && (
                    <div className="absolute inset-0 bg-slate-950/75 backdrop-blur-xs flex flex-col items-center justify-center text-center p-6 animate-fadeIn">
                      <div className="text-4xl mb-2 animate-bounce">🐍🦷</div>
                      <h3 className="text-xl font-extrabold text-white mb-1">¿Listo para una partida?</h3>
                      <p className="text-xs text-slate-300 max-w-xs mb-5">
                        Usa las flechitas o las teclas WASD para guiar a la viborita y recolectar las muelas.
                      </p>
                      <Button
                        variant="primary"
                        onClick={startGame}
                        className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl shadow-lg shadow-emerald-600/30 flex items-center gap-2"
                      >
                        <Play className="w-4 h-4 fill-white" />
                        Jugar Ahora
                      </Button>
                    </div>
                  )}

                  {/* Overlay Pausa */}
                  {isPlaying && isPaused && (
                    <div className="absolute inset-0 bg-slate-950/70 backdrop-blur-xs flex flex-col items-center justify-center text-center p-6 animate-fadeIn">
                      <div className="text-3xl mb-2">⏸️</div>
                      <h3 className="text-xl font-bold text-white mb-3">Juego en Pausa</h3>
                      <Button
                        variant="primary"
                        onClick={togglePause}
                        className="px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl flex items-center gap-2"
                      >
                        <Play className="w-4 h-4 fill-white" />
                        Reanudar
                      </Button>
                    </div>
                  )}

                  {/* Overlay Game Over */}
                  {isGameOver && (
                    <div className="absolute inset-0 bg-slate-950/85 backdrop-blur-xs flex flex-col items-center justify-center text-center p-6 animate-fadeIn">
                      <div className="text-4xl mb-1">💥</div>
                      <h3 className="text-2xl font-black text-red-400 mb-1">¡Fin del Juego!</h3>
                      <p className="text-xs text-slate-300 mb-2">
                        Atrapaste <strong className="text-white font-bold">{teethEaten}</strong> muelas y sumaste{' '}
                        <strong className="text-emerald-400 font-bold">{score} puntos</strong>.
                      </p>
                      {score === highScore && score > 0 && (
                        <div className="mb-4 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 text-xs font-bold animate-pulse">
                          <Sparkles className="w-3.5 h-3.5 fill-amber-300" />
                          ¡Nuevo récord personal!
                        </div>
                      )}
                      <Button
                        variant="primary"
                        onClick={startGame}
                        className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl shadow-lg shadow-emerald-600/30 flex items-center gap-2"
                      >
                        <RotateCcw className="w-4 h-4" />
                        Intentar de Nuevo
                      </Button>
                    </div>
                  )}
                </div>

                {/* Controles de juego debajo del tablero */}
                <div className="flex items-center gap-3 mt-4">
                  {isPlaying && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={togglePause}
                      className="flex items-center gap-1.5 text-xs"
                    >
                      {isPaused ? <Play className="w-3.5 h-3.5" /> : <Pause className="w-3.5 h-3.5" />}
                      {isPaused ? 'Reanudar' : 'Pausar'}
                    </Button>
                  )}
                  {isPlaying && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={startGame}
                      className="flex items-center gap-1.5 text-xs text-red-400 hover:text-red-300"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      Reiniciar
                    </Button>
                  )}
                </div>
              </div>

              {/* Panel Lateral: Dificultad, Teclas y D-Pad para táctil */}
              <div className="flex flex-col items-center lg:items-start gap-5 max-w-xs w-full">
                {/* Selector de Dificultad */}
                <div className="w-full">
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-2">
                    Velocidad / Dificultad:
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {Object.entries(DIFFICULTIES).map(([key, item]) => (
                      <button
                        key={key}
                        type="button"
                        onClick={() => {
                          setDifficulty(key);
                          if (isPlaying) startGame();
                        }}
                        className={`py-2 px-2 text-xs font-bold rounded-xl transition-all ${
                          difficulty === key
                            ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20'
                            : 'bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700'
                        }`}
                      >
                        {item.name}
                      </button>
                    ))}
                  </div>
                </div>

                {/* D-Pad táctil / para clicks */}
                <div className="w-full flex flex-col items-center">
                  <p className="text-[11px] font-semibold text-slate-500 mb-2">Controles en pantalla:</p>
                  <div className="flex flex-col items-center gap-1">
                    <button
                      type="button"
                      onClick={() => changeDirection({ x: 0, y: -1 })}
                      className="w-12 h-12 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl flex items-center justify-center font-bold text-lg border border-slate-300 dark:border-slate-700 shadow-xs active:scale-95 transition-all cursor-pointer"
                      aria-label="Arriba"
                    >
                      ▲
                    </button>
                    <div className="flex gap-1">
                      <button
                        type="button"
                        onClick={() => changeDirection({ x: -1, y: 0 })}
                        className="w-12 h-12 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl flex items-center justify-center font-bold text-lg border border-slate-300 dark:border-slate-700 shadow-xs active:scale-95 transition-all cursor-pointer"
                        aria-label="Izquierda"
                      >
                        ◀
                      </button>
                      <button
                        type="button"
                        onClick={() => changeDirection({ x: 0, y: 1 })}
                        className="w-12 h-12 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl flex items-center justify-center font-bold text-lg border border-slate-300 dark:border-slate-700 shadow-xs active:scale-95 transition-all cursor-pointer"
                        aria-label="Abajo"
                      >
                        ▼
                      </button>
                      <button
                        type="button"
                        onClick={() => changeDirection({ x: 1, y: 0 })}
                        className="w-12 h-12 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl flex items-center justify-center font-bold text-lg border border-slate-300 dark:border-slate-700 shadow-xs active:scale-95 transition-all cursor-pointer"
                        aria-label="Derecha"
                      >
                        ▶
                      </button>
                    </div>
                  </div>
                </div>

                {/* Atajos de teclado */}
                <div className="w-full text-[11px] text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-900/60 p-3 rounded-xl border border-slate-200 dark:border-slate-800">
                  <span className="font-bold text-slate-700 dark:text-slate-300 block mb-1">Teclas admitidas:</span>
                  <div className="flex flex-wrap gap-1.5 mt-1">
                    <span className="bg-white dark:bg-slate-800 px-1.5 py-0.5 rounded border border-slate-200 dark:border-slate-700 text-[10px] font-mono">
                      Flechas / WASD
                    </span>
                    <span className="bg-white dark:bg-slate-800 px-1.5 py-0.5 rounded border border-slate-200 dark:border-slate-700 text-[10px] font-mono">
                      Espacio (Pausa)
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        )}
      </Card>
    </div>
  );
};

export default SnakeGame;
