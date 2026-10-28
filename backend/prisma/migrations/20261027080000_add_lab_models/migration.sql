CREATE TABLE "LabModel" (
    "id" TEXT NOT NULL,
    "experimentId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "uploadedById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LabModel_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "LabModel_experimentId_key" ON "LabModel"("experimentId");
CREATE INDEX "LabModel_uploadedById_idx" ON "LabModel"("uploadedById");

ALTER TABLE "LabModel"
ADD CONSTRAINT "LabModel_uploadedById_fkey"
FOREIGN KEY ("uploadedById") REFERENCES "User"("id")
ON DELETE CASCADE ON UPDATE CASCADE;
