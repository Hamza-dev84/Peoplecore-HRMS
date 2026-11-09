"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { useForm } from "react-hook-form";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { AuthHeader } from "@/features/auth/AuthHeader";
import { getErrorMessage } from "@/lib/errors";
import { authService } from "@/services/auth.service";

interface ForgotForm {
  email: string;
}

export default function ForgotPasswordPage() {
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ForgotForm>();

  const onSubmit = async ({ email }: ForgotForm) => {
    setError(null);
    setSuccess(null);

    try {
      setSuccess(await authService.forgotPassword(email));
    } catch (err) {
      setError(getErrorMessage(err));
    }
  };

  return (
    <>
      <AuthHeader
        title="Forgot your password?"
        subtitle="Enter your email and we will send you a reset link"
      />

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
        {error && <Alert variant="error">{error}</Alert>}
        {success && <Alert variant="success">{success}</Alert>}

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

        <Button type="submit" className="w-full" size="lg" loading={isSubmitting}>
          Send reset link
        </Button>
      </form>

      <Link
        href="/login"
        className="mt-6 flex items-center justify-center gap-2 text-sm font-medium text-slate-600 hover:text-slate-900"
      >
        <ArrowLeft size={16} /> Back to login
      </Link>
    </>
  );
}