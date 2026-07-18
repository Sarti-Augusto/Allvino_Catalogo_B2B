-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'ADMIN',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Product" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "vinicola" TEXT NOT NULL,
    "uva" TEXT NOT NULL,
    "teorAlcoolico" REAL NOT NULL,
    "safra" TEXT NOT NULL,
    "paisOrigem" TEXT NOT NULL,
    "regiao" TEXT NOT NULL,
    "notasDegustacao" TEXT NOT NULL,
    "precoOriginal" REAL NOT NULL,
    "precoPromocional" REAL,
    "status" BOOLEAN NOT NULL DEFAULT true,
    "imagemUrl" TEXT NOT NULL,
    "estoque" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Template" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "nome" TEXT NOT NULL,
    "htmlContent" TEXT NOT NULL,
    "cssStyles" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");
