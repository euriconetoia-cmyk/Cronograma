-- CreateEnum
CREATE TYPE "CalendarEventType" AS ENUM (
  'NATIONAL_HOLIDAY',
  'STATE_HOLIDAY',
  'MUNICIPAL_HOLIDAY',
  'RECESS',
  'VACATION',
  'ACADEMIC_DAY',
  'NON_ACADEMIC_DAY',
  'BLOCKED_DATE',
  'INSTITUTIONAL_EVENT'
);

CREATE TABLE "AcademicCalendar" (
  "id" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "year" INTEGER NOT NULL,
  "unitId" TEXT NOT NULL,
  "active" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "AcademicCalendar_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "CalendarEvent" (
  "id" TEXT NOT NULL,
  "calendarId" TEXT NOT NULL,
  "type" "CalendarEventType" NOT NULL,
  "title" TEXT NOT NULL,
  "startDate" TIMESTAMP(3) NOT NULL,
  "endDate" TIMESTAMP(3) NOT NULL,
  "blocksAcademicActivities" BOOLEAN NOT NULL DEFAULT true,
  "description" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "CalendarEvent_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "AcademicCalendar_unitId_year_key"
ON "AcademicCalendar"("unitId", "year");

CREATE INDEX "CalendarEvent_calendarId_startDate_endDate_idx"
ON "CalendarEvent"("calendarId", "startDate", "endDate");

ALTER TABLE "AcademicCalendar"
ADD CONSTRAINT "AcademicCalendar_unitId_fkey"
FOREIGN KEY ("unitId") REFERENCES "Unit"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "CalendarEvent"
ADD CONSTRAINT "CalendarEvent_calendarId_fkey"
FOREIGN KEY ("calendarId") REFERENCES "AcademicCalendar"("id")
ON DELETE CASCADE ON UPDATE CASCADE;
