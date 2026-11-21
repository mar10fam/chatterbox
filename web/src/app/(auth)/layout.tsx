import { LogoMark } from "@/components/icons";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-secondary px-4 py-10">
      <div className="flex w-full max-w-[420px] flex-col gap-6">
        <div className="flex items-center justify-center gap-2.5">
          <LogoMark size={34} />
          <span className="font-display text-2xl font-semibold tracking-[-0.2px]">Chatterbox</span>
        </div>
        <main>{children}</main>
      </div>
    </div>
  );
}
