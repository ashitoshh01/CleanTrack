"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { Button, Badge } from "@cleancity/ui";
import { LogOut, User, Shield, PlusCircle, ListFilter, LayoutDashboard } from "lucide-react";

export function NavBar() {
  const { user, logout } = useAuth();
  const router = useRouter();

  const handleLogout = () => {
    logout();
    router.push("/login");
  };

  return (
    <header className="sticky top-0 z-50 border-b border-border/60 bg-background/80 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
        {/* Brand */}
        <Link href="/" className="flex items-center gap-2 group">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-xl group-hover:scale-105 transition-transform">
            🌿
          </div>
          <span className="text-xl font-bold tracking-tight">
            Clean<span className="text-primary">City</span>
          </span>
        </Link>

        {/* Navigation links & user menu */}
        <div className="flex items-center gap-4">
          {user ? (
            <>
              <div className="flex items-center gap-3">
                {user.role === "CITIZEN" && (
                  <Link
                    href="/citizen"
                    className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1.5"
                  >
                    <ListFilter className="h-4 w-4 text-primary" />
                    My Complaints
                  </Link>
                )}

                {(user.role === "ADMIN" || user.role === "STAFF") && (
                  <Link
                    href="/admin"
                    className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1.5"
                  >
                    <LayoutDashboard className="h-4 w-4 text-amber-400" />
                    Admin Panel
                  </Link>
                )}

                <div className="h-4 w-[1px] bg-border" />

                <div className="flex items-center gap-2 text-sm">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-secondary text-foreground font-semibold text-xs border border-border">
                    {user.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="hidden md:flex flex-col">
                    <span className="font-medium text-xs leading-none">{user.name}</span>
                    <span className="text-[10px] text-muted-foreground">{user.email}</span>
                  </div>
                  <Badge
                    variant={
                      user.role === "ADMIN"
                        ? "warning"
                        : user.role === "STAFF"
                        ? "info"
                        : "success"
                    }
                    className="text-[10px] uppercase font-bold"
                  >
                    {user.role}
                  </Badge>
                </div>

                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleLogout}
                  title="Log out"
                  className="h-9 w-9 text-muted-foreground hover:text-destructive"
                >
                  <LogOut className="h-4 w-4" />
                </Button>
              </div>
            </>
          ) : (
            <div className="flex items-center gap-2">
              <Link href="/login">
                <Button variant="ghost" size="sm">
                  Log in
                </Button>
              </Link>
              <Link href="/register">
                <Button size="sm">Get Started</Button>
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
