import { BookDemoForm } from "@/components/book-demo-form"
import { EmbedResizer } from "@/components/embed-resizer"

export default function Home() {
  return (
    <>
      <EmbedResizer />
      <main className="flex justify-center p-5">
        <div className="w-full max-w-[500px] rounded-xl bg-card p-10 shadow-[0_10px_40px_rgba(0,0,0,0.08)]">
          <header className="mb-4 text-center">
            <h1 className="font-heading text-[28px] font-bold tracking-tight text-foreground">
              Schedule a Meeting with SMRT
            </h1>
          </header>
          <BookDemoForm />
        </div>
      </main>
    </>
  )
}
