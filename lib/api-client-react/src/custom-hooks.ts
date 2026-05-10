import { useQuery } from "@tanstack/react-query";

export function useGetAIAnalysis(tradeId: number) {
  return useQuery({
    queryKey: ["ai-analysis", tradeId],
    queryFn: async () => {
      const response = await fetch(`/api/ai/analysis/${tradeId}`, {
        headers: {
          "Authorization": `Bearer ${localStorage.getItem("token")}`
        }
      });
      if (!response.ok) return null;
      return response.json();
    },
    enabled: !!tradeId,
  });
}
