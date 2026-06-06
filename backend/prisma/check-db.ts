import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();
async function main() {
  const approval = await prisma.approval.findUnique({
    where: { id: "cmq227be5001mlyn4d8d2trpn" },
    include: { purchaseOrder: true }
  });
  console.log("Approval:", approval);
}
main().catch(console.error).finally(() => prisma.$disconnect());
