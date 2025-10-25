import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";
import { ArrowLeft, CheckCircle, XCircle } from "lucide-react";

interface Withdrawal {
  id: string;
  user_id: string;
  amount: number;
  status: string;
  created_at: string;
  profiles: {
    email: string;
  };
}

const Admin = () => {
  const navigate = useNavigate();
  const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([]);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAdmin();
  }, []);

  const checkAdmin = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate("/auth");
        return;
      }

      const { data: roles } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id)
        .eq("role", "admin")
        .single();

      if (!roles) {
        toast.error("У вас нет прав администратора");
        navigate("/");
        return;
      }

      setIsAdmin(true);
      loadWithdrawals();
    } catch (error) {
      console.error("Error checking admin:", error);
      navigate("/");
    } finally {
      setLoading(false);
    }
  };

  const loadWithdrawals = async () => {
    try {
      const { data, error } = await supabase
        .from("withdrawals")
        .select(`
          *,
          profiles (
            email
          )
        `)
        .eq("status", "pending")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setWithdrawals(data || []);
    } catch (error) {
      console.error("Error loading withdrawals:", error);
      toast.error("Ошибка загрузки заявок");
    }
  };

  const handleWithdrawal = async (id: string, status: "completed" | "rejected") => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase
        .from("withdrawals")
        .update({
          status,
          processed_at: new Date().toISOString(),
          processed_by: user.id,
        })
        .eq("id", id);

      if (error) throw error;

      toast.success(
        status === "completed" 
          ? "Заявка одобрена" 
          : "Заявка отклонена"
      );
      loadWithdrawals();
    } catch (error) {
      console.error("Error processing withdrawal:", error);
      toast.error("Ошибка обработки заявки");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-2xl text-muted-foreground">Загрузка...</div>
      </div>
    );
  }

  if (!isAdmin) return null;

  return (
    <div className="min-h-screen p-8 bg-gradient-to-b from-background to-card">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-primary via-primary-glow to-primary bg-clip-text text-transparent">
            Панель администратора
          </h1>
          <Button onClick={() => navigate("/")} variant="outline">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Назад
          </Button>
        </div>

        <Card className="p-6">
          <h2 className="text-2xl font-bold mb-6 text-foreground">
            Заявки на вывод средств ({withdrawals.length})
          </h2>

          {withdrawals.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              Нет новых заявок
            </div>
          ) : (
            <div className="space-y-4">
              {withdrawals.map((withdrawal) => (
                <Card key={withdrawal.id} className="p-4 bg-card/50">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-semibold text-foreground">
                        {withdrawal.profiles.email}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        Сумма: {withdrawal.amount.toFixed(2)} токенов
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {new Date(withdrawal.created_at).toLocaleString("ru-RU")}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        onClick={() => handleWithdrawal(withdrawal.id, "completed")}
                        className="bg-green-600 hover:bg-green-700"
                      >
                        <CheckCircle className="w-4 h-4 mr-2" />
                        Одобрить
                      </Button>
                      <Button
                        onClick={() => handleWithdrawal(withdrawal.id, "rejected")}
                        variant="destructive"
                      >
                        <XCircle className="w-4 h-4 mr-2" />
                        Отклонить
                      </Button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
};

export default Admin;
