"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import api from "@/lib/api";
import { AxiosError } from "axios";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { Eye, EyeOff } from "lucide-react";
import Logo from "./Logo";

interface AuthFormProps {
  type: "login" | "register";
  role: "user" | "admin" | "worker";
}

export default function AuthForm({ type, role }: AuthFormProps) {
  const router = useRouter();
  const [form, setForm] = useState({ name: "", email: "", phone: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const loadingToast = toast.loading("Processing...");

    try {
      const endpoint = type === "register" ? "/auth/register" : "/auth/login";
      const payload =
        type === "register"
          ? form
          : { email: form.email, password: form.password };

      const res = await api.post(endpoint, payload);
      const { access_token } = res.data;

      if (!access_token) throw new Error("Invalid response from server");

      localStorage.setItem("token", access_token);
      localStorage.setItem("role", role);
      if (form.name) {
        localStorage.setItem("username", form.name);
      }
      if (form.email) {
        localStorage.setItem("email", form.email);
      }
      if (form.phone) {
        localStorage.setItem("phone", form.phone);
      }

      toast.success("Success! Redirecting...", { id: loadingToast });

      setTimeout(() => {
        const targetPath = role === "admin" ? "/admin/dashboard" : role === "worker" ? "/worker/dashboard" : "/user/dashboard";
        router.push(targetPath);
      }, 400);
    } catch (err) {
      const error = err as AxiosError<{ detail?: string }>;
      const detail = error.response?.data?.detail;
      if (detail === "Email already registered") {
        toast.error("This email is already registered! Please login instead.", { id: loadingToast });
      } else {
        toast.error(detail || "Something went wrong. Please check your credentials.", { id: loadingToast });
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-[calc(100vh-60px)] flex flex-col items-center justify-center">

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="w-full max-w-md p-8 mt-20 bg-white/90 dark:bg-gray-900/90 backdrop-blur-lg rounded-2xl shadow-2xl border border-gray-100 dark:border-gray-700"
      >
        <div className="flex justify-center mb-5">
          <Logo size="lg" showText={false} />
        </div>

        <h2 className="text-3xl font-semibold text-center text-gray-900 dark:text-white mb-6">
          {type === "register"
            ? "Create Your Account"
            : role === "admin"
            ? "Admin Login"
            : role === "worker"
            ? "Field Worker Login"
            : "User Login"}
        </h2>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {type === "register" && (
            <input
              type="text"
              placeholder="Full Name"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="px-4 py-3 rounded-lg bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-800 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:outline-none"
              required
            />
          )}

          {type === "register" && (
            <input
              type="tel"
              placeholder="Contact Number"
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
              className="px-4 py-3 rounded-lg bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-800 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:outline-none"
              required
            />
          )}

          <input
            type="email"
            placeholder="Email"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            className="px-4 py-3 rounded-lg bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-800 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:outline-none"
            required
          />

          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              placeholder="Password"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              className="w-full px-4 py-3 rounded-lg bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-800 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:outline-none"
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-3.5 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors"
            >
              {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
            </button>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white py-3 rounded-lg font-medium transition-all shadow-lg hover:shadow-xl"
          >
            {loading
              ? "Processing..."
              : type === "register"
              ? "Register"
              : "Login"}
          </button>
        </form>

        {role === "user" && (
          <p className="text-center text-sm text-gray-500 dark:text-gray-400 mt-6">
            {type === "register" ? (
              <>
                Already have an account?{" "}
                <span
                  onClick={() => router.push("/auth/login/user")}
                  className="text-blue-600 cursor-pointer hover:underline"
                >
                  Login here
                </span>
              </>
            ) : (
              <>
                New user?{" "}
                <span
                  onClick={() => router.push("/auth/register")}
                  className="text-blue-600 cursor-pointer hover:underline"
                >
                  Register now
                </span>
              </>
            )}
          </p>
        )}
      </motion.div>
    </div>
  );
}
