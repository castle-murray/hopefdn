-- Wide banner/hero image per calendar event (separate from flyer/card image_url).
-- Same storage convention: text path under /uploads/events/….

alter table events
  add column if not exists banner_url text;
