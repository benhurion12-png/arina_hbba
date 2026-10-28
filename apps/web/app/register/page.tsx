import { AuthForm } from "@/components/auth-form";
import { AuthLayout } from "@/components/auth-layout";

export default function RegisterPage() {
  return <AuthLayout title="Создайте аккаунт" subtitle="Сохраняйте анализы и наблюдайте динамику"><AuthForm mode="register" /></AuthLayout>;
}
