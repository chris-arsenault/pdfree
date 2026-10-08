import { useRef, type RefObject, type PointerEvent } from "react";
export function SignatureCanvas({ canvasRef }: { canvasRef: RefObject<HTMLCanvasElement | null> }) {
  const drawing = useRef(false);
  const point = (event: PointerEvent<HTMLCanvasElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    return {
      x: ((event.clientX - rect.left) * 640) / rect.width,
      y: ((event.clientY - rect.top) * 200) / rect.height,
    };
  };
  const start = (event: PointerEvent<HTMLCanvasElement>) => {
    const context = event.currentTarget.getContext("2d");
    if (!context) return;
    const p = point(event);
    drawing.current = true;
    context.strokeStyle = "#173732";
    context.lineWidth = 2.8;
    context.lineCap = "round";
    context.lineJoin = "round";
    context.beginPath();
    context.moveTo(p.x, p.y);
    event.currentTarget.setPointerCapture(event.pointerId);
  };
  const move = (event: PointerEvent<HTMLCanvasElement>) => {
    if (!drawing.current) return;
    const p = point(event),
      context = event.currentTarget.getContext("2d");
    context?.lineTo(p.x, p.y);
    context?.stroke();
  };
  return (
    <div className="signature-pad">
      <canvas
        ref={canvasRef}
        width="640"
        height="200"
        aria-label="Draw your signature"
        onPointerDown={start}
        onPointerMove={move}
        onPointerUp={() => {
          drawing.current = false;
        }}
        onPointerCancel={() => {
          drawing.current = false;
        }}
      />
      <span>Sign above</span>
      <button
        className="text-button"
        onClick={() => canvasRef.current?.getContext("2d")?.clearRect(0, 0, 640, 200)}
      >
        Clear
      </button>
    </div>
  );
}
