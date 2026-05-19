import type { ReactNode } from "react"

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col w-full bg-[#f7f9fb] dark:bg-neutral-950">
      {children}
    </div>
  )
}
