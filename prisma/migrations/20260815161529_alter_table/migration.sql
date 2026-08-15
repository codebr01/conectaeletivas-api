/*
  Warnings:

  - You are about to drop the column `professorId` on the `electives` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "electives" DROP CONSTRAINT "electives_professorId_fkey";

-- AlterTable
ALTER TABLE "electives" DROP COLUMN "professorId";

-- CreateTable
CREATE TABLE "elective_professors" (
    "id" TEXT NOT NULL,
    "electiveId" TEXT NOT NULL,
    "professorId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "elective_professors_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "elective_professors_electiveId_professorId_key" ON "elective_professors"("electiveId", "professorId");

-- AddForeignKey
ALTER TABLE "elective_professors" ADD CONSTRAINT "elective_professors_electiveId_fkey" FOREIGN KEY ("electiveId") REFERENCES "electives"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "elective_professors" ADD CONSTRAINT "elective_professors_professorId_fkey" FOREIGN KEY ("professorId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
