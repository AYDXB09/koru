import "server-only";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createHash, randomBytes } from "node:crypto";
import { prisma } from "@/lib/db";
import { SESSION_COOKIE, SESSION_MAX_AGE_DAYS } from "@/lib/constants";

/**
 * Session-based auth for frictionless email sign-in. Tokens are stored hashed
 * (sha256). The session cookie is HttpOnly + SameSite=Lax.
 */

function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

function sessionAgeMs() {
  return SESSION_MAX_AGE_DAYS * 24 * 60 * 60 * 1000;
}

export async function createSession(userId: string) {
  const rawToken = randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + sessionAgeMs());
  await prisma.session.create({
    data: { userId, token: hashToken(rawToken), expiresAt },
  });
  const store = await cookies();
  store.set(SESSION_COOKIE, rawToken, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    expires: expiresAt,
  });
}

export async function destroySession() {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;
  if (token) {
    await prisma.session.deleteMany({ where: { token: hashToken(token) } });
  }
  store.delete(SESSION_COOKIE);
}

export async function getSessionUser() {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;
  if (!token) return null;
  const session = await prisma.session.findUnique({
    where: { token: hashToken(token) },
    include: { user: { include: { profile: true } } },
  });
  if (!session) return null;
  if (session.expiresAt < new Date()) {
    await prisma.session.delete({ where: { id: session.id } });
    return null;
  }
  return session.user;
}

export type SessionUser = NonNullable<Awaited<ReturnType<typeof getSessionUser>>>;

/** Returns the logged-in user or redirects to /login. */
export async function requireUser() {
  const user = await getSessionUser();
  if (!user) {
    redirect("/login");
  }
  return user;
}

/** Returns the logged-in user or null (for pages that render logged-out states). */
export async function optionalUser() {
  return getSessionUser();
}
