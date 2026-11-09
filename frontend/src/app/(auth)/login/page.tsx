"use client";

import { useState } from "react";
import Link from "next/link";
// import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import axios from "axios";
import toast from "react-hot-toast";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { useAuth } from "@/features/auth/AuthContext";
import { AuthHeader } from "@/features/auth/AuthHeader";
import { getErrorMessage } from "@/lib/errors";
import { authService } from "@/services/auth.service";

interface LoginForm {
  email: string;
  password: string;
}

export default function LoginPage() {
  // const router = useRouter();
  const { login } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const [needsVerification, setNeedsVerification] = useState(false);
  const [resending, setResending] = useState(false);

  const {
    register,
    handleSubmit,
    getValues,
    formState: { errors, isSubmitting },
  } = useForm<LoginForm>();

  const onSubmit = async (values: LoginForm) => {
    setError(null);
    setNeedsVerification(false);

    try {
      await login(values);
      toast.success("Welcome back!");
      // router.replace("/dashboard");
    } catch (err) {
      const message = getErrorMessage(err);
      setError(message);
      setNeedsVerification(
        axios.isAxiosError(err) &&
          err.response?.status === 403 &&
          message.toLowerCase().includes("verify your email")
      );
    }
  };

  const resendVerification = async () => {
    setResending(true);
    try {
      toast.success(await authService.resendVerification(getValues("email")));
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setResending(false);
    }
  };

  return (
    <>
      <AuthHeader title="Welcome back" subtitle="Sign in to your account to continue" />

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
        {error && (
          <Alert variant="error">
            <p>{error}</p>
            {needsVerification && (
              <button
                type="button"
                onClick={resendVerification}
                disabled={resending}
                className="mt-1 font-semibold underline disabled:opacity-60"
              >
                {resending ? "Sending..." : "Resend verification email"}
              </button>
            )}
          </Alert>
        )}

        <Input
          label="Email"
          type="email"
          placeholder="you@company.com"
          autoComplete="email"
          error={errors.email?.message}
          {...register("email", {
            required: "Email is required",
            pattern: { value: /^\S+@\S+\.\S+$/, message: "Enter a valid email address" },
          })}
        />

        <Input
          label="Password"
          type="password"
          placeholder="Enter your password"
          autoComplete="current-password"
          error={errors.password?.message}
          {...register("password", { required: "Password is required" })}
        />

        <div className="flex justify-end">
          <Link href="/forgot-password" className="text-sm font-medium text-brand-600 hover:text-brand-700">
            Forgot password?
          </Link>
        </div>

        <Button type="submit" className="w-full" size="lg" loading={isSubmitting}>
          Sign in
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-slate-500">
        Don&apos;t have an account?{" "}
        <Link href="/register" className="font-medium text-brand-600 hover:text-brand-700">
          Create one
        </Link>
      </p>
    </>
  );
}