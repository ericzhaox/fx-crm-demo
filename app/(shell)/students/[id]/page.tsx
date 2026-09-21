import { StudentDetailPage } from "@/views/StudentDetailPage";

export function generateStaticParams() {
  return Array.from({ length: 12 }, (_, i) => ({ id: `st${i + 1}` }));
}

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <StudentDetailPage id={id} />;
}
