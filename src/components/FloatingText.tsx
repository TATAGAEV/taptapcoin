import { useEffect, useState } from "react";

interface FloatingTextProps {
  text: string;
  x: number;
  y: number;
  id: string;
  onComplete: (id: string) => void;
}

const FloatingText = ({ text, x, y, id, onComplete }: FloatingTextProps) => {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false);
      onComplete(id);
    }, 1000);

    return () => clearTimeout(timer);
  }, [id, onComplete]);

  if (!isVisible) return null;

  return (
    <div
      className="fixed pointer-events-none z-50 text-3xl font-bold text-primary animate-float"
      style={{
        left: `${x}px`,
        top: `${y}px`,
        animation: "float 1s ease-out forwards",
      }}
    >
      {text}
    </div>
  );
};

export default FloatingText;
