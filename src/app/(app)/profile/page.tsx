import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { jparse } from "@/lib/json";
import { ProfileEditor } from "@/components/profile/editor";

export const metadata = { title: "My profile · Koru" };

export default async function ProfilePage() {
  const user = await requireUser();
  const profile = await prisma.profile.findUnique({ where: { userId: user.id } });

  return (
    <ProfileEditor
      name={user.name}
      email={user.email}
      profile={{
        age: profile?.age ?? null,
        citizenship: profile?.citizenship ?? null,
        city: profile?.city ?? null,
        education: profile?.education ?? null,
        employmentStatus: profile?.employmentStatus ?? null,
        sector: profile?.sector ?? null,
        organizationType: profile?.organizationType ?? null,
        businessStage: profile?.businessStage ?? null,
        yearsExperience: profile?.yearsExperience ?? null,
        fundingInterests: jparse<string[]>(profile?.fundingInterests, []),
        languages: jparse<string[]>(profile?.languages, []),
        documentsAvailable: jparse<string[]>(profile?.documentsAvailable, []),
        bio: profile?.bio ?? null,
      }}
    />
  );
}
