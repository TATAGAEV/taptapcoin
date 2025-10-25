import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import Coin from "@/components/Coin";
import FloatingText from "@/components/FloatingText";
import Stats from "@/components/Stats";
import { LogOut, Shield } from "lucide-react";

interface Profile {
  id: string;
  balance: number;
  total_clicks: number;
  referral_code: string;
  referred_by: string | null;
}

interface FloatingTextItem {
  id: string;
  text: string;
  x: number;
  y: number;
}

const Index = () => {
  const navigate = useNavigate();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [clicking, setClicking] = useState(false);
  const [floatingTexts, setFloatingTexts] = useState<FloatingTextItem[]>([]);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        navigate("/auth");
        return;
      }

      await loadProfile(user.id);
      await checkAdminStatus(user.id);
    } catch (error) {
      console.error("Error checking auth:", error);
      navigate("/auth");
    } finally {
      setLoading(false);
    }
  };

  const loadProfile = async (userId: string) => {
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .single();

    if (error) {
      console.error("Error loading profile:", error);
      return;
    }

    setProfile(data);
  };

  const checkAdminStatus = async (userId: string) => {
    const { data } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", userId)
      .eq("role", "admin")
      .single();

    setIsAdmin(!!data);
  };

  const handleClick = async (e: React.MouseEvent<HTMLButtonElement>) => {
    if (clicking || !profile) return;

    setClicking(true);

    const newBalance = profile.balance + 0.1;
    const newClicks = profile.total_clicks + 1;

    // Оптимистичное обновление UI
    setProfile({
      ...profile,
      balance: newBalance,
      total_clicks: newClicks,
    });

    // Добавляем летающий текст
    const id = Date.now().toString();
    setFloatingTexts([
      ...floatingTexts,
      {
        id,
        text: "+0.1",
        x: e.clientX,
        y: e.clientY,
      },
    ]);

    try {
      // Обновляем профиль в БД
      const { error } = await supabase
        .from("profiles")
        .update({
          balance: newBalance,
          total_clicks: newClicks,
        })
        .eq("id", profile.id);

      if (error) throw error;

      // Если есть реферер, начисляем ему 30%
      if (profile.referred_by) {
        const { data: referrer } = await supabase
          .from("profiles")
          .select("id, balance, referral_code")
          .eq("referral_code", profile.referred_by)
          .single();

        if (referrer) {
          const referralBonus = 0.03; // 30% от 0.1 = 0.03

          await supabase
            .from("profiles")
            .update({
              balance: referrer.balance + referralBonus,
            })
            .eq("id", referrer.id);

          await supabase
            .from("referral_earnings")
            .insert({
              referrer_id: referrer.id,
              referred_id: profile.id,
              amount: referralBonus,
            });
        }
      }
    } catch (error) {
      console.error("Error updating balance:", error);
      toast.error("Ошибка при обновлении баланса");
      // Откатываем оптимистичное обновление
      setProfile({
        ...profile,
        balance: profile.balance,
        total_clicks: profile.total_clicks,
      });
    } finally {
      setClicking(false);
    }
  };

  const handleFloatingTextComplete = (id: string) => {
    setFloatingTexts((prev) => prev.filter((item) => item.id !== id));
  };

  const handleWithdraw = async () => {
    if (!profile || profile.balance < 100000) {
      toast.error("Минимальная сумма вывода: 100,000 токенов");
      return;
    }

    try {
      const { error } = await supabase
        .from("withdrawals")
        .insert({
          user_id: profile.id,
          amount: profile.balance,
        });

      if (error) throw error;

      // Обнуляем баланс
      const { error: updateError } = await supabase
        .from("profiles")
        .update({ balance: 0 })
        .eq("id", profile.id);

      if (updateError) throw updateError;

      setProfile({ ...profile, balance: 0 });
      toast.success("Заявка на вывод создана! Ожидайте обработки администратором.");
    } catch (error) {
      console.error("Error creating withdrawal:", error);
      toast.error("Ошибка при создании заявки на вывод");
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/auth");
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-background to-card">
        <div className="text-2xl text-muted-foreground">Загрузка...</div>
      </div>
    );
  }

  if (!profile) return null;

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-card p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-5xl font-bold bg-gradient-to-r from-primary via-primary-glow to-primary bg-clip-text text-transparent">
            CoinClicker
          </h1>
          <div className="flex gap-2">
            {isAdmin && (
              <Button onClick={() => navigate("/admin")} variant="outline">
                <Shield className="w-4 h-4 mr-2" />
                Админ панель
              </Button>
            )}
            <Button onClick={handleLogout} variant="outline">
              <LogOut className="w-4 h-4 mr-2" />
              Выйти
            </Button>
          </div>
        </div>

        <div className="mb-8">
          <Stats
            balance={profile.balance}
            totalClicks={profile.total_clicks}
            referralCode={profile.referral_code}
            onWithdraw={handleWithdraw}
          />
        </div>

        <div className="flex justify-center items-center py-12">
          <Coin onClick={handleClick} disabled={clicking} />
        </div>

        <div className="text-center text-muted-foreground mt-8">
          <p className="text-lg">
            Нажимайте на монету, чтобы заработать токены!
          </p>
          <p className="text-sm mt-2">
            Каждый клик = 0.1 токен | Реферальный бонус = 30%
          </p>
        </div>
      </div>

      {floatingTexts.map((item) => (
        <FloatingText
          key={item.id}
          id={item.id}
          text={item.text}
          x={item.x}
          y={item.y}
          onComplete={handleFloatingTextComplete}
        />
      ))}
    </div>
  );
};

export default Index;
