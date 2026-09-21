import { ShellLayout } from "@/layouts/ShellLayout";

export default function Layout({ children }: { children: React.ReactNode }) {
  return <ShellLayout>{children}</ShellLayout>;
}
