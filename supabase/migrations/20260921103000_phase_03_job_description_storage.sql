create policy "Recruiters can upload their job descriptions"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'job-descriptions'
  and (storage.foldername(name))[1] = (select auth.uid()::text)
);

create policy "Recruiters can read their job descriptions"
on storage.objects
for select
to authenticated
using (
  bucket_id = 'job-descriptions'
  and (storage.foldername(name))[1] = (select auth.uid()::text)
);

create policy "Recruiters can remove their job descriptions"
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'job-descriptions'
  and (storage.foldername(name))[1] = (select auth.uid()::text)
);
