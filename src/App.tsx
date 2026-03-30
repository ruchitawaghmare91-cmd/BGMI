/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Trophy, Play, RotateCcw, ArrowUp, ArrowDown, ArrowLeft, ArrowRight } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

// Constants
const GRID_SIZE = 20;
const CANVAS_SIZE = 400;
const INITIAL_SNAKE = [
  { x: 10, y: 10 },
  { x: 10, y: 11 },
  { x: 10, y: 12 },
];
const INITIAL_DIRECTION = { x: 0, y: -1 };
const GAME_SPEED = 150;

type Point = { x: number; y: number };

export default function App() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [snake, setSnake] = useState<Point[]>(INITIAL_SNAKE);
  const [food, setFood] = useState<Point>({ x: 5, y: 5 });
  const [direction, setDirection] = useState<Point>(INITIAL_DIRECTION);
  const [isGameOver, setIsGameOver] = useState(false);
  const [isStarted, setIsStarted] = useState(false);
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(0);
  
  // Ref to track direction to prevent 180-degree turns in a single frame
  const nextDirection = useRef<Point>(INITIAL_DIRECTION);

  // Generate random food position
  const generateFood = useCallback((currentSnake: Point[]): Point => {
    let newFood;
    while (true) {
      newFood = {
        x: Math.floor(Math.random() * (CANVAS_SIZE / GRID_SIZE)),
        y: Math.floor(Math.random() * (CANVAS_SIZE / GRID_SIZE)),
      };
      // Check if food is on snake body
      const isOnSnake = currentSnake.some(
        (segment) => segment.x === newFood.x && segment.y === newFood.y
      );
      if (!isOnSnake) break;
    }
    return newFood;
  }, []);

  // Initialize game
  const startGame = () => {
    setSnake(INITIAL_SNAKE);
    setDirection(INITIAL_DIRECTION);
    nextDirection.current = INITIAL_DIRECTION;
    setFood(generateFood(INITIAL_SNAKE));
    setScore(0);
    setIsGameOver(false);
    setIsStarted(true);
  };

  // Handle key presses
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'ArrowUp':
          if (direction.y === 0) nextDirection.current = { x: 0, y: -1 };
          break;
        case 'ArrowDown':
          if (direction.y === 0) nextDirection.current = { x: 0, y: 1 };
          break;
        case 'ArrowLeft':
          if (direction.x === 0) nextDirection.current = { x: -1, y: 0 };
          break;
        case 'ArrowRight':
          if (direction.x === 0) nextDirection.current = { x: 1, y: 0 };
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [direction]);

  // Game loop
  useEffect(() => {
    if (!isStarted || isGameOver) return;

    const moveSnake = () => {
      setSnake((prevSnake) => {
        const head = prevSnake[0];
        const currentDir = nextDirection.current;
        setDirection(currentDir);
        
        const newHead = {
          x: head.x + currentDir.x,
          y: head.y + currentDir.y,
        };

        // Check wall collision
        if (
          newHead.x < 0 ||
          newHead.x >= CANVAS_SIZE / GRID_SIZE ||
          newHead.y < 0 ||
          newHead.y >= CANVAS_SIZE / GRID_SIZE
        ) {
          setIsGameOver(true);
          return prevSnake;
        }

        // Check self collision
        if (prevSnake.some((segment) => segment.x === newHead.x && segment.y === newHead.y)) {
          setIsGameOver(true);
          return prevSnake;
        }

        const newSnake = [newHead, ...prevSnake];

        // Check food collision
        if (newHead.x === food.x && newHead.y === food.y) {
          setScore((s) => {
            const newScore = s + 10;
            if (newScore > highScore) setHighScore(newScore);
            return newScore;
          });
          setFood(generateFood(newSnake));
        } else {
          newSnake.pop();
        }

        return newSnake;
      });
    };

    const intervalId = setInterval(moveSnake, GAME_SPEED);
    return () => clearInterval(intervalId);
  }, [isStarted, isGameOver, food, generateFood, highScore]);

  // Draw game
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas
    ctx.fillStyle = '#1a1a1a';
    ctx.fillRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);

    // Draw grid lines (subtle)
    ctx.strokeStyle = '#2a2a2a';
    ctx.lineWidth = 0.5;
    for (let i = 0; i <= CANVAS_SIZE; i += GRID_SIZE) {
      ctx.beginPath();
      ctx.moveTo(i, 0);
      ctx.lineTo(i, CANVAS_SIZE);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(0, i);
      ctx.lineTo(CANVAS_SIZE, i);
      ctx.stroke();
    }

    // Draw snake
    snake.forEach((segment, index) => {
      ctx.fillStyle = index === 0 ? '#4ade80' : '#22c55e'; // Brighter head
      ctx.fillRect(
        segment.x * GRID_SIZE + 1,
        segment.y * GRID_SIZE + 1,
        GRID_SIZE - 2,
        GRID_SIZE - 2
      );
      
      // Add a little eye to the head
      if (index === 0) {
        ctx.fillStyle = '#000';
        const eyeSize = 3;
        // Position eye based on direction
        if (direction.x === 1) ctx.fillRect(segment.x * GRID_SIZE + 14, segment.y * GRID_SIZE + 5, eyeSize, eyeSize);
        else if (direction.x === -1) ctx.fillRect(segment.x * GRID_SIZE + 3, segment.y * GRID_SIZE + 5, eyeSize, eyeSize);
        else if (direction.y === 1) ctx.fillRect(segment.x * GRID_SIZE + 5, segment.y * GRID_SIZE + 14, eyeSize, eyeSize);
        else ctx.fillRect(segment.x * GRID_SIZE + 5, segment.y * GRID_SIZE + 3, eyeSize, eyeSize);
      }
    });

    // Draw food
    ctx.fillStyle = '#ef4444';
    ctx.beginPath();
    ctx.arc(
      food.x * GRID_SIZE + GRID_SIZE / 2,
      food.y * GRID_SIZE + GRID_SIZE / 2,
      GRID_SIZE / 2 - 2,
      0,
      Math.PI * 2
    );
    ctx.fill();
    
    // Food highlight
    ctx.fillStyle = '#fca5a5';
    ctx.beginPath();
    ctx.arc(
      food.x * GRID_SIZE + GRID_SIZE / 3,
      food.y * GRID_SIZE + GRID_SIZE / 3,
      2,
      0,
      Math.PI * 2
    );
    ctx.fill();

  }, [snake, food, direction]);

  return (
    <div className="min-h-screen bg-[#0f0f0f] text-white flex flex-col items-center justify-center p-4 font-sans">
      <div className="max-w-md w-full space-y-6">
        {/* Header */}
        <div className="flex justify-between items-end">
          <div>
            <h1 className="text-4xl font-black tracking-tighter italic text-green-500 uppercase">Snake</h1>
            <p className="text-xs font-mono text-zinc-500 uppercase tracking-widest">Classic Arcade</p>
          </div>
          <div className="text-right">
            <div className="flex items-center justify-end gap-2 text-zinc-400">
              <Trophy size={14} className="text-yellow-500" />
              <span className="text-xs font-mono uppercase tracking-tighter">High Score</span>
            </div>
            <div className="text-2xl font-mono font-bold leading-none">{highScore}</div>
          </div>
        </div>

        {/* Game Board Container */}
        <div className="relative group">
          <div className="absolute -inset-1 bg-gradient-to-r from-green-600 to-emerald-600 rounded-xl blur opacity-25 group-hover:opacity-40 transition duration-1000"></div>
          <div className="relative bg-[#1a1a1a] rounded-lg overflow-hidden border border-zinc-800 shadow-2xl">
            <canvas
              ref={canvasRef}
              width={CANVAS_SIZE}
              height={CANVAS_SIZE}
              className="w-full aspect-square block"
            />

            {/* Overlays */}
            <AnimatePresence>
              {!isStarted && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="absolute inset-0 bg-black/80 backdrop-blur-sm flex flex-col items-center justify-center p-8 text-center"
                >
                  <motion.div
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.2 }}
                  >
                    <h2 className="text-3xl font-black italic uppercase mb-2">Ready?</h2>
                    <p className="text-zinc-400 text-sm mb-8">Use arrow keys to navigate the grid.</p>
                    <button
                      onClick={startGame}
                      className="group relative px-8 py-3 bg-green-500 hover:bg-green-400 text-black font-bold rounded-full transition-all flex items-center gap-2 overflow-hidden"
                    >
                      <Play size={20} fill="currentColor" />
                      <span>START GAME</span>
                    </button>
                  </motion.div>
                </motion.div>
              )}

              {isGameOver && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="absolute inset-0 bg-red-950/90 backdrop-blur-md flex flex-col items-center justify-center p-8 text-center"
                >
                  <motion.div
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                  >
                    <h2 className="text-5xl font-black italic uppercase text-red-500 mb-2">Game Over</h2>
                    <div className="mb-8">
                      <p className="text-zinc-400 text-xs uppercase tracking-widest mb-1">Final Score</p>
                      <p className="text-4xl font-mono font-bold">{score}</p>
                    </div>
                    <button
                      onClick={startGame}
                      className="px-8 py-3 bg-white text-black font-bold rounded-full hover:bg-zinc-200 transition-all flex items-center gap-2 mx-auto"
                    >
                      <RotateCcw size={20} />
                      <span>TRY AGAIN</span>
                    </button>
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Score HUD */}
            {isStarted && !isGameOver && (
              <div className="absolute top-4 left-4 pointer-events-none">
                <div className="bg-black/40 backdrop-blur-md border border-white/10 px-3 py-1 rounded-full">
                  <span className="text-[10px] font-mono text-zinc-400 uppercase tracking-widest mr-2">Score</span>
                  <span className="text-lg font-mono font-bold">{score}</span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Controls Hint / Mobile Controls */}
        <div className="grid grid-cols-3 gap-4">
          <div className="col-span-2 bg-zinc-900/50 border border-zinc-800 rounded-xl p-4 flex items-center gap-4">
            <div className="flex flex-col gap-1">
              <div className="flex justify-center">
                <div className="w-8 h-8 rounded border border-zinc-700 flex items-center justify-center bg-zinc-800"><ArrowUp size={14} /></div>
              </div>
              <div className="flex gap-1">
                <div className="w-8 h-8 rounded border border-zinc-700 flex items-center justify-center bg-zinc-800"><ArrowLeft size={14} /></div>
                <div className="w-8 h-8 rounded border border-zinc-700 flex items-center justify-center bg-zinc-800"><ArrowDown size={14} /></div>
                <div className="w-8 h-8 rounded border border-zinc-700 flex items-center justify-center bg-zinc-800"><ArrowRight size={14} /></div>
              </div>
            </div>
            <div className="text-xs text-zinc-500 font-medium">
              Use your keyboard arrow keys to control the snake.
            </div>
          </div>
          
          <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-4 flex flex-col justify-center items-center text-center">
            <span className="text-[10px] text-zinc-500 uppercase tracking-widest mb-1">Speed</span>
            <span className="text-sm font-mono font-bold">1.0x</span>
          </div>
        </div>

        {/* Footer */}
        <footer className="pt-8 border-t border-zinc-800 flex justify-between items-center opacity-50">
          <span className="text-[10px] uppercase tracking-widest font-mono">Build v1.0.0</span>
          <div className="flex gap-4">
            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
            <span className="text-[10px] uppercase tracking-widest font-mono">System Online</span>
          </div>
        </footer>
      </div>
    </div>
  );
}
