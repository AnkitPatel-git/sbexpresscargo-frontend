"use client"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { useAuth } from "@/context/auth-context"
import { useMutation } from "@tanstack/react-query"
import { authApi } from "@/lib/api-client"
import { useState, useEffect } from "react"
import { AlertCircle, Loader2, Eye, EyeOff } from "lucide-react"
import Image from "next/image"
import Link from "next/link"

const loginSchema = z.object({
    email: z.string().min(1, "Username is required"),
    password: z.string().min(6, "Password must be at least 6 characters"),
})

type LoginFormValues = z.infer<typeof loginSchema>

export default function LoginPage() {
    const { login } = useAuth()
    const [error, setError] = useState<string | null>(null)
    const [showPassword, setShowPassword] = useState(false)
    const [currentSlide, setCurrentSlide] = useState(0)

    const slides = [
        "/sliders/images/1.png",
        "/sliders/images/2.png",
        "/sliders/images/3.png",
        "/sliders/images/4.png",
    ]

    useEffect(() => {
        const timer = setInterval(() => {
            setCurrentSlide((prev) => (prev + 1) % slides.length)
        }, 5000)
        return () => clearInterval(timer)
    }, [slides.length])

    const form = useForm<LoginFormValues>({
        resolver: zodResolver(loginSchema),
        defaultValues: {
            email: "",
            password: "",
        },
    })

    const loginMutation = useMutation({
        mutationFn: (values: LoginFormValues) =>
            authApi.login({
                email: values.email,
                password: values.password,
                platform: "portal"
            }),
        onSuccess: (response) => {
            if (response.success) {
                login(response.data)
            } else {
                setError(response.message || "Login failed")
            }
        },
        onError: (err: any) => {
            setError(err.message || "An unexpected error occurred")
        },
    })

    const onSubmit = (values: LoginFormValues) => {
        setError(null)
        loginMutation.mutate(values)
    }

    return (
        <div className="flex min-h-screen w-full bg-white">
            {/* Left Side - Illustration */}
            <div className="hidden lg:flex lg:w-[60%] bg-slate-50 relative items-center justify-center overflow-hidden">
                <div className="relative w-full h-full flex items-center justify-center p-8 sm:p-12">
                    <div className="relative w-full h-full flex items-center justify-center">
                        {slides.map((slide, index) => (
                            <img 
                                key={slide}
                                src={slide} 
                                alt={`Logistics Slider ${index + 1}`} 
                                className={`absolute inset-0 object-contain w-full h-full transition-all duration-1000 ease-in-out transform ${
                                    index === currentSlide ? "opacity-100 z-10 scale-100" : "opacity-0 z-0 scale-95"
                                }`}
                                onError={(e) => {
                                    e.currentTarget.style.display = 'none';
                                }}
                            />
                        ))}
                    </div>

                    {/* Pagination Dots */}
                    <div className="absolute bottom-12 left-1/2 -translate-x-1/2 flex gap-2 z-20">
                        {slides.map((_, index) => (
                            <button
                                key={index}
                                onClick={() => setCurrentSlide(index)}
                                className={`h-2 rounded-full transition-all duration-300 shadow-sm ${
                                    index === currentSlide 
                                        ? "w-8 bg-primary" 
                                        : "w-2 bg-slate-300 hover:bg-slate-400"
                                }`}
                                aria-label={`Go to slide ${index + 1}`}
                            />
                        ))}
                    </div>
                </div>
            </div>

            {/* Right Side - Form */}
            <div className="flex flex-col flex-1 lg:w-[40%] justify-between px-8 py-12 sm:px-16 lg:px-24">
                <div /> {/* Spacer for flex-between */}
                
                <div className="w-full max-w-md mx-auto space-y-8">
                    {/* Logo & Heading */}
                    <div className="flex flex-col items-center">
                        <img 
                            src="/logo/logo.png" 
                            alt="SB Express Cargo" 
                            className="h-12 w-auto object-contain mx-auto"
                            onError={(e) => {
                                e.currentTarget.style.display = 'none';
                            }}
                        />
                    </div>

                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                        {error && (
                            <div className="flex items-center gap-2 p-3 text-sm text-red-600 bg-red-50 rounded-md border border-red-100">
                                <AlertCircle className="h-4 w-4 shrink-0" />
                                <span>{error}</span>
                            </div>
                        )}
                        
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <Input
                                    id="email"
                                    type="text"
                                    placeholder="Username"
                                    className="h-12 border-gray-300 rounded-md px-4"
                                    {...form.register("email")}
                                />
                                {form.formState.errors.email && (
                                    <p className="text-xs text-red-500">{form.formState.errors.email.message}</p>
                                )}
                            </div>
                            
                            <div className="space-y-2">
                                <div className="relative">
                                    <Input
                                        id="password"
                                        type={showPassword ? "text" : "password"}
                                        placeholder="********"
                                        className="h-12 border-gray-300 rounded-md pr-12 px-4"
                                        {...form.register("password")}
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
                                {form.formState.errors.password && (
                                    <p className="text-xs text-red-500">{form.formState.errors.password.message}</p>
                                )}
                            </div>
                        </div>

                        <Button
                            className="w-full h-12 text-base font-semibold"
                            type="submit"
                            disabled={loginMutation.isPending}
                        >
                            {loginMutation.isPending ? (
                                <>
                                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                                    Logging in...
                                </>
                            ) : (
                                "Login"
                            )}
                        </Button>

                        <div className="pt-2">
                            <Link 
                                href="/forgot-password" 
                                className="text-[15px] font-semibold text-primary hover:text-primary/80 hover:underline inline-block"
                            >
                                Forgot / Reset Password
                            </Link>
                        </div>
                    </form>
                </div>

                {/* Footer */}
                <div className="text-center md:text-left text-sm text-gray-500 flex items-center justify-center md:justify-start gap-1 mt-12">
                    ©2026 Powered by <span className="font-semibold text-gray-900">SB Express Cargo</span>
                </div>
            </div>
        </div>
    )
}
