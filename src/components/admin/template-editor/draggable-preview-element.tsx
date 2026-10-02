"use client";

import {
  useRef,
  useState,
  type CSSProperties,
  type KeyboardEvent,
  type PointerEvent,
  type ReactNode,
} from "react";

type Axis = "both" | "x" | "y";

interface DraggablePreviewElementProps {
  children: ReactNode;
  className?: string;
  elementId: string;
  label: string;
  onPositionChange: (x: number, y: number) => void;
  onSelect: (elementId: string) => void;
  rotation?: number;
  scale: number;
  selected: boolean;
  style?: CSSProperties;
  x: number;
  y: number;
  axis?: Axis;
}

const clampPosition = (value: number) => Math.max(-450, Math.min(450, Math.round(value)));

export function DraggablePreviewElement({
  axis = "both",
  children,
  className,
  elementId,
  label,
  onPositionChange,
  onSelect,
  rotation = 0,
  scale,
  selected,
  style,
  x,
  y,
}: DraggablePreviewElementProps) {
  const dragRef = useRef<{
    pointerId: number;
    startClientX: number;
    startClientY: number;
    startX: number;
    startY: number;
  } | null>(null);
  const [dragging, setDragging] = useState(false);

  const updatePosition = (nextX: number, nextY: number) => {
    onPositionChange(
      axis === "y" ? x : clampPosition(nextX),
      axis === "x" ? y : clampPosition(nextY),
    );
  };

  const handlePointerDown = (event: PointerEvent<HTMLDivElement>) => {
    if (event.button !== 0) return;
    event.preventDefault();
    event.stopPropagation();
    onSelect(elementId);
    event.currentTarget.setPointerCapture(event.pointerId);
    dragRef.current = {
      pointerId: event.pointerId,
      startClientX: event.clientX,
      startClientY: event.clientY,
      startX: x,
      startY: y,
    };
    setDragging(true);
  };

  const handlePointerMove = (event: PointerEvent<HTMLDivElement>) => {
    const drag = dragRef.current;
    if (!drag || drag.pointerId !== event.pointerId) return;
    const safeScale = Math.max(scale, 0.01);
    updatePosition(
      drag.startX + (event.clientX - drag.startClientX) / safeScale,
      drag.startY + (event.clientY - drag.startClientY) / safeScale,
    );
  };

  const finishDrag = (event: PointerEvent<HTMLDivElement>) => {
    if (dragRef.current?.pointerId === event.pointerId) {
      dragRef.current = null;
      setDragging(false);
      if (event.currentTarget.hasPointerCapture(event.pointerId)) {
        event.currentTarget.releasePointerCapture(event.pointerId);
      }
    }
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    const step = event.shiftKey ? 10 : 1;
    const deltas: Record<string, [number, number]> = {
      ArrowLeft: [-step, 0],
      ArrowRight: [step, 0],
      ArrowUp: [0, -step],
      ArrowDown: [0, step],
    };
    const delta = deltas[event.key];
    if (!delta) return;
    event.preventDefault();
    onSelect(elementId);
    updatePosition(x + delta[0], y + delta[1]);
  };

  return (
    <div
      aria-label={`${label}. Arraste para posicionar ou use as setas do teclado.`}
      className={className}
      onClick={(event) => {
        event.stopPropagation();
        onSelect(elementId);
      }}
      onKeyDown={handleKeyDown}
      onPointerCancel={finishDrag}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={finishDrag}
      role="button"
      tabIndex={0}
      style={{
        ...style,
        cursor: dragging ? "grabbing" : "grab",
        outline: selected ? "2px solid #b48d56" : "2px solid transparent",
        outlineOffset: selected ? "4px" : "2px",
        touchAction: "none",
        transform: `translate(${x * scale}px, ${y * scale}px) rotate(${rotation}deg)`,
        transition: dragging ? "none" : "outline-color 120ms ease",
      }}
      title={`${label}: X ${Math.round(x)} / Y ${Math.round(y)}`}
    >
      {children}
      {selected ? (
        <span className="pointer-events-none absolute -top-6 left-0 z-50 whitespace-nowrap rounded bg-allvino-primary px-1.5 py-0.5 text-[8px] font-bold text-white shadow">
          {label}
        </span>
      ) : null}
    </div>
  );
}
