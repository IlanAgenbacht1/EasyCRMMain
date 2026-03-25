import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import TopBar from "./TopBar";
import BottomNav from "./BottomNav";

export default async function AuthenticatedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();
  if (!session) {
    redirect("/login");
  }

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <TopBar username={session.username} />
      <main className="flex-1 pb-24 md:pb-4 md:ml-56">
        <div className="max-w-5xl mx-auto px-4 py-4">{children}</div>
      </main>
      <BottomNav />
    </div>
  );
}
