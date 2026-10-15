import { useEffect, useRef } from "react";
import { SceneType } from "../../types/game";

interface Props {
  sceneType: SceneType;
  integrity: number;
  alarm: number;
  isStormActive?: boolean;
  threatenedSquadCount?: number;
}

export function WorldBackdrop({
  sceneType,
  alarm,
  isStormActive = false,
}: Props) {
  const world = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const target = window as Window & {
      triggerWorldImpact?: (type: "damage" | "shield" | "power") => void;
    };
    let timeout: ReturnType<typeof setTimeout>;
    target.triggerWorldImpact = (type) => {
      world.current?.setAttribute("data-impact", type);
      clearTimeout(timeout);
      timeout = setTimeout(
        () => world.current?.removeAttribute("data-impact"),
        600,
      );
    };
    return () => {
      clearTimeout(timeout);
      delete target.triggerWorldImpact;
    };
  }, []);
  return (
    <div
      ref={world}
      className={`illustrated-world ${isStormActive ? "world-storm" : ""} ${sceneType === "clue_puzzle" ? "world-rain" : ""}`}
      aria-hidden="true"
    >
      <div className="world-art" />
      <div className="world-vignette" />
      {alarm >= 4 && <div className="world-alarm" />}
      <div className="firefly-field">
        {Array.from({ length: 16 }, (_, i) => (
          <i
            key={i}
            style={{
              left: `${(i * 37) % 100}%`,
              top: `${25 + ((i * 19) % 70)}%`,
              animationDelay: `${i * -0.8}s`,
            }}
          />
        ))}
      </div>
      <div className="world-impact" />
    </div>
  );
}
