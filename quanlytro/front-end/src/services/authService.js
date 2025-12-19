import api from "@/lib/api";

export const authService = {
  // Đăng ký tài khoản
  register: async (data) => {
    const payload = {
      first_name: data.firstName,
      last_name: data.lastName,
      email: data.email,
      password: data.password,
      confirm_password: data.confirmPassword,
    };
    const res = await api.post("/auth/register", payload);
    return res.data;
  },

  // Đăng nhập
  login: async (email, password) => {
    const res = await api.post("/auth/login", { email, password });
    return res.data;
  },

  // Lấy thông tin người dùng hiện tại từ token
  getCurrentUser: async () => {
    const res = await api.get("/auth/me");
    return res.data;
  },
};
