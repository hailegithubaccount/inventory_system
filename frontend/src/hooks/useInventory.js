import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { inventoryService } from "../api/inventoryService";

export const useProductsQuery = () => {
  return useQuery({
    queryKey: ["products"],
    queryFn: inventoryService.getProducts,
  });
};

export const useShortagesQuery = () => {
  return useQuery({
    queryKey: ["shortages"],
    queryFn: inventoryService.getShortages,
  });
};

export const useTransferMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: inventoryService.transferStock,
    onSuccess: () => {
      // Invalidate queries to trigger a refetch of fresh data
      queryClient.invalidateQueries({ queryKey: ["products"] });
      queryClient.invalidateQueries({ queryKey: ["shortages"] });
    },
  });
};
