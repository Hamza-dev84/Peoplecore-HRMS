"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { PageLoader } from "@/components/ui/Spinner";
import { AuthHeader } from "@/features/auth/AuthHeader";
import { getErrorMessage } from "@/lib/errors";
import { authService } from "@/services/auth.service";

type Status = "loading" | "success" | "error";

function VerifyEmailContent() {
  const token = useSearchParams().get("token");
  const called = useRef(false);
  const [status, setStatus] = useState<Status>(token ? "loading" : "error");
  const [message, setMessage] = useState(token ? "" : "The verification link is missing or invalid.");

  useEffect(() => {
    if (!token || called.current) return;
    called.current = true;

    authService
      .verifyEmail(token)
      .then((result) => {
        setMessage(result);
        setStatus("success");
      })
      .catch((err) => {
        setMessage(getErrorMessage(err));
        setStatus("error");
      });
  }, [token]);

  return (
    <>
      <AuthHeader title="Email verification" subtitle="Confirming your email address" />

      {status === "loading" && <PageLoader />}

      {status === "success" && (
        <div className="space-y-4">
          <Alert variant="success">{message}</Alert>
          <Link href="/login">
            <Button className="w-full" size="lg">
              Continue to login
            </Button>
          </Link>
        </div>
      )}

      {status === "error" && (
        <div className="space-y-4">
          <Alert variant="error">{message}</Alert>
          <p className="text-sm text-slate-500">
            If your link has expired, sign in and use &quot;Resend verification email&quot; to get a new one.
          </p>
          <Link href="/login">
            <Button variant="outline" className="w-full">
              Back to login
            </Button>
          </Link>
        </div>
      )}
    </>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={<PageLoader />}>
      <VerifyEmailContent />
    </Suspense>
  );
}