"use client";

import { useEffect, useRef, useState } from "react";
import { submitGameScore } from "@/app/actions";

// Canvas and gameplay dimensions.
const W = 360;
const H = 640;
const FLOOR_H = 70;
const GROUND_Y = H - FLOOR_H;

// Physics based on barzin144/FlappyBird.
const GRAVITY = 0.5;
const LIFT = -8;
const MAX_VEL = 15;
const BIRD_X = 75;
const BIRD_W = 44;
const BIRD_H = 32;

// Pipes.
const PIPE_W = 65;
const MIN_PIPE_GAP = 155;
const MAX_PIPE_GAP = 195;
const MIN_PIPE_H = 80;
const MAX_PIPE_H = 290;
const BASE_SPEED = 2;
const FIRST_PIPE_DELAY = 110;
const MIN_DIST = 220;
const MAX_DIST = 330;

// Custom graphics — drop any of these PNG files into /public/games/:
//   bg.png        — full background image
//   bird.png      — single custom bird (static, all frames)
//   bird1.png … bird4.png — 4-frame animated bird (used if all 4 present)
//   pipe.png      — pipe body (opening assumed at top; top pipe is flipped)
//   floor.png     — floor tile (tiled horizontally)
//   profile.png   — circular avatar that replaces the bird entirely
// Sprite sheet fallback (used when individual files are absent):
//   sprite.png    — original sprite sheet
const IMG_BG      = "/games/bg.png";
const IMG_SPRITE  = "/games/sprite.png";
const IMG_PROFILE = "/games/profile.png";
const IMG_BIRD    = "/games/bird.png";
const IMG_BIRD1   = "/games/bird1.png";
const IMG_BIRD2   = "/games/bird2.png";
const IMG_BIRD3   = "/games/bird3.png";
const IMG_BIRD4   = "/games/bird4.png";
const IMG_PIPE    = "/games/pipe.png";
const IMG_FLOOR   = "/games/floor.png";

// Sprite sheet source rectangles (from reference repo).
const SPRITE_BIRD_W = 70;
const SPRITE_BIRD_H = 50;
const BIRD_FRAME_X = [200, 272, 344, 416];
const BIRD_FRAME_Y = 0;

const SPRITE_PIPE_W = 100;
const SPRITE_PIPE_X_TOP = 100;
const SPRITE_PIPE_X_BOTTOM = 0;
const SPRITE_PIPE_Y_BASE = 500;

const SPRITE_FLOOR_X = 200;
const SPRITE_FLOOR_Y = 60;
const SPRITE_FLOOR_W = 30;
const SPRITE_FLOOR_H = 150;

type Phase = "idle" | "playing" | "dead";
interface Pipe {
  x: number;
  topH: number;
  gap: number;
  passed: boolean;
}

function spawnPipe(): Pipe {
  const gap =
    MIN_PIPE_GAP + Math.floor(Math.random() * (MAX_PIPE_GAP - MIN_PIPE_GAP + 1));
  const topH =
    MIN_PIPE_H + Math.floor(Math.random() * (MAX_PIPE_H - MIN_PIPE_H + 1));
  return { x: W + 6, topH, gap, passed: false };
}

