CREATE TYPE "ScheduleStatus" AS ENUM ('GENERATED','REVIEW','APPROVED','PUBLISHED');
CREATE TYPE "ScheduleItemType" AS ENUM ('CURRICULAR_UNIT','RECOVERY','ENROLLMENT','INAUGURAL_CLASS');
CREATE TYPE "MeetingType" AS ENUM ('PRESENTIAL','WEB_CLASS','PRACTICE','LAB','ASSESSMENT','RECOVERY','INAUGURAL_CLASS','OTHER');

CREATE TABLE "Schedule" (
  "id" TEXT NOT NULL,
  "classGroupId" TEXT NOT NULL,
  "status" "ScheduleStatus" NOT NULL DEFAULT 'GENERATED',
  "generatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "startDate" TIMESTAMP(3),
  "endDate" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Schedule_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ScheduleItem" (
  "id" TEXT NOT NULL,
  "scheduleId" TEXT NOT NULL,
  "curricularUnitId" TEXT,
  "type" "ScheduleItemType" NOT NULL,
  "title" TEXT NOT NULL,
  "order" INTEGER NOT NULL,
  "startDate" TIMESTAMP(3) NOT NULL,
  "endDate" TIMESTAMP(3) NOT NULL,
  "avaEndDate" TIMESTAMP(3),
  "totalHours" INTEGER NOT NULL DEFAULT 0,
  "notes" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "ScheduleItem_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Meeting" (
  "id" TEXT NOT NULL,
  "scheduleItemId" TEXT NOT NULL,
  "number" INTEGER NOT NULL,
  "type" "MeetingType" NOT NULL,
  "date" TIMESTAMP(3) NOT NULL,
  "startTime" TEXT NOT NULL,
  "endTime" TEXT NOT NULL,
  "hours" INTEGER NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Meeting_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "Schedule_classGroupId_key" ON "Schedule"("classGroupId");
CREATE INDEX "ScheduleItem_scheduleId_order_idx" ON "ScheduleItem"("scheduleId","order");
CREATE UNIQUE INDEX "Meeting_scheduleItemId_number_key" ON "Meeting"("scheduleItemId","number");

ALTER TABLE "Schedule"
ADD CONSTRAINT "Schedule_classGroupId_fkey"
FOREIGN KEY ("classGroupId") REFERENCES "ClassGroup"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "ScheduleItem"
ADD CONSTRAINT "ScheduleItem_scheduleId_fkey"
FOREIGN KEY ("scheduleId") REFERENCES "Schedule"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "ScheduleItem"
ADD CONSTRAINT "ScheduleItem_curricularUnitId_fkey"
FOREIGN KEY ("curricularUnitId") REFERENCES "CurricularUnit"("id")
ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "Meeting"
ADD CONSTRAINT "Meeting_scheduleItemId_fkey"
FOREIGN KEY ("scheduleItemId") REFERENCES "ScheduleItem"("id")
ON DELETE CASCADE ON UPDATE CASCADE;
