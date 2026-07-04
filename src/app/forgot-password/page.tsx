"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useMutation } from "@tanstack/react-query";
import { authApi } from "@/lib/api-client";
import { useState } from "react";
import { AlertCircle, CheckCircle2, Loader2, ArrowLeft } from "lucide-react";
import Link from "next/link";

const forgotPasswordSchema = z.object({
  email: z.string().email("Enter a valid email address"),
});

type ForgotPasswordFormValues = z.infer<typeof forgotPasswordSchema>;

export default function ForgotPasswordPage() {
  const [error, setError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);

  const form = useForm<ForgotPasswordFormValues>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: { email: "" },
  });

  const forgotPasswordMutation = useMutation({
    mutationFn: (values: ForgotPasswordFormValues) =>
      authApi.forgotPassword({ email: values.email }),
    onSuccess: () => {
      setError(null);
      setSubmitted(true);
    },
    onError: (err: Error) => {
      setError(err.message || "Unable to send reset email. Please try again.");
    },
  });

  const onSubmit = (values: ForgotPasswordFormValues) => {
    setError(null);
    setSubmitted(false);
    forgotPasswordMutation.mutate(values);
  };

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
              Forgot / Reset Password
            </h1>
            <p className="text-sm text-gray-500">
              Enter your account email and we&apos;ll send you a reset link.
            </p>
          </div>
        </div>

        {submitted ? (
          <div className="space-y-6">
            <div className="flex items-start gap-2 p-4 text-sm text-green-700 bg-green-50 rounded-md border border-green-100">
              <CheckCircle2 className="h-4 w-4 shrink-0 mt-0.5" />
              <span>
                If an account exists for that email, a password reset link has
                been sent. Check your inbox and spam folder.
              </span>
            </div>
            <Link
              href="/login"
              className="inline-flex items-center gap-2 text-sm font-semibold text-primary hover:text-primary/80 hover:underline"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to login
            </Link>
          </div>
        ) : (
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {error && (
              <div className="flex items-center gap-2 p-3 text-sm text-red-600 bg-red-50 rounded-md border border-red-100">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <div className="space-y-2">
              <Input
                id="email"
                type="email"
                placeholder="Email address"
                className="h-12 border-gray-300 rounded-md px-4"
                autoComplete="email"
                {...form.register("email")}
              />
              {form.formState.errors.email && (
                <p className="text-xs text-red-500">
                  {form.formState.errors.email.message}
                </p>
              )}
            </div>

            <Button
              className="w-full h-12 text-base font-semibold"
              type="submit"
              disabled={forgotPasswordMutation.isPending}
            >
              {forgotPasswordMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Sending reset link...
                </>
              ) : (
                "Send reset link"
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
        )}

        <div className="text-center text-sm text-gray-500">
          ©2026 Powered by{" "}
          <span className="font-semibold text-gray-900">SB Express Cargo</span>
        </div>
      </div>
    </div>
  );
}
