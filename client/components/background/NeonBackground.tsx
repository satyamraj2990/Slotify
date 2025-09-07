import { useEffect, useRef } from "react";

export default function NeonBackground() {
  const ref = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = ref.current!;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let raf = 0;
    let w = (canvas.width = canvas.offsetWidth);
    let h = (canvas.height = canvas.offsetHeight);
    const DPR = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = w * DPR;
    canvas.height = h * DPR;
    ctx.scale(DPR, DPR);

    const particles = Array.from({ length: 120 }, (_, i) => ({
      x: Math.random() * w,
      y: Math.random() * h,
      a: Math.random() * Math.PI * 2,
      s: 0.4 + Math.random() * 1.2,
      r: 0.6 + Math.random() * 1.8,
    }));

    const pink = "rgba(255,20,147,0.25)";
    const fuchsia = "rgba(240, 46, 170, 0.18)";

    const render = () => {
      ctx.clearRect(0, 0, w, h);

      // flowing gradient backwash
      const grad = ctx.createRadialGradient(w * 0.7, h * 0.2, 50, w * 0.7, h * 0.2, Math.max(w, h));
      grad.addColorStop(0, pink);
      grad.addColorStop(1, "rgba(0,0,0,0)");
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, w, h);

      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];
        p.a += 0.003 + p.s * 0.0015;
        p.x += Math.cos(p.a) * p.s;
        p.y += Math.sin(p.a * 0.9) * p.s;
        if (p.x < -10) p.x = w + 10;
        if (p.x > w + 10) p.x = -10;
        if (p.y < -10) p.y = h + 10;
        if (p.y > h + 10) p.y = -10;

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = i % 3 === 0 ? pink : fuchsia;
        ctx.shadowColor = "rgba(255,20,147,0.6)";
        ctx.shadowBlur = 12;
        ctx.fill();
      }

      raf = requestAnimationFrame(render);
    };

    render();

    const onResize = () => {
      w = canvas.width = canvas.offsetWidth;
      h = canvas.height = canvas.offsetHeight;
      canvas.width = w * DPR;
      canvas.height = h * DPR;
      ctx.scale(DPR, DPR);
    };
    window.addEventListener("resize", onResize);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", onResize);
    };
  }, []);

  return <canvas ref={ref} className="absolute inset-0 -z-10 h-full w-full" aria-hidden />;
}
