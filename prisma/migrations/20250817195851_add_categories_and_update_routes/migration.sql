-- CreateTable
CREATE TABLE "public"."categorias" (
    "id" TEXT NOT NULL,
    "titulo" TEXT NOT NULL,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "categorias_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."categoria_produtos" (
    "id" TEXT NOT NULL,
    "categoriaId" TEXT NOT NULL,
    "produtoId" TEXT NOT NULL,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "categoria_produtos_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "categoria_produtos_categoriaId_idx" ON "public"."categoria_produtos"("categoriaId");

-- CreateIndex
CREATE INDEX "categoria_produtos_produtoId_idx" ON "public"."categoria_produtos"("produtoId");

-- CreateIndex
CREATE UNIQUE INDEX "categoria_produtos_categoriaId_produtoId_key" ON "public"."categoria_produtos"("categoriaId", "produtoId");

-- AddForeignKey
ALTER TABLE "public"."categoria_produtos" ADD CONSTRAINT "categoria_produtos_categoriaId_fkey" FOREIGN KEY ("categoriaId") REFERENCES "public"."categorias"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."categoria_produtos" ADD CONSTRAINT "categoria_produtos_produtoId_fkey" FOREIGN KEY ("produtoId") REFERENCES "public"."produtos"("id") ON DELETE CASCADE ON UPDATE CASCADE;
