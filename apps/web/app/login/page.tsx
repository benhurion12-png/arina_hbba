import { AuthForm } from "@/components/auth-form";
import { AuthLayout } from "@/components/auth-layout";

export default function LoginPage() {
  return <AuthLayout title="С возвращением" subtitle="Войдите, чтобы продолжить работу с HBBA"><AuthForm mode="login" /></AuthLayout>;
}
