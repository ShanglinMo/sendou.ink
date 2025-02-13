select
  "CalendarEvent"."id" as "eventId",
  "CalendarEvent"."name" as "eventName",
  "CalendarEventResultTeam"."id" as "teamId",
  "CalendarEventResultTeam"."name" as "teamName",
  "CalendarEventResultTeam"."placement",
  "CalendarEvent"."participantCount",
  (
    select
      max("startTime")
    from
      "CalendarEventDate"
    where
      "eventId" = "CalendarEvent"."id"
  ) as "startTime"
from
  "CalendarEventResultPlayer"
  join "CalendarEventResultTeam" on "CalendarEventResultTeam"."id" = "CalendarEventResultPlayer"."teamId"
  join "CalendarEvent" on "CalendarEvent"."id" = "CalendarEventResultTeam"."eventId"
where
  "CalendarEventResultPlayer"."userId" = @userId
order by
  "startTime" desc