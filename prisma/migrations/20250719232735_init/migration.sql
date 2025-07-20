-- CreateTable
CREATE TABLE "produtos" (
    "id" TEXT NOT NULL,
    "titulo" TEXT NOT NULL,
    "valorBruto" DOUBLE PRECISION NOT NULL,
    "valorDesconto" DOUBLE PRECISION,
    "descontoCalculado" DOUBLE PRECISION,
    "fotos" TEXT[],
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "produtos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "stacks" (
    "id" TEXT NOT NULL,
    "titulo" TEXT NOT NULL,
    "ordem" INTEGER NOT NULL DEFAULT 0,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "stacks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "stack_produtos" (
    "id" TEXT NOT NULL,
    "stackId" TEXT NOT NULL,
    "produtoId" TEXT NOT NULL,
    "ordem" INTEGER NOT NULL DEFAULT 0,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "stack_produtos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "configuracao_site" (
    "id" TEXT NOT NULL,
    "chave" TEXT NOT NULL,
    "valor" TEXT NOT NULL,
    "descricao" TEXT,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "configuracao_site_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sessao_admin" (
    "id" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "expiraEm" TIMESTAMP(3) NOT NULL,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "sessao_admin_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "stacks_ordem_idx" ON "stacks"("ordem");

-- CreateIndex
CREATE INDEX "stack_produtos_stackId_ordem_idx" ON "stack_produtos"("stackId", "ordem");

-- CreateIndex
CREATE INDEX "stack_produtos_produtoId_idx" ON "stack_produtos"("produtoId");

-- CreateIndex
CREATE UNIQUE INDEX "stack_produtos_stackId_produtoId_key" ON "stack_produtos"("stackId", "produtoId");

-- CreateIndex
CREATE UNIQUE INDEX "configuracao_site_chave_key" ON "configuracao_site"("chave");

-- CreateIndex
CREATE UNIQUE INDEX "sessao_admin_token_key" ON "sessao_admin"("token");

-- CreateIndex
CREATE INDEX "sessao_admin_token_idx" ON "sessao_admin"("token");

-- CreateIndex
CREATE INDEX "sessao_admin_expiraEm_idx" ON "sessao_admin"("expiraEm");

-- AddForeignKey
ALTER TABLE "stack_produtos" ADD CONSTRAINT "stack_produtos_stackId_fkey" FOREIGN KEY ("stackId") REFERENCES "stacks"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stack_produtos" ADD CONSTRAINT "stack_produtos_produtoId_fkey" FOREIGN KEY ("produtoId") REFERENCES "produtos"("id") ON DELETE CASCADE ON UPDATE CASCADE;
