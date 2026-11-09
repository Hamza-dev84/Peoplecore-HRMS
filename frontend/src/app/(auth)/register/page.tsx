"use client";

import { useState } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import toast from "react-hot-toast";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { AuthHeader } from "@/features/auth/AuthHeader";
import { getErrorMessage } from "@/lib/errors";
import { authService } from "@/services/auth.service";

interface RegisterForm {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
}

export default function RegisterPage() {
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    getValues,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<RegisterForm>();

  const onSubmit = async (values: RegisterForm) => {
    setError(null);
    setSuccess(null);

    try {
      const { message } = await authService.register({
        name: values.name,
        email: values.email,
        password: values.password,
      });
      setSuccess(message);
      toast.success("Account created");
      reset();
    } catch (err) {
      setError(getErrorMessage(err));
    }
  };

  return (
    <>
      <AuthHeader title="Create your account" subtitle="Get started with HRMS Enterprise" />

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
        {error && <Alert variant="error">{error}</Alert>}
        {success && (
          <Alert variant="success" title="Registration successful">
            {success}{" "}
            <Link href="/login" className="font-semibold underline">
              Go to login
            </Link>
          </Alert>
        )}

        <Input
          label="Full name"
          placeholder="John Doe"
          autoComplete="name"
          error={errors.name?.message}
          {...register("name", {
            required: "Name is required",
            minLength: { value: 2, message: "Name must be at least 2 characters" },
            maxLength: { value: 50, message: "Name cannot exceed 50 characters" },
          })}
        />

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
          placeholder="At least 8 characters"
          autoComplete="new-password"
          error={errors.password?.message}
          {...register("password", {
            required: "Password is required",
            minLength: { value: 8, message: "Password must be at least 8 characters" },
          })}
        />

        <Input
          label="Confirm password"
          type="password"
          placeholder="Re-enter your password"
          autoComplete="new-password"
          error={errors.confirmPassword?.message}
          {...register("confirmPassword", {
            required: "Please confirm your password",
            validate: (value) => value === getValues("password") || "Passwords do not match",
          })}
        />

        <Button type="submit" className="w-full" size="lg" loading={isSubmitting}>
          Create account
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-slate-500">
        Already have an account?{" "}
        <Link href="/login" className="font-medium text-brand-600 hover:text-brand-700">
          Sign in
        </Link>
      </p>
    </>
  );
}