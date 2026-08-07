"use server";

import { z } from "zod";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { createApplication } from "@/server/actions/applications";
import { getOpportunityFits } from "@/server/queries";

const onboardingSchema = z.object({
  name: z.string().min(1).max(120),
  age: z.coerce.number().int().min(13).max(100).optional(),
  city: z.string().max(80).optional(),
  education: z.string().max(40).optional(),
  employmentStatus: z.string().max(40).optional(),
  sector: z.string().max(60).optional(),
  organizationType: z.string().max(40).optional(),
  businessStage: z.string().max(40).optional(),
  yearsExperience: z.coerce.number().int().min(0).max(60).optional(),
  fundingInterests: z.array(z.string()).max(20).default([]),
  languages: z.array(z.string()).max(10).default([]),
  documentsAvailable: z.array(z.string()).max(20).default([]),
  bio: z.string().max(400).optional(),
});

export type OnboardingState = {
  ok: boolean;
  message?: string;
};

/**
 * Saves the profile collected in the onboarding wizard, marks the user as
 * onboarded, and opens applications for their three strongest matches so the
 * dashboard has a real plan of work from the first visit.
 */
export async function completeOnboarding(
  _prev: OnboardingState,
  formData: FormData,
): Promise<OnboardingState> {
  const user = await requireUser();

  const raw = {
    name: formData.get("name")?.toString() ?? "",
    age: formData.get("age")?.toString() || undefined,
    city: formData.get("city")?.toString() || undefined,
    education: formData.get("education")?.toString() || undefined,
    employmentStatus: formData.get("employmentStatus")?.toString() || undefined,
    sector: formData.get("sector")?.toString() || undefined,
    organizationType: formData.get("organizationType")?.toString() || undefined,
    businessStage: formData.get("businessStage")?.toString() || undefined,
    yearsExperience: formData.get("yearsExperience")?.toString() || undefined,
    fundingInterests: formData.getAll("interest"),
    languages: formData.getAll("language"),
    documentsAvailable: formData.getAll("document"),
    bio: formData.get("bio")?.toString() || undefined,
  };

  const parsed = onboardingSchema.safeParse(raw);
  if (!parsed.success) {
    return { ok: false, message: parsed.error.issues[0]?.message ?? "Check the details and try again." };
  }

  const data = parsed.data;

  await prisma.$transaction([
    prisma.user.update({
      where: { id: user.id },
      data: { name: data.name, onboardedAt: new Date() },
    }),
    prisma.profile.upsert({
      where: { userId: user.id },
      update: {
        age: data.age ?? null,
        city: data.city ?? null,
        education: data.education ?? null,
        employmentStatus: data.employmentStatus ?? null,
        sector: data.sector ?? null,
        organizationType: data.organizationType ?? null,
        businessStage: data.businessStage ?? null,
        yearsExperience: data.yearsExperience ?? null,
        fundingInterests: JSON.stringify(data.fundingInterests),
        languages: JSON.stringify(data.languages),
        documentsAvailable: JSON.stringify(data.documentsAvailable),
        bio: data.bio ?? null,
      },
      create: {
        userId: user.id,
        age: data.age ?? null,
        city: data.city ?? null,
        education: data.education ?? null,
        employmentStatus: data.employmentStatus ?? null,
        sector: data.sector ?? null,
        organizationType: data.organizationType ?? null,
        businessStage: data.businessStage ?? null,
        yearsExperience: data.yearsExperience ?? null,
        fundingInterests: JSON.stringify(data.fundingInterests),
        languages: JSON.stringify(data.languages),
        documentsAvailable: JSON.stringify(data.documentsAvailable),
        bio: data.bio ?? null,
      },
    }),
  ]);

  // Open the three best matches so the user starts with a real plan of work.
  if (data.fundingInterests.length > 0) {
    const fits = await getOpportunityFits(user.id);
    const matches = fits
      .filter((f) => f.eligible || f.fitScore >= 60)
      .slice(0, 3);
    for (const m of matches) {
      await createApplication(user.id, m.id);
    }
  }

  redirect("/dashboard");
}

/** Skips onboarding without saving a profile. */
export async function skipOnboarding(): Promise<void> {
  const user = await requireUser();
  await prisma.user.update({
    where: { id: user.id },
    data: { onboardedAt: new Date() },
  });
  redirect("/dashboard");
}
