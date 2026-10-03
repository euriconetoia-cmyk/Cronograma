CREATE TYPE "RoomType" AS ENUM (
  'CLASSROOM',
  'COMPUTER_LAB',
  'NETWORK_LAB',
  'ELECTRICAL_LAB',
  'WORKSHOP',
  'OTHER'
);

CREATE TABLE "PersonAvailability" (
  "id" TEXT NOT NULL,
  "personId" TEXT NOT NULL,
  "weekday" "Weekday" NOT NULL,
  "startTime" TEXT NOT NULL,
  "endTime" TEXT NOT NULL,
  "active" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "PersonAvailability_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Room" (
  "id" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "code" TEXT NOT NULL,
  "type" "RoomType" NOT NULL,
  "capacity" INTEGER,
  "active" BOOLEAN NOT NULL DEFAULT true,
  "unitId" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Room_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "Meeting"
ADD COLUMN "instructorId" TEXT,
ADD COLUMN "roomId" TEXT;

CREATE UNIQUE INDEX "Room_unitId_code_key" ON "Room"("unitId","code");
CREATE INDEX "PersonAvailability_personId_weekday_idx"
ON "PersonAvailability"("personId","weekday");

ALTER TABLE "PersonAvailability"
ADD CONSTRAINT "PersonAvailability_personId_fkey"
FOREIGN KEY ("personId") REFERENCES "Person"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "Room"
ADD CONSTRAINT "Room_unitId_fkey"
FOREIGN KEY ("unitId") REFERENCES "Unit"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "Meeting"
ADD CONSTRAINT "Meeting_instructorId_fkey"
FOREIGN KEY ("instructorId") REFERENCES "Person"("id")
ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "Meeting"
ADD CONSTRAINT "Meeting_roomId_fkey"
FOREIGN KEY ("roomId") REFERENCES "Room"("id")
ON DELETE SET NULL ON UPDATE CASCADE;
