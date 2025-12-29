import { redirect } from "next/navigation";
import { auth } from "@/app/lib/auth";

export default async function DownloadLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  
  if (!session?.user) {
    redirect("/login");
  }

  return <>{children}</>;
}

