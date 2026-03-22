export function AdminPlaceholderView({
  eyebrow,
  title,
  body
}: {
  eyebrow: string;
  title: string;
  body: string;
}) {
  return (
    <section className="p-6 md:p-8 xl:p-10">
      <div className="max-w-5xl space-y-6 bg-surface-high p-8 md:p-10">
        <p className="bf-label text-primary">{eyebrow}</p>
        <h1 className="bf-display text-[2.5rem] leading-none tracking-tightHeading sm:text-[3.4rem]">
          {title}
        </h1>
        <p className="max-w-3xl text-[1rem] leading-8 text-muted">{body}</p>
      </div>
    </section>
  );
}
