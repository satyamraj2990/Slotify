import { useEffect, useMemo } from "react";
import ParticlesImpl from "react-tsparticles";
import type { Container, ISourceOptions } from "tsparticles-engine";

export type ParticleProps = {
  density?: number; // approx particles per px^2 (lower = fewer)
  speed?: number; // base particle speed
  colors?: string[]; // particle/link colors
  shape?: "circle" | "triangle" | "square";
  enableLines?: boolean;
};

export default function Particles({ density = 0.00008, speed = 0.4, colors = ["#ffffff", "#f472b6"], shape = "circle", enableLines = true }: ParticleProps) {
  const reduce = useMemo(() => matchMedia("(prefers-reduced-motion: reduce)").matches, []);
  const isMobile = useMemo(() => typeof navigator !== "undefined" && /Mobi|Android/i.test(navigator.userAgent), []);

  const options: ISourceOptions = useMemo(() => ({
    fullScreen: { enable: false },
    detectRetina: true,
    background: { color: "transparent" },
    fpsLimit: 60,
    particles: {
      number: { value: 0, density: { enable: true, area: 1 / (density || 0.00008) } },
      color: { value: colors },
      shape: { type: shape },
      opacity: { value: { min: 0.2, max: 0.8 } },
      size: { value: { min: 1, max: 2.6 } },
      move: {
        enable: true,
        speed: reduce ? 0.1 : speed,
        direction: "none",
        outModes: { default: "out" },
        decay: 0.015,
      },
      links: enableLines
        ? {
            enable: true,
            distance: isMobile ? 80 : 120,
            color: colors[0],
            opacity: 0.18,
            width: 0.6,
          }
        : { enable: false },
    },
    interactivity: {
      detectsOn: "window",
      events: {
        onHover: { enable: !reduce, mode: "attract", parallax: { enable: true, force: 10, smooth: 12 } },
        onClick: { enable: !reduce, mode: "push" },
        resize: true,
      },
      modes: {
        attract: { distance: 120, duration: 0.2, factor: 1 },
        push: { quantity: 2 },
      },
    },
    pauseOnBlur: true,
    smooth: true,
  }), [colors, density, enableLines, isMobile, reduce, shape, speed]);

  useEffect(() => {
    const onScroll = () => {
      const y = window.scrollY || 0;
      document.documentElement.style.setProperty("--particle-shift", String(Math.min(15, y * 0.02)));
    };
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const init = async (_engine: any) => {
    // default engine already works; presets/plugins can be loaded here
  };
  const loaded = async (_container?: Container): Promise<void> => {
    // reserved for future tweaks
  };

  return (
    <div className="absolute inset-0 -z-10 h-full w-full pointer-events-none">
      <ParticlesImpl id="bg-particles" init={init} loaded={loaded} options={options} className="h-full w-full" />
    </div>
  );
}
