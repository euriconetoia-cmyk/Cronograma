ALTER TABLE "ScheduleItem"
ADD COLUMN "manuallyAdjusted" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "adjustmentReason" TEXT;
