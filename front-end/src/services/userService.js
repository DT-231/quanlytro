import api from "@/lib/api";

export const userService = {
  createTenant: async (data) => {
    const response = await api.post("/auth/create-tenant", data);
    return response.data;
  },

  getAll: async (params) => {
    const response = await api.get("/users", { params });
    return response.data || response;
  },

  getUserById: async (id) => {
    const response = await api.get(`/users/${id}`);
    return response.data;
  },

  uploadCCCD: async (id, file, type) => {
    const formData = new FormData();
    const fieldName = type === "front" ? "cccd_front" : "cccd_back";
    formData.append(fieldName, file);
    const response = await api.put(`/users/${id}`, formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
    return response.data;
  },

  getRoles: async () => {
    const response = await api.get("/users/roles");
    return response && response.data ? response.data : response;
  },

  getStats: async (params) => {
    const response = await api.get("/users/stats", { params });
    return response && response.data ? response.data : response;
  },

  update: async (id, data) => {
    const response = await api.put(`/users/${id}`, data);
    return response.data;
  },

  delete: async (id) => {
    const response = await api.delete(`/users/${id}`);
    return response.data;
  },
};
