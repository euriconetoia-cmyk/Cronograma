CREATE TYPE "Weekday" AS ENUM (
  'SUNDAY','MONDAY','TUESDAY','WEDNESDAY','THURSDAY','FRIDAY','SATURDAY'
);

CREATE TYPE "ClassGroupStatus" AS ENUM (
  'DRAFT','PLANNED','ACTIVE','COMPLETED','CANCELLED'
);

CREATE TYPE "ClassGroupPersonRole" AS ENUM (
  'INSTRUCTOR','TUTOR','MONITOR','PLANNER'
);

CREATE TABLE "Person" (
  "id" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "email" TEXT,
  "registry" TEXT,
  "active" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Person_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ClassGroup" (
  "id" TEXT NOT NULL,
  "code" TEXT NOT NULL,
  "expectedStudents" INTEGER,
  "startDate" TIMESTAMP(3) NOT NULL,
  "endDateLimit" TIMESTAMP(3),
  "status" "ClassGroupStatus" NOT NULL DEFAULT 'DRAFT',
  "courseId" TEXT NOT NULL,
  "courseVersionId" TEXT NOT NULL,
  "unitId" TEXT NOT NULL,
  "modalityId" TEXT NOT NULL,
  "academicCalendarId" TEXT NOT NULL,
  "generateRecovery" BOOLEAN NOT NULL DEFAULT false,
  "createEnrollmentPeriod" BOOLEAN NOT NULL DEFAULT false,
  "createInauguralClass" BOOLEAN NOT NULL DEFAULT false,
  "avaExtraDays" INTEGER NOT NULL DEFAULT 0,
  "allowSaturday" BOOLEAN NOT NULL DEFAULT false,
  "allowSunday" BOOLEAN NOT NULL DEFAULT false,
  "allowOverlap" BOOLEAN NOT NULL DEFAULT false,
  "allowNextUcDuringRecovery" BOOLEAN NOT NULL DEFAULT false,
  "observations" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "ClassGroup_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ClassScheduleRule" (
  "id" TEXT NOT NULL,
  "classGroupId" TEXT NOT NULL,
  "weekday" "Weekday" NOT NULL,
  "startTime" TEXT NOT NULL,
  "endTime" TEXT NOT NULL,
  "maxDailyHours" INTEGER,
  "enabled" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "ClassScheduleRule_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ClassGroupPerson" (
  "id" TEXT NOT NULL,
  "classGroupId" TEXT NOT NULL,
  "personId" TEXT NOT NULL,
  "role" "ClassGroupPersonRole" NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ClassGroupPerson_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "ClassGroup_code_key" ON "ClassGroup"("code");
CREATE UNIQUE INDEX "ClassScheduleRule_classGroupId_weekday_key"
ON "ClassScheduleRule"("classGroupId","weekday");
CREATE UNIQUE INDEX "ClassGroupPerson_classGroupId_personId_role_key"
ON "ClassGroupPerson"("classGroupId","personId","role");

ALTER TABLE "ClassGroup"
ADD CONSTRAINT "ClassGroup_courseId_fkey"
FOREIGN KEY ("courseId") REFERENCES "Course"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "ClassGroup"
ADD CONSTRAINT "ClassGroup_courseVersionId_fkey"
FOREIGN KEY ("courseVersionId") REFERENCES "CourseVersion"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "ClassGroup"
ADD CONSTRAINT "ClassGroup_unitId_fkey"
FOREIGN KEY ("unitId") REFERENCES "Unit"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "ClassGroup"
ADD CONSTRAINT "ClassGroup_modalityId_fkey"
FOREIGN KEY ("modalityId") REFERENCES "Modality"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "ClassGroup"
ADD CONSTRAINT "ClassGroup_academicCalendarId_fkey"
FOREIGN KEY ("academicCalendarId") REFERENCES "AcademicCalendar"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "ClassScheduleRule"
ADD CONSTRAINT "ClassScheduleRule_classGroupId_fkey"
FOREIGN KEY ("classGroupId") REFERENCES "ClassGroup"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "ClassGroupPerson"
ADD CONSTRAINT "ClassGroupPerson_classGroupId_fkey"
FOREIGN KEY ("classGroupId") REFERENCES "ClassGroup"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "ClassGroupPerson"
ADD CONSTRAINT "ClassGroupPerson_personId_fkey"
FOREIGN KEY ("personId") REFERENCES "Person"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
