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
    <section className="p-4 md:p-5 xl:p-6">
      <div className="max-w-4xl space-y-4 bg-surface-high p-5 md:p-6">
        <p className="bf-label text-primary">{eyebrow}</p>
        <h1 className="bf-display text-[1.85rem] leading-none tracking-tightHeading sm:text-[2.45rem]">
          {title}
        </h1>
        <p className="max-w-3xl text-[0.8rem] leading-6 text-muted">{body}</p>
      </div>
    </section>
  );
}
