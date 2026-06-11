// app/not-found.tsx
"use client";

import Link from "next/link";
import { useEffect, useRef, useState, useCallback } from "react";
import { motion } from "framer-motion";

/* ========================================================
   SISTEMA CREATIVO: "El Teorema del Valor Atípico"
   Combina familias de curvas estadísticas en una composición
   generativa de líneas finas, gradientes y ruido granular.
   ======================================================== */

export default function NotFound() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isClient, setIsClient] = useState(false);
  const animRef = useRef<number>(0);
  const timeRef = useRef<number>(0);

  // Colores de la paleta magistral
  const PALETTE = {
    deep: "#0f172a",      // fondo oscuro (slate 900)
    grid: "#1e293b",      // rejilla
    blue: "#3b82f6",
    cyan: "#06b6d4",
    purple: "#8b5cf6",
    orange: "#f97316",
    red: "#ef4444",
    emerald: "#10b981",
    textSoft: "#cbd5e1",
    white: "#f8fafc",
  };

  // Configuración de familias de curvas
  const curveFamilies = {
    gaussian: { count: 15, paramStart: 0.5, paramEnd: 1.8 },
    weibull: { count: 12, shapeStart: 0.8, shapeEnd: 2.5 },
    mixture: { count: 8, mixStart: 0.1, mixEnd: 0.9 },
    timeseries: { count: 20, freqStart: 1, freqEnd: 6 },
    variogram: { count: 10, rangeStart: 0.3, rangeEnd: 1.0 },
  };

  const drawFrame = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const W = canvas.width;
    const H = canvas.height;
    const t = timeRef.current;

    // Limpiar
    ctx.clearRect(0, 0, W, H);

    // 1. Fondo con ruido granular (Perlin simplificado) y gradiente radial
    const bgGrad = ctx.createRadialGradient(W * 0.3, H * 0.3, 50, W * 0.7, H * 0.7, W);
    bgGrad.addColorStop(0, "#1e293b");
    bgGrad.addColorStop(1, "#0f172a");
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, W, H);

    // Textura granular (puntos semi-transparentes con ruido)
    ctx.fillStyle = "rgba(255,255,255,0.03)";
    for (let i = 0; i < 1500; i++) {
      const x = (Math.sin(i * 12.9898 + t * 0.2) * 43758.5453) % 1 * W;
      const y = (Math.cos(i * 78.233 + t * 0.15) * 43758.5453) % 1 * H;
      const r = 0.5 + ((Math.sin(i * 45.164 + t * 0.1) * 43758.5453) % 1) * 1.5;
      ctx.beginPath();
      ctx.arc(x, y, r, 0, 2 * Math.PI);
      ctx.fill();
    }

    // 2. Rejilla técnica de fondo (muy sutil)
    ctx.strokeStyle = "rgba(255,255,255,0.05)";
    ctx.lineWidth = 0.5;
    const stepX = W / 24;
    const stepY = H / 16;
    for (let x = stepX; x < W; x += stepX) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, H);
      ctx.stroke();
    }
    for (let y = stepY; y < H; y += stepY) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(W, y);
      ctx.stroke();
    }

    // 3. Familias de curvas delgadas superpuestas
    const drawCurveFamily = (
      type: keyof typeof curveFamilies,
      originX: number,
      originY: number,
      scaleX: number,
      scaleY: number,
      colorBase: string,
      alpha: number,
      lineWidth: number
    ) => {
      const cfg = curveFamilies[type];
      ctx.save();
      ctx.translate(originX, originY);

      for (let i = 0; i < cfg.count; i++) {
        const param =
          "paramStart" in cfg
            ? cfg.paramStart + (i / (cfg.count - 1)) * (cfg.paramEnd - cfg.paramStart)
            : 0;
        const freq =
          "freqStart" in cfg
            ? cfg.freqStart + (i / (cfg.count - 1)) * (cfg.freqEnd - cfg.freqStart)
            : 1;
        const mix =
          "mixStart" in cfg
            ? cfg.mixStart + (i / (cfg.count - 1)) * (cfg.mixEnd - cfg.mixStart)
            : 0.5;
        const range =
          "rangeStart" in cfg
            ? cfg.rangeStart + (i / (cfg.count - 1)) * (cfg.rangeEnd - cfg.rangeStart)
            : 0.5;

        ctx.beginPath();
        let first = true;

        for (let sx = 0; sx <= scaleX; sx += 1.5) {
          const normX = sx / scaleX; // 0..1
          let y = 0;

          switch (type) {
            case "gaussian":
              // familia de gaussianas con σ variable (param) y media desplazada ligeramente con el tiempo
              const mu = 0.5 + 0.05 * Math.sin(t * 0.5 + i);
              y = Math.exp(-Math.pow((normX - mu) / (0.15 * param), 2));
              break;

            case "weibull":
              // función de supervivencia Weibull (1 - CDF) → da la forma de decaimiento
              if (normX <= 0) y = 1;
              else {
                const k = param; // shape
                const lambda = 0.5;
                y = Math.exp(-Math.pow(normX / lambda, k));
              }
              break;

            case "mixture":
              // mezcla de dos normales
              const comp1 = Math.exp(-Math.pow((normX - 0.35) / 0.12, 2));
              const comp2 = Math.exp(-Math.pow((normX - 0.65) / 0.12, 2));
              y = mix * comp1 + (1 - mix) * comp2;
              break;

            case "timeseries":
              // onda compuesta que varía con el tiempo
              y =
                0.5 +
                0.25 * Math.sin(normX * Math.PI * 2 * freq + t * 2) +
                0.15 * Math.cos(normX * Math.PI * 4 * freq * 0.7 - t);
              break;

            case "variogram":
              // modelo esférico de variograma
              if (normX <= range) {
                y = 1.5 * (normX / range) - 0.5 * Math.pow(normX / range, 3);
              } else {
                y = 1;
              }
              break;
          }

          const screenX = sx;
          const screenY = -y * scaleY;
          if (first) {
            ctx.moveTo(screenX, screenY);
            first = false;
          } else {
            ctx.lineTo(screenX, screenY);
          }
        }

        ctx.strokeStyle = colorBase;
        ctx.globalAlpha = alpha * (0.4 + 0.6 * ((i + 1) / cfg.count)); // degradado de opacidad
        ctx.lineWidth = lineWidth;
        ctx.stroke();
      }

      ctx.restore();
    };

    // Posicionamiento artístico de las familias
    // Gaussianas en el centro-izquierda
    drawCurveFamily("gaussian", W * 0.08, H * 0.55, W * 0.35, H * 0.18, PALETTE.blue, 0.8, 1.2);
    // Weibull (supervivencia) en el centro-derecha alto
    drawCurveFamily("weibull", W * 0.55, H * 0.32, W * 0.4, H * 0.16, PALETTE.purple, 0.75, 1.2);
    // Mezcla (perfilamiento) abajo derecha
    drawCurveFamily("mixture", W * 0.58, H * 0.78, W * 0.38, H * 0.15, PALETTE.orange, 0.7, 1.0);
    // Series temporales abajo izquierda
    drawCurveFamily("timeseries", W * 0.05, H * 0.85, W * 0.3, H * 0.12, PALETTE.emerald, 0.8, 1.0);
    // Variograma (geo) en el centro inferior
    drawCurveFamily("variogram", W * 0.32, H * 0.9, W * 0.32, H * 0.08, PALETTE.cyan, 0.7, 1.2);

    // 4. Elementos adicionales: puntos de datos dispersos que dan sensación analítica
    ctx.fillStyle = "rgba(255,255,255,0.4)";
    for (let i = 0; i < 60; i++) {
      const x = (Math.sin(i * 34.56 + t * 0.3) * 43758.5453) % 1 * W;
      const y = (Math.cos(i * 87.12 + t * 0.2) * 43758.5453) % 1 * H;
      ctx.beginPath();
      ctx.arc(x, y, 1.2, 0, 2 * Math.PI);
      ctx.fill();
    }

    // 5. "404" como texto camuflado en medio de las curvas (efecto Oulipo)
    ctx.font = "bold 120px 'Courier New', monospace";
    ctx.fillStyle = "rgba(255,255,255,0.07)";
    ctx.textAlign = "center";
    ctx.fillText("404", W * 0.5, H * 0.5);

    timeRef.current += 0.005;
    animRef.current = requestAnimationFrame(drawFrame);
  }, []);

  useEffect(() => {
    setIsClient(true);
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const resize = () => {
      const container = canvas.parentElement;
      if (!container) return;
      const w = container.clientWidth;
      const h = Math.max(450, window.innerHeight * 0.7);
      canvas.width = w;
      canvas.height = h;
    };

    window.addEventListener("resize", resize);
    resize();

    // Iniciar animación
    animRef.current = requestAnimationFrame(drawFrame);

    return () => {
      window.removeEventListener("resize", resize);
      cancelAnimationFrame(animRef.current);
    };
  }, [drawFrame]);

  return (
    <main className="flex min-h-[100svh-5rem] flex-col items-center justify-center bg-slate-950 px-4 text-center">
      <div className="relative w-full max-w-5xl">
        {isClient && (
          <canvas
            ref={canvasRef}
            className="w-full rounded-xl border border-white/10 shadow-2xl"
            style={{ display: "block" }}
          />
        )}
        {/* Texto animado con Framer Motion */}
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1.2, delay: 0.3 }}
            className="text-center"
          >
            <h1 className="text-5xl md:text-7xl font-bold tracking-tight text-white drop-shadow-lg"
              style={{ fontFamily: "'Courier New', monospace" }}>
              404 NOT FOUND
            </h1>
            <p className="mt-4 text-lg md:text-2xl text-slate-300 max-w-xl mx-auto font-light">
              <span className="italic">But in the long tail, it remains statistically possible.</span>
            </p>
          </motion.div>
        </div>
      </div>

      <div className="mt-8 max-w-md text-slate-400 text-sm mx-auto">
        <p className="mb-6">
          La página que buscas está fuera de nuestro intervalo de confianza actual.
          Como buen analista, sabemos que ningún modelo es perfecto: este outlier podría existir en otra muestra.
        </p>
        <Link
          href="/"
          className="inline-flex items-center rounded-full bg-gradient-to-r from-blue-600 to-purple-600 px-6 py-3 text-sm font-medium text-white shadow-lg hover:from-blue-500 hover:to-purple-500 transition-all duration-300"
        >
          ← Regresar a la distribución principal
        </Link>
      </div>
    </main>
  );
}