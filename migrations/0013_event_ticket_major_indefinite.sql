-- Optional ticket link, major-event banner flag, and indefinite recurrence.
-- Existing rows stay valid: ticket_url null, major_event false.
-- A repeating event may omit both recurrence_until and recurrence_count.
-- No event-row updates here (sandbox data fixes must not ship in this file).

alter table events
  add column if not exists ticket_url text;

alter table events
  add column if not exists major_event boolean not null default false;

alter table events
  drop constraint if exists events_recurrence_shape_check;

alter table events
  add constraint events_recurrence_shape_check
  check (
    recurrence_interval >= 1
    and recurrence_interval <= 52
    and (recurrence_count is null or (recurrence_count >= 1 and recurrence_count <= 500))
    and (
      (
        recurrence_freq is null
        and recurrence_until is null
        and recurrence_count is null
      )
      or recurrence_freq is not null
    )
  );
