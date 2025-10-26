import type { BaseLayoutProps } from "fumadocs-ui/layouts/shared";

export function baseOptions(): BaseLayoutProps {
  return {
    nav: {
      title: (
        <span className="inline-flex items-center gap-2 font-semibold">
          <span className="relative flex h-6 w-6 items-center justify-center">
            <img
              src="/Qubic-Logo-Dark.svg"
              alt="Qubic logo"
              className="h-6 w-6 dark:hidden"
              aria-hidden="true"
            />
            <img
              src="/Qubic-Symbol-White.svg"
              alt="Qubic logo"
              className="hidden h-6 w-6 dark:block"
              aria-hidden="true"
            />
          </span>
          <span className="tracking-tight">Qubic TypeScript SDK</span>
        </span>
      ),
    },
  };
}
