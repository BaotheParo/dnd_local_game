/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useRef } from 'react';
import { SceneType } from '../../types/game';

interface WorldCanvasProps {
  sceneType: SceneType;
  integrity: number;
  alarm: number;
  isStormActive?: boolean;
  threatenedSquadCount?: number;
  onTriggerPulse?: () => void;
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  alpha: number;
  maxLife: number;
  life: number;
  color: string;
  type: 'ember' | 'rain' | 'spark' | 'mist';
}

export const WorldCanvas: React.FC<WorldCanvasProps> = ({
  sceneType,
  integrity,
  alarm,
  isStormActive = false,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Use refs to feed dynamic React props into isolated 60fps loop without re-triggering effect
  const propsRef = useRef({ sceneType, integrity, alarm, isStormActive });
  propsRef.current = { sceneType, integrity, alarm, isStormActive };

  // Simulation state refs
  const simRef = useRef({
    cameraX: 0,
    cameraY: 0,
    caravanX: 180,
    caravanY: 0,
    wheelAngle: 0,
    time: 0,
    shake: 0,
    hitstopUntil: 0,
    flashColor: '',
    flashAlpha: 0,
    particles: [] as Particle[],
    lastTime: performance.now(),
    keys: {
      left: false,
      right: false,
      up: false,
      down: false,
      space: false,
    },
  });

  // Global trigger hooks exposed to window for hit flashes and camera shakes
  useEffect(() => {
    (window as any).triggerWorldImpact = (type: 'damage' | 'shield' | 'power') => {
      const s = simRef.current;
      if (type === 'damage') {
        s.shake = 16;
        s.flashColor = 'rgba(239, 68, 68, 0.45)'; // red
        s.flashAlpha = 1.0;
        s.hitstopUntil = performance.now() + 60; // 60ms hitstop
      } else if (type === 'shield') {
        s.shake = 8;
        s.flashColor = 'rgba(56, 189, 248, 0.35)'; // sky blue
        s.flashAlpha = 0.8;
      } else if (type === 'power') {
        s.shake = 6;
        s.flashColor = 'rgba(250, 204, 21, 0.35)'; // golden
        s.flashAlpha = 0.8;
      }
    };

    return () => {
      delete (window as any).triggerWorldImpact;
    };
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;

    const handleResize = () => {
      if (!canvas) return;
      canvas.width = canvas.parentElement?.clientWidth || window.innerWidth;
      canvas.height = canvas.parentElement?.clientHeight || window.innerHeight;
    };
    handleResize();
    window.addEventListener('resize', handleResize);

    // Keyboard handlers
    const handleKeyDown = (e: KeyboardEvent) => {
      const k = simRef.current.keys;
      if (e.key === 'ArrowLeft' || e.key === 'a') k.left = true;
      if (e.key === 'ArrowRight' || e.key === 'd') k.right = true;
      if (e.key === 'ArrowUp' || e.key === 'w') k.up = true;
      if (e.key === 'ArrowDown' || e.key === 's') k.down = true;
      if (e.key === ' ') {
        k.space = true;
        // Spawn rune spark burst
        const width = canvas.width;
        const groundY = canvas.height * 0.68;
        for (let i = 0; i < 20; i++) {
          simRef.current.particles.push({
            x: width * 0.35 + (Math.random() - 0.5) * 60,
            y: groundY - 40,
            vx: (Math.random() - 0.5) * 140,
            vy: -Math.random() * 120 - 40,
            radius: Math.random() * 3 + 1,
            alpha: 1,
            maxLife: 0.8,
            life: 0.8,
            color: '#38bdf8',
            type: 'spark',
          });
        }
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      const k = simRef.current.keys;
      if (e.key === 'ArrowLeft' || e.key === 'a') k.left = false;
      if (e.key === 'ArrowRight' || e.key === 'd') k.right = false;
      if (e.key === 'ArrowUp' || e.key === 'w') k.up = false;
      if (e.key === 'ArrowDown' || e.key === 's') k.down = false;
      if (e.key === ' ') k.space = false;
    };

    const handleBlur = () => {
      const k = simRef.current.keys;
      k.left = false;
      k.right = false;
      k.up = false;
      k.down = false;
      k.space = false;
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    window.addEventListener('blur', handleBlur);

    // Initialize particles
    const sim = simRef.current;
    sim.particles = [];
    for (let i = 0; i < 60; i++) {
      sim.particles.push({
        x: Math.random() * (canvas.width || 800),
        y: Math.random() * (canvas.height || 600),
        vx: -30 - Math.random() * 40,
        vy: (Math.random() - 0.5) * 10,
        radius: Math.random() * 2.5 + 0.8,
        alpha: Math.random() * 0.6 + 0.2,
        maxLife: 4 + Math.random() * 4,
        life: Math.random() * 4,
        color: '#fef08a',
        type: 'ember',
      });
    }

    // 60fps Isolated Game Loop
    const loop = (currentTime: number) => {
      const rawDt = (currentTime - sim.lastTime) / 1000;
      sim.lastTime = currentTime;
      // Clamp delta time to 50ms to prevent simulation explosion on tab switch
      const dt = Math.min(rawDt, 0.05);

      // Check hitstop
      if (currentTime < sim.hitstopUntil) {
        animId = requestAnimationFrame(loop);
        return;
      }

      sim.time += dt;

      // Decay camera shake
      if (sim.shake > 0) {
        sim.shake = Math.max(0, sim.shake - dt * 30);
      }

      // Decay screen flash
      if (sim.flashAlpha > 0) {
        sim.flashAlpha = Math.max(0, sim.flashAlpha - dt * 3.5);
      }

      // Camera pan
      const shakeOffsetX = (Math.random() - 0.5) * sim.shake;
      const shakeOffsetY = (Math.random() - 0.5) * sim.shake;

      const width = canvas.width;
      const height = canvas.height;
      const groundY = height * 0.68;

      ctx.save();
      ctx.clearRect(0, 0, width, height);

      // Apply camera shake
      ctx.translate(shakeOffsetX, shakeOffsetY);

      // DRAW ATMOSPHERIC WORLD
      const { sceneType, alarm, isStormActive } = propsRef.current;
      const isRainScene = sceneType === 'clue_puzzle';

      // 1. Sky & Background Gradients
      const skyGrad = ctx.createLinearGradient(0, 0, 0, height);
      if (isStormActive) {
        skyGrad.addColorStop(0, '#020617'); // slate-950
        skyGrad.addColorStop(0.5, '#0f172a'); // slate-900
        skyGrad.addColorStop(1, '#090d16');
      } else if (isRainScene) {
        skyGrad.addColorStop(0, '#0c1626');
        skyGrad.addColorStop(0.5, '#1e293b');
        skyGrad.addColorStop(1, '#0b1320');
      } else {
        skyGrad.addColorStop(0, '#081528'); // Deep twilight blue
        skyGrad.addColorStop(0.6, '#0f2438');
        skyGrad.addColorStop(1, '#071822');
      }
      ctx.fillStyle = skyGrad;
      ctx.fillRect(-20, -20, width + 40, height + 40);

      // 2. Distant Mist Mountain Ridges
      const ridgeY = height * 0.45;
      ctx.beginPath();
      ctx.moveTo(-10, height);
      ctx.lineTo(-10, ridgeY);
      for (let x = 0; x <= width + 40; x += 60) {
        const yOffset = Math.sin(x * 0.003 + sim.time * 0.1) * 35 + Math.cos(x * 0.007) * 20;
        ctx.lineTo(x, ridgeY + yOffset);
      }
      ctx.lineTo(width + 20, height);
      ctx.closePath();
      ctx.fillStyle = isStormActive ? 'rgba(15, 23, 42, 0.7)' : 'rgba(12, 32, 50, 0.6)';
      ctx.fill();

      // 3. Midground Silhouette Pine Trees
      const treeBaseY = groundY - 20;
      ctx.fillStyle = isStormActive ? 'rgba(6, 12, 22, 0.85)' : 'rgba(9, 28, 38, 0.85)';
      for (let i = 0; i < width + 100; i += 75) {
        const tHeight = 70 + ((i * 37) % 50);
        const tx = i - ((sim.time * 40) % 75);
        ctx.beginPath();
        ctx.moveTo(tx, treeBaseY);
        ctx.lineTo(tx + 22, treeBaseY - tHeight);
        ctx.lineTo(tx + 44, treeBaseY);
        ctx.closePath();
        ctx.fill();
      }

      // 4. Ground Layer
      const groundGrad = ctx.createLinearGradient(0, groundY, 0, height);
      groundGrad.addColorStop(0, '#0b1622');
      groundGrad.addColorStop(0.3, '#070f18');
      groundGrad.addColorStop(1, '#03070b');
      ctx.fillStyle = groundGrad;
      ctx.fillRect(-10, groundY, width + 20, height - groundY + 20);

      // Road track / bridge stone lines
      ctx.strokeStyle = 'rgba(56, 189, 248, 0.15)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(-20, groundY + 32);
      ctx.lineTo(width + 20, groundY + 32);
      ctx.stroke();

      ctx.strokeStyle = 'rgba(217, 119, 6, 0.12)';
      ctx.beginPath();
      ctx.moveTo(-20, groundY + 54);
      ctx.lineTo(width + 20, groundY + 54);
      ctx.stroke();

      // 5. Active Weather & Environmental Particles
      // Emit rain if rain scene
      if (isRainScene) {
        if (Math.random() < 0.8) {
          sim.particles.push({
            x: Math.random() * width,
            y: -10,
            vx: -80,
            vy: 420 + Math.random() * 100,
            radius: 1,
            alpha: 0.5,
            maxLife: 1.5,
            life: 1.5,
            color: '#7dd3fc',
            type: 'rain',
          });
        }
      }

      // 6. Draw Caravan
      const caravanBaseX = width * 0.28;
      const caravanBaseY = groundY - 14;
      const bobY = Math.sin(sim.time * 4) * 3;
      sim.wheelAngle += dt * 3.5;

      // Lantern Light Cone (radial warm glow)
      const lanternX = caravanBaseX + 115;
      const lanternY = caravanBaseY - 55 + bobY;
      const lightGrad = ctx.createRadialGradient(
        lanternX,
        lanternY,
        5,
        lanternX,
        lanternY,
        180
      );
      lightGrad.addColorStop(0, 'rgba(254, 240, 138, 0.7)'); // bright warm gold
      lightGrad.addColorStop(0.3, 'rgba(245, 158, 11, 0.35)');
      lightGrad.addColorStop(0.7, 'rgba(217, 119, 6, 0.12)');
      lightGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = lightGrad;
      ctx.beginPath();
      ctx.arc(lanternX, lanternY, 180, 0, Math.PI * 2);
      ctx.fill();

      // Caravan Hull Shadow
      ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
      ctx.beginPath();
      ctx.ellipse(caravanBaseX + 50, groundY + 6, 80, 14, 0, 0, Math.PI * 2);
      ctx.fill();

      // Caravan Body (Main Carriage Cabin)
      ctx.save();
      ctx.translate(caravanBaseX, caravanBaseY + bobY);

      // Chassis frame
      ctx.fillStyle = '#1e1b18'; // dark aged oak
      ctx.beginPath();
      ctx.roundRect(-20, -65, 125, 55, 6);
      ctx.fill();
      ctx.strokeStyle = '#78350f'; // bronze trim
      ctx.lineWidth = 3;
      ctx.stroke();

      // Arched Roof with Runes
      ctx.fillStyle = '#292524';
      ctx.beginPath();
      ctx.moveTo(-25, -65);
      ctx.lineTo(110, -65);
      ctx.lineTo(95, -88);
      ctx.lineTo(-10, -88);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = '#d97706';
      ctx.lineWidth = 2;
      ctx.stroke();

      // Glowing Rune Inscriptions on Side Panel
      ctx.strokeStyle = '#38bdf8'; // glowing cyan
      ctx.lineWidth = 1.8;
      ctx.shadowColor = '#0284c7';
      ctx.shadowBlur = 8;
      ctx.beginPath();
      // Rune Glyph 1
      ctx.moveTo(10, -38);
      ctx.lineTo(25, -52);
      ctx.lineTo(40, -38);
      ctx.moveTo(25, -52);
      ctx.lineTo(25, -25);
      // Rune Glyph 2
      ctx.moveTo(55, -26);
      ctx.lineTo(75, -50);
      ctx.lineTo(75, -26);
      ctx.stroke();
      ctx.shadowBlur = 0; // reset

      // Glass windows with warm lantern glow
      ctx.fillStyle = 'rgba(251, 191, 36, 0.85)';
      ctx.fillRect(8, -52, 14, 12);
      ctx.fillRect(45, -52, 14, 12);

      // Sacred Golden Lantern Post on front
      ctx.strokeStyle = '#f59e0b';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(105, -30);
      ctx.lineTo(115, -50);
      ctx.stroke();

      // Hanging Lantern Lamp
      ctx.fillStyle = '#fef08a';
      ctx.beginPath();
      ctx.arc(115, -55, 8, 0, Math.PI * 2);
      ctx.fill();

      // Caravan Wheels (Two Heavy Rune Wheels with rotating spokes)
      const drawWheel = (wx: number, wy: number) => {
        ctx.save();
        ctx.translate(wx, wy);
        ctx.rotate(sim.wheelAngle);

        // Outer bronze rim
        ctx.strokeStyle = '#d97706';
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.arc(0, 0, 18, 0, Math.PI * 2);
        ctx.stroke();

        // Inner axle
        ctx.fillStyle = '#451a03';
        ctx.beginPath();
        ctx.arc(0, 0, 7, 0, Math.PI * 2);
        ctx.fill();

        // Rotating Spokes with rune gems
        ctx.strokeStyle = '#fbbf24';
        ctx.lineWidth = 2;
        for (let a = 0; a < 4; a++) {
          const angle = (a * Math.PI) / 2;
          ctx.beginPath();
          ctx.moveTo(-Math.cos(angle) * 16, -Math.sin(angle) * 16);
          ctx.lineTo(Math.cos(angle) * 16, Math.sin(angle) * 16);
          ctx.stroke();
        }

        ctx.restore();
      };

      drawWheel(0, 0);
      drawWheel(85, 0);

      ctx.restore();

      // 7. Bell-Tapping Mist Creature (in storm challenge)
      if (isStormActive) {
        const creatureX = width * 0.74 + Math.sin(sim.time * 2) * 25;
        const creatureY = groundY - 140 + Math.cos(sim.time * 3) * 18;

        // Swirling dark mist body
        const mistGrad = ctx.createRadialGradient(
          creatureX,
          creatureY,
          10,
          creatureX,
          creatureY,
          130
        );
        mistGrad.addColorStop(0, 'rgba(15, 23, 42, 0.95)');
        mistGrad.addColorStop(0.5, 'rgba(30, 41, 59, 0.6)');
        mistGrad.addColorStop(1, 'rgba(15, 23, 42, 0)');
        ctx.fillStyle = mistGrad;
        ctx.beginPath();
        ctx.arc(creatureX, creatureY, 130, 0, Math.PI * 2);
        ctx.fill();

        // Glowing yellow mist eyes
        ctx.fillStyle = '#fef08a';
        ctx.shadowColor = '#eab308';
        ctx.shadowBlur = 14;
        ctx.beginPath();
        ctx.ellipse(creatureX - 22, creatureY - 20, 7, 12, 0.2, 0, Math.PI * 2);
        ctx.ellipse(creatureX + 18, creatureY - 20, 7, 12, -0.2, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;

        // Floating bronze bells orbiting the creature
        for (let b = 0; b < 4; b++) {
          const bAngle = sim.time * 2.2 + (b * Math.PI) / 2;
          const bx = creatureX + Math.cos(bAngle) * 65;
          const by = creatureY + Math.sin(bAngle) * 45;

          ctx.fillStyle = '#d97706';
          ctx.beginPath();
          ctx.arc(bx, by, 7, 0, Math.PI * 2);
          ctx.fill();

          // Bell chime wave pulse
          ctx.strokeStyle = 'rgba(251, 191, 36, 0.4)';
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          ctx.arc(bx, by, 12 + ((sim.time * 30 + b * 10) % 20), 0, Math.PI * 2);
          ctx.stroke();
        }
      }

      // 8. Particle System Update & Render
      for (let i = sim.particles.length - 1; i >= 0; i--) {
        const p = sim.particles[i];
        p.life -= dt;
        if (p.life <= 0) {
          if (p.type === 'ember') {
            // Recycle ember
            p.x = width + 10;
            p.y = groundY - 40 + (Math.random() - 0.5) * 80;
            p.life = p.maxLife;
          } else {
            sim.particles.splice(i, 1);
            continue;
          }
        }

        p.x += p.vx * dt;
        p.y += p.vy * dt;

        ctx.fillStyle = p.color;
        ctx.globalAlpha = (p.life / p.maxLife) * p.alpha;
        ctx.beginPath();

        if (p.type === 'rain') {
          ctx.strokeStyle = p.color;
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          ctx.moveTo(p.x, p.y);
          ctx.lineTo(p.x - 4, p.y + 12);
          ctx.stroke();
        } else {
          ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
          ctx.fill();
        }
      }
      ctx.globalAlpha = 1.0;

      // 9. Foreground Rolling Ground Mist
      const fogGrad = ctx.createLinearGradient(0, height - 70, 0, height);
      fogGrad.addColorStop(0, 'rgba(15, 23, 42, 0)');
      fogGrad.addColorStop(0.5, 'rgba(30, 41, 59, 0.35)');
      fogGrad.addColorStop(1, 'rgba(15, 23, 42, 0.85)');
      ctx.fillStyle = fogGrad;
      ctx.fillRect(0, height - 70, width, 70);

      // 10. Screen Flash Overlay (for hits, shields, powers)
      if (sim.flashAlpha > 0.01) {
        ctx.fillStyle = sim.flashColor;
        ctx.globalAlpha = sim.flashAlpha;
        ctx.fillRect(-20, -20, width + 40, height + 40);
        ctx.globalAlpha = 1.0;
      }

      ctx.restore();

      animId = requestAnimationFrame(loop);
    };

    animId = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      window.removeEventListener('blur', handleBlur);
    };
  }, []);

  return (
    <div className="absolute inset-0 w-full h-full overflow-hidden pointer-events-none select-none">
      <canvas ref={canvasRef} className="w-full h-full block" />
    </div>
  );
};
