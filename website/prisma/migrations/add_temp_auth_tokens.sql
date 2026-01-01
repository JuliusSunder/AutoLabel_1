-- CreateTable
CREATE TABLE "TempAuthToken" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "used" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TempAuthToken_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "TempAuthToken_token_key" ON "TempAuthToken"("token");

-- CreateIndex
CREATE INDEX "TempAuthToken_userId_idx" ON "TempAuthToken"("userId");

-- CreateIndex
CREATE INDEX "TempAuthToken_token_idx" ON "TempAuthToken"("token");

-- CreateIndex
CREATE INDEX "TempAuthToken_expiresAt_idx" ON "TempAuthToken"("expiresAt");

-- AddForeignKey
ALTER TABLE "TempAuthToken" ADD CONSTRAINT "TempAuthToken_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

