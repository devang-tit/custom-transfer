-- AlterTable
ALTER TABLE "Product" ADD COLUMN     "gstRate" DOUBLE PRECISION,
ADD COLUMN     "hsnCode" TEXT;

-- AlterTable
ALTER TABLE "Order" ADD COLUMN     "codFee" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "customerGstin" TEXT;

-- AlterTable
ALTER TABLE "OrderItem" ADD COLUMN     "gstRate" DOUBLE PRECISION,
ADD COLUMN     "hsnCode" TEXT;

