import axiosInstance from "./axios";

export const inventoryService = {
  getProducts: async () => {
    const response = await axiosInstance.get("/products");
    return response.data;
  },

  getShortages: async () => {
    const response = await axiosInstance.get("/report/shortages");
    return response.data;
  },

  transferStock: async (transferData) => {
    const response = await axiosInstance.post("/transfer", transferData);
    return response.data;
  },
};
