import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import BottomNav from "@/components/BottomNav"

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/auth")

  return (
    <>
      <div className="min-h-dvh flex justify-center bg-stone-950">
        <div className="w-full max-w-[420px] flex flex-col pb-20">
          {children}
        </div>
      </div>
      <BottomNav />
    </>
  )
}
