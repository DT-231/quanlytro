import api from "@/lib/api";

export const authService = {
  register: async (data) => {
    const payload = {
      first_name: data.firstName,
      last_name: data.lastName,
      email: data.email,
      password: data.password,
      confirm_password: data.confirmPassword,
    };

    console.log("Payload gửi lên API:", payload);

    return await api.post("/auth/register", payload);
  },

  login: async (email, password) => {
    return await api.post("/auth/login", { email, password });
  },

  createTenant: async (userData) => {
    const response = await api.post("/auth/create-tenant", userData);
    return response.data;
  },
};
