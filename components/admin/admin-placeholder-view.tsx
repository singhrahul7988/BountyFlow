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
    <section className="p-5 md:p-6 xl:p-7">
      <div className="max-w-5xl space-y-5 bg-surface-high p-6 md:p-7">
        <p className="bf-label text-primary">{eyebrow}</p>
        <h1 className="bf-display text-[2.2rem] leading-none tracking-tightHeading sm:text-[3rem]">
          {title}
        </h1>
        <p className="max-w-3xl text-[0.84rem] leading-7 text-muted">{body}</p>
      </div>
    </section>
  );
}
