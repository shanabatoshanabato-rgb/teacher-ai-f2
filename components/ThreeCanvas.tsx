
import React, { useEffect, useRef } from 'react';

interface Particle {
  x: number;
  y: number;
  z: number;
  vx: number;
  vy: number;
  vz: number;
  radius: number;
  color: string;
  originalZ: number;
}

const ThreeCanvas: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mouseRef = useRef({ x: 0, y: 0 });
  const animFrameRef = useRef<number>(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let W = window.innerWidth;
    let H = window.innerHeight;
    canvas.width = W;
    canvas.height = H;

    const COLORS = [
      'rgba(99, 102, 241,',   // indigo
      'rgba(139, 92, 246,',   // violet
      'rgba(59, 130, 246,',   // blue
      'rgba(16, 185, 129,',   // emerald
      'rgba(255, 255, 255,',  // white
    ];

    const NUM_PARTICLES = 180;
    const FOCAL_LENGTH = W * 0.8;
    let particles: Particle[] = [];

    const createParticle = (): Particle => {
      const colorBase = COLORS[Math.floor(Math.random() * COLORS.length)];
      return {
        x: (Math.random() - 0.5) * W * 3,
        y: (Math.random() - 0.5) * H * 3,
        z: Math.random() * W,
        vx: (Math.random() - 0.5) * 0.3,
        vy: (Math.random() - 0.5) * 0.3,
        vz: -0.6 - Math.random() * 1.2,
        radius: Math.random() * 1.8 + 0.4,
        color: colorBase,
        originalZ: Math.random() * W,
      };
    };

    for (let i = 0; i < NUM_PARTICLES; i++) {
      particles.push(createParticle());
    }

    // Orbiting rings
    const RINGS = [
      { radius: 220, speed: 0.0008, color: 'rgba(99,102,241,', tilt: 0.3 },
      { radius: 340, speed: -0.0005, color: 'rgba(139,92,246,', tilt: -0.5 },
      { radius: 480, speed: 0.0003, color: 'rgba(59,130,246,', tilt: 0.7 },
    ];

    let time = 0;

    const project = (x: number, y: number, z: number) => {
      const scale = FOCAL_LENGTH / (FOCAL_LENGTH + z);
      return {
        sx: x * scale + W / 2,
        sy: y * scale + H / 2,
        scale,
      };
    };

    const drawRing = (ring: typeof RINGS[0]) => {
      const cx = W / 2 + (mouseRef.current.x - W / 2) * 0.02;
      const cy = H / 2 + (mouseRef.current.y - H / 2) * 0.02;
      const numDots = 90;
      const angle = time * ring.speed * 1000;

      ctx.beginPath();
      for (let i = 0; i < numDots; i++) {
        const theta = (i / numDots) * Math.PI * 2 + angle;
        const x3d = Math.cos(theta) * ring.radius;
        const y3d = Math.sin(theta) * ring.radius * ring.tilt;
        const z3d = Math.sin(theta) * ring.radius * 0.3;

        const scale = FOCAL_LENGTH / (FOCAL_LENGTH + z3d + 200);
        const sx = cx + x3d * scale;
        const sy = cy + y3d * scale;

        const alpha = (0.3 + (z3d + ring.radius) / (ring.radius * 2) * 0.4);
        const size = (1.5 + (z3d + ring.radius) / (ring.radius * 2) * 2) * scale;

        ctx.beginPath();
        ctx.arc(sx, sy, Math.max(0.3, size), 0, Math.PI * 2);
        ctx.fillStyle = `${ring.color}${alpha.toFixed(2)})`;
        ctx.fill();
      }
    };

    const draw = () => {
      ctx.clearRect(0, 0, W, H);

      // Draw rings
      RINGS.forEach(drawRing);

      // Draw connection lines between nearby particles
      const projected = particles.map(p => ({ ...project(p.x, p.y, p.z), p }));

      for (let i = 0; i < projected.length; i++) {
        for (let j = i + 1; j < projected.length; j++) {
          const a = projected[i];
          const b = projected[j];
          const dist = Math.hypot(a.sx - b.sx, a.sy - b.sy);
          if (dist < 120) {
            const alpha = (1 - dist / 120) * 0.15;
            ctx.beginPath();
            ctx.moveTo(a.sx, a.sy);
            ctx.lineTo(b.sx, b.sy);
            ctx.strokeStyle = `rgba(99,102,241,${alpha.toFixed(3)})`;
            ctx.lineWidth = 0.5;
            ctx.stroke();
          }
        }
      }

      // Draw particles
      particles.forEach((p, idx) => {
        const { sx, sy, scale } = project(p.x, p.y, p.z);

        if (sx < -100 || sx > W + 100 || sy < -100 || sy > H + 100 || p.z < -FOCAL_LENGTH) {
          particles[idx] = createParticle();
          particles[idx].z = FOCAL_LENGTH;
          return;
        }

        const alpha = Math.min(1, scale * 1.5);
        const r = Math.max(0.2, p.radius * scale * 3);

        // Glow effect
        const grad = ctx.createRadialGradient(sx, sy, 0, sx, sy, r * 3);
        grad.addColorStop(0, `${p.color}${alpha.toFixed(2)})`);
        grad.addColorStop(1, `${p.color}0)`);
        ctx.beginPath();
        ctx.arc(sx, sy, r * 3, 0, Math.PI * 2);
        ctx.fillStyle = grad;
        ctx.fill();

        // Core dot
        ctx.beginPath();
        ctx.arc(sx, sy, r, 0, Math.PI * 2);
        ctx.fillStyle = `${p.color}${Math.min(1, alpha * 1.5).toFixed(2)})`;
        ctx.fill();

        // Move
        const mx = (mouseRef.current.x - W / 2) * 0.0003;
        const my = (mouseRef.current.y - H / 2) * 0.0003;
        p.x += p.vx + mx;
        p.y += p.vy + my;
        p.z += p.vz;
      });

      time++;
      animFrameRef.current = requestAnimationFrame(draw);
    };

    draw();

    const handleMouse = (e: MouseEvent) => {
      mouseRef.current = { x: e.clientX, y: e.clientY };
    };

    const handleResize = () => {
      W = window.innerWidth;
      H = window.innerHeight;
      canvas.width = W;
      canvas.height = H;
    };

    window.addEventListener('mousemove', handleMouse);
    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(animFrameRef.current);
      window.removeEventListener('mousemove', handleMouse);
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 z-0 pointer-events-none"
      style={{ opacity: 0.7 }}
    />
  );
};

export default ThreeCanvas;
