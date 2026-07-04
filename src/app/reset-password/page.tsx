"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useMutation } from "@tanstack/react-query";
import { authApi } from "@/lib/api-client";
import { useState, Suspense } from "react";
import { AlertCircle, CheckCircle2, Eye, EyeOff, Loader2, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";

const resetPasswordSchema = z
  .object({
    newPassword: z.string().min(8, "Password must be at least 8 characters"),
    confirmPassword: z.string().min(8, "Confirm your new password"),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

type ResetPasswordFormValues = z.infer<typeof resetPasswordSchema>;

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token")?.trim() ?? "";

  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const form = useForm<ResetPasswordFormValues>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      newPassword: "",
      confirmPassword: "",
    },
  });

  const resetPasswordMutation = useMutation({
    mutationFn: (values: ResetPasswordFormValues) =>
      authApi.resetPassword({
        token,
        newPassword: values.newPassword,
      }),
    onSuccess: () => {
      setError(null);
      setSuccess(true);
      setTimeout(() => router.push("/login"), 2500);
    },
    onError: (err: Error) => {
      setError(err.message || "Unable to reset password. Please try again.");
    },
  });

  const onSubmit = (values: ResetPasswordFormValues) => {
    if (!token) {
      setError("Reset link is invalid or missing. Request a new one.");
      return;
    }
    setError(null);
    resetPasswordMutation.mutate(values);
  };

  if (!token) {
    return (
      <div className="space-y-6">
        <div className="flex items-start gap-2 p-4 text-sm text-red-600 bg-red-50 rounded-md border border-red-100">
          <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
          <span>
            This reset link is invalid or has expired. Request a new password
            reset email.
          </span>
        </div>
        <Link
          href="/forgot-password"
          className="inline-flex items-center gap-2 text-sm font-semibold text-primary hover:text-primary/80 hover:underline"
        >
          <ArrowLeft className="h-4 w-4" />
          Request reset link
        </Link>
      </div>
    );
  }

  if (success) {
    return (
      <div className="space-y-6">
        <div className="flex items-start gap-2 p-4 text-sm text-green-700 bg-green-50 rounded-md border border-green-100">
          <CheckCircle2 className="h-4 w-4 shrink-0 mt-0.5" />
          <span>
            Password reset successfully. Redirecting you to login...
          </span>
        </div>
        <Link
          href="/login"
          className="inline-flex items-center gap-2 text-sm font-semibold text-primary hover:text-primary/80 hover:underline"
        >
          Go to login now
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
      {error && (
        <div className="flex items-center gap-2 p-3 text-sm text-red-600 bg-red-50 rounded-md border border-red-100">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <div className="space-y-4">
        <div className="space-y-2">
          <div className="relative">
            <Input
              id="newPassword"
              type={showPassword ? "text" : "password"}
              placeholder="New password"
              className="h-12 border-gray-300 rounded-md pr-12 px-4"
              autoComplete="new-password"
              {...form.register("newPassword")}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 p-1"
            >
              {showPassword ? (
                <EyeOff className="h-5 w-5" />
              ) : (
                <Eye className="h-5 w-5" />
              )}
              <span className="sr-only">Toggle password visibility</span>
            </button>
          </div>
          {form.formState.errors.newPassword && (
            <p className="text-xs text-red-500">
              {form.formState.errors.newPassword.message}
            </p>
          )}
        </div>

        <div className="space-y-2">
          <div className="relative">
            <Input
              id="confirmPassword"
              type={showConfirmPassword ? "text" : "password"}
              placeholder="Confirm new password"
              className="h-12 border-gray-300 rounded-md pr-12 px-4"
              autoComplete="new-password"
              {...form.register("confirmPassword")}
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 p-1"
            >
              {showConfirmPassword ? (
                <EyeOff className="h-5 w-5" />
              ) : (
                <Eye className="h-5 w-5" />
              )}
              <span className="sr-only">Toggle confirm password visibility</span>
            </button>
          </div>
          {form.formState.errors.confirmPassword && (
            <p className="text-xs text-red-500">
              {form.formState.errors.confirmPassword.message}
            </p>
          )}
        </div>
      </div>

      <Button
        className="w-full h-12 text-base font-semibold"
        type="submit"
        disabled={resetPasswordMutation.isPending}
      >
        {resetPasswordMutation.isPending ? (
          <>
            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
            Resetting password...
          </>
        ) : (
          "Reset password"
        )}
      </Button>

      <Link
        href="/login"
        className="inline-flex items-center gap-2 text-sm font-semibold text-primary hover:text-primary/80 hover:underline"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to login
      </Link>
    </form>
  );
}

export default function ResetPasswordPage() {
  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-white px-8 py-12">
      <div className="w-full max-w-md space-y-8">
        <div className="flex flex-col items-center space-y-4">
          <img
            src="/logo/logo.png"
            alt="SB Express Cargo"
            className="h-12 w-auto object-contain"
            onError={(e) => {
              e.currentTarget.style.display = "none";
            }}
          />
          <div className="text-center space-y-2">
            <h1 className="text-2xl font-semibold text-gray-900">
              Set a new password
            </h1>
            <p className="text-sm text-gray-500">
              Choose a new password for your account.
            </p>
          </div>
        </div>

        <Suspense
          fallback={
            <div className="flex justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          }
        >
          <ResetPasswordForm />
        </Suspense>

        <div className="text-center text-sm text-gray-500">
          ©2026 Powered by{" "}
          <span className="font-semibold text-gray-900">SB Express Cargo</span>
        </div>
      </div>
    </div>
  );
}
