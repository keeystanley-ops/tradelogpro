import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

export interface UserSettings {
  id: number;
  displayName: string;
  email: string | null;
  avatarUrl: string | null;
  timezone: string;
  defaultAssetClass: string;
  defaultCurrency: string;
  startingBalance: string;
  riskPerTrade: string;
  maxDailyLoss: string | null;
  maxDailyTrades: number | null;
  theme: string;
  compactMode: boolean;
  showPnlInPercent: boolean;
  emailNotifications: boolean;
  dailySummary: boolean;
  weeklyReport: boolean;
  tradeAlerts: boolean;
}

export const SETTINGS_QUERY_KEY = ["/api/settings"];

export function useGetSettings() {
  return useQuery<UserSettings>({
    queryKey: SETTINGS_QUERY_KEY,
    queryFn: async () => {
      const token = localStorage.getItem("token");
      const res = await fetch("/api/settings", {
        headers: {
          "Authorization": `Bearer ${token}`
        }
      });
      if (!res.ok) {
        if (res.status === 401) {
          localStorage.removeItem("token");
          localStorage.removeItem("user");
        }
        throw new Error("Failed to fetch settings");
      }
      return res.json();
    },
  });
}

export function useUpdateSettings() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (updates: Partial<UserSettings>) => {
      const token = localStorage.getItem("token");
      const res = await fetch("/api/settings", {
        method: "PATCH",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify(updates),
      });
      if (!res.ok) {
        if (res.status === 401) {
          localStorage.removeItem("token");
          localStorage.removeItem("user");
        }
        throw new Error("Failed to update settings");
      }
      return res.json();
    },
    onSuccess: (data) => {
      queryClient.setQueryData(SETTINGS_QUERY_KEY, data);
    },
  });
}
