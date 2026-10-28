"use client";

import React, { useRef, useState, useEffect, useCallback } from "react";
import {
  Pen,
  Highlighter,
  Eraser,
  Square,
  Circle,
  Minus,
  MoveRight,
  Triangle,
  Type,
  StickyNote,
  Trash2,
  Undo2,
  Redo2,
  Download,
  Maximize2,
  Minimize2,
  Grid,
  Palette,
  Sparkles,
  Layers,
  ChevronLeft,
  ChevronRight,
  Plus,
  Compass,
  Box,
  X,
  RotateCcw,
  Check,
  FileImage,
  Share2,
  HelpCircle,
  MousePointer,
  Flame,
  Hand,
  ZoomIn,
  ZoomOut,
  Sliders,
  Clock,
  Play,
  Pause,
  Copy,
  Scissors,
  CheckSquare,
  Sparkle,
  Image as ImageIcon,
  Zap,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useLang } from "@/contexts/LanguageContext";
import ThreeDViewer, { ModelType } from "@/components/ui/ThreeDViewer";

export type DrawingTool =
  | "select"
  | "pan"
  | "pen"
  | "brush"
  | "neon"
  | "highlighter"
  | "laser"
  | "eraser"
  | "line"
  | "arrow"
  | "rect"
  | "circle"
  | "triangle"
  | "star"
  | "diamond"
  | "text";

export type EraserMode = "stroke" | "object" | "area";

export type LineStyle = "solid" | "dashed" | "dotted";

export type BoardTheme =
  | "white"
  | "grid"
  | "coordinate"
  | "dots"
  | "greenboard"
  | "blackboard";

export interface StickyNoteItem {
  id: string;
  x: number;
  y: number;
  text: string;
  color: "yellow" | "cyan" | "emerald" | "rose" | "purple";
  width: number;
  height: number;
}

export interface TextLabelItem {
  id: string;
  x: number;
  y: number;
  text: string;
  color: string;
  fontSize: number;
  isBold?: boolean;
}

export interface BoardImageItem {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  src: string;
  name: string;
}

interface Point {
  x: number;
  y: number;
}

interface Stroke {
  id: string;
  tool: DrawingTool;
  color: string;
  size: number;
  opacity: number;
  lineStyle: LineStyle;
  points: Point[];
  fillMode?: "none" | "semi" | "solid";
}

interface BoardPage {
  id: string;
  title: string;
  strokes: Stroke[];
  stickies: StickyNoteItem[];
  texts: TextLabelItem[];
  images: BoardImageItem[];
  theme: BoardTheme;
}

const PRESET_CHALK_COLORS = [
  { name: "Trắng Phấn", hex: "#ffffff" },
  { name: "Vàng Chanh", hex: "#fef08a" },
  { name: "Hồng Phấn", hex: "#f472b6" },
  { name: "Xanh Thiên Thanh", hex: "#38bdf8" },
  { name: "Xanh Lá Non", hex: "#4ade80" },
  { name: "Cam Rực Rỡ", hex: "#fb923c" },
  { name: "Đỏ Cờ", hex: "#ef4444" },
  { name: "Tím Mực", hex: "#a855f7" },
  { name: "Xanh Đậm Học Sinh", hex: "#2563eb" },
  { name: "Đen Mực", hex: "#0f172a" },
];

const PRESET_PEN_SIZES = [
  { label: "1px", size: 1, desc: "Siêu mảnh" },
  { label: "3px", size: 3, desc: "Bút bi" },
  { label: "6px", size: 6, desc: "Bút dạ" },
  { label: "12px", size: 12, desc: "Bút lông" },
  { label: "24px", size: 24, desc: "Cọ lớn" },
  { label: "48px", size: 48, desc: "Khổng lồ" },
];

const PRESET_ERASER_SIZES = [
  { label: "Nhỏ", size: 12 },
  { label: "Vừa", size: 28 },
  { label: "Lớn", size: 56 },
  { label: "Cực đại", size: 100 },
];

const QUICK_FORMULAS = [
  { label: "FA = d·V", formula: "F_A = d · V (Lực đẩy Archimedes)" },
  { label: "P = 10·m", formula: "P = 10 · m (Trọng lượng)" },
  { label: "NaCl", formula: "NaCl → Na⁺ + Cl⁻ (Muối ăn)" },
  { label: "C2H4", formula: "CH₂=CH₂ + Br₂ → CH₂Br-CH₂Br" },
  { label: "H2O", formula: "2H₂ + O₂ → 2H₂O" },
  { label: "V-E+F=2", formula: "Đỉnh (V) - Cạnh (E) + Mặt (F) = 2" },
  { label: "π", formula: "π ≈ 3.14159" },
  { label: "√x", formula: "√" },
  { label: "Δt", formula: "Δt" },
  { label: "λ", formula: "λ" },
  { label: "Ω", formula: "Ω (Ohm)" },
  { label: "±", formula: "±" },
  { label: "⊥", formula: "⊥ (Vuông góc)" },
  { label: "∥", formula: "∥ (Song song)" },
  { label: "109.5°", formula: "109.5° (Góc tứ diện CH₄)" },
  { label: "120°", formula: "120° (Góc phẳng C₂H₄)" },
];

