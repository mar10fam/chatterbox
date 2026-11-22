import Link from "next/link";
import { LogoMark } from "@/components/icons";
import { Button } from "@/components/ui/button";
import { HOME_PATH } from "@/lib/routes";

export default function NotFound() {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center gap-5 bg-secondary px-5 text-center">
      <LogoMark size={48} />
      <h1 className="font-heading text-3xl font-semibold">We couldn’t find that page</h1>
      <p className="max-w-sm text-muted-foreground">The link may be broken, or the page may have moved.</p>
      <Button asChild size="lg" className="rounded-full">
        <Link href={HOME_PATH}>Back to Chatterbox</Link>
      </Button>
    </main>
  );
}
