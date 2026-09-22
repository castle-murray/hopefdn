-- Optional single image per calendar event (URL/path; staff upload).
-- Matches products.image_url convention: text path served from /uploads or /images.

alter table events
  add column if not exists image_url text;
