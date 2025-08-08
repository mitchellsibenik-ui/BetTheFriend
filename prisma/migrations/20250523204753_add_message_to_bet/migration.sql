/*
  Warnings:

  - You are about to drop the column `trashTalk` on the `Bet` table. All the data in the column will be lost.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Bet" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "gameId" TEXT NOT NULL,
    "senderId" INTEGER NOT NULL,
    "receiverId" INTEGER NOT NULL,
    "senderTeam" TEXT NOT NULL,
    "receiverTeam" TEXT NOT NULL,
    "betType" TEXT NOT NULL,
    "senderValue" TEXT NOT NULL,
    "receiverValue" TEXT NOT NULL,
    "amount" REAL NOT NULL,
    "message" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "gameDetails" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "resolved" BOOLEAN NOT NULL DEFAULT false,
    "resolvedAt" DATETIME,
    "winnerId" INTEGER,
    "loserId" INTEGER,
    "result" TEXT,
    CONSTRAINT "Bet_senderId_fkey" FOREIGN KEY ("senderId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Bet_receiverId_fkey" FOREIGN KEY ("receiverId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Bet_winnerId_fkey" FOREIGN KEY ("winnerId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Bet_loserId_fkey" FOREIGN KEY ("loserId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Bet" ("amount", "betType", "createdAt", "gameDetails", "gameId", "id", "loserId", "receiverId", "receiverTeam", "receiverValue", "resolved", "resolvedAt", "result", "senderId", "senderTeam", "senderValue", "status", "updatedAt", "winnerId") SELECT "amount", "betType", "createdAt", "gameDetails", "gameId", "id", "loserId", "receiverId", "receiverTeam", "receiverValue", "resolved", "resolvedAt", "result", "senderId", "senderTeam", "senderValue", "status", "updatedAt", "winnerId" FROM "Bet";
DROP TABLE "Bet";
ALTER TABLE "new_Bet" RENAME TO "Bet";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
