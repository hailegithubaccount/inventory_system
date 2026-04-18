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
      
      queryClient.invalidateQueries({ queryKey: ["products"] });
      queryClient.invalidateQueries({ queryKey: ["shortages"] });
    },
  });
};
