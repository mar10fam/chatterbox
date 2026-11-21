import type { ComponentType, ReactNode, SVGProps } from "react";

export function DashboardCard({
  id,
  title,
  className = "",
  children,
}: {
  id: string;
  title: string;
  className?: string;
  children: ReactNode;
}) {
  return (
    <section
      aria-labelledby={id}
      className={`flex min-w-0 flex-col gap-3 rounded-[22px] bg-lavender p-[18px] lg:gap-4 lg:rounded-3xl lg:p-6 ${className}`}
    >
      <h2 id={id} className="m-0 font-display text-lg font-medium lg:text-xl">
        {title}
      </h2>
      {children}
    </section>
  );
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  className = "",
  descriptionClassName = "",
}: {
  icon: ComponentType<SVGProps<SVGSVGElement> & { size?: number }>;
  title: string;
  description: string;
  className?: string;
  descriptionClassName?: string;
}) {
  return (
    <div
      className={`flex flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-lavender-dash bg-white p-4 text-center lg:min-h-70 lg:gap-2.5 lg:rounded-[18px] lg:p-6 ${className}`}
    >
      <Icon className="size-[30px] text-brand lg:size-9" />
      <p className="m-0 text-[15px] font-bold lg:text-base">{title}</p>
      <p className={`m-0 text-[13px] text-muted lg:text-sm ${descriptionClassName}`}>{description}</p>
    </div>
  );
}
