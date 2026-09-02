import type { PropsWithChildren } from "react";

interface SectionProps {
  id?: string;
  className?: string;
  "aria-labelledby"?: string;
  "aria-label"?: string;
}

export default function Section({
  id,
  className = "",
  children,
  ...rest
}: PropsWithChildren<SectionProps>) {
  return (
    <section id={id} className={`px-5 sm:px-8 lg:px-12 ${className}`} {...rest}>
      <div className="mx-auto w-full max-w-6xl">{children}</div>
    </section>
  );
}
