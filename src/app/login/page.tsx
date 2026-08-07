import { redirect } from "next/navigation";
import { optionalUser } from "@/lib/auth";
import { Brand, KoruMark } from "@/components/brand";
import { ThemeToggle } from "@/components/theme-toggle";
import { LoginForm } from "@/components/auth/login-form";

export const metadata = { title: "Sign in · Koru" };

export default async function LoginPage() {
  const user = await optionalUser();
  if (user) redirect("/dashboard");

  return (
    <div className="tide-paper grid min-h-screen lg:grid-cols-[1fr_1fr]">
      {/* Editorial panel */}
      <aside className="relative hidden flex-col justify-between overflow-hidden border-r p-10 lg:flex">
        <Brand />
        <div className="relative z-10 max-w-md">
          <p className="label-mono text-primary">The funding OS for Fiji</p>
          <blockquote className="mt-4 font-display text-3xl font-light italic leading-snug">
            “Fiji loses more to paperwork than to competition. We built the machine that finishes the
            paperwork.”
          </blockquote>
          <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
            Every grant, scholarship and fellowship for Fijians aged 18 to 40. One profile, matched
            automatically, walked to the final submit button.
          </p>
        </div>
        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          <KoruMark className="h-6 w-6 text-primary" />
          <span>Made in Suva · 2026</span>
        </div>
      </aside>

      {/* Form panel */}
      <main className="relative flex flex-col">
        <header className="flex items-center justify-between px-6 py-5 lg:justify-end">
          <span className="lg:hidden">
            <Brand />
          </span>
          <ThemeToggle />
        </header>
        <div className="flex flex-1 items-center justify-center px-6 pb-16 pt-6">
          <LoginForm />
        </div>
      </main>
    </div>
  );
}
