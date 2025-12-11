// src/services/buildingService.js
import api from "../lib/api";

export const buildingService = {
  getAll: async (params) => {
    const response = await api.get("/buildings", { params });
    return response.data;
  },

  create: async (data) => {
    const response = await api.post("/buildings", data);
    return response.data;
  },

  getById: async (id) => {
    const response = await api.get(`/buildings/${id}`);
    return response.data;
  },
  
  update: async (id, data) => {
    const response = await api.put(`/buildings/${id}`, data);
    return response.data;
  },

  delete: async (id) => {
    const response = await api.delete(`/buildings/${id}`);
    return response.data;
  },
};
