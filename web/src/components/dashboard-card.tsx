import type { ComponentProps, ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { cn } from "@/lib/utils";

/** Lavender dashboard panel with a heading. */
export function DashboardCard({
  title,
  className,
  children,
  ...props
}: Omit<ComponentProps<typeof Card>, "title"> & { title: string; children: ReactNode }) {
  const headingId = `${props.id ?? title.toLowerCase().replace(/\W+/g, "-")}-title`;
  return (
    <Card variant="tinted" role="region" aria-labelledby={headingId} className={cn("min-w-0", className)} {...props}>
      <CardHeader>
        <CardTitle id={headingId} role="heading" aria-level={2}>
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-1 flex-col">{children}</CardContent>
    </Card>
  );
}

/** Dashed placeholder shown inside a DashboardCard before there's data. */
export function EmptyState({
  icon: Icon,
  title,
  description,
  className,
}: {
  icon: LucideIcon;
  title: string;
  description: string;
  className?: string;
}) {
  return (
    <Empty className={cn("rounded-2xl border-2 border-lavender-dash bg-card p-4 lg:p-6", className)}>
      <EmptyHeader className="gap-2">
        <EmptyMedia className="mb-0 text-brand">
          <Icon className="size-[30px] lg:size-9" strokeWidth={2} aria-hidden />
        </EmptyMedia>
        <EmptyTitle className="font-sans text-[15px] font-bold tracking-normal lg:text-base">{title}</EmptyTitle>
        <EmptyDescription className="text-[13px] lg:text-sm">{description}</EmptyDescription>
      </EmptyHeader>
    </Empty>
  );
}