export function FlappyBird({
  playerName,
  onScoreSubmitted,
}: {
  playerName: string;
  onScoreSubmitted?: () => void;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const resetRef = useRef<() => void>(() => {});
  const deadScoreRef = useRef(0);

  const [gamePhase, setGamePhase] = useState<Phase>("idle");
  const [deadScore, setDeadScore] = useState(0);
  const [highScore, setHighScore] = useState(0);
  const [submitMsg, setSubmitMsg] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Auto-submit as soon as the game dies so a new best is never missed.
  useEffect(() => {
    if (gamePhase !== "dead") return;
    let cancelled = false;
    setSubmitMsg("");
    setSubmitting(true);
    submitGameScore("flappy", deadScoreRef.current, playerName).then((result) => {
      if (cancelled) return;
      if (result.error) {
        setSubmitMsg("Error: " + result.error);
      } else {
        setSubmitMsg(result.skipped ? "" : "New best saved! 🎉");
        if (!result.skipped) onScoreSubmitted?.();
      }
      setSubmitting(false);
    });
    return () => { cancelled = true; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gamePhase]);

  // Preload images; if unavailable, fallback drawing is used.
  const imgs = useRef<Record<string, HTMLImageElement | null>>({
    bg: null, sprite: null, profile: null,
    bird: null, bird1: null, bird2: null, bird3: null, bird4: null,
    pipe: null, floor: null,
  });

  useEffect(() => {
    const tryLoad = (key: string, src: string) => {
      const img = new Image();
      img.onload = () => { imgs.current[key] = img; };
      img.src = src;
    };
    tryLoad("bg",      IMG_BG);
    tryLoad("sprite",  IMG_SPRITE);
    tryLoad("profile", IMG_PROFILE);
    tryLoad("bird",   IMG_BIRD);
    tryLoad("bird1",  IMG_BIRD1);
    tryLoad("bird2",  IMG_BIRD2);
    tryLoad("bird3",  IMG_BIRD3);
    tryLoad("bird4",  IMG_BIRD4);
    tryLoad("pipe",   IMG_PIPE);
    tryLoad("floor",  IMG_FLOOR);
  }, []);

  // Main game loop.
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d")!;
    let raf: number;

    // Mutable state stays inside this closure for animation performance.
    let frame = 0;
    let phase: Phase = "idle";

    // bird
    let birdY = GROUND_Y / 2 - BIRD_H / 2;
    let birdVY = 0;
    let birdAngle = 0;
    let birdDead = false;

    // pipes
    let pipes: Pipe[] = [];
    let nextSpawnDist = 0;

    // floor scroll
    let floorX = 0;

    // score / level
    let score = 0;
    const level = () => Math.floor(score / 10);
    const pipeSpeed = () => BASE_SPEED + level();

    const setPhase = (p: Phase) => {
      phase = p;
      setGamePhase(p);
    };

    const reset = () => {
      frame = 0;
      birdY = GROUND_Y / 2 - BIRD_H / 2;
      birdVY = 0;
      birdAngle = 0;
      birdDead = false;
      pipes = [];
      nextSpawnDist = 0;
      floorX = 0;
      score = 0;
      setPhase("idle");
      setSubmitMsg("");
    };
    resetRef.current = reset;

    const jump = () => {
      if (phase === "dead") {
        reset();
        return;
      }
      if (phase === "idle") setPhase("playing");
      if (!birdDead) {
        birdVY = LIFT;
        birdAngle = -25;
      }
    };

    // Drawing helpers.

    const drawBg = () => {
      if (imgs.current.bg) {
        ctx.drawImage(imgs.current.bg, 0, 0, W, H);
        return;
      }
      const gr = ctx.createLinearGradient(0, 0, 0, GROUND_Y);
      gr.addColorStop(0, "#0f172a");
      gr.addColorStop(0.6, "#1e3a5f");
      gr.addColorStop(1, "#063a2a");
      ctx.fillStyle = gr;
      ctx.fillRect(0, 0, W, H);
    };

    const drawFloor = () => {
      // Priority: floor.png > sprite sheet > canvas fallback
      if (imgs.current.floor) {
        const tileW = imgs.current.floor.naturalWidth || 30;
        const tilesNeeded = Math.ceil(W / tileW) + 2;
        for (let i = 0; i < tilesNeeded; i++) {
          ctx.drawImage(imgs.current.floor, floorX + i * tileW, GROUND_Y, tileW, FLOOR_H);
        }
        return;
      }
      if (imgs.current.sprite) {
        const tilesNeeded = Math.ceil(W / 30) + 2;
        for (let i = 0; i < tilesNeeded; i++) {
          ctx.drawImage(
            imgs.current.sprite,
            SPRITE_FLOOR_X,
            SPRITE_FLOOR_Y,
            SPRITE_FLOOR_W,
            SPRITE_FLOOR_H,
            floorX + i * 30,
            GROUND_Y,
            30,
            FLOOR_H,
          );
        }
        return;
      }
      ctx.fillStyle = "#78350f";
      ctx.fillRect(0, GROUND_Y, W, FLOOR_H);
      ctx.fillStyle = "#166534";
      ctx.fillRect(0, GROUND_Y, W, 9);
    };

    const drawBird = () => {
      ctx.save();
      const cx = BIRD_X + BIRD_W / 2;
      const cy = birdY + BIRD_H / 2;
      ctx.translate(cx, cy);
      ctx.rotate((Math.PI / 180) * birdAngle);

      if (imgs.current.profile) {
        // Circular avatar — highest priority
        ctx.save();
        ctx.beginPath();
        ctx.arc(0, 0, BIRD_H / 2, 0, Math.PI * 2);
        ctx.closePath();
        ctx.clip();
        ctx.drawImage(imgs.current.profile, -BIRD_W / 2, -BIRD_H / 2, BIRD_W, BIRD_H);
        ctx.restore();
        ctx.strokeStyle = "#f8fafc";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(0, 0, BIRD_H / 2, 0, Math.PI * 2);
        ctx.stroke();
      } else if (
        imgs.current.bird1 && imgs.current.bird2 &&
        imgs.current.bird3 && imgs.current.bird4
      ) {
        // 4-frame animated custom bird
        const frameIndex = Math.floor(frame / 8) % 4;
        const frames = [imgs.current.bird1, imgs.current.bird2, imgs.current.bird3, imgs.current.bird4];
        ctx.drawImage(frames[frameIndex]!, -BIRD_W / 2, -BIRD_H / 2, BIRD_W, BIRD_H);
      } else if (imgs.current.bird) {
        // Single static custom bird
        ctx.drawImage(imgs.current.bird, -BIRD_W / 2, -BIRD_H / 2, BIRD_W, BIRD_H);
      } else if (imgs.current.sprite) {
        const frameIndex = Math.floor(frame / 8) % 4;
        ctx.drawImage(
          imgs.current.sprite,
          BIRD_FRAME_X[frameIndex],
          BIRD_FRAME_Y,
          SPRITE_BIRD_W,
          SPRITE_BIRD_H,
          -BIRD_W / 2,
          -BIRD_H / 2,
          BIRD_W,
          BIRD_H,
        );
      } else {
        const flapFrame = Math.floor(frame / 8) % 4;
        const wingDYArr = [-6, -10, -4, 2];
        const wingDY = wingDYArr[flapFrame];

        ctx.fillStyle = "#fbbf24";
        ctx.beginPath();
        ctx.ellipse(0, 0, BIRD_W / 2, BIRD_H / 2, 0, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = "#f59e0b";
        ctx.beginPath();
        ctx.ellipse(-3, wingDY, 13, 7, 0.3, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = "#fff";
        ctx.beginPath();
        ctx.arc(11, -5, 6, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = "#1e293b";
        ctx.beginPath();
        ctx.arc(12, -5, 3, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = "#ef4444";
        ctx.beginPath();
        ctx.moveTo(BIRD_W / 2 - 3, -3);
        ctx.lineTo(BIRD_W / 2 + 9, -5);
        ctx.lineTo(BIRD_W / 2 + 9, 2);
        ctx.closePath();
        ctx.fill();
      }
      ctx.restore();
    };

    const drawPipe = (p: Pipe) => {
      const botY = p.topH + p.gap;

      // Priority: pipe.png > sprite sheet > canvas fallback
      if (imgs.current.pipe) {
        const bottomH = Math.max(0, GROUND_Y - botY);
        // Top pipe: flip vertically so the opening faces downward
        ctx.save();
        ctx.translate(p.x + PIPE_W / 2, p.topH / 2);
        ctx.scale(1, -1);
        ctx.drawImage(imgs.current.pipe, -PIPE_W / 2, -p.topH / 2, PIPE_W, p.topH);
        ctx.restore();
        // Bottom pipe: normal orientation, opening faces upward
        ctx.drawImage(imgs.current.pipe, p.x, botY, PIPE_W, bottomH);
        return;
      }

      if (imgs.current.sprite) {
        const topSrcY = Math.max(0, SPRITE_PIPE_Y_BASE - p.topH);
        const bottomH = Math.max(0, GROUND_Y - botY);

        // Top pipe uses right pipe column in sprite.
        ctx.drawImage(
          imgs.current.sprite,
          SPRITE_PIPE_X_TOP,
          topSrcY,
          SPRITE_PIPE_W,
          p.topH,
          p.x,
          0,
          PIPE_W,
          p.topH,
        );

        // Bottom pipe uses left pipe column in sprite.
        ctx.drawImage(
          imgs.current.sprite,
          SPRITE_PIPE_X_BOTTOM,
          0,
          SPRITE_PIPE_W,
          bottomH,
          p.x,
          botY,
          PIPE_W,
          bottomH,
        );
        return;
      }

      const grad = ctx.createLinearGradient(p.x, 0, p.x + PIPE_W, 0);
      grad.addColorStop(0, "#14532d");
      grad.addColorStop(0.35, "#22c55e");
      grad.addColorStop(1, "#14532d");
      ctx.fillStyle = grad;
      const cap = 18;

      if (p.topH > cap) ctx.fillRect(p.x + 6, 0, PIPE_W - 12, p.topH - cap);
      ctx.fillRect(p.x, p.topH - cap, PIPE_W, cap);
      ctx.fillRect(p.x, botY, PIPE_W, cap);
      if (GROUND_Y - botY > cap) {
        ctx.fillRect(p.x + 6, botY + cap, PIPE_W - 12, GROUND_Y - botY - cap);
      }
    };

    // Box collision similar to the reference implementation.
    const checkCrash = (): boolean => {
      const bx1 = BIRD_X + 5;
      const bx2 = BIRD_X + BIRD_W - 5;
      const by1 = birdY + 4;
      const by2 = birdY + BIRD_H - 4;

      if (by2 >= GROUND_Y || by1 <= 0) return true;

      for (const p of pipes) {
        const px1 = p.x;
        const px2 = p.x + PIPE_W;
        if (bx1 < px2 && bx2 > px1) {
          if (by1 < p.topH || by2 > p.topH + p.gap) return true;
        }
      }
      return false;
    };

    // Main render/update loop.
    const loop = () => {
      ctx.clearRect(0, 0, W, H);
      drawBg();

      if (phase === "playing" && !birdDead) {
        frame++;

        birdVY += GRAVITY;
        if (birdVY > MAX_VEL) birdVY = MAX_VEL;
        birdY += birdVY;

        if (birdVY > 12) birdAngle = 90;
        else if (birdVY > 11) birdAngle = 67.5;
        else if (birdVY > 10) birdAngle = 45;
        else if (birdVY > 9) birdAngle = 22.5;
        else if (birdVY > 8) birdAngle = 0;

        floorX -= pipeSpeed();
        if (floorX <= -30) floorX = 0;

        for (const p of pipes) {
          p.x -= pipeSpeed();
          if (!p.passed && p.x + PIPE_W < BIRD_X) {
            p.passed = true;
            score++;
          }
        }
        pipes = pipes.filter((p) => p.x + PIPE_W > -10);

        const last = pipes[pipes.length - 1];
        const shouldSpawn = last
          ? W + 6 - last.x > nextSpawnDist
          : frame >= FIRST_PIPE_DELAY;

        if (shouldSpawn) {
          pipes.push(spawnPipe());
          nextSpawnDist =
            MIN_DIST + Math.floor(Math.random() * (MAX_DIST - MIN_DIST + 1));
        }

        if (checkCrash()) {
          birdDead = true;
          deadScoreRef.current = score;
          setDeadScore(score);
          setHighScore((prev) => Math.max(prev, score));
          setPhase("dead");
        }
      } else if (phase === "idle") {
        floorX -= 1;
        if (floorX <= -30) floorX = 0;
      }

      for (const p of pipes) drawPipe(p);
      drawFloor();
      drawBird();

      if (phase === "playing") {
        const lvl = level();
        ctx.fillStyle = "rgba(0,0,0,0.5)";
        ctx.fillRect(W / 2 - 36, 12, 72, lvl > 0 ? 46 : 36);
        ctx.fillStyle = "#fff";
        ctx.font = "bold 26px 'Courier New', monospace";
        ctx.textAlign = "center";
        ctx.fillText(String(score), W / 2, 38);
        if (lvl > 0) {
          ctx.fillStyle = "#fde68a";
          ctx.font = "bold 12px sans-serif";
          ctx.fillText(`Level ${lvl + 1}`, W / 2, 52);
        }
      }

      if (phase === "idle") {
        ctx.fillStyle = "rgba(0,0,0,0.48)";
        ctx.fillRect(0, 0, W, GROUND_Y);
        ctx.fillStyle = "#f1f5f9";
        ctx.font = "bold 28px sans-serif";
        ctx.textAlign = "center";
        ctx.fillText("Flappy Room", W / 2, GROUND_Y / 2 - 20);
        ctx.fillStyle = "#94a3b8";
        ctx.font = "15px sans-serif";
        ctx.fillText("Tap  /  Space  to start", W / 2, GROUND_Y / 2 + 16);
        ctx.font = "12px sans-serif";
        ctx.fillStyle = "#64748b";
        ctx.fillText("Put profile.png in /public/games to use your own bird", W / 2, GROUND_Y / 2 + 36);
      }

      raf = requestAnimationFrame(loop);
    };

    raf = requestAnimationFrame(loop);

    const onKey = (e: KeyboardEvent) => {
      if (e.code === "Space" || e.code === "ArrowUp") {
        e.preventDefault();
        jump();
      }
    };
    const onTouch = (e: TouchEvent) => {
      e.preventDefault();
      jump();
    };
    canvas.addEventListener("click", jump);
    canvas.addEventListener("touchstart", onTouch, { passive: false });
    window.addEventListener("keydown", onKey);

    return () => {
      cancelAnimationFrame(raf);
      canvas.removeEventListener("click", jump);
      canvas.removeEventListener("touchstart", onTouch);
      window.removeEventListener("keydown", onKey);
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="flex flex-col items-center gap-3">
      <div className="w-full" style={{ maxWidth: "360px" }}>
        <canvas
          ref={canvasRef}
          width={W}
          height={H}
          style={{ width: "100%", height: "auto", display: "block" }}
          className="rounded-xl cursor-pointer touch-none border border-gray-800"
        />
      </div>

      {gamePhase === "dead" && (
        <div className="w-full max-w-90 bg-gray-900 border border-gray-800 rounded-xl p-4 space-y-3 text-center">
          <p className="text-white font-bold text-lg">Game Over</p>
          <div className="flex justify-center gap-8">
            <div>
              <p className="text-gray-500 text-xs mb-0.5">Score</p>
              <p className="text-yellow-400 font-mono text-2xl font-bold">{deadScore}</p>
            </div>
            <div>
              <p className="text-gray-500 text-xs mb-0.5">Best</p>
              <p className="text-green-400 font-mono text-2xl font-bold">{highScore}</p>
            </div>
          </div>
          {submitting ? (
            <p className="text-blue-400 text-sm">Submitting score...</p>
          ) : submitMsg ? (
            <p className={`text-sm ${submitMsg.startsWith("Error") ? "text-red-400" : "text-green-400"}`}>
              {submitMsg}
            </p>
          ) : null}
          <button
            onClick={() => resetRef.current()}
            className="w-full py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-lg text-sm min-h-11 transition-colors"
          >
            Play Again
          </button>
        </div>
      )}
    </div>
  );
}
