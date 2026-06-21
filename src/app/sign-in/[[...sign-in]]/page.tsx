import { SignIn } from "@clerk/nextjs";
import Link from "next/link";
import { Logo } from "@/components/ui";

export default function Page() {
  return (
    <div className="flex min-h-full flex-col items-center justify-center gap-8 px-6 py-12">
      <Link href="/"><Logo /></Link>
      <SignIn signUpUrl="/sign-up" fallbackRedirectUrl="/studio" />
    </div>
  );
}
