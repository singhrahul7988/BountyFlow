insert into storage.buckets (id, name, public)
values ('submission-evidence', 'submission-evidence', true)
on conflict (id) do update
set public = excluded.public;

drop policy if exists "Public can read submission evidence" on storage.objects;
create policy "Public can read submission evidence"
on storage.objects
for select
to anon, authenticated
using (bucket_id = 'submission-evidence');

drop policy if exists "Researchers can upload own evidence" on storage.objects;
create policy "Researchers can upload own evidence"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'submission-evidence'
  and (storage.foldername(name))[1] = (select auth.uid())::text
);

drop policy if exists "Researchers can update own evidence" on storage.objects;
create policy "Researchers can update own evidence"
on storage.objects
for update
to authenticated
using (
  bucket_id = 'submission-evidence'
  and (storage.foldername(name))[1] = (select auth.uid())::text
)
with check (
  bucket_id = 'submission-evidence'
  and (storage.foldername(name))[1] = (select auth.uid())::text
);

drop policy if exists "Researchers can delete own evidence" on storage.objects;
create policy "Researchers can delete own evidence"
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'submission-evidence'
  and (storage.foldername(name))[1] = (select auth.uid())::text
);
