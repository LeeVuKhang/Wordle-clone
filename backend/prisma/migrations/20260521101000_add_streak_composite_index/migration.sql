-- CreateIndex
CREATE INDEX "DailyGame_userId_status_gameDate_idx" ON "DailyGame"("userId", "status", "gameDate");
