"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { NavBar } from "@/components/nav-bar";
import { ShieldAlert } from "lucide-react";
import { Button } from "@cleancity/ui";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !user) {
      router.push("/login?redirect=/admin");
    }
  }, [user, isLoading, router]);

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="flex items-center gap-2 text-muted-foreground animate-pulse">
          <div className="h-4 w-4 rounded-full bg-amber-500 animate-ping" />
          Loading Admin Panel...
        </div>
      </div>
    );
  }

  if (!user) return null;

  // Role guard for Admin portal
  if (user.role !== "ADMIN" && user.role !== "STAFF") {
    return (
      <div className="min-h-screen bg-background">
        <NavBar />
        <div className="flex min-h-[70vh] flex-col items-center justify-center gap-4 text-center px-4">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-destructive/10 text-destructive">
            <ShieldAlert className="h-8 w-8" />
          </div>
          <h1 className="text-2xl font-bold">Access Denied</h1>
          <p className="max-w-md text-muted-foreground">
            You are logged in as a <strong>CITIZEN</strong>. Access to the municipal admin panel is restricted to STAFF and ADMIN accounts.
          </p>
          <Button onClick={() => router.push("/citizen")}>
            Go to Citizen Portal
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <NavBar />
      <main className="mx-auto max-w-7xl px-4 sm:px-6 py-8">{children}</main>
    </div>
  );
}
