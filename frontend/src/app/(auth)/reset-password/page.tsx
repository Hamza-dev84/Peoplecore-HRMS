"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import toast from "react-hot-toast";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { PageLoader } from "@/components/ui/Spinner";
import { AuthHeader } from "@/features/auth/AuthHeader";
import { getErrorMessage } from "@/lib/errors";
import { authService } from "@/services/auth.service";

interface ResetForm {
  password: string;
  confirmPassword: string;
}

function ResetPasswordForm() {
  const router = useRouter();
  const token = useSearchParams().get("token");
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    getValues,
    formState: { errors, isSubmitting },
  } = useForm<ResetForm>();

  if (!token) {
    return (
      <>
        <AuthHeader title="Reset password" subtitle="This reset link is not valid" />
        <Alert variant="error">
          The reset link is missing or invalid.{" "}
          <Link href="/forgot-password" className="font-semibold underline">
            Request a new link
          </Link>
        </Alert>
      </>
    );
  }

  const onSubmit = async ({ password }: ResetForm) => {
    setError(null);

    try {
      const message = await authService.resetPassword(token, password);
      toast.success(message);
      router.replace("/login");
    } catch (err) {
      setError(getErrorMessage(err));
    }
  };

  return (
    <>
      <AuthHeader title="Set a new password" subtitle="Choose a strong password for your account" />

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
        {error && (
          <Alert variant="error">
            {error}{" "}
            <Link href="/forgot-password" className="font-semibold underline">
              Request a new link
            </Link>
          </Alert>
        )}

        <Input
          label="New password"
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
          label="Confirm new password"
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
          Reset password
        </Button>
      </form>
    </>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<PageLoader />}>
      <ResetPasswordForm />
    </Suspense>
  );
}