-- One row keeps the series. Occurrences are computed, not copied into extra rows.
-- recurrence_freq null means a one-off event. A repeating event needs an end date or a count.

alter table events
  add column if not exists recurrence_freq text,
  add column if not exists recurrence_interval integer not null default 1,
  add column if not exists recurrence_until timestamptz,
  add column if not exists recurrence_count integer;

alter table events
  drop constraint if exists events_recurrence_freq_check;
alter table events
  add constraint events_recurrence_freq_check
  check (recurrence_freq is null or recurrence_freq in ('weekly', 'monthly'));

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
      or (
        recurrence_freq is not null
        and (recurrence_until is not null or recurrence_count is not null)
      )
    )
  );
