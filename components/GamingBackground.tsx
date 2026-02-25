
import React, { useEffect, useRef } from 'react';

const GamingBackground: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d', { alpha: false }); 
    if (!ctx) return;

    const config = {
        bgColor: '#050505', 
        hexRadius: 35,      
        hexGap: 2,          
        hexStroke: 1.5,     
    };

    let w = 0, h = 0;
    
    class Hexagon {
        x: number; y: number; r: number;
        constructor(x: number, y: number, r: number) { 
          this.x = x; 
          this.y = y; 
          this.r = r; 
        }
        draw(time: number) {
            if (!ctx) return;
            ctx.beginPath();
            for (let i = 0; i < 6; i++) {
                const theta = (Math.PI / 3) * i + (Math.PI / 6); 
                const px = this.x + this.r * Math.cos(theta);
                const py = this.y + this.r * Math.sin(theta);
                if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
            }
            ctx.closePath();
            ctx.fillStyle = '#080808'; 
            ctx.globalAlpha = 1.0;
            ctx.fill();
            const speed = 0.02;
            const waveLength = 1.5;
            const safeW = w || 1;
            const phase = (this.x / safeW) * waveLength - (time * speed);
            const sineWave = (Math.sin(phase) + 1) / 2;
            const strokeOpacity = 0.05 + (Math.pow(sineWave, 2) * 0.45);
            ctx.strokeStyle = '#ffffff'; 
            ctx.lineWidth = config.hexStroke;
            ctx.globalAlpha = strokeOpacity;
            ctx.stroke();
            ctx.globalAlpha = 1.0;
        }
    }

    let hexagons: Hexagon[] = []; 
    let time = 0;
    let animationFrameId: number;

    const initHexGrid = () => {
        hexagons = [];
        const r = config.hexRadius;
        const hexW = r * Math.sqrt(3);
        const distH = hexW + config.hexGap; 
        const distV = r * 1.5 + (config.hexGap * 0.8); 
        const cols = Math.ceil(w / distH) + 2;
        const rows = Math.ceil(h / distV) + 2;
        for (let row = 0; row < rows; row++) {
            for (let col = 0; col < cols; col++) {
                let x = col * distH;
                let y = row * distV;
                if (row % 2 !== 0) x += distH / 2;
                x -= distH; y -= distV;
                hexagons.push(new Hexagon(x, y, r));
            }
        }
    };

    const animate = () => {
        if (!ctx || !canvas) return;
        time++; 
        ctx.fillStyle = config.bgColor;
        ctx.fillRect(0, 0, w, h);
        hexagons.forEach(hex => hex.draw(time));
        animationFrameId = requestAnimationFrame(animate);
    };

    const resize = () => {
        if (!canvas) return;
        w = canvas.width = window.innerWidth;
        h = canvas.height = window.innerHeight;
        initHexGrid();
    };
    
    window.addEventListener('resize', resize);
    resize(); 
    animate(); 

    return () => {
        window.removeEventListener('resize', resize);
        cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return <canvas ref={canvasRef} className="absolute inset-0 z-0 pointer-events-none w-full h-full" style={{ backgroundColor: '#050505' }} />;
}

export default GamingBackground;
