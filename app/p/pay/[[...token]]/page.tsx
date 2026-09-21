import { PayForm } from "@/views/public/PublicForms";

export function generateStaticParams() {
  return [{ token: [] }, { token: ["tok1"] }];
}

export default async function Page({ params }: { params: Promise<{ token?: string[] }> }) {
  const { token } = await params;
  return <PayForm token={token?.[0]} />;
}
