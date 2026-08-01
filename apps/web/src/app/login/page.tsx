"use client";

import { useState, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { loginSchema, type LoginInput } from "@cleancity/types";
import { useAuth } from "@/lib/auth-context";
import { Button, Input, Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@cleancity/ui";
import { LogIn, AlertCircle, ShieldAlert, User, ArrowRight } from "lucide-react";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams.get("redirect") || "/citizen";
  const { login } = useAuth();
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const onSubmit = async (data: LoginInput) => {
    setError(null);
    try {
      await login(data.email, data.password);
      router.push(redirect);
    } catch (err: any) {
      setError(err.message || "Failed to log in. Please check your credentials.");
    }
  };

  const fillQuickAcc = (email: string, pass: string) => {
    setValue("email", email);
    setValue("password", pass);
  };

  return (
    <CardContent className="space-y-6">
      {error && (
        <div className="flex items-center gap-2 rounded-lg border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
            Email Address
          </label>
          <Input
            type="email"
            placeholder="you@example.com"
            {...register("email")}
            className={errors.email ? "border-destructive focus-visible:ring-destructive" : ""}
          />
          {errors.email && (
            <p className="text-xs text-destructive">{errors.email.message}</p>
          )}
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
            Password
          </label>
          <Input
            type="password"
            placeholder="••••••••"
            {...register("password")}
            className={errors.password ? "border-destructive focus-visible:ring-destructive" : ""}
          />
          {errors.password && (
            <p className="text-xs text-destructive">{errors.password.message}</p>
          )}
        </div>

        <Button
          type="submit"
          disabled={isSubmitting}
          className="w-full h-11 text-base font-semibold group"
        >
          {isSubmitting ? (
            "Logging in..."
          ) : (
            <>
              Log In
              <ArrowRight className="h-4 w-4 ml-1 transition-transform group-hover:translate-x-1" />
            </>
          )}
        </Button>
      </form>

      <div className="border-t border-border/50 pt-4">
        <p className="text-xs font-medium text-muted-foreground mb-2 text-center">
          Quick Demo Accounts:
        </p>
        <div className="grid grid-cols-2 gap-2 text-xs">
          <button
            type="button"
            onClick={() => fillQuickAcc("citizen@cleancity.app", "citizen123456")}
            className="flex items-center justify-center gap-1.5 rounded-md border border-border bg-secondary/50 p-2 hover:bg-secondary transition-colors text-muted-foreground hover:text-foreground"
          >
            <User className="h-3.5 w-3.5 text-primary" />
            Citizen Demo
          </button>
          <button
            type="button"
            onClick={() => fillQuickAcc("admin@cleancity.app", "admin123456")}
            className="flex items-center justify-center gap-1.5 rounded-md border border-border bg-secondary/50 p-2 hover:bg-secondary transition-colors text-muted-foreground hover:text-foreground"
          >
            <ShieldAlert className="h-3.5 w-3.5 text-amber-400" />
            Admin Demo
          </button>
        </div>
      </div>
    </CardContent>
  );
}

export default function LoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-12 relative overflow-hidden">
      <div className="pointer-events-none absolute -top-40 left-1/2 -translate-x-1/2 h-96 w-96 rounded-full bg-primary/15 blur-[120px]" />

      <Card className="w-full max-w-md border-border/60 bg-card/80 shadow-2xl backdrop-blur-xl">
        <CardHeader className="text-center space-y-2">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary mb-2">
            <LogIn className="h-6 w-6" />
          </div>
          <CardTitle className="text-2xl font-bold">Welcome Back</CardTitle>
          <CardDescription>
            Log in to CleanCity to report waste or triage reports
          </CardDescription>
        </CardHeader>

        <Suspense fallback={<div className="p-8 text-center text-xs text-muted-foreground">Loading login form...</div>}>
          <LoginForm />
        </Suspense>

        <CardFooter className="flex justify-center border-t border-border/40 py-4">
          <p className="text-sm text-muted-foreground">
            Don&apos;t have an account?{" "}
            <Link
              href="/register"
              className="font-medium text-primary hover:underline"
            >
              Sign up
            </Link>
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}
