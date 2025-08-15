/*
  Warnings:

  - Added the required column `gameDate` to the `ShowdownRoom` table without a default value. This is not possible if the table is not empty.
  - Added the required column `sport` to the `ShowdownRoom` table without a default value. This is not possible if the table is not empty.
  - Added the required column `sportTitle` to the `ShowdownRoom` table without a default value. This is not possible if the table is not empty.

*/
-- First add the columns as nullable
ALTER TABLE "ShowdownRoom" ADD COLUMN     "gameDate" TEXT,
ADD COLUMN     "sport" TEXT,
ADD COLUMN     "sportTitle" TEXT;

-- Update existing records with default values
UPDATE "ShowdownRoom" SET 
  "gameDate" = '2025-08-15',
  "sport" = 'baseball_mlb',
  "sportTitle" = 'MLB'
WHERE "gameDate" IS NULL;

-- Now make the columns required
ALTER TABLE "ShowdownRoom" ALTER COLUMN "gameDate" SET NOT NULL,
ALTER COLUMN "sport" SET NOT NULL,
ALTER COLUMN "sportTitle" SET NOT NULL;

-- AlterTable
ALTER TABLE "User" ALTER COLUMN "balance" SET DEFAULT 10000;
