import { BookDemoForm } from "@/components/book-demo-form"

export default function Home() {
  return (
    <main className="flex min-h-full flex-1 items-center justify-center p-5">
      <div className="w-full max-w-[500px] rounded-xl bg-card p-10 shadow-[0_10px_40px_rgba(0,0,0,0.08)]">
        <header className="mb-4 text-center">
          <h1 className="font-heading text-[28px] font-bold tracking-tight text-foreground">
            Schedule a Meeting with SMRT
          </h1>
        </header>
        <BookDemoForm />
      </div>
    </main>
  )
}
