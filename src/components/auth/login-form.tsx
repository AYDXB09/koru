"use client";

import { useActionState } from "react";
import { ArrowRight, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { signIn, demoSignIn } from "@/server/actions/auth";

const EMPTY: Awaited<ReturnType<typeof signIn>> = { ok: true };

export function LoginForm() {
  const [state, action, pending] = useActionState(signIn, EMPTY);

  return (
    <div className="w-full max-w-sm space-y-6">
      <div>
        <p className="label-mono text-primary">Sign in</p>
        <h1 className="mt-2 font-display text-3xl font-light tracking-tight">Your email is the key</h1>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
          No password, no code. Enter your email and you&apos;re in. Koru pulls your opportunities while you
          get on with the day.
        </p>
      </div>

      {!state.ok && state.message && (
        <div className="border border-destructive/40 bg-destructive/5 px-3 py-2.5 text-sm text-destructive">
          {state.message}
        </div>
      )}

      <form action={action} className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="email">Email address</Label>
          <Input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            required
            placeholder="you@example.fj"
            className="h-11"
          />
        </div>
        <Button type="submit" size="lg" className="w-full" disabled={pending}>
          {pending && <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />}
          Continue
          {!pending && <ArrowRight className="ml-1.5 h-4 w-4" />}
        </Button>
      </form>

      <div className="flex items-center gap-3">
        <span className="rule-h flex-1" />
        <span className="label-mono text-muted-foreground">or</span>
        <span className="rule-h flex-1" />
      </div>

      <form action={demoSignIn}>
        <Button variant="outline" size="lg" className="w-full">
          Explore the demo account
        </Button>
      </form>

      <p className="text-center text-xs leading-relaxed text-muted-foreground">
        Koru is built for Fiji. Your data is never sold, and every opportunity links back to its official
        source.
      </p>
    </div>
  );
}
