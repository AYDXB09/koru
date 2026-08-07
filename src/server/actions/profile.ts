"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { jstring, jparse } from "@/lib/json";

const profileSchema = z.object({
  age: z.coerce.number().int().min(13).max(100).nullable().optional(),
  citizenship: z.string().max(80).optional(),
  city: z.string().max(80).optional(),
  education: z.string().max(40).optional(),
  employmentStatus: z.string().max(40).optional(),
  sector: z.string().max(80).optional(),
  organizationType: z.string().max(80).optional(),
  businessStage: z.string().max(40).optional(),
  yearsExperience: z.coerce.number().int().min(0).max(60).nullable().optional(),
  fundingInterests: z.array(z.string().max(60)).max(20).optional(),
  languages: z.array(z.string().max(60)).max(20).optional(),
  documentsAvailable: z.array(z.string().max(60)).max(20).optional(),
  bio: z.string().max(2000).optional(),
});

export type ProfileInput = z.infer<typeof profileSchema>;

export async function updateProfile(input: ProfileInput) {
  const user = await requireUser();
  const data = profileSchema.parse(input);

  const existing = await prisma.profile.findUnique({ where: { userId: user.id } });
  const values = {
    age: data.age ?? null,
    citizenship: data.citizenship ?? existing?.citizenship ?? "Fijian",
    city: data.city ?? null,
    education: data.education ?? null,
    employmentStatus: data.employmentStatus ?? null,
    sector: data.sector ?? null,
    organizationType: data.organizationType ?? null,
    businessStage: data.businessStage ?? null,
    yearsExperience: data.yearsExperience ?? null,
    fundingInterests: jstring(data.fundingInterests ?? jparse<string[]>(existing?.fundingInterests ?? "[]", [])),
    languages: jstring(data.languages ?? jparse<string[]>(existing?.languages ?? "[]", [])),
    documentsAvailable: jstring(data.documentsAvailable ?? jparse<string[]>(existing?.documentsAvailable ?? "[]", [])),
    bio: data.bio ?? null,
  };

  await prisma.profile.upsert({
    where: { userId: user.id },
    update: values,
    create: { userId: user.id, ...values },
  });

  revalidatePath("/profile");
  revalidatePath("/dashboard");
  return { ok: true };
}

export async function updateProfileName(name: string) {
  const user = await requireUser();
  if (name.trim().length < 2) throw new Error("Name is too short.");
  await prisma.user.update({ where: { id: user.id }, data: { name: name.trim() } });
  revalidatePath("/profile");
}
