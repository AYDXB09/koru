import { redirect } from "next/navigation";
import { optionalUser } from "@/lib/auth";
import { OnboardingWizard } from "@/components/onboarding/wizard";

export const metadata = { title: "Set up Koru" };

export default async function OnboardingPage() {
  const user = await optionalUser();
  if (!user) redirect("/login");
  if (user.onboardedAt) redirect("/dashboard");

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <header className="border-b">
        <div className="mx-auto flex h-16 w-full max-w-3xl items-center justify-between px-4">
          <span className="label-mono text-muted-foreground">Koru · set up</span>
          <span className="label-mono text-primary">2 minutes</span>
        </div>
      </header>
      <main className="flex flex-1 items-start justify-center px-4 py-10">
        <OnboardingWizard name={user.name ?? ""} />
      </main>
    </div>
  );
}
