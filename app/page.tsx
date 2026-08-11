import { BookDemoForm } from "@/components/book-demo-form"
import { EmbedResizer } from "@/components/embed-resizer"

export default function Home() {
  return (
    <>
      <EmbedResizer />
      <main className="flex justify-center p-3 sm:p-5">
        <div className="w-full max-w-[500px] rounded-xl bg-card p-6 shadow-[0_10px_40px_rgba(0,0,0,0.08)] sm:p-10">
          <header className="mb-4 text-center">
            <h1 className="text-balance font-heading text-[24px] font-bold tracking-tight text-foreground sm:text-[28px]">
              Schedule a Meeting with&nbsp;SMRT
            </h1>
          </header>
          <BookDemoForm />
        </div>
      </main>
    </>
  )
}
