import api from "@/lib/api";

export const userService = {
  createTenant: async (data) => {
    const response = await api.post("/auth/create-tenant", data);
    return response.data;
  },

  getAll: async (params) => {
    const response = await api.get("/users", { params });
    return response.data;
  },

  getStats: async () => {
    const response = await api.get("/users/stats");
    return response.data;
  },

  update: async (id, data) => {
    const response = await api.put(`/users/${id}`, data);
    return response.data;
  },

  delete: async (id) => {
    const response = await api.delete(`/users/${id}`);
    return response.data;
  },

  uploadCCCD: async (userId, file, type) => {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("type", type);
    const response = await api.put(`/users/${userId}/upload-cccd`, formData);
    return response.data;
  },
};
