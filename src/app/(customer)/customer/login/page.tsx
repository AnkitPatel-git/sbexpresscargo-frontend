"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { z } from "zod";
import { AlertCircle, Eye, EyeOff, Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/context/auth-context";
import { authApi } from "@/lib/api-client";

const loginSchema = z.object({
  email: z.string().min(1, "Username is required"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export default function CustomerLoginPage() {
  const { login, isCustomerUser, isLoading } = useAuth();
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  useEffect(() => {
    if (!isLoading && isCustomerUser) {
      router.replace("/dashboard");
    }
  }, [isLoading, isCustomerUser, router]);

  const loginMutation = useMutation({
    mutationFn: (values: LoginFormValues) =>
      authApi.login({
        email: values.email,
        password: values.password,
        platform: "portal",
        audience: "customer",
      }),
    onSuccess: (response) => {
      if (!response.success) {
        setError(response.message || "Login failed");
        return;
      }
      if (response.data.user?.role?.identifier !== "CUSTOMER") {
        setError("This account uses the staff login.");
        return;
      }
      login(response.data, "/dashboard");
    },
    onError: (err: Error) => {
      setError(err.message || "An unexpected error occurred");
    },
  });

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-md flex-col justify-center px-6 py-12">
      <div className="mb-8 text-center">
        <img src="/logo/logo.png" alt="SB Express Cargo" className="mx-auto h-12 w-auto object-contain" />
        <h1 className="mt-6 text-2xl font-semibold text-slate-900">Customer login</h1>
        <p className="mt-2 text-sm text-slate-500">Book shipments and check your MIS.</p>
      </div>
      <form onSubmit={form.handleSubmit((values) => { setError(null); loginMutation.mutate(values); })} className="space-y-4">
        {error && (
          <div className="flex items-center gap-2 rounded-md border border-red-100 bg-red-50 p-3 text-sm text-red-600">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}
        <Input placeholder="Username" className="h-12" {...form.register("email")} />
        {form.formState.errors.email && (
          <p className="text-xs text-red-500">{form.formState.errors.email.message}</p>
        )}
        <div className="relative">
          <Input
            type={showPassword ? "text" : "password"}
            placeholder="Password"
            className="h-12 pr-12"
            {...form.register("password")}
          />
          <button
            type="button"
            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400"
            onClick={() => setShowPassword((value) => !value)}
          >
            {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
          </button>
        </div>
        <Button className="h-12 w-full" type="submit" disabled={loginMutation.isPending}>
          {loginMutation.isPending ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : null}
          Login
        </Button>
        <div className="flex justify-between text-sm">
          <Link href="/forgot-password" className="font-medium text-primary hover:underline">
            Forgot password
          </Link>
          <Link href="/login" className="text-slate-500 hover:underline">
            Staff login
          </Link>
        </div>
      </form>
    </div>
  );
}
