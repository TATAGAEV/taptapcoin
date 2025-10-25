import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { TrendingUp, Users, Gift } from "lucide-react";

interface StatsProps {
  balance: number;
  totalClicks: number;
  referralCode: string;
  onWithdraw: () => void;
}

const Stats = ({ balance, totalClicks, referralCode, onWithdraw }: StatsProps) => {
  const canWithdraw = balance >= 100000;
  const referralLink = `${window.location.origin}/auth?ref=${referralCode}`;

  const copyReferralLink = () => {
    navigator.clipboard.writeText(referralLink);
  };

  return (
    <div className="w-full max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-4">
      <Card className="p-6 bg-gradient-to-br from-card to-card/50 border-primary/20">
        <div className="flex items-center justify-between mb-2">
          <span className="text-muted-foreground flex items-center gap-2">
            <TrendingUp className="w-4 h-4" />
            Баланс
          </span>
        </div>
        <div className="text-3xl font-bold text-primary">
          {balance.toFixed(1)}
        </div>
        <Button 
          onClick={onWithdraw} 
          disabled={!canWithdraw}
          className="w-full mt-4"
          size="sm"
        >
          {canWithdraw ? "Вывести средства" : `Минимум: 100,000`}
        </Button>
      </Card>

      <Card className="p-6 bg-gradient-to-br from-card to-card/50 border-secondary/20">
        <div className="flex items-center justify-between mb-2">
          <span className="text-muted-foreground flex items-center gap-2">
            <Users className="w-4 h-4" />
            Всего кликов
          </span>
        </div>
        <div className="text-3xl font-bold text-secondary">
          {totalClicks}
        </div>
      </Card>

      <Card className="p-6 bg-gradient-to-br from-card to-card/50 border-accent/20">
        <div className="flex items-center justify-between mb-2">
          <span className="text-muted-foreground flex items-center gap-2">
            <Gift className="w-4 h-4" />
            Реферальный код
          </span>
        </div>
        <div className="text-2xl font-bold text-accent mb-2">
          {referralCode}
        </div>
        <Button 
          onClick={copyReferralLink}
          variant="outline"
          className="w-full"
          size="sm"
        >
          Копировать ссылку
        </Button>
      </Card>
    </div>
  );
};

export default Stats;
