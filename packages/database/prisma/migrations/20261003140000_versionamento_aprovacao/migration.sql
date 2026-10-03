ALTER TYPE "ScheduleStatus" ADD VALUE IF NOT EXISTS 'AWAITING_APPROVAL';

CREATE TYPE "ApprovalDecision" AS ENUM (
  'PENDING',
  'APPROVED',
  'REJECTED',
  'CHANGES_REQUESTED'
);

CREATE TABLE "ScheduleVersion" (
  "id" TEXT NOT NULL,
  "scheduleId" TEXT NOT NULL,
  "version" INTEGER NOT NULL,
  "actorName" TEXT NOT NULL,
  "reason" TEXT NOT NULL,
  "snapshot" JSONB NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ScheduleVersion_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Approval" (
  "id" TEXT NOT NULL,
  "scheduleId" TEXT NOT NULL,
  "decision" "ApprovalDecision" NOT NULL DEFAULT 'PENDING',
  "actorName" TEXT NOT NULL,
  "comment" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Approval_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "AuditLog" (
  "id" TEXT NOT NULL,
  "entityType" TEXT NOT NULL,
  "entityId" TEXT NOT NULL,
  "action" TEXT NOT NULL,
  "actorName" TEXT NOT NULL,
  "reason" TEXT,
  "changes" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "ScheduleVersion_scheduleId_version_key"
ON "ScheduleVersion"("scheduleId","version");

CREATE INDEX "AuditLog_entityType_entityId_createdAt_idx"
ON "AuditLog"("entityType","entityId","createdAt");

ALTER TABLE "ScheduleVersion"
ADD CONSTRAINT "ScheduleVersion_scheduleId_fkey"
FOREIGN KEY ("scheduleId") REFERENCES "Schedule"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "Approval"
ADD CONSTRAINT "Approval_scheduleId_fkey"
FOREIGN KEY ("scheduleId") REFERENCES "Schedule"("id")
ON DELETE CASCADE ON UPDATE CASCADE;
