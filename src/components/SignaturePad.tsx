import { useRef, useState, type PointerEvent } from 'react';
import { Button } from './Button';

interface SignaturePadProps {
  /** Accessible name of the drawing area. */
  label: string;
  clearLabel: string;
  /** Alt text for a signature drawn earlier. */
  drawnLabel: string;
  /** The drawn signature as a PNG data URL, or null while empty. */
  value: string | null;
  onChange: (value: string | null) => void;
}

const WIDTH = 600;
const HEIGHT = 200;

/**
 * "Draw" mode of the signature (SPEC 5.7): a canvas to sign on with a finger, pen or
 * mouse, and Clear. People who cannot draw use "Type" instead.
 */
export function SignaturePad({ label, clearLabel, drawnLabel, value, onChange }: SignaturePadProps) {
  const canvas = useRef<HTMLCanvasElement>(null);
  const drawing = useRef(false);
  // A signature drawn before this pad was shown again is displayed as a picture.
  const [showSaved, setShowSaved] = useState(value !== null);

  const point = (event: PointerEvent<HTMLCanvasElement>) => {
    const box = event.currentTarget.getBoundingClientRect();
    const scaleX = box.width ? WIDTH / box.width : 1;
    const scaleY = box.height ? HEIGHT / box.height : 1;
    return { x: (event.clientX - box.left) * scaleX, y: (event.clientY - box.top) * scaleY };
  };

  const start = (event: PointerEvent<HTMLCanvasElement>) => {
    const context = event.currentTarget.getContext('2d');
    if (!context) return;
    drawing.current = true;
    event.currentTarget.setPointerCapture?.(event.pointerId);
    const { x, y } = point(event);
    context.lineWidth = 3;
    context.lineCap = 'round';
    context.lineJoin = 'round';
    context.strokeStyle = getComputedStyle(event.currentTarget).color || '#17201B';
    context.beginPath();
    context.moveTo(x, y);
  };

  const move = (event: PointerEvent<HTMLCanvasElement>) => {
    if (!drawing.current) return;
    const context = event.currentTarget.getContext('2d');
    if (!context) return;
    const { x, y } = point(event);
    context.lineTo(x, y);
    context.stroke();
  };

  const end = (event: PointerEvent<HTMLCanvasElement>) => {
    if (!drawing.current) return;
    drawing.current = false;
    onChange(event.currentTarget.toDataURL('image/png'));
  };

  const clear = () => {
    const element = canvas.current;
    element?.getContext('2d')?.clearRect(0, 0, WIDTH, HEIGHT);
    setShowSaved(false);
    onChange(null);
  };

  return (
    <>
      <div className="oc-sign">
        {showSaved && value ? (
          <img className="oc-sign__canvas" src={value} alt={drawnLabel} />
        ) : (
          <canvas
            className="oc-sign__canvas"
            ref={canvas}
            width={WIDTH}
            height={HEIGHT}
            role="img"
            aria-label={label}
            onPointerDown={start}
            onPointerMove={move}
            onPointerUp={end}
            onPointerLeave={end}
            onPointerCancel={end}
          />
        )}
      </div>
      <Button variant="link" onClick={clear} disabled={value === null}>
        {clearLabel}
      </Button>
    </>
  );
}
