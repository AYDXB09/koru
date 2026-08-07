"use server";

import { z } from "zod";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { createSession, destroySession } from "@/lib/auth";

const emailSchema = z.string().email("Enter a valid email address.").max(160);

export type SignInState = {
  ok: boolean;
  message?: string;
};

/**
 * Frictionless sign-in. Enter an email and you are in. No passwords, no codes.
 * In production this would pair with a real identity provider; the session
 * cookie model in src/lib/auth.ts is unchanged and stays secure either way.
 */
export async function signIn(_prev: SignInState, formData: FormData): Promise<SignInState> {
  const parsed = emailSchema.safeParse(formData.get("email"));
  if (!parsed.success) {
    return { ok: false, message: parsed.error.issues[0]?.message ?? "Enter a valid email address." };
  }
  const email = parsed.data.toLowerCase().trim();

  const user = await prisma.user.upsert({
    where: { email },
    update: {},
    create: { email, name: email.split("@")[0] || "Fiji user" },
  });

  await createSession(user.id);
  redirect("/dashboard");
}

/** One-tap demo entry: signs in as the seeded demo user. */
export async function demoSignIn(): Promise<void> {
  const email = process.env.DEMO_EMAIL ?? "demo@koru.fj";
  const user = await prisma.user.upsert({
    where: { email },
    update: {},
    create: { email, name: "Sereana Tui" },
  });
  await createSession(user.id);
  redirect("/dashboard");
}

export async function logout() {
  await destroySession();
  redirect("/login");
}
