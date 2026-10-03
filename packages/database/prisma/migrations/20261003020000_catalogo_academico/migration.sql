-- CreateEnum
CREATE TYPE "CourseStatus" AS ENUM ('ACTIVE', 'INACTIVE');
CREATE TYPE "ModalityStatus" AS ENUM ('ACTIVE', 'INACTIVE');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Unit" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "state" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Unit_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Modality" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "description" TEXT,
    "status" "ModalityStatus" NOT NULL DEFAULT 'ACTIVE',
    "allowsEad" BOOLEAN NOT NULL DEFAULT false,
    "allowsSynchronous" BOOLEAN NOT NULL DEFAULT false,
    "allowsInPersonMeetings" BOOLEAN NOT NULL DEFAULT true,
    "allowsWebClasses" BOOLEAN NOT NULL DEFAULT false,
    "defaultDailyHours" INTEGER,
    "defaultAvaExtraDays" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Modality_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Course" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "description" TEXT,
    "totalHours" INTEGER NOT NULL,
    "status" "CourseStatus" NOT NULL DEFAULT 'ACTIVE',
    "responsibleUnitId" TEXT,
    "defaultModalityId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Course_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "CourseVersion" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "courseId" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "CourseVersion_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "CourseModule" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT,
    "order" INTEGER NOT NULL,
    "courseVersionId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "CourseModule_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "CurricularUnit" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT,
    "order" INTEGER NOT NULL,
    "totalHours" INTEGER NOT NULL,
    "inPersonHours" INTEGER NOT NULL DEFAULT 0,
    "eadHours" INTEGER NOT NULL DEFAULT 0,
    "synchronousHours" INTEGER NOT NULL DEFAULT 0,
    "asynchronousHours" INTEGER NOT NULL DEFAULT 0,
    "suggestedStudyDays" INTEGER,
    "meetingCount" INTEGER NOT NULL DEFAULT 0,
    "meetingHours" INTEGER,
    "requiresWebClass" BOOLEAN NOT NULL DEFAULT false,
    "requiresInPerson" BOOLEAN NOT NULL DEFAULT false,
    "recoveryEnabled" BOOLEAN NOT NULL DEFAULT false,
    "enrollmentPeriodDays" INTEGER,
    "inauguralClass" BOOLEAN NOT NULL DEFAULT false,
    "avaExtraDays" INTEGER NOT NULL DEFAULT 0,
    "observations" TEXT,
    "moduleId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "CurricularUnit_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "User_email_key" ON "User"("email");
CREATE UNIQUE INDEX "Unit_code_key" ON "Unit"("code");
CREATE UNIQUE INDEX "Modality_name_key" ON "Modality"("name");
CREATE UNIQUE INDEX "Modality_code_key" ON "Modality"("code");
CREATE UNIQUE INDEX "Course_code_key" ON "Course"("code");
CREATE UNIQUE INDEX "CourseVersion_courseId_name_key" ON "CourseVersion"("courseId", "name");
CREATE UNIQUE INDEX "CourseModule_courseVersionId_order_key" ON "CourseModule"("courseVersionId", "order");
CREATE UNIQUE INDEX "CurricularUnit_moduleId_order_key" ON "CurricularUnit"("moduleId", "order");

ALTER TABLE "Course"
ADD CONSTRAINT "Course_responsibleUnitId_fkey"
FOREIGN KEY ("responsibleUnitId") REFERENCES "Unit"("id")
ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "Course"
ADD CONSTRAINT "Course_defaultModalityId_fkey"
FOREIGN KEY ("defaultModalityId") REFERENCES "Modality"("id")
ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "CourseVersion"
ADD CONSTRAINT "CourseVersion_courseId_fkey"
FOREIGN KEY ("courseId") REFERENCES "Course"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "CourseModule"
ADD CONSTRAINT "CourseModule_courseVersionId_fkey"
FOREIGN KEY ("courseVersionId") REFERENCES "CourseVersion"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "CurricularUnit"
ADD CONSTRAINT "CurricularUnit_moduleId_fkey"
FOREIGN KEY ("moduleId") REFERENCES "CourseModule"("id")
ON DELETE CASCADE ON UPDATE CASCADE;
