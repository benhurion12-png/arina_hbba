"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { ArrowRight, Eye, EyeOff, LoaderCircle } from "lucide-react";
import { apiFetch, ApiError } from "@/lib/api";
import type { User } from "@/lib/types";

export function AuthForm({ mode }: { mode: "login" | "register" }) {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError("");
    const form = new FormData(event.currentTarget);
    const body = {
      ...(mode === "register" ? { name: String(form.get("name")) } : {}),
      email: String(form.get("email")),
      password: String(form.get("password")),
    };

    try {
      const { user } = await apiFetch<{ user: User }>(`/auth/${mode}`, { method: "POST", body: JSON.stringify(body) });
      router.push(user.role === "ADMIN" ? "/admin" : "/dashboard");
      router.refresh();
    } catch (caught) {
      setError(caught instanceof ApiError ? caught.message : "Не удалось продолжить. Попробуйте ещё раз.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form className="auth-form" onSubmit={submit}>
      {mode === "register" && (
        <label><span>Имя</span><input name="name" autoComplete="name" placeholder="Как к вам обращаться" minLength={2} maxLength={80} required /></label>
      )}
      <label><span>Email</span><input name="email" type="email" autoComplete="email" placeholder="name@example.com" required /></label>
      <label>
        <span>Пароль</span>
        <div className="password-field">
          <input name="password" type={showPassword ? "text" : "password"} autoComplete={mode === "login" ? "current-password" : "new-password"} placeholder="Не менее 8 символов" minLength={8} required />
          <button type="button" onClick={() => setShowPassword((value) => !value)} aria-label={showPassword ? "Скрыть пароль" : "Показать пароль"}>
            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        </div>
      </label>
      {error && <div className="form-error" role="alert">{error}</div>}
      <button className="button primary auth-submit" disabled={loading}>
        {loading ? <LoaderCircle className="spin" size={19} /> : <>{mode === "login" ? "Войти" : "Создать аккаунт"}<ArrowRight size={18} /></>}
      </button>
      <p className="auth-switch">
        {mode === "login" ? "Ещё нет аккаунта?" : "Уже зарегистрированы?"}{" "}
        <Link href={mode === "login" ? "/register" : "/login"}>{mode === "login" ? "Создать" : "Войти"}</Link>
      </p>
    </form>
  );
}
