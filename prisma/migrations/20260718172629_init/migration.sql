-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'ADMIN',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Product" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "vinicola" TEXT NOT NULL,
    "uva" TEXT NOT NULL,
    "teorAlcoolico" DOUBLE PRECISION NOT NULL,
    "safra" TEXT NOT NULL,
    "paisOrigem" TEXT NOT NULL,
    "regiao" TEXT NOT NULL,
    "notasDegustacao" TEXT NOT NULL,
    "precoOriginal" DOUBLE PRECISION NOT NULL,
    "precoPromocional" DOUBLE PRECISION,
    "status" BOOLEAN NOT NULL DEFAULT true,
    "imagemUrl" TEXT NOT NULL,
    "categoria" TEXT NOT NULL DEFAULT 'Tinto',
    "estoque" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Product_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Template" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "htmlContent" TEXT NOT NULL,
    "cssStyles" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Template_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");
