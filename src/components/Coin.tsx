import { useState } from "react";
import { Coins } from "lucide-react";

interface CoinProps {
  onClick: (e: React.MouseEvent<HTMLButtonElement>) => void;
  disabled?: boolean;
}

const Coin = ({ onClick, disabled }: CoinProps) => {
  const [isPressed, setIsPressed] = useState(false);

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    setIsPressed(true);
    onClick(e);
    setTimeout(() => setIsPressed(false), 100);
  };

  return (
    <button
      onClick={handleClick}
      disabled={disabled}
      className={`
        relative w-64 h-64 rounded-full 
        bg-gradient-to-br from-primary via-primary-glow to-primary
        shadow-[0_0_60px_hsl(var(--primary)/0.5)]
        transition-all duration-100 ease-out
        hover:scale-105 active:scale-95
        disabled:opacity-50 disabled:cursor-not-allowed
        ${isPressed ? "scale-95" : "scale-100"}
      `}
      style={{
        boxShadow: isPressed 
          ? "0 0 40px hsl(var(--primary)/0.3)" 
          : "0 0 60px hsl(var(--primary)/0.5), 0 10px 30px rgba(0,0,0,0.3)"
      }}
    >
      <div className="absolute inset-0 rounded-full flex items-center justify-center">
        <Coins className="w-32 h-32 text-primary-foreground drop-shadow-2xl" />
      </div>
      <div className="absolute inset-0 rounded-full bg-gradient-to-b from-white/20 to-transparent" />
    </button>
  );
};

export default Coin;