export default function WhiteboardCanvas() {
  const { locale } = useLang();
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Board Pages state
  const [pages, setPages] = useState<BoardPage[]>([
    {
      id: "page-1",
      title: "Trang 1: Khởi động & Đặt vấn đề",
      strokes: [],
      stickies: [],
      texts: [],
      images: [],
      theme: "grid",
    },
  ]);
  const [currentPageIndex, setCurrentPageIndex] = useState(0);

  // Active Tool & Style State
  const [activeTool, setActiveTool] = useState<DrawingTool>("pen");
  const [eraserMode, setEraserMode] = useState<EraserMode>("stroke");
  const [eraserSize, setEraserSize] = useState<number>(36);

  const [strokeColor, setStrokeColor] = useState<string>("#2563eb");
  const [strokeSize, setStrokeSize] = useState<number>(4);
  const [strokeOpacity, setStrokeOpacity] = useState<number>(1);
  const [lineStyle, setLineStyle] = useState<LineStyle>("solid");
  const [fillMode, setFillMode] = useState<"none" | "semi" | "solid">("none");
  const [boardTheme, setBoardTheme] = useState<BoardTheme>("grid");

  // Zoom and Pan State
  const [zoom, setZoom] = useState<number>(1);
  const [panOffset, setPanOffset] = useState<Point>({ x: 0, y: 0 });
  const isPanningRef = useRef(false);
  const panStartRef = useRef<Point>({ x: 0, y: 0 });

  // History Undo/Redo stacks for current page
  const [undoStack, setUndoStack] = useState<BoardPage[]>([]);
  const [redoStack, setRedoStack] = useState<BoardPage[]>([]);

  // Drawing runtime state
  const isDrawingRef = useRef(false);
  const currentStrokeRef = useRef<Stroke | null>(null);

  // Pointer position for cursor visualizer (e.g. Eraser circle)
  const [cursorPos, setCursorPos] = useState<Point | null>(null);

  // Laser Pointer trail
  const [laserPoint, setLaserPoint] = useState<{ x: number; y: number; time: number } | null>(null);
  const laserTrailRef = useRef<{ x: number; y: number; alpha: number }[]>([]);

  // Area Erase marquee box
  const [eraseMarquee, setEraseMarquee] = useState<{ start: Point; current: Point } | null>(null);

  // Interactive Text insertion popup
  const [textInputPos, setTextInputPos] = useState<Point | null>(null);
  const [textInputValue, setTextInputValue] = useState("");
  const [textInputSize, setTextInputSize] = useState(20);

  // Dragging Sticky note state
  const [activeStickyDrag, setActiveStickyDrag] = useState<{
    id: string;
    offsetX: number;
    offsetY: number;
  } | null>(null);

  // UI Modals and Panels
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isThemePickerOpen, setIsThemePickerOpen] = useState(false);
  const [isFormulaBarOpen, setIsFormulaBarOpen] = useState(false);
  const [isTemplatesModalOpen, setIsTemplatesModalOpen] = useState(false);
  const [isStrokeSettingsOpen, setIsStrokeSettingsOpen] = useState(false);
  const [isEraserSettingsOpen, setIsEraserSettingsOpen] = useState(false);
  const [isClearMenuOpen, setIsClearMenuOpen] = useState(false);

  // Classroom Timer Widget
  const [isTimerOpen, setIsTimerOpen] = useState(false);
  const [timerSecondsLeft, setTimerSecondsLeft] = useState(300); // 5 mins
  const [timerRunning, setTimerRunning] = useState(false);
  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Floating 3D PiP Window
  const [is3DWindowOpen, setIs3DWindowOpen] = useState(false);
  const [selected3DModel, setSelected3DModel] = useState<ModelType>("crystal_nacl");
  const [pipPosition, setPipPosition] = useState<Point>({ x: 24, y: 76 });

  // Loaded Images cache for Canvas 2D
  const imageElementsMapRef = useRef<Map<string, HTMLImageElement>>(new Map());

  const currentPage = pages[currentPageIndex] || pages[0];

  // Sync theme when switching pages
  useEffect(() => {
    if (currentPage) {
      setBoardTheme(currentPage.theme);
    }
  }, [currentPageIndex]);

  // Adjust theme color palette defaults
  useEffect(() => {
    if (boardTheme === "greenboard" || boardTheme === "blackboard") {
      if (strokeColor === "#0f172a" || strokeColor === "#2563eb") setStrokeColor("#ffffff");
    }
  }, [boardTheme]);

  // Classroom Timer logic
  useEffect(() => {
    if (timerRunning) {
      timerIntervalRef.current = setInterval(() => {
        setTimerSecondsLeft((prev) => {
          if (prev <= 1) {
            setTimerRunning(false);
            // Play gentle web audio synthetic beep
            playTimerAlarmSound();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    }

    return () => {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    };
  }, [timerRunning]);

  function playTimerAlarmSound() {
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(587.33, audioCtx.currentTime); // D5
      osc.frequency.exponentialRampToValueAtTime(880, audioCtx.currentTime + 0.3); // A5
      gain.gain.setValueAtTime(0.3, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.5);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.5);
    } catch (e) {
      // AudioContext unavailable or blocked by browser
    }
  }

  // Save state snapshot for undo
  const pushUndoSnapshot = useCallback(() => {
    setUndoStack((prev) => [...prev.slice(-30), JSON.parse(JSON.stringify(currentPage))]);
    setRedoStack([]);
  }, [currentPage]);

  // Coordinate conversion: Screen -> World
  const screenToWorld = useCallback(
    (screenX: number, screenY: number): Point => {
      return {
        x: (screenX - panOffset.x) / zoom,
        y: (screenY - panOffset.y) / zoom,
      };
    },
    [panOffset, zoom]
  );

  // Redraw entire canvas
  const redrawCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Reset transform & clear
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const dpr = window.devicePixelRatio || 1;
    const logicalW = canvas.width / dpr;
    const logicalH = canvas.height / dpr;

    // 1. Draw Background & Grid in screen space or world space
    ctx.scale(dpr, dpr);
    drawBackground(ctx, logicalW, logicalH, boardTheme, zoom, panOffset);

    // Apply World Coordinate Transform (Pan + Zoom)
    ctx.save();
    ctx.translate(panOffset.x, panOffset.y);
    ctx.scale(zoom, zoom);

    // 2. Draw Images placed on board
    currentPage.images?.forEach((imgItem) => {
      let htmlImg = imageElementsMapRef.current.get(imgItem.id);
      if (!htmlImg) {
        htmlImg = new Image();
        htmlImg.src = imgItem.src;
        htmlImg.onload = () => redrawCanvas();
        imageElementsMapRef.current.set(imgItem.id, htmlImg);
      }
      if (htmlImg.complete) {
        ctx.drawImage(htmlImg, imgItem.x, imgItem.y, imgItem.width, imgItem.height);
        // Subtle border around image
        ctx.strokeStyle = "rgba(100, 116, 139, 0.4)";
        ctx.lineWidth = 1 / zoom;
        ctx.strokeRect(imgItem.x, imgItem.y, imgItem.width, imgItem.height);
      }
    });

    // 3. Draw Committed Strokes
    currentPage.strokes.forEach((stroke) => {
      drawStroke(ctx, stroke);
    });

    // 4. Draw Active In-progress Stroke
    if (currentStrokeRef.current) {
      drawStroke(ctx, currentStrokeRef.current);
    }

    ctx.restore();

    // 5. Draw Area Erase Marquee Box (Screen Coordinates)
    if (eraseMarquee) {
      ctx.save();
      const x = Math.min(eraseMarquee.start.x, eraseMarquee.current.x);
      const y = Math.min(eraseMarquee.start.y, eraseMarquee.current.y);
      const w = Math.abs(eraseMarquee.current.x - eraseMarquee.start.x);
      const h = Math.abs(eraseMarquee.current.y - eraseMarquee.start.y);

      ctx.strokeStyle = "#ef4444";
      ctx.setLineDash([6, 4]);
      ctx.lineWidth = 2;
      ctx.fillStyle = "rgba(239, 68, 68, 0.15)";
      ctx.fillRect(x, y, w, h);
      ctx.strokeRect(x, y, w, h);
      ctx.restore();
    }
  }, [currentPage, boardTheme, zoom, panOffset, eraseMarquee]);

  // Handle Resize
  const updateCanvasSize = useCallback(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const rect = container.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;

    canvas.width = Math.floor(rect.width * dpr);
    canvas.height = Math.floor(rect.height * dpr);
    canvas.style.width = `${rect.width}px`;
    canvas.style.height = `${rect.height}px`;

    redrawCanvas();
  }, [redrawCanvas]);

  useEffect(() => {
    updateCanvasSize();
    window.addEventListener("resize", updateCanvasSize);
    return () => window.removeEventListener("resize", updateCanvasSize);
  }, [updateCanvasSize]);

  useEffect(() => {
    redrawCanvas();
  }, [redrawCanvas]);

  // Laser Pointer fading animation loop
  useEffect(() => {
    if (activeTool !== "laser") return;

    let animId: number;
    const loop = () => {
      redrawCanvas();

      const canvas = canvasRef.current;
      if (canvas) {
        const ctx = canvas.getContext("2d");
        const dpr = window.devicePixelRatio || 1;
        if (ctx) {
          ctx.setTransform(1, 0, 0, 1, 0, 0);
          ctx.scale(dpr, dpr);

          // Update trail
          laserTrailRef.current = laserTrailRef.current
            .map((pt) => ({ ...pt, alpha: pt.alpha - 0.04 }))
            .filter((pt) => pt.alpha > 0);

          laserTrailRef.current.forEach((pt) => {
            ctx.beginPath();
            ctx.arc(pt.x, pt.y, 6, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(239, 68, 68, ${pt.alpha})`;
            ctx.shadowColor = "#ef4444";
            ctx.shadowBlur = 12;
            ctx.fill();
            ctx.shadowBlur = 0;
          });

          // Glow current point
          if (laserPoint && Date.now() - laserPoint.time < 300) {
            ctx.beginPath();
            ctx.arc(laserPoint.x, laserPoint.y, 8, 0, Math.PI * 2);
            ctx.fillStyle = "#ff0044";
            ctx.shadowColor = "#ff0044";
            ctx.shadowBlur = 18;
            ctx.fill();
            ctx.shadowBlur = 0;
          }
        }
      }

      animId = requestAnimationFrame(loop);
    };

    animId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animId);
  }, [activeTool, laserPoint, redrawCanvas]);

  // ─────────────────────────────────────────────────────────────
  // Canvas Background Renderers
  // ─────────────────────────────────────────────────────────────
  function drawBackground(
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    theme: BoardTheme,
    scale: number,
    offset: Point
  ) {
    if (theme === "white") {
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, width, height);
    } else if (theme === "grid") {
      ctx.fillStyle = "#fafbfd";
      ctx.fillRect(0, 0, width, height);

      ctx.strokeStyle = "#e2e8f0";
      ctx.lineWidth = 1;
      const step = 28 * scale;
      const startX = offset.x % step;
      const startY = offset.y % step;

      ctx.beginPath();
      for (let x = startX; x <= width; x += step) {
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
      }
      for (let y = startY; y <= height; y += step) {
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
      }
      ctx.stroke();
    } else if (theme === "coordinate") {
      // Cartesian Oxy Coordinate Grid
      ctx.fillStyle = "#f8fafc";
      ctx.fillRect(0, 0, width, height);

      // Minor grid
      ctx.strokeStyle = "#e2e8f0";
      ctx.lineWidth = 0.8;
      const step = 28 * scale;
      const startX = offset.x % step;
      const startY = offset.y % step;

      ctx.beginPath();
      for (let x = startX; x <= width; x += step) {
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
      }
      for (let y = startY; y <= height; y += step) {
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
      }
      ctx.stroke();

      // Major axes centered at world (width/2, height/2)
      const cx = offset.x + (width / 2) * scale;
      const cy = offset.y + (height / 2) * scale;

      ctx.strokeStyle = "#0284c7";
      ctx.lineWidth = 2.5;

      // X-axis
      ctx.beginPath();
      ctx.moveTo(0, cy);
      ctx.lineTo(width - 10, cy);
      ctx.lineTo(width - 20, cy - 6);
      ctx.moveTo(width - 10, cy);
      ctx.lineTo(width - 20, cy + 6);
      ctx.stroke();

      // Y-axis
      ctx.beginPath();
      ctx.moveTo(cx, height);
      ctx.lineTo(cx, 10);
      ctx.lineTo(cx - 6, 20);
      ctx.moveTo(cx, 10);
      ctx.lineTo(cx + 6, 20);
      ctx.stroke();

      // Labels
      ctx.font = "bold 13px Inter, sans-serif";
      ctx.fillStyle = "#0284c7";
      ctx.fillText("x", width - 24, cy - 10);
      ctx.fillText("y", cx + 12, 22);
      ctx.fillText("O", cx - 16, cy + 18);
    } else if (theme === "dots") {
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, width, height);

      ctx.fillStyle = "#cbd5e1";
      const step = 28 * scale;
      const startX = offset.x % step;
      const startY = offset.y % step;
      for (let x = startX; x < width; x += step) {
        for (let y = startY; y < height; y += step) {
          ctx.beginPath();
          ctx.arc(x, y, 1.4 * Math.min(scale, 1.5), 0, Math.PI * 2);
          ctx.fill();
        }
      }
    } else if (theme === "greenboard") {
      // Classic Classroom Chalkboard Green
      ctx.fillStyle = "#164e29";
      ctx.fillRect(0, 0, width, height);

      ctx.strokeStyle = "rgba(255, 255, 255, 0.08)";
      ctx.lineWidth = 1;
      const step = 32 * scale;
      const startY = offset.y % step;
      ctx.beginPath();
      for (let y = startY; y <= height; y += step) {
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
      }
      ctx.stroke();
    } else if (theme === "blackboard") {
      // Cosmic Blackboard Dark
      ctx.fillStyle = "#0a0f1d";
      ctx.fillRect(0, 0, width, height);

      ctx.strokeStyle = "rgba(255, 255, 255, 0.05)";
      ctx.lineWidth = 1;
      const step = 28 * scale;
      const startX = offset.x % step;
      const startY = offset.y % step;
      ctx.beginPath();
      for (let x = startX; x <= width; x += step) {
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
      }
      for (let y = startY; y <= height; y += step) {
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
      }
      ctx.stroke();
    }
  }

  // ─────────────────────────────────────────────────────────────
  // Individual Stroke Renderer
  // ─────────────────────────────────────────────────────────────
  function drawStroke(ctx: CanvasRenderingContext2D, stroke: Stroke) {
    if (stroke.points.length === 0) return;

    ctx.save();
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.lineWidth = stroke.size;
    ctx.strokeStyle = stroke.color;
    ctx.globalAlpha = stroke.opacity;

    // Line Styles
    if (stroke.lineStyle === "dashed") {
      ctx.setLineDash([stroke.size * 3, stroke.size * 2]);
    } else if (stroke.lineStyle === "dotted") {
      ctx.setLineDash([stroke.size, stroke.size * 2]);
    } else {
      ctx.setLineDash([]);
    }

    // Brush Tool Customizations
    if (stroke.tool === "highlighter") {
      ctx.globalAlpha = Math.min(stroke.opacity, 0.35);
      ctx.lineWidth = Math.max(stroke.size * 2.8, 20);
    } else if (stroke.tool === "neon") {
      // Neon Glow effect
      ctx.shadowColor = stroke.color;
      ctx.shadowBlur = stroke.size * 3;
    } else if (stroke.tool === "brush") {
      ctx.shadowColor = stroke.color;
      ctx.shadowBlur = 4;
    } else if (stroke.tool === "eraser") {
      ctx.globalCompositeOperation = "destination-out";
      ctx.lineWidth = stroke.size;
    }

    const pts = stroke.points;

    if (
      stroke.tool === "pen" ||
      stroke.tool === "brush" ||
      stroke.tool === "neon" ||
      stroke.tool === "highlighter" ||
      stroke.tool === "eraser"
    ) {
      if (pts.length === 1) {
        ctx.beginPath();
        ctx.arc(pts[0].x, pts[0].y, stroke.size / 2, 0, Math.PI * 2);
        ctx.fillStyle = stroke.color;
        ctx.fill();
      } else {
        ctx.beginPath();
        ctx.moveTo(pts[0].x, pts[0].y);

        for (let i = 1; i < pts.length - 1; i++) {
          const midX = (pts[i].x + pts[i + 1].x) / 2;
          const midY = (pts[i].y + pts[i + 1].y) / 2;
          ctx.quadraticCurveTo(pts[i].x, pts[i].y, midX, midY);
        }

        const last = pts[pts.length - 1];
        ctx.lineTo(last.x, last.y);
        ctx.stroke();
      }
    } else if (stroke.tool === "line") {
      const start = pts[0];
      const end = pts[pts.length - 1];
      ctx.beginPath();
      ctx.moveTo(start.x, start.y);
      ctx.lineTo(end.x, end.y);
      ctx.stroke();
    } else if (stroke.tool === "arrow") {
      const start = pts[0];
      const end = pts[pts.length - 1];

      ctx.beginPath();
      ctx.moveTo(start.x, start.y);
      ctx.lineTo(end.x, end.y);
      ctx.stroke();

      const angle = Math.atan2(end.y - start.y, end.x - start.x);
      const headLen = Math.max(stroke.size * 3.5, 14);

      ctx.beginPath();
      ctx.moveTo(end.x, end.y);
      ctx.lineTo(
        end.x - headLen * Math.cos(angle - Math.PI / 6),
        end.y - headLen * Math.sin(angle - Math.PI / 6)
      );
      ctx.moveTo(end.x, end.y);
      ctx.lineTo(
        end.x - headLen * Math.cos(angle + Math.PI / 6),
        end.y - headLen * Math.sin(angle + Math.PI / 6)
      );
      ctx.stroke();
    } else if (stroke.tool === "rect") {
      const start = pts[0];
      const end = pts[pts.length - 1];
      const x = Math.min(start.x, end.x);
      const y = Math.min(start.y, end.y);
      const w = Math.abs(end.x - start.x);
      const h = Math.abs(end.y - start.y);

      if (stroke.fillMode === "solid") {
        ctx.fillStyle = stroke.color;
        ctx.fillRect(x, y, w, h);
      } else if (stroke.fillMode === "semi") {
        ctx.fillStyle = stroke.color;
        ctx.globalAlpha = 0.25;
        ctx.fillRect(x, y, w, h);
        ctx.globalAlpha = stroke.opacity;
      }
      ctx.strokeRect(x, y, w, h);
    } else if (stroke.tool === "circle") {
      const start = pts[0];
      const end = pts[pts.length - 1];
      const rx = Math.abs(end.x - start.x) / 2;
      const ry = Math.abs(end.y - start.y) / 2;
      const cx = Math.min(start.x, end.x) + rx;
      const cy = Math.min(start.y, end.y) + ry;

      ctx.beginPath();
      ctx.ellipse(cx, cy, Math.max(rx, 1), Math.max(ry, 1), 0, 0, Math.PI * 2);

      if (stroke.fillMode === "solid") {
        ctx.fillStyle = stroke.color;
        ctx.fill();
      } else if (stroke.fillMode === "semi") {
        ctx.fillStyle = stroke.color;
        ctx.globalAlpha = 0.25;
        ctx.fill();
        ctx.globalAlpha = stroke.opacity;
      }
      ctx.stroke();
    } else if (stroke.tool === "triangle") {
      const start = pts[0];
      const end = pts[pts.length - 1];

      ctx.beginPath();
      ctx.moveTo((start.x + end.x) / 2, start.y);
      ctx.lineTo(start.x, end.y);
      ctx.lineTo(end.x, end.y);
      ctx.closePath();

      if (stroke.fillMode === "solid") {
        ctx.fillStyle = stroke.color;
        ctx.fill();
      } else if (stroke.fillMode === "semi") {
        ctx.fillStyle = stroke.color;
        ctx.globalAlpha = 0.25;
        ctx.fill();
        ctx.globalAlpha = stroke.opacity;
      }
      ctx.stroke();
    } else if (stroke.tool === "diamond") {
      const start = pts[0];
      const end = pts[pts.length - 1];
      const midX = (start.x + end.x) / 2;
      const midY = (start.y + end.y) / 2;

      ctx.beginPath();
      ctx.moveTo(midX, start.y);
      ctx.lineTo(end.x, midY);
      ctx.lineTo(midX, end.y);
      ctx.lineTo(start.x, midY);
      ctx.closePath();

      if (stroke.fillMode === "solid") {
        ctx.fillStyle = stroke.color;
        ctx.fill();
      } else if (stroke.fillMode === "semi") {
        ctx.fillStyle = stroke.color;
        ctx.globalAlpha = 0.25;
        ctx.fill();
        ctx.globalAlpha = stroke.opacity;
      }
      ctx.stroke();
    } else if (stroke.tool === "star") {
      const start = pts[0];
      const end = pts[pts.length - 1];
      const cx = (start.x + end.x) / 2;
      const cy = (start.y + end.y) / 2;
      const r = Math.max(Math.abs(end.x - start.x), Math.abs(end.y - start.y)) / 2;

      ctx.beginPath();
      for (let i = 0; i < 5; i++) {
        const outerAngle = (i * 4 * Math.PI) / 5 - Math.PI / 2;
        const x = cx + r * Math.cos(outerAngle);
        const y = cy + r * Math.sin(outerAngle);
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.closePath();

      if (stroke.fillMode === "solid") {
        ctx.fillStyle = stroke.color;
        ctx.fill();
      } else if (stroke.fillMode === "semi") {
        ctx.fillStyle = stroke.color;
        ctx.globalAlpha = 0.25;
        ctx.fill();
        ctx.globalAlpha = stroke.opacity;
      }
      ctx.stroke();
    }

    ctx.restore();
  }

  // ─────────────────────────────────────────────────────────────
  // Object Eraser Collision Checker
  // ─────────────────────────────────────────────────────────────
  const eraseStrokeAtPoint = (worldPt: Point, radius: number): boolean => {
    let erasedAny = false;

    setPages((prev) =>
      prev.map((page, idx) => {
        if (idx !== currentPageIndex) return page;

        const remainingStrokes = page.strokes.filter((stroke) => {
          // Check if worldPt is within radius of any segment in stroke
          for (const pt of stroke.points) {
            const dist = Math.hypot(pt.x - worldPt.x, pt.y - worldPt.y);
            if (dist <= radius + stroke.size / 2) {
              erasedAny = true;
              return false; // delete this stroke
            }
          }
          return true;
        });

        return { ...page, strokes: remainingStrokes };
      })
    );

    return erasedAny;
  };

  // ─────────────────────────────────────────────────────────────
  // Pointer Event Handlers
  // ─────────────────────────────────────────────────────────────
  const getCanvasScreenCoords = (e: React.PointerEvent<HTMLCanvasElement>): Point => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    };
  };

  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    (e.target as HTMLElement).setPointerCapture(e.pointerId);

    const screenPt = getCanvasScreenCoords(e);
    const worldPt = screenToWorld(screenPt.x, screenPt.y);

    // Pan Mode
    if (activeTool === "pan" || e.button === 1) {
      isPanningRef.current = true;
      panStartRef.current = { x: e.clientX - panOffset.x, y: e.clientY - panOffset.y };
      return;
    }

    if (activeTool === "select") {
      return;
    }

    if (activeTool === "text") {
      setTextInputPos(screenPt);
      setTextInputValue("");
      return;
    }

    if (activeTool === "laser") {
      setLaserPoint({ x: screenPt.x, y: screenPt.y, time: Date.now() });
      laserTrailRef.current.push({ x: screenPt.x, y: screenPt.y, alpha: 1.0 });
      return;
    }

    // Area Eraser Marquee
    if (activeTool === "eraser" && eraserMode === "area") {
      setEraseMarquee({ start: screenPt, current: screenPt });
      return;
    }

    // Object Eraser
    if (activeTool === "eraser" && eraserMode === "object") {
      pushUndoSnapshot();
      eraseStrokeAtPoint(worldPt, eraserSize / zoom);
      redrawCanvas();
      return;
    }

    pushUndoSnapshot();

    isDrawingRef.current = true;
    currentStrokeRef.current = {
      id: `stroke-${Date.now()}`,
      tool: activeTool,
      color: strokeColor,
      size: strokeSize,
      opacity: strokeOpacity,
      lineStyle,
      fillMode,
      points: [worldPt],
    };

    redrawCanvas();
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const screenPt = getCanvasScreenCoords(e);
    setCursorPos(screenPt);
    const worldPt = screenToWorld(screenPt.x, screenPt.y);

    // Pan in progress
    if (isPanningRef.current) {
      setPanOffset({
        x: e.clientX - panStartRef.current.x,
        y: e.clientY - panStartRef.current.y,
      });
      return;
    }

    if (activeTool === "laser") {
      setLaserPoint({ x: screenPt.x, y: screenPt.y, time: Date.now() });
      laserTrailRef.current.push({ x: screenPt.x, y: screenPt.y, alpha: 1.0 });
      return;
    }

    // Area Erase Marquee updating
    if (eraseMarquee) {
      setEraseMarquee((prev) => (prev ? { ...prev, current: screenPt } : null));
      return;
    }

    // Object Eraser Dragging
    if (activeTool === "eraser" && eraserMode === "object" && (e.buttons === 1)) {
      eraseStrokeAtPoint(worldPt, eraserSize / zoom);
      redrawCanvas();
      return;
    }

    if (!isDrawingRef.current || !currentStrokeRef.current) return;

    const stroke = currentStrokeRef.current;

    if (
      stroke.tool === "pen" ||
      stroke.tool === "brush" ||
      stroke.tool === "neon" ||
      stroke.tool === "highlighter" ||
      stroke.tool === "eraser"
    ) {
      stroke.points.push(worldPt);
    } else {
      if (stroke.points.length > 1) {
        stroke.points[1] = worldPt;
      } else {
        stroke.points.push(worldPt);
      }
    }

    redrawCanvas();
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (isPanningRef.current) {
      isPanningRef.current = false;
      return;
    }

    // Area Eraser Marquee execution
    if (eraseMarquee) {
      const startW = screenToWorld(
        Math.min(eraseMarquee.start.x, eraseMarquee.current.x),
        Math.min(eraseMarquee.start.y, eraseMarquee.current.y)
      );
      const endW = screenToWorld(
        Math.max(eraseMarquee.start.x, eraseMarquee.current.x),
        Math.max(eraseMarquee.start.y, eraseMarquee.current.y)
      );

      pushUndoSnapshot();

      setPages((prev) =>
        prev.map((page, idx) => {
          if (idx !== currentPageIndex) return page;

          const remainingStrokes = page.strokes.filter((stroke) => {
            const hasPointInside = stroke.points.some(
              (pt) => pt.x >= startW.x && pt.x <= endW.x && pt.y >= startW.y && pt.y <= endW.y
            );
            return !hasPointInside;
          });

          return { ...page, strokes: remainingStrokes };
        })
      );

      setEraseMarquee(null);
      redrawCanvas();
      return;
    }

    if (!isDrawingRef.current || !currentStrokeRef.current) return;

    isDrawingRef.current = false;
    const finalStroke = currentStrokeRef.current;
    currentStrokeRef.current = null;

    if (finalStroke.points.length > 0) {
      setPages((prev) =>
        prev.map((page, idx) =>
          idx === currentPageIndex
            ? { ...page, strokes: [...page.strokes, finalStroke] }
            : page
        )
      );
    }

    redrawCanvas();
  };

  // ─────────────────────────────────────────────────────────────
  // Action Handlers (Undo, Redo, Clear, Pages, Zoom, Images)
  // ─────────────────────────────────────────────────────────────
  const handleUndo = () => {
    if (undoStack.length === 0) return;
    const prev = undoStack[undoStack.length - 1];
    setUndoStack((s) => s.slice(0, -1));
    setRedoStack((s) => [...s, JSON.parse(JSON.stringify(currentPage))]);

    setPages((prevPages) =>
      prevPages.map((page, idx) => (idx === currentPageIndex ? prev : page))
    );
  };

  const handleRedo = () => {
    if (redoStack.length === 0) return;
    const next = redoStack[redoStack.length - 1];
    setRedoStack((s) => s.slice(0, -1));
    setUndoStack((s) => [...s, JSON.parse(JSON.stringify(currentPage))]);

    setPages((prevPages) =>
      prevPages.map((page, idx) => (idx === currentPageIndex ? next : page))
    );
  };

  const handleClearStrokesOnly = () => {
    pushUndoSnapshot();
    setPages((prev) =>
      prev.map((page, idx) => (idx === currentPageIndex ? { ...page, strokes: [] } : page))
    );
    setIsClearMenuOpen(false);
  };

  const handleClearStickiesOnly = () => {
    pushUndoSnapshot();
    setPages((prev) =>
      prev.map((page, idx) => (idx === currentPageIndex ? { ...page, stickies: [] } : page))
    );
    setIsClearMenuOpen(false);
  };

  const handleClearAll = () => {
    pushUndoSnapshot();
    setPages((prev) =>
      prev.map((page, idx) =>
        idx === currentPageIndex ? { ...page, strokes: [], stickies: [], texts: [], images: [] } : page
      )
    );
    setIsClearMenuOpen(false);
  };

  const handleAddPage = () => {
    const newPageNumber = pages.length + 1;
    const newPage: BoardPage = {
      id: `page-${Date.now()}`,
      title: `Trang ${newPageNumber}: Nội dung bài giảng`,
      strokes: [],
      stickies: [],
      texts: [],
      images: [],
      theme: boardTheme,
    };
    setPages((prev) => [...prev, newPage]);
    setCurrentPageIndex(pages.length);
    setUndoStack([]);
    setRedoStack([]);
  };

  const handleDuplicatePage = () => {
    const duplicatePage: BoardPage = {
      ...JSON.parse(JSON.stringify(currentPage)),
      id: `page-${Date.now()}`,
      title: `${currentPage.title} (Bản sao)`,
    };
    setPages((prev) => [...prev.slice(0, currentPageIndex + 1), duplicatePage, ...prev.slice(currentPageIndex + 1)]);
    setCurrentPageIndex(currentPageIndex + 1);
  };

  const handleDeletePage = (pageIdx: number) => {
    if (pages.length <= 1) return;
    if (confirm("Xóa trang bảng này?")) {
      setPages((prev) => prev.filter((_, idx) => idx !== pageIdx));
      if (currentPageIndex >= pageIdx && currentPageIndex > 0) {
        setCurrentPageIndex((prev) => prev - 1);
      }
    }
  };

  // Zoom Controls
  const handleZoomIn = () => setZoom((z) => Math.min(z + 0.25, 3.0));
  const handleZoomOut = () => setZoom((z) => Math.max(z - 0.25, 0.4));
  const handleResetZoom = () => {
    setZoom(1);
    setPanOffset({ x: 0, y: 0 });
  };

  // Image Upload onto Board
  const handleUploadImage = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const src = event.target?.result as string;
      const img = new Image();
      img.onload = () => {
        pushUndoSnapshot();
        const maxW = 320;
        const scale = Math.min(maxW / img.width, 1);
        const w = img.width * scale;
        const h = img.height * scale;

        const newImage: BoardImageItem = {
          id: `img-${Date.now()}`,
          x: 100,
          y: 100,
          width: w,
          height: h,
          src,
          name: file.name,
        };

        setPages((prev) =>
          prev.map((page, idx) =>
            idx === currentPageIndex
              ? { ...page, images: [...(page.images || []), newImage] }
              : page
          )
        );
      };
      img.src = src;
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  const handleExportPNG = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const link = document.createElement("a");
    link.download = `smart-explorer-whiteboard-${currentPage.title.replace(/\s+/g, "_")}.png`;
    link.href = canvas.toDataURL("image/png");
    link.click();
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      containerRef.current?.requestFullscreen?.();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen?.();
      setIsFullscreen(false);
    }
  };

  // Add sticky note
  const handleAddSticky = (color: StickyNoteItem["color"] = "yellow") => {
    pushUndoSnapshot();
    const newNote: StickyNoteItem = {
      id: `sticky-${Date.now()}`,
      x: 120 + Math.random() * 80,
      y: 120 + Math.random() * 60,
      text: "Ghi chú bài học...",
      color,
      width: 190,
      height: 140,
    };

    setPages((prev) =>
      prev.map((page, idx) =>
        idx === currentPageIndex
          ? { ...page, stickies: [...page.stickies, newNote] }
          : page
      )
    );
  };

  // Confirm Text input
  const handleConfirmText = () => {
    if (!textInputPos || !textInputValue.trim()) {
      setTextInputPos(null);
      return;
    }

    pushUndoSnapshot();
    const newText: TextLabelItem = {
      id: `text-${Date.now()}`,
      x: textInputPos.x,
      y: textInputPos.y,
      text: textInputValue,
      color: strokeColor,
      fontSize: textInputSize,
    };

    setPages((prev) =>
      prev.map((page, idx) =>
        idx === currentPageIndex
          ? { ...page, texts: [...page.texts, newText] }
          : page
      )
    );

    setTextInputPos(null);
    setTextInputValue("");
  };

  // Insert formula directly
  const handleInsertFormula = (formula: string) => {
    pushUndoSnapshot();
    const newText: TextLabelItem = {
      id: `formula-${Date.now()}`,
      x: 150 + Math.random() * 80,
      y: 150 + Math.random() * 80,
      text: formula,
      color: strokeColor,
      fontSize: 22,
      isBold: true,
    };

    setPages((prev) =>
      prev.map((page, idx) =>
        idx === currentPageIndex
          ? { ...page, texts: [...page.texts, newText] }
          : page
      )
    );
    setIsFormulaBarOpen(false);
  };

  // Load STEM Preset Template
  const handleLoadTemplate = (
    templateKey: "mindmap" | "tchart" | "experiment" | "kntt_archimedes" | "kntt_circuit"
  ) => {
    pushUndoSnapshot();

    if (templateKey === "tchart") {
      const texts: TextLabelItem[] = [
        { id: "t1", x: 250, y: 60, text: "BẢNG SO SÁNH 2 CỘT (T-CHART)", color: "#2563eb", fontSize: 24, isBold: true },
        { id: "t2", x: 180, y: 120, text: "ĐẶC ĐIỂM TIÊU CHÍ A", color: "#0f172a", fontSize: 18, isBold: true },
        { id: "t3", x: 550, y: 120, text: "ĐẶC ĐIỂM TIÊU CHÍ B", color: "#0f172a", fontSize: 18, isBold: true },
      ];
      const strokes: Stroke[] = [
        { id: "s1", tool: "line", color: "#94a3b8", size: 3, opacity: 1, lineStyle: "solid", points: [{ x: 80, y: 160 }, { x: 850, y: 160 }] },
        { id: "s2", tool: "line", color: "#94a3b8", size: 3, opacity: 1, lineStyle: "solid", points: [{ x: 460, y: 100 }, { x: 460, y: 650 }] },
      ];
      setPages((prev) =>
        prev.map((page, idx) =>
          idx === currentPageIndex ? { ...page, strokes, texts, theme: "grid" } : page
        )
      );
    } else if (templateKey === "mindmap") {
      const texts: TextLabelItem[] = [
        { id: "m1", x: 380, y: 310, text: "CHỦ ĐỀ CHÍNH", color: "#ffffff", fontSize: 20, isBold: true },
        { id: "m2", x: 150, y: 160, text: "Nhánh 1: Khái niệm", color: "#2563eb", fontSize: 16, isBold: true },
        { id: "m3", x: 650, y: 160, text: "Nhánh 2: Tính chất", color: "#059669", fontSize: 16, isBold: true },
        { id: "m4", x: 150, y: 480, text: "Nhánh 3: Thí nghiệm", color: "#d97706", fontSize: 16, isBold: true },
        { id: "m5", x: 650, y: 480, text: "Nhánh 4: Ứng dụng", color: "#7c3aed", fontSize: 16, isBold: true },
      ];
      const strokes: Stroke[] = [
        { id: "sm1", tool: "circle", color: "#3b82f6", size: 3, opacity: 1, lineStyle: "solid", fillMode: "solid", points: [{ x: 340, y: 260 }, { x: 580, y: 390 }] },
        { id: "sm2", tool: "arrow", color: "#2563eb", size: 3, opacity: 1, lineStyle: "solid", points: [{ x: 360, y: 270 }, { x: 250, y: 190 }] },
        { id: "sm3", tool: "arrow", color: "#059669", size: 3, opacity: 1, lineStyle: "solid", points: [{ x: 550, y: 270 }, { x: 660, y: 190 }] },
        { id: "sm4", tool: "arrow", color: "#d97706", size: 3, opacity: 1, lineStyle: "solid", points: [{ x: 360, y: 380 }, { x: 250, y: 460 }] },
        { id: "sm5", tool: "arrow", color: "#7c3aed", size: 3, opacity: 1, lineStyle: "solid", points: [{ x: 550, y: 380 }, { x: 660, y: 460 }] },
      ];
      setPages((prev) =>
        prev.map((page, idx) =>
          idx === currentPageIndex ? { ...page, strokes, texts, theme: "dots" } : page
        )
      );
    } else if (templateKey === "experiment") {
      const texts: TextLabelItem[] = [
        { id: "e1", x: 220, y: 60, text: "BÁO CÁO THỰC HÀNH & THÍ NGHIỆM KHTN", color: "#059669", fontSize: 22, isBold: true },
        { id: "e2", x: 100, y: 130, text: "1. Dụng cụ thí nghiệm:", color: "#0f172a", fontSize: 16, isBold: true },
        { id: "e3", x: 100, y: 270, text: "2. Các bước tiến hành:", color: "#0f172a", fontSize: 16, isBold: true },
        { id: "e4", x: 100, y: 410, text: "3. Hiện tượng quan sát & Giải thích:", color: "#0f172a", fontSize: 16, isBold: true },
        { id: "e5", x: 100, y: 550, text: "4. Kết luận khoa học:", color: "#0f172a", fontSize: 16, isBold: true },
      ];
      const strokes: Stroke[] = [
        { id: "se1", tool: "rect", color: "#cbd5e1", size: 2, opacity: 1, lineStyle: "solid", fillMode: "semi", points: [{ x: 80, y: 110 }, { x: 860, y: 240 }] },
        { id: "se2", tool: "rect", color: "#cbd5e1", size: 2, opacity: 1, lineStyle: "solid", fillMode: "semi", points: [{ x: 80, y: 250 }, { x: 860, y: 380 }] },
        { id: "se3", tool: "rect", color: "#cbd5e1", size: 2, opacity: 1, lineStyle: "solid", fillMode: "semi", points: [{ x: 80, y: 390 }, { x: 860, y: 520 }] },
        { id: "se4", tool: "rect", color: "#cbd5e1", size: 2, opacity: 1, lineStyle: "solid", fillMode: "semi", points: [{ x: 80, y: 530 }, { x: 860, y: 640 }] },
      ];
      setPages((prev) =>
        prev.map((page, idx) =>
          idx === currentPageIndex ? { ...page, strokes, texts, theme: "grid" } : page
        )
      );
    } else if (templateKey === "kntt_archimedes") {
      setSelected3DModel("archimedes_buoyancy");
      setIs3DWindowOpen(true);
      const texts: TextLabelItem[] = [
        { id: "ka1", x: 100, y: 60, text: "KHTN 8 (KNTT - BÀI 17): LỰC ĐẨY ARCHIMEDES", color: "#0284c7", fontSize: 22, isBold: true },
        { id: "ka2", x: 100, y: 110, text: "• Công thức định luật: FA = d · V", color: "#0f172a", fontSize: 18, isBold: true },
        { id: "ka3", x: 100, y: 150, text: "  d: Trọng lượng riêng chất lỏng (N/m³)", color: "#475569", fontSize: 15 },
        { id: "ka4", x: 100, y: 180, text: "  V: Thể tích phần chất lỏng bị chiếm chỗ (m³)", color: "#475569", fontSize: 15 },
        { id: "ka5", x: 100, y: 240, text: "• Điều kiện nổi:", color: "#16a34a", fontSize: 17, isBold: true },
        { id: "ka6", x: 120, y: 275, text: "FA > P : Vật nổi lên mặt thoáng", color: "#16a34a", fontSize: 15 },
        { id: "ka7", x: 120, y: 305, text: "FA = P : Vật nổi lơ lửng cân bằng", color: "#0284c7", fontSize: 15 },
        { id: "ka8", x: 120, y: 335, text: "FA < P : Vật chìm xuống đáy", color: "#dc2626", fontSize: 15 },
      ];
      setPages((prev) =>
        prev.map((page, idx) =>
          idx === currentPageIndex ? { ...page, texts, theme: "grid" } : page
        )
      );
    } else if (templateKey === "kntt_circuit") {
      setSelected3DModel("electric_circuit");
      setIs3DWindowOpen(true);
      const texts: TextLabelItem[] = [
        { id: "kc1", x: 100, y: 60, text: "KHTN 8 (KNTT - BÀI 22): MẠCH ĐIỆN ĐƠN GIẢN", color: "#eab308", fontSize: 22, isBold: true },
        { id: "kc2", x: 100, y: 110, text: "• Mạch điện gồm: Nguồn pin, Công tắc (Khóa K), Dây dẫn đồng, Bóng đèn.", color: "#0f172a", fontSize: 16, isBold: true },
        { id: "kc3", x: 100, y: 150, text: "• Quy ước chiều dòng điện: Cực dương (+) → Dây dẫn → Cực âm (-).", color: "#dc2626", fontSize: 16, isBold: true },
        { id: "kc4", x: 100, y: 190, text: "• Chiều dịch chuyển electron: Cực âm (-) → Dây dẫn → Cực dương (+).", color: "#2563eb", fontSize: 16, isBold: true },
      ];
      setPages((prev) =>
        prev.map((page, idx) =>
          idx === currentPageIndex ? { ...page, texts, theme: "blackboard" } : page
        )
      );
    }
    setIsTemplatesModalOpen(false);
  };

  return (
    <div
      ref={containerRef}
      className={`relative w-full h-[calc(100vh-64px)] flex flex-col overflow-hidden select-none bg-neutral-900 ${
        isFullscreen ? "h-screen z-50 fixed inset-0" : ""
      }`}
    >
      {/* ─────────────────────────────────────────────────────────────
          TOP TOOLBAR: Page Navigator, Templates, Formulas, Actions
          ───────────────────────────────────────────────────────────── */}
      <header className="h-14 border-b border-neutral-200/90 dark:border-neutral-800 bg-white/95 dark:bg-neutral-900/95 backdrop-blur-md px-3 sm:px-4 flex items-center justify-between z-20 shrink-0">
        <div className="flex items-center gap-1.5 sm:gap-2.5">
          <div className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-tr from-indigo-600 via-blue-600 to-cyan-500 text-white shadow-sm">
              <Compass className="h-4 w-4" />
            </span>
            <div className="hidden sm:block">
              <h1 className="text-xs sm:text-sm font-bold text-neutral-900 dark:text-white flex items-center gap-2">
                <span>Bảng Trắng Số 3D</span>
                <Badge variant="outline" className="text-[10px] py-0 border-indigo-500/40 text-indigo-400">
                  STEM KNTT
                </Badge>
              </h1>
            </div>
          </div>

          <div className="h-5 w-[1px] bg-neutral-200 dark:bg-neutral-800 hidden md:block" />

          {/* Page Switcher with Duplicate */}
          <div className="flex items-center gap-0.5 sm:gap-1 bg-neutral-100 dark:bg-neutral-800/80 p-1 rounded-xl">
            <button
              onClick={() => setCurrentPageIndex((prev) => Math.max(prev - 1, 0))}
              disabled={currentPageIndex === 0}
              className="p-1 rounded-lg text-neutral-600 dark:text-neutral-300 hover:bg-white dark:hover:bg-neutral-700 disabled:opacity-30"
              title="Trang trước"
            >
              <ChevronLeft className="h-3.5 w-3.5" />
            </button>

            <span className="text-[11px] font-bold px-1.5 text-neutral-700 dark:text-neutral-200 whitespace-nowrap">
              Trang {currentPageIndex + 1}/{pages.length}
            </span>

            <button
              onClick={() => setCurrentPageIndex((prev) => Math.min(prev + 1, pages.length - 1))}
              disabled={currentPageIndex === pages.length - 1}
              className="p-1 rounded-lg text-neutral-600 dark:text-neutral-300 hover:bg-white dark:hover:bg-neutral-700 disabled:opacity-30"
              title="Trang sau"
            >
              <ChevronRight className="h-3.5 w-3.5" />
            </button>

            <button
              onClick={handleAddPage}
              className="p-1 rounded-lg text-blue-600 dark:text-blue-400 hover:bg-white dark:hover:bg-neutral-700"
              title="Thêm trang trắng mới"
            >
              <Plus className="h-3.5 w-3.5" />
            </button>

            <button
              onClick={handleDuplicatePage}
              className="p-1 rounded-lg text-indigo-600 dark:text-indigo-400 hover:bg-white dark:hover:bg-neutral-700 hidden lg:inline-flex"
              title="Nhân bản trang bài giảng này"
            >
              <Copy className="h-3.5 w-3.5" />
            </button>
          </div>

          {/* STEM Templates & Formulas shortcuts */}
          <Button
            size="sm"
            variant="outline"
            onClick={() => setIsTemplatesModalOpen(true)}
            className="hidden md:flex h-8 rounded-xl text-xs font-semibold gap-1.5 border-indigo-500/30 text-indigo-600 dark:text-indigo-400"
          >
            <Sparkles className="h-3.5 w-3.5 text-amber-500" />
            <span>Mẫu Bài Giảng KNTT</span>
          </Button>

          <Button
            size="sm"
            variant="outline"
            onClick={() => setIsFormulaBarOpen((prev) => !prev)}
            className="hidden xl:flex h-8 rounded-xl text-xs font-semibold gap-1.5"
          >
            <span>∑ Ký Hiệu Khoa Học</span>
          </Button>

          {/* 3D Model PiP toggle */}
          <Button
            size="sm"
            variant={is3DWindowOpen ? "default" : "outline"}
            onClick={() => setIs3DWindowOpen((prev) => !prev)}
            className={`h-8 rounded-xl text-xs font-bold gap-1.5 ${
              is3DWindowOpen ? "bg-cyan-600 hover:bg-cyan-500 text-white" : "border-cyan-500/30 text-cyan-500"
            }`}
          >
            <Box className="h-3.5 w-3.5" />
            <span>3D PiP</span>
          </Button>

          {/* Classroom Timer Shortcut */}
          <button
            onClick={() => setIsTimerOpen((prev) => !prev)}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs font-bold border transition-all ${
              timerRunning
                ? "bg-rose-50 border-rose-300 text-rose-600 animate-pulse dark:bg-rose-950/60 dark:border-rose-800"
                : "border-neutral-200 dark:border-neutral-700 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800"
            }`}
            title="Đồng hồ đếm ngược giờ làm bài"
          >
            <Clock className="h-3.5 w-3.5 text-amber-500" />
            <span className="font-mono">
              {Math.floor(timerSecondsLeft / 60)
                .toString()
                .padStart(2, "0")}
              :
              {(timerSecondsLeft % 60).toString().padStart(2, "0")}
            </span>
          </button>
        </div>

        {/* Right actions: Undo, Redo, Zoom, Eraser Menu, Themes, Export */}
        <div className="flex items-center gap-1 sm:gap-1.5">
          <button
            onClick={handleUndo}
            disabled={undoStack.length === 0}
            className="p-1.5 sm:p-2 rounded-xl text-neutral-600 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 disabled:opacity-30 transition-all"
            title="Hoàn tác (Ctrl+Z)"
          >
            <Undo2 className="h-4 w-4" />
          </button>

          <button
            onClick={handleRedo}
            disabled={redoStack.length === 0}
            className="p-1.5 sm:p-2 rounded-xl text-neutral-600 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 disabled:opacity-30 transition-all"
            title="Làm lại (Ctrl+Y)"
          >
            <Redo2 className="h-4 w-4" />
          </button>

          {/* Zoom controls */}
          <div className="hidden lg:flex items-center gap-0.5 bg-neutral-100 dark:bg-neutral-800 p-0.5 rounded-xl text-xs font-bold">
            <button
              onClick={handleZoomOut}
              className="p-1 rounded-lg hover:bg-white dark:hover:bg-neutral-700 text-neutral-600 dark:text-neutral-300"
              title="Thu nhỏ (-)"
            >
              <ZoomOut className="h-3.5 w-3.5" />
            </button>
            <button
              onClick={handleResetZoom}
              className="px-1.5 py-0.5 text-[11px] text-neutral-700 dark:text-neutral-200"
              title="Khôi phục 100%"
            >
              {Math.round(zoom * 100)}%
            </button>
            <button
              onClick={handleZoomIn}
              className="p-1 rounded-lg hover:bg-white dark:hover:bg-neutral-700 text-neutral-600 dark:text-neutral-300"
              title="Phóng to (+)"
            >
              <ZoomIn className="h-3.5 w-3.5" />
            </button>
          </div>

          <div className="h-5 w-[1px] bg-neutral-200 dark:bg-neutral-800 mx-1 hidden sm:block" />

          {/* Image Upload Input */}
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleUploadImage}
            accept="image/*"
            className="hidden"
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            className="p-1.5 sm:p-2 rounded-xl text-neutral-600 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-all"
            title="Chèn ảnh / sơ đồ bài tập từ máy tính"
          >
            <ImageIcon className="h-4 w-4 text-emerald-500" />
          </button>

          {/* Theme Selector Button */}
          <div className="relative">
            <button
              onClick={() => setIsThemePickerOpen((prev) => !prev)}
              className="p-1.5 sm:p-2 rounded-xl text-neutral-600 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-all flex items-center gap-1"
              title="Đổi loại bảng (Trắng, Lưới, Oxy, Phấn xanh, Đen)"
            >
              <Grid className="h-4 w-4 text-emerald-500" />
            </button>

            {isThemePickerOpen && (
              <div className="absolute right-0 top-12 w-52 p-2 rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 shadow-xl z-30 space-y-1">
                <span className="text-[11px] font-bold text-neutral-400 px-2 uppercase block">Nền Bảng Học Đường:</span>
                {[
                  { key: "grid", label: "Lưới Ca-rô Toán Học", color: "bg-slate-100 text-slate-800" },
                  { key: "coordinate", label: "Hệ Trục Tọa Độ Oxy", color: "bg-blue-50 text-blue-700" },
                  { key: "white", label: "Bảng Trắng Hiện Đại", color: "bg-white text-neutral-800" },
                  { key: "dots", label: "Lưới Chấm Dot Grid", color: "bg-neutral-100 text-neutral-700" },
                  { key: "greenboard", label: "Bảng Xanh Phấn Trắng", color: "bg-emerald-800 text-white" },
                  { key: "blackboard", label: "Bảng Đen Dạ Quang", color: "bg-neutral-950 text-white" },
                ].map((th) => (
                  <button
                    key={th.key}
                    onClick={() => {
                      setBoardTheme(th.key as BoardTheme);
                      setPages((prev) =>
                        prev.map((p, i) => (i === currentPageIndex ? { ...p, theme: th.key as BoardTheme } : p))
                      );
                      setIsThemePickerOpen(false);
                    }}
                    className={`w-full text-left px-2.5 py-1.5 rounded-xl text-xs font-semibold flex items-center justify-between ${
                      boardTheme === th.key ? "bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400" : "hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-700 dark:text-neutral-300"
                    }`}
                  >
                    <span>{th.label}</span>
                    {boardTheme === th.key && <Check className="h-3.5 w-3.5 text-blue-500" />}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Clear Menu Dropdown */}
          <div className="relative">
            <button
              onClick={() => setIsClearMenuOpen((prev) => !prev)}
              className="p-1.5 sm:p-2 rounded-xl text-neutral-600 dark:text-neutral-300 hover:text-rose-600 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-all"
              title="Menu xóa bảng các kiểu"
            >
              <Trash2 className="h-4 w-4" />
            </button>

            {isClearMenuOpen && (
              <div className="absolute right-0 top-12 w-56 p-2 rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 shadow-xl z-30 space-y-1">
                <span className="text-[11px] font-bold text-neutral-400 px-2 uppercase block">Tùy Chọn Xóa:</span>
                <button
                  onClick={handleClearStrokesOnly}
                  className="w-full text-left px-2.5 py-1.5 rounded-xl text-xs font-semibold text-neutral-700 dark:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800 flex items-center gap-2"
                >
                  <Pen className="h-3.5 w-3.5 text-blue-500" />
                  <span>Chỉ xóa nét vẽ (Giữ lại chữ)</span>
                </button>
                <button
                  onClick={handleClearStickiesOnly}
                  className="w-full text-left px-2.5 py-1.5 rounded-xl text-xs font-semibold text-neutral-700 dark:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800 flex items-center gap-2"
                >
                  <StickyNote className="h-3.5 w-3.5 text-amber-500" />
                  <span>Chỉ xóa giấy Sticky Notes</span>
                </button>
                <div className="border-t border-neutral-100 dark:border-neutral-800 my-1" />
                <button
                  onClick={handleClearAll}
                  className="w-full text-left px-2.5 py-1.5 rounded-xl text-xs font-bold text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/50 flex items-center gap-2"
                >
                  <Trash2 className="h-3.5 w-3.5 text-rose-500" />
                  <span>Xóa sạch toàn bộ trang bảng</span>
                </button>
              </div>
            )}
          </div>

          <Button
            size="sm"
            onClick={handleExportPNG}
            className="h-8 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold gap-1.5 shadow-sm"
          >
            <Download className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Xuất Ảnh</span>
          </Button>

          <button
            onClick={toggleFullscreen}
            className="p-1.5 sm:p-2 rounded-xl text-neutral-600 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-all"
            title="Toàn màn hình trình chiếu"
          >
            {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
          </button>
        </div>
      </header>

      {/* ─────────────────────────────────────────────────────────────
          QUICK FORMULAS TRAY (Expandable)
          ───────────────────────────────────────────────────────────── */}
      <AnimatePresence>
        {isFormulaBarOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="bg-neutral-100 dark:bg-neutral-900/90 border-b border-neutral-200 dark:border-neutral-800 px-4 py-2 flex items-center gap-1.5 overflow-x-auto z-20 shrink-0"
          >
            <span className="text-[11px] font-bold text-neutral-500 shrink-0 mr-1">Chèn nhanh:</span>
            {QUICK_FORMULAS.map((item, idx) => (
              <button
                key={idx}
                onClick={() => handleInsertFormula(item.formula)}
                className="shrink-0 px-2.5 py-1 rounded-lg bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-xs font-bold text-neutral-800 dark:text-neutral-200 hover:border-blue-500 hover:text-blue-600 dark:hover:text-blue-400 transition-all"
                title={item.formula}
              >
                {item.label}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* ─────────────────────────────────────────────────────────────
          CANVAS PLAYGROUND & FLOATING OVERLAYS
          ───────────────────────────────────────────────────────────── */}
      <div className="relative flex-1 w-full h-full overflow-hidden touch-none">
        <canvas
          ref={canvasRef}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          className={`absolute inset-0 w-full h-full ${
            activeTool === "pan"
              ? "cursor-grab active:cursor-grabbing"
              : activeTool === "select"
              ? "cursor-default"
              : activeTool === "laser"
              ? "cursor-crosshair"
              : activeTool === "text"
              ? "cursor-text"
              : activeTool === "eraser"
              ? "cursor-none"
              : "cursor-crosshair"
          }`}
        />

        {/* Visual Eraser Indicator Circle Cursor */}
        {activeTool === "eraser" && cursorPos && (
          <div
            style={{
              position: "absolute",
              left: cursorPos.x - eraserSize / 2,
              top: cursorPos.y - eraserSize / 2,
              width: eraserSize,
              height: eraserSize,
            }}
            className="rounded-full border-2 border-rose-500 bg-rose-500/20 pointer-events-none z-30"
          />
        )}

        {/* Committed Text Labels on Board */}
        {currentPage.texts.map((t) => (
          <div
            key={t.id}
            style={{
              position: "absolute",
              left: t.x * zoom + panOffset.x,
              top: t.y * zoom + panOffset.y,
              transform: `scale(${zoom})`,
              transformOrigin: "top left",
              color: t.color,
              fontSize: `${t.fontSize}px`,
              fontWeight: t.isBold ? "bold" : "normal",
            }}
            className="pointer-events-auto cursor-move select-text p-1 rounded-lg hover:outline hover:outline-dashed hover:outline-blue-400 group"
          >
            <span>{t.text}</span>
            <button
              onClick={() => {
                pushUndoSnapshot();
                setPages((prev) =>
                  prev.map((p, i) =>
                    i === currentPageIndex
                      ? { ...p, texts: p.texts.filter((item) => item.id !== t.id) }
                      : p
                  )
                );
              }}
              className="hidden group-hover:inline-block ml-1.5 p-0.5 rounded text-rose-500 bg-white/80 dark:bg-neutral-800"
              title="Xóa chữ này"
            >
              <X className="h-3 w-3" />
            </button>
          </div>
        ))}

        {/* Committed Sticky Notes on Board */}
        {currentPage.stickies.map((sticky) => {
          const bgMap = {
            yellow: "bg-amber-100 text-amber-900 border-amber-300 dark:bg-amber-950/80 dark:text-amber-100 dark:border-amber-700",
            cyan: "bg-cyan-100 text-cyan-900 border-cyan-300 dark:bg-cyan-950/80 dark:text-cyan-100 dark:border-cyan-700",
            emerald: "bg-emerald-100 text-emerald-900 border-emerald-300 dark:bg-emerald-950/80 dark:text-emerald-100 dark:border-emerald-700",
            rose: "bg-rose-100 text-rose-900 border-rose-300 dark:bg-rose-950/80 dark:text-rose-100 dark:border-rose-700",
            purple: "bg-purple-100 text-purple-900 border-purple-300 dark:bg-purple-950/80 dark:text-purple-100 dark:border-purple-700",
          };

          return (
            <div
              key={sticky.id}
              style={{
                position: "absolute",
                left: sticky.x * zoom + panOffset.x,
                top: sticky.y * zoom + panOffset.y,
                width: sticky.width * zoom,
                transform: `scale(${zoom})`,
                transformOrigin: "top left",
              }}
              className={`p-3 rounded-2xl border shadow-lg ${bgMap[sticky.color]} z-10 transition-shadow hover:shadow-xl`}
            >
              <div
                className="flex items-center justify-between pb-1 cursor-grab active:cursor-grabbing border-b border-black/10 dark:border-white/10 mb-2"
                onPointerDown={(e) => {
                  setActiveStickyDrag({
                    id: sticky.id,
                    offsetX: e.clientX - (sticky.x * zoom + panOffset.x),
                    offsetY: e.clientY - (sticky.y * zoom + panOffset.y),
                  });
                }}
              >
                <span className="text-[10px] font-bold uppercase tracking-wider opacity-60">Ghi chú</span>
                <button
                  onClick={() => {
                    pushUndoSnapshot();
                    setPages((prev) =>
                      prev.map((p, i) =>
                        i === currentPageIndex
                          ? { ...p, stickies: p.stickies.filter((item) => item.id !== sticky.id) }
                          : p
                      )
                    );
                  }}
                  className="p-0.5 rounded text-neutral-500 hover:text-rose-600"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>

              <textarea
                value={sticky.text}
                onChange={(e) => {
                  const val = e.target.value;
                  setPages((prev) =>
                    prev.map((p, i) =>
                      i === currentPageIndex
                        ? {
                            ...p,
                            stickies: p.stickies.map((s) => (s.id === sticky.id ? { ...s, text: val } : s)),
                          }
                        : p
                    )
                  );
                }}
                className="w-full bg-transparent resize-none border-none focus:outline-none text-xs font-medium leading-relaxed"
                rows={3}
              />
            </div>
          );
        })}

        {/* Global Pointer listener for dragging Sticky note */}
        {activeStickyDrag && (
          <div
            className="fixed inset-0 z-40 cursor-grabbing"
            onPointerMove={(e) => {
              const newScreenX = e.clientX - activeStickyDrag.offsetX;
              const newScreenY = e.clientY - activeStickyDrag.offsetY;
              const world = screenToWorld(newScreenX, newScreenY);

              setPages((prev) =>
                prev.map((p, i) =>
                  i === currentPageIndex
                    ? {
                        ...p,
                        stickies: p.stickies.map((s) =>
                          s.id === activeStickyDrag.id ? { ...s, x: world.x, y: world.y } : s
                        ),
                      }
                    : p
                )
              );
            }}
            onPointerUp={() => setActiveStickyDrag(null)}
          />
        )}

        {/* Text Input Modal when clicking with Text Tool */}
        {textInputPos && (
          <div
            style={{ position: "absolute", left: textInputPos.x, top: textInputPos.y }}
            className="z-30 p-2.5 rounded-2xl border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 shadow-2xl space-y-2 min-w-[260px]"
          >
            <div className="flex items-center justify-between text-xs font-bold text-neutral-700 dark:text-neutral-300">
              <span>Chèn chữ lên bảng:</span>
              <button onClick={() => setTextInputPos(null)} className="text-neutral-400 hover:text-neutral-700">
                <X className="h-3.5 w-3.5" />
              </button>
            </div>

            <input
              autoFocus
              type="text"
              value={textInputValue}
              onChange={(e) => setTextInputValue(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleConfirmText();
                if (e.key === "Escape") setTextInputPos(null);
              }}
              placeholder="Nhập nội dung chữ..."
              className="w-full px-3 py-1.5 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-950 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
            />

            <div className="flex items-center justify-between pt-1">
              <div className="flex items-center gap-1 text-[11px] text-neutral-500">
                <span>Cỡ:</span>
                <select
                  value={textInputSize}
                  onChange={(e) => setTextInputSize(Number(e.target.value))}
                  className="px-1.5 py-0.5 rounded border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-950 text-[11px]"
                >
                  <option value={14}>14px Nhỏ</option>
                  <option value={20}>20px Vừa</option>
                  <option value={28}>28px Lớn</option>
                  <option value={38}>38px Tiêu đề</option>
                </select>
              </div>

              <Button size="sm" onClick={handleConfirmText} className="h-7 text-xs px-3 rounded-lg bg-blue-600 text-white font-bold">
                Đặt chữ
              </Button>
            </div>
          </div>
        )}

        {/* Floating 3D PiP Viewer Window */}
        <AnimatePresence>
          {is3DWindowOpen && (
            <motion.div
              drag
              dragMomentum={false}
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              style={{ left: pipPosition.x, top: pipPosition.y }}
              className="absolute z-30 w-72 sm:w-80 h-80 rounded-3xl border border-neutral-200/90 dark:border-neutral-800 bg-white/95 dark:bg-neutral-900/95 shadow-2xl backdrop-blur-md flex flex-col overflow-hidden"
            >
              {/* PiP Header */}
              <div className="px-3.5 py-2.5 border-b border-neutral-200 dark:border-neutral-800 flex items-center justify-between cursor-move bg-neutral-50/80 dark:bg-neutral-800/60">
                <div className="flex items-center gap-2">
                  <Box className="h-4 w-4 text-cyan-500" />
                  <span className="text-xs font-bold text-neutral-900 dark:text-white">Mô hình 3D Bài giảng</span>
                </div>

                <div className="flex items-center gap-1">
                  <select
                    value={selected3DModel}
                    onChange={(e) => setSelected3DModel(e.target.value as ModelType)}
                    className="text-[11px] px-1.5 py-0.5 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-neutral-800 dark:text-neutral-200 max-w-[130px] truncate"
                  >
                    <optgroup label="Bộ Sách Kết Nối Tri Thức (KNTT)">
                      <option value="human_heart">Tim người 3D (KNTT 8)</option>
                      <option value="fluid_pressure">Áp suất chất lỏng (KNTT 8)</option>
                      <option value="crystal_nacl">Muối ăn NaCl (KNTT 7)</option>
                      <option value="archimedes_buoyancy">Lực Archimedes (KNTT 8)</option>
                      <option value="solar_eclipse">Nhật thực (KNTT 6)</option>
                      <option value="electric_circuit">Mạch điện (KNTT 8)</option>
                      <option value="chromosome">Nhiễm sắc thể (Sinh 9)</option>
                      <option value="molecule_ethene">Etilen C2H4 (Hóa 9)</option>
                    </optgroup>
                    <optgroup label="Mô hình K12 phổ biến">
                      <option value="atom">Nguyên tử Bohr</option>
                      <option value="molecule_h2o">Nước H2O</option>
                      <option value="solar_system">Hệ Mặt Trời</option>
                      <option value="dna">Chuỗi ADN</option>
                      <option value="plant_cell">Tế bào thực vật</option>
                      <option value="light_prism">Lăng kính quang học</option>
                      <option value="magnetic_field">Từ trường nam châm</option>
                    </optgroup>
                  </select>

                  <button
                    onClick={() => setIs3DWindowOpen(false)}
                    className="p-1 rounded-lg text-neutral-400 hover:text-neutral-700 dark:hover:text-white"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>

              {/* PiP 3D Canvas */}
              <div className="flex-1 w-full h-full relative bg-neutral-950">
                <ThreeDViewer modelType={selected3DModel} hideQuickSelector={true} />
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Floating Classroom Timer Widget */}
        <AnimatePresence>
          {isTimerOpen && (
            <motion.div
              drag
              dragMomentum={false}
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              style={{ left: 24, top: 120 }}
              className="absolute z-30 p-4 rounded-3xl border border-neutral-200/90 dark:border-neutral-800 bg-white/95 dark:bg-neutral-900/95 shadow-2xl backdrop-blur-md w-64 space-y-3"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-neutral-900 dark:text-white flex items-center gap-1.5">
                  <Clock className="h-4 w-4 text-amber-500" />
                  <span>Đồng Hồ Đếm Giờ</span>
                </span>
                <button onClick={() => setIsTimerOpen(false)} className="text-neutral-400 hover:text-neutral-700">
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>

              <div className="text-center py-2 bg-neutral-100 dark:bg-neutral-800/80 rounded-2xl">
                <span className="text-3xl font-extrabold font-mono text-neutral-900 dark:text-white">
                  {Math.floor(timerSecondsLeft / 60)
                    .toString()
                    .padStart(2, "0")}
                  :
                  {(timerSecondsLeft % 60).toString().padStart(2, "0")}
                </span>
              </div>

              {/* Preset minute buttons */}
              <div className="grid grid-cols-4 gap-1 text-[11px] font-bold">
                {[1, 3, 5, 10].map((m) => (
                  <button
                    key={m}
                    onClick={() => {
                      setTimerSecondsLeft(m * 60);
                      setTimerRunning(false);
                    }}
                    className="py-1 rounded-lg bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-200"
                  >
                    {m}p
                  </button>
                ))}
              </div>

              <div className="flex items-center justify-between gap-2 pt-1">
                <Button
                  size="sm"
                  onClick={() => setTimerRunning((r) => !r)}
                  className={`flex-1 h-8 rounded-xl text-xs font-bold gap-1.5 ${
                    timerRunning ? "bg-amber-600 hover:bg-amber-500" : "bg-emerald-600 hover:bg-emerald-500"
                  } text-white`}
                >
                  {timerRunning ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}
                  <span>{timerRunning ? "Tạm Dừng" : "Bắt Đầu"}</span>
                </Button>

                <button
                  onClick={() => {
                    setTimerSecondsLeft(300);
                    setTimerRunning(false);
                  }}
                  className="p-2 rounded-xl bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300 hover:bg-neutral-200"
                  title="Đặt lại 5 phút"
                >
                  <RotateCcw className="h-3.5 w-3.5" />
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ─────────────────────────────────────────────────────────────
            BOTTOM FLOATING TOOLBAR: Pen, Eraser, Shapes, Colors, Sizes
            ───────────────────────────────────────────────────────────── */}
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-30 max-w-[96vw] flex flex-wrap items-center justify-center gap-1 sm:gap-1.5 p-2 rounded-2xl border border-neutral-200/90 dark:border-neutral-800 bg-white/95 dark:bg-neutral-900/95 backdrop-blur-xl shadow-2xl">
          {/* Pan / Hand Tool */}
          <button
            onClick={() => setActiveTool("pan")}
            className={`p-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1 ${
              activeTool === "pan"
                ? "bg-blue-600 text-white shadow-md shadow-blue-500/20"
                : "text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800"
            }`}
            title="Bàn tay kéo bảng tự do (Pan/Hand)"
          >
            <Hand className="h-4 w-4" />
          </button>

          {/* Select Tool */}
          <button
            onClick={() => setActiveTool("select")}
            className={`p-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1 ${
              activeTool === "select"
                ? "bg-blue-600 text-white shadow-md shadow-blue-500/20"
                : "text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800"
            }`}
            title="Con trỏ chọn / Di chuyển ghi chú"
          >
            <MousePointer className="h-4 w-4" />
          </button>

          <div className="h-6 w-[1px] bg-neutral-200 dark:bg-neutral-800 mx-0.5" />

          {/* Pen Tool with Settings Popover */}
          <div className="relative">
            <button
              onClick={() => {
                setActiveTool("pen");
                setIsStrokeSettingsOpen((prev) => !prev);
              }}
              className={`p-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1 ${
                activeTool === "pen" || activeTool === "brush" || activeTool === "neon"
                  ? "bg-blue-600 text-white shadow-md shadow-blue-500/20"
                  : "text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800"
              }`}
              title="Bút vẽ & Cài đặt nét bút"
            >
              <Pen className="h-4 w-4" />
            </button>

            {/* Pen Stroke Customization Drawer */}
            {isStrokeSettingsOpen && (
              <div className="absolute bottom-14 left-0 w-64 p-3.5 rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 shadow-2xl z-40 space-y-3">
                <div className="flex items-center justify-between pb-1 border-b border-neutral-100 dark:border-neutral-800">
                  <span className="text-xs font-bold text-neutral-800 dark:text-neutral-200 flex items-center gap-1.5">
                    <Sliders className="h-3.5 w-3.5 text-blue-500" />
                    <span>Tùy Chỉnh Nét Bút</span>
                  </span>
                  <button onClick={() => setIsStrokeSettingsOpen(false)} className="text-neutral-400 hover:text-neutral-700">
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>

                {/* Brush Type Switcher */}
                <div className="space-y-1">
                  <span className="text-[11px] font-bold text-neutral-500 block">Kiểu ngòi bút:</span>
                  <div className="grid grid-cols-3 gap-1">
                    {[
                      { key: "pen", label: "Bút bi" },
                      { key: "brush", label: "Bút lông" },
                      { key: "neon", label: "Phát sáng" },
                    ].map((b) => (
                      <button
                        key={b.key}
                        onClick={() => setActiveTool(b.key as any)}
                        className={`py-1 rounded-lg text-[11px] font-bold border ${
                          activeTool === b.key
                            ? "bg-blue-50 border-blue-500 text-blue-600 dark:bg-blue-950/60"
                            : "border-neutral-200 dark:border-neutral-700 text-neutral-600 dark:text-neutral-300"
                        }`}
                      >
                        {b.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Continuous Pen Size Slider with Live Preview */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-[11px] font-bold text-neutral-600 dark:text-neutral-300">
                    <span>Kích thước ngòi:</span>
                    <span className="text-blue-600 dark:text-blue-400 font-mono">{strokeSize}px</span>
                  </div>
                  <input
                    type="range"
                    min="1"
                    max="64"
                    value={strokeSize}
                    onChange={(e) => setStrokeSize(Number(e.target.value))}
                    className="w-full accent-blue-600 cursor-pointer"
                  />
                  {/* Preset quick buttons */}
                  <div className="flex items-center justify-between gap-1">
                    {PRESET_PEN_SIZES.map((sz) => (
                      <button
                        key={sz.size}
                        onClick={() => setStrokeSize(sz.size)}
                        className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                          strokeSize === sz.size
                            ? "bg-blue-600 text-white"
                            : "bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300"
                        }`}
                      >
                        {sz.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Line Style (Solid, Dashed, Dotted) */}
                <div className="space-y-1">
                  <span className="text-[11px] font-bold text-neutral-500 block">Kiểu đường vẽ:</span>
                  <div className="grid grid-cols-3 gap-1">
                    {[
                      { key: "solid", label: "Nét liền" },
                      { key: "dashed", label: "Nét đứt" },
                      { key: "dotted", label: "Chấm bi" },
                    ].map((ls) => (
                      <button
                        key={ls.key}
                        onClick={() => setLineStyle(ls.key as any)}
                        className={`py-1 rounded-lg text-[11px] font-bold border ${
                          lineStyle === ls.key
                            ? "bg-blue-50 border-blue-500 text-blue-600 dark:bg-blue-950/60"
                            : "border-neutral-200 dark:border-neutral-700 text-neutral-600 dark:text-neutral-300"
                        }`}
                      >
                        {ls.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Opacity slider */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-[11px] font-bold text-neutral-600 dark:text-neutral-300">
                    <span>Độ đậm nhạt (Opacity):</span>
                    <span className="font-mono">{Math.round(strokeOpacity * 100)}%</span>
                  </div>
                  <input
                    type="range"
                    min="0.1"
                    max="1"
                    step="0.05"
                    value={strokeOpacity}
                    onChange={(e) => setStrokeOpacity(Number(e.target.value))}
                    className="w-full accent-blue-600 cursor-pointer"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Highlighter Tool */}
          <button
            onClick={() => setActiveTool("highlighter")}
            className={`p-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1 ${
              activeTool === "highlighter"
                ? "bg-amber-500 text-white shadow-md shadow-amber-500/20"
                : "text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800"
            }`}
            title="Bút dạ quang nhớ dòng (Highlighter)"
          >
            <Highlighter className="h-4 w-4" />
          </button>

          {/* Laser Pointer */}
          <button
            onClick={() => setActiveTool("laser")}
            className={`p-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1 ${
              activeTool === "laser"
                ? "bg-rose-600 text-white shadow-md shadow-rose-500/20"
                : "text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800"
            }`}
            title="Bút Laser thuyết trình phát sáng"
          >
            <Flame className="h-4 w-4 text-rose-400" />
          </button>

          {/* ─────────────────────────────────────────────────────────────
              ERASER WITH MODES & SIZES
              ───────────────────────────────────────────────────────────── */}
          <div className="relative">
            <button
              onClick={() => {
                setActiveTool("eraser");
                setIsEraserSettingsOpen((prev) => !prev);
              }}
              className={`p-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1 ${
                activeTool === "eraser"
                  ? "bg-neutral-800 text-white dark:bg-white dark:text-neutral-900 shadow-md"
                  : "text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800"
              }`}
              title="Tẩy gôm & Cài đặt kiểu xóa"
            >
              <Eraser className="h-4 w-4" />
            </button>

            {/* Eraser Modes Drawer */}
            {isEraserSettingsOpen && (
              <div className="absolute bottom-14 left-0 w-64 p-3.5 rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 shadow-2xl z-40 space-y-3">
                <div className="flex items-center justify-between pb-1 border-b border-neutral-100 dark:border-neutral-800">
                  <span className="text-xs font-bold text-neutral-800 dark:text-neutral-200 flex items-center gap-1.5">
                    <Eraser className="h-3.5 w-3.5 text-rose-500" />
                    <span>Chế Độ Tẩy Gôm</span>
                  </span>
                  <button onClick={() => setIsEraserSettingsOpen(false)} className="text-neutral-400 hover:text-neutral-700">
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>

                {/* 3 Eraser Modes */}
                <div className="space-y-1">
                  <button
                    onClick={() => setEraserMode("stroke")}
                    className={`w-full text-left px-2.5 py-1.5 rounded-xl text-xs font-semibold flex items-center justify-between ${
                      eraserMode === "stroke"
                        ? "bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 font-bold"
                        : "hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-700 dark:text-neutral-300"
                    }`}
                  >
                    <span>1. Tẩy nét tự do (Pixel Eraser)</span>
                    {eraserMode === "stroke" && <Check className="h-3.5 w-3.5 text-rose-500" />}
                  </button>

                  <button
                    onClick={() => setEraserMode("object")}
                    className={`w-full text-left px-2.5 py-1.5 rounded-xl text-xs font-semibold flex items-center justify-between ${
                      eraserMode === "object"
                        ? "bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 font-bold"
                        : "hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-700 dark:text-neutral-300"
                    }`}
                  >
                    <span>2. Chạm là xóa cả nét (Object)</span>
                    {eraserMode === "object" && <Check className="h-3.5 w-3.5 text-rose-500" />}
                  </button>

                  <button
                    onClick={() => setEraserMode("area")}
                    className={`w-full text-left px-2.5 py-1.5 rounded-xl text-xs font-semibold flex items-center justify-between ${
                      eraserMode === "area"
                        ? "bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 font-bold"
                        : "hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-700 dark:text-neutral-300"
                    }`}
                  >
                    <span>3. Quét hộp xóa vùng (Area/Lasso)</span>
                    {eraserMode === "area" && <Check className="h-3.5 w-3.5 text-rose-500" />}
                  </button>
                </div>

                {/* Eraser Size Slider */}
                <div className="space-y-1.5 pt-1 border-t border-neutral-100 dark:border-neutral-800">
                  <div className="flex items-center justify-between text-[11px] font-bold text-neutral-600 dark:text-neutral-300">
                    <span>Kích thước tẩy:</span>
                    <span className="text-rose-600 font-mono">{eraserSize}px</span>
                  </div>
                  <input
                    type="range"
                    min="8"
                    max="100"
                    value={eraserSize}
                    onChange={(e) => setEraserSize(Number(e.target.value))}
                    className="w-full accent-rose-600 cursor-pointer"
                  />
                  {/* Preset eraser sizes */}
                  <div className="flex items-center justify-between gap-1">
                    {PRESET_ERASER_SIZES.map((sz) => (
                      <button
                        key={sz.size}
                        onClick={() => setEraserSize(sz.size)}
                        className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          eraserSize === sz.size
                            ? "bg-rose-600 text-white"
                            : "bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300"
                        }`}
                      >
                        {sz.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="h-6 w-[1px] bg-neutral-200 dark:bg-neutral-800 mx-0.5" />

          {/* Shapes Tools */}
          <button
            onClick={() => setActiveTool("line")}
            className={`p-2.5 rounded-xl transition-all ${
              activeTool === "line"
                ? "bg-blue-600 text-white"
                : "text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800"
            }`}
            title="Đoạn thẳng / Thước kẻ"
          >
            <Minus className="h-4 w-4" />
          </button>

          <button
            onClick={() => setActiveTool("arrow")}
            className={`p-2.5 rounded-xl transition-all ${
              activeTool === "arrow"
                ? "bg-blue-600 text-white"
                : "text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800"
            }`}
            title="Mũi tên / Vector lực"
          >
            <MoveRight className="h-4 w-4" />
          </button>

          <button
            onClick={() => setActiveTool("rect")}
            className={`p-2.5 rounded-xl transition-all ${
              activeTool === "rect"
                ? "bg-blue-600 text-white"
                : "text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800"
            }`}
            title="Hình chữ nhật"
          >
            <Square className="h-4 w-4" />
          </button>

          <button
            onClick={() => setActiveTool("circle")}
            className={`p-2.5 rounded-xl transition-all ${
              activeTool === "circle"
                ? "bg-blue-600 text-white"
                : "text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800"
            }`}
            title="Hình tròn / Elip"
          >
            <Circle className="h-4 w-4" />
          </button>

          <button
            onClick={() => setActiveTool("triangle")}
            className={`p-2.5 rounded-xl transition-all ${
              activeTool === "triangle"
                ? "bg-blue-600 text-white"
                : "text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800"
            }`}
            title="Hình tam giác"
          >
            <Triangle className="h-4 w-4" />
          </button>

          <button
            onClick={() => setActiveTool("star")}
            className={`p-2.5 rounded-xl transition-all hidden sm:inline-flex ${
              activeTool === "star"
                ? "bg-blue-600 text-white"
                : "text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800"
            }`}
            title="Hình ngôi sao"
          >
            <Sparkle className="h-4 w-4" />
          </button>

          <div className="h-6 w-[1px] bg-neutral-200 dark:bg-neutral-800 mx-0.5" />

          {/* Text & Sticky Tools */}
          <button
            onClick={() => setActiveTool("text")}
            className={`p-2.5 rounded-xl transition-all ${
              activeTool === "text"
                ? "bg-blue-600 text-white"
                : "text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800"
            }`}
            title="Chèn chữ / Nhãn văn bản"
          >
            <Type className="h-4 w-4" />
          </button>

          <button
            onClick={() => handleAddSticky("yellow")}
            className="p-2.5 rounded-xl text-amber-500 hover:bg-amber-50 dark:hover:bg-amber-950/60 transition-all"
            title="Dán giấy ghi chú (Sticky Note)"
          >
            <StickyNote className="h-4 w-4" />
          </button>

          <div className="h-6 w-[1px] bg-neutral-200 dark:bg-neutral-800 mx-0.5" />

          {/* Color Palette (Quick 6 colors) */}
          <div className="flex items-center gap-1 px-1">
            {PRESET_CHALK_COLORS.slice(0, 6).map((c) => (
              <button
                key={c.hex}
                onClick={() => setStrokeColor(c.hex)}
                style={{ backgroundColor: c.hex }}
                className={`h-5 w-5 rounded-full border border-black/20 transition-transform ${
                  strokeColor === c.hex
                    ? "scale-125 ring-2 ring-blue-500 ring-offset-2 dark:ring-offset-neutral-900"
                    : "hover:scale-110"
                }`}
                title={c.name}
              />
            ))}

            {/* Custom Color input */}
            <input
              type="color"
              value={strokeColor}
              onChange={(e) => setStrokeColor(e.target.value)}
              className="h-6 w-6 rounded-full cursor-pointer border-none bg-transparent"
              title="Chọn màu tự do"
            />
          </div>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          TEMPLATES MODAL: Fast STEM & KNTT Board Layouts
          ───────────────────────────────────────────────────────────── */}
      <AnimatePresence>
        {isTemplatesModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-xl rounded-3xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-6 shadow-2xl space-y-5"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="p-2 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600">
                    <Sparkles className="h-5 w-5" />
                  </span>
                  <div>
                    <h3 className="text-base font-bold text-neutral-900 dark:text-white">
                      Kho Mẫu Bảng Giảng Dạy STEM & KNTT
                    </h3>
                    <p className="text-xs text-neutral-500">
                      Tải mẫu bài giảng 1-click có sẵn khung sơ đồ và tích hợp mô hình 3D tương ứng.
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => setIsTemplatesModalOpen(false)}
                  className="p-1 rounded-lg text-neutral-400 hover:text-neutral-700 dark:hover:text-white"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[60vh] overflow-y-auto pr-1">
                <div
                  onClick={() => handleLoadTemplate("kntt_archimedes")}
                  className="p-4 rounded-2xl border border-cyan-200 dark:border-cyan-800/60 bg-cyan-50/50 dark:bg-cyan-950/30 hover:border-cyan-500 cursor-pointer transition-all space-y-1.5"
                >
                  <Badge className="bg-cyan-600 text-white text-[10px]">KHTN 8 (KNTT)</Badge>
                  <h4 className="text-xs font-bold text-neutral-900 dark:text-white">
                    Bài 17: Lực Đẩy Archimedes & Sự Nổi
                  </h4>
                  <p className="text-[11px] text-neutral-500">
                    Bao gồm sẵn công thức FA = d.V, điều kiện nổi chìm và bật mô hình 3D lực đẩy.
                  </p>
                </div>

                <div
                  onClick={() => handleLoadTemplate("kntt_circuit")}
                  className="p-4 rounded-2xl border border-amber-200 dark:border-amber-800/60 bg-amber-50/50 dark:bg-amber-950/30 hover:border-amber-500 cursor-pointer transition-all space-y-1.5"
                >
                  <Badge className="bg-amber-600 text-white text-[10px]">KHTN 8 (KNTT)</Badge>
                  <h4 className="text-xs font-bold text-neutral-900 dark:text-white">
                    Bài 22: Mạch Điện Cơ Bản & Chiều Dòng Điện
                  </h4>
                  <p className="text-[11px] text-neutral-500">
                    Bảng đen dạ quang kèm chiều dòng điện quy ước và mô hình 3D bóng đèn phát sáng.
                  </p>
                </div>

                <div
                  onClick={() => handleLoadTemplate("mindmap")}
                  className="p-4 rounded-2xl border border-blue-200 dark:border-blue-800/60 bg-blue-50/50 dark:bg-blue-950/30 hover:border-blue-500 cursor-pointer transition-all space-y-1.5"
                >
                  <Badge className="bg-blue-600 text-white text-[10px]">Sơ Đồ Tư Duy</Badge>
                  <h4 className="text-xs font-bold text-neutral-900 dark:text-white">
                    Khung Mindmap 4 Nhánh Trực Quan
                  </h4>
                  <p className="text-[11px] text-neutral-500">
                    Hình tròn chủ đề trung tâm và 4 mũi tên tỏa ra các nhánh khái niệm, tính chất, ứng dụng.
                  </p>
                </div>

                <div
                  onClick={() => handleLoadTemplate("tchart")}
                  className="p-4 rounded-2xl border border-purple-200 dark:border-purple-800/60 bg-purple-50/50 dark:bg-purple-950/30 hover:border-purple-500 cursor-pointer transition-all space-y-1.5"
                >
                  <Badge className="bg-purple-600 text-white text-[10px]">So Sánh Khoa Học</Badge>
                  <h4 className="text-xs font-bold text-neutral-900 dark:text-white">
                    Bảng So Sánh 2 Cột (T-Chart)
                  </h4>
                  <p className="text-[11px] text-neutral-500">
                    Phù hợp giảng dạy so sánh Đơn chất vs Hợp chất, Liên kết ion vs Cộng hóa trị.
                  </p>
                </div>

                <div
                  onClick={() => handleLoadTemplate("experiment")}
                  className="p-4 rounded-2xl border border-emerald-200 dark:border-emerald-800/60 bg-emerald-50/50 dark:bg-emerald-950/30 hover:border-emerald-500 cursor-pointer transition-all space-y-1.5 sm:col-span-2"
                >
                  <Badge className="bg-emerald-600 text-white text-[10px]">Thực Hành Thí Nghiệm</Badge>
                  <h4 className="text-xs font-bold text-neutral-900 dark:text-white">
                    Khung Báo Cáo Thí Nghiệm 4 Bước Chuẩn Sư Phạm
                  </h4>
                  <p className="text-[11px] text-neutral-500">
                    Phân chia 4 vùng ghi chú: Dụng cụ → Tiến hành → Hiện tượng & Giải thích → Kết luận.
                  </p>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
