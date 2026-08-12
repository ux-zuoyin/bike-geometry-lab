import { memo, useEffect, useRef } from "react";

import "./DotField.css";

const TWO_PI = Math.PI * 2;

const DotField = memo(({
  dotRadius = 1.5,
  dotSpacing = 14,
  maxDots = 5200,
  cursorRadius = 500,
  cursorForce = 0.1,
  bulgeOnly = true,
  bulgeStrength = 67,
  glowRadius = 160,
  sparkle = false,
  waveAmplitude = 0,
  gradientFrom = "rgba(168, 85, 247, 0.35)",
  gradientTo = "rgba(180, 151, 207, 0.25)",
  glowColor = "#120F17",
}) => {
  const canvasRef = useRef(null);
  const glowRef = useRef(null);
  const dotsRef = useRef([]);
  const mouseRef = useRef({ x: -9999, y: -9999, prevX: -9999, prevY: -9999, speed: 0 });
  const rafRef = useRef(null);
  const sizeRef = useRef({ w: 0, h: 0, offsetX: 0, offsetY: 0 });
  const glowOpacity = useRef(0);
  const engagement = useRef(0);
  const propsRef = useRef({});
  const rebuildRef = useRef(null);
  const glowIdRef = useRef(`dot-field-glow-${Math.random().toString(36).slice(2, 9)}`);

  propsRef.current = { dotRadius, dotSpacing, maxDots, cursorRadius, cursorForce, bulgeOnly, bulgeStrength, sparkle, waveAmplitude, gradientFrom, gradientTo };

  useEffect(() => {
    const canvas = canvasRef.current;
    const glowEl = glowRef.current;
    if (!canvas) return undefined;
    const ctx = canvas.getContext("2d", { alpha: true });
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const reducedMotion = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    let resizeTimer;
    let frameCount = 0;
    let lastInteractionAt = 0;
    let isVisible = !document.hidden;

    const buildDots = (w, h) => {
      const p = propsRef.current;
      const baseStep = p.dotRadius + p.dotSpacing;
      const maximum = Math.max(1, p.maxDots);
      const step = Math.max(baseStep, Math.sqrt((w * h) / maximum));
      const cols = Math.floor(w / step);
      const rows = Math.floor(h / step);
      const padX = (w % step) / 2;
      const padY = (h % step) / 2;
      const dots = new Array(rows * cols);
      let index = 0;

      for (let row = 0; row < rows; row += 1) {
        for (let col = 0; col < cols; col += 1) {
          const ax = padX + col * step + step / 2;
          const ay = padY + row * step + step / 2;
          dots[index] = { ax, ay, sx: ax, sy: ay, vx: 0, vy: 0, x: ax, y: ay };
          index += 1;
        }
      }
      dotsRef.current = dots;
    };

    const resetDots = () => {
      dotsRef.current.forEach((dot) => {
        dot.sx = dot.ax;
        dot.sy = dot.ay;
        dot.vx = 0;
        dot.vy = 0;
        dot.x = dot.ax;
        dot.y = dot.ay;
      });
    };

    const drawFrame = () => {
      const dots = dotsRef.current;
      const mouse = mouseRef.current;
      const { w, h } = sizeRef.current;
      const p = propsRef.current;
      const targetEngagement = Math.min(mouse.speed / 5, 1);
      engagement.current += (targetEngagement - engagement.current) * 0.06;
      if (engagement.current < 0.001) engagement.current = 0;
      mouse.speed *= 0.82;
      const activeEngagement = engagement.current;
      glowOpacity.current += (activeEngagement - glowOpacity.current) * 0.08;

      if (glowEl) {
        glowEl.setAttribute("cx", mouse.x);
        glowEl.setAttribute("cy", mouse.y);
        glowEl.style.opacity = glowOpacity.current;
      }

      ctx.clearRect(0, 0, w, h);
      const gradient = ctx.createLinearGradient(0, 0, w, h);
      gradient.addColorStop(0, p.gradientFrom);
      gradient.addColorStop(1, p.gradientTo);
      ctx.fillStyle = gradient;

      const cursorRadiusSquared = p.cursorRadius * p.cursorRadius;
      const radius = p.dotRadius / 2;
      const time = frameCount * 0.02;
      ctx.beginPath();

      for (let index = 0; index < dots.length; index += 1) {
        const dot = dots[index];
        const dx = mouse.x - dot.ax;
        const dy = mouse.y - dot.ay;
        const distanceSquared = dx * dx + dy * dy;

        if (distanceSquared < cursorRadiusSquared && activeEngagement > 0.01) {
          const distance = Math.sqrt(distanceSquared);
          if (p.bulgeOnly) {
            const force = (1 - distance / p.cursorRadius) ** 2 * p.bulgeStrength * activeEngagement;
            const angle = Math.atan2(dy, dx);
            dot.sx += (dot.ax - Math.cos(angle) * force - dot.sx) * 0.15;
            dot.sy += (dot.ay - Math.sin(angle) * force - dot.sy) * 0.15;
          } else {
            const angle = Math.atan2(dy, dx);
            const move = (500 / distance) * (mouse.speed * p.cursorForce);
            dot.vx += Math.cos(angle) * -move;
            dot.vy += Math.sin(angle) * -move;
          }
        } else if (p.bulgeOnly) {
          dot.sx += (dot.ax - dot.sx) * 0.1;
          dot.sy += (dot.ay - dot.sy) * 0.1;
        }

        if (!p.bulgeOnly) {
          dot.vx *= 0.9;
          dot.vy *= 0.9;
          dot.x = dot.ax + dot.vx;
          dot.y = dot.ay + dot.vy;
          dot.sx += (dot.x - dot.sx) * 0.1;
          dot.sy += (dot.y - dot.sy) * 0.1;
        }

        let drawX = dot.sx;
        let drawY = dot.sy;
        if (p.waveAmplitude > 0) {
          drawY += Math.sin(dot.ax * 0.03 + time) * p.waveAmplitude;
          drawX += Math.cos(dot.ay * 0.03 + time * 0.7) * p.waveAmplitude * 0.5;
        }

        if (p.sparkle && (((index * 2654435761) ^ (frameCount >> 3)) >>> 0) % 100 < 3) {
          ctx.moveTo(drawX + radius * 1.8, drawY);
          ctx.arc(drawX, drawY, radius * 1.8, 0, TWO_PI);
        } else {
          ctx.moveTo(drawX + radius, drawY);
          ctx.arc(drawX, drawY, radius, 0, TWO_PI);
        }
      }

      ctx.fill();
    };

    const stopAnimation = () => {
      if (rafRef.current != null) cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    };

    const tick = () => {
      rafRef.current = null;
      if (!isVisible || reducedMotion) return;
      frameCount += 1;
      drawFrame();
      const hasRecentInteraction = performance.now() - lastInteractionAt < 180;
      if (hasRecentInteraction || engagement.current > 0.001) {
        rafRef.current = requestAnimationFrame(tick);
      }
    };

    const requestAnimation = () => {
      if (reducedMotion || !isVisible || rafRef.current != null) return;
      rafRef.current = requestAnimationFrame(tick);
    };

    const doResize = () => {
      const rect = canvas.parentElement.getBoundingClientRect();
      const w = rect.width;
      const h = rect.height;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      sizeRef.current = { w, h, offsetX: rect.left + window.scrollX, offsetY: rect.top + window.scrollY };
      buildDots(w, h);
      resetDots();
      drawFrame();
    };

    const resize = () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(doResize, 100);
    };

    const onPointerMove = (event) => {
      if (reducedMotion || !isVisible) return;
      const size = sizeRef.current;
      const mouse = mouseRef.current;
      const nextX = event.pageX - size.offsetX;
      const nextY = event.pageY - size.offsetY;
      const dx = mouse.x - nextX;
      const dy = mouse.y - nextY;
      const distance = Math.sqrt(dx * dx + dy * dy);
      mouse.speed += (distance - mouse.speed) * 0.5;
      mouse.prevX = mouse.x;
      mouse.prevY = mouse.y;
      mouse.x = nextX;
      mouse.y = nextY;
      lastInteractionAt = performance.now();
      requestAnimation();
    };

    const onVisibilityChange = () => {
      isVisible = !document.hidden;
      if (!isVisible) {
        stopAnimation();
        return;
      }
      mouseRef.current.speed = 0;
      engagement.current = 0;
      resetDots();
      drawFrame();
    };

    doResize();
    window.addEventListener("resize", resize);
    window.addEventListener("pointermove", onPointerMove, { passive: true });
    document.addEventListener("visibilitychange", onVisibilityChange);
    rebuildRef.current = () => {
      const { w, h } = sizeRef.current;
      if (w > 0 && h > 0) {
        buildDots(w, h);
        resetDots();
        drawFrame();
      }
    };

    return () => {
      stopAnimation();
      clearTimeout(resizeTimer);
      window.removeEventListener("resize", resize);
      window.removeEventListener("pointermove", onPointerMove);
      document.removeEventListener("visibilitychange", onVisibilityChange);
    };
  }, []);

  useEffect(() => {
    rebuildRef.current?.();
  }, [dotRadius, dotSpacing, maxDots]);

  return (
    <div className="dot-field-container">
      <canvas ref={canvasRef} className="dot-field-container__canvas" />
      <svg className="dot-field-container__glow" aria-hidden="true">
        <defs>
          <radialGradient id={glowIdRef.current}>
            <stop offset="0%" stopColor={glowColor} />
            <stop offset="100%" stopColor="transparent" />
          </radialGradient>
        </defs>
        <circle ref={glowRef} cx="-9999" cy="-9999" r={glowRadius} fill={`url(#${glowIdRef.current})`} />
      </svg>
    </div>
  );
});

DotField.displayName = "DotField";

export default DotField;
