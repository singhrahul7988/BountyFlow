import { Navbar } from "@/components/home/navbar";
import { SiteFooter } from "@/components/home/site-footer";

export function ComingSoonPage({
  eyebrow,
  title,
  body
}: {
  eyebrow: string;
  title: string;
  body: string;
}) {
  return (
    <main className="min-h-screen bg-background text-foreground">
      <Navbar />
      <section className="bf-shell pt-32 pb-24">
        <div className="max-w-5xl space-y-6 bg-surface-low p-8 md:p-10">
          <p className="bf-label text-primary">{eyebrow}</p>
          <h1 className="bf-display text-[2.5rem] leading-none tracking-tightHeading sm:text-[3.8rem]">
            {title}
          </h1>
          <p className="max-w-3xl text-[1rem] leading-8 text-muted">{body}</p>
        </div>
      </section>
      <SiteFooter />
    </main>
  );
}
