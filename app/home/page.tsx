import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { PartyPopper, BookOpen, GraduationCap, IdCard } from "lucide-react";

export default async function HomePage() {
  const session = await auth();

  if (!session) {
    redirect("/login");
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white border-b">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <h1 className="text-2xl font-bold text-blue-600">UOSphere</h1>
          <div className="flex items-center gap-4">
            <div className="text-sm">
              <p className="font-semibold">{session.user?.name}</p>
              <p className="text-gray-600">{session.user?.rollNo}</p>
            </div>
            <form
              action={async () => {
                "use server";
                const { signOut } = await import("@/lib/auth");
                await signOut({ redirectTo: "/" });
              }}
            >
              <button
                type="submit"
                className="px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600"
              >
                Sign Out
              </button>
            </form>
          </div>
        </div>
      </nav>

      <main className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold mb-6">Welcome to UOSphere!</h2>
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center gap-2 mb-4 text-lg">
              <PartyPopper className="w-5 h-5 text-blue-600" />
              <p>
                You're now logged in as <strong>{session.user?.name}</strong>
              </p>
            </div>
            <div className="space-y-2 text-gray-700">
              <div className="flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-blue-600" />
                <p>Department: {session.user?.department}</p>
              </div>
              <div className="flex items-center gap-2">
                <GraduationCap className="w-5 h-5 text-blue-600" />
                <p>Batch: {session.user?.batch}</p>
              </div>
              <div className="flex items-center gap-2">
                <IdCard className="w-5 h-5 text-blue-600" />
                <p>Roll No: {session.user?.rollNo}</p>
              </div>
            </div>
            <div className="mt-6 bg-blue-50 rounded-lg p-4">
              <p className="text-sm text-blue-700">
                <strong>Coming soon:</strong> Discover peers, join communities,
                and start connecting!
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
