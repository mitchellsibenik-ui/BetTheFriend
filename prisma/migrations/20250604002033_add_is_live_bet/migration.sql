-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Bet" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "gameId" TEXT NOT NULL,
    "senderId" TEXT NOT NULL,
    "receiverId" TEXT NOT NULL,
    "senderTeam" TEXT NOT NULL,
    "receiverTeam" TEXT NOT NULL,
    "betType" TEXT NOT NULL,
    "senderValue" TEXT,
    "receiverValue" TEXT,
    "amount" INTEGER NOT NULL,
    "message" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "gameDetails" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "resolved" BOOLEAN NOT NULL DEFAULT false,
    "resolvedAt" DATETIME,
    "winnerId" TEXT,
    "loserId" TEXT,
    "result" TEXT,
    "isLiveBet" BOOLEAN NOT NULL DEFAULT false,
    CONSTRAINT "Bet_senderId_fkey" FOREIGN KEY ("senderId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Bet_receiverId_fkey" FOREIGN KEY ("receiverId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Bet_gameId_fkey" FOREIGN KEY ("gameId") REFERENCES "Game" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Bet_winnerId_fkey" FOREIGN KEY ("winnerId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Bet_loserId_fkey" FOREIGN KEY ("loserId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Bet" ("amount", "betType", "createdAt", "gameDetails", "gameId", "id", "loserId", "message", "receiverId", "receiverTeam", "receiverValue", "resolved", "resolvedAt", "result", "senderId", "senderTeam", "senderValue", "status", "updatedAt", "winnerId") SELECT "amount", "betType", "createdAt", "gameDetails", "gameId", "id", "loserId", "message", "receiverId", "receiverTeam", "receiverValue", "resolved", "resolvedAt", "result", "senderId", "senderTeam", "senderValue", "status", "updatedAt", "winnerId" FROM "Bet";
DROP TABLE "Bet";
ALTER TABLE "new_Bet" RENAME TO "Bet";
CREATE INDEX "Bet_senderId_idx" ON "Bet"("senderId");
CREATE INDEX "Bet_receiverId_idx" ON "Bet"("receiverId");
CREATE INDEX "Bet_gameId_idx" ON "Bet"("gameId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
