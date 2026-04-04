import { PrismaClient, Department, RoleType } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding demo tenant...");

  const tenant = await prisma.tenant.upsert({
    where: { slug: "demo" },
    update: {},
    create: {
      name: "Demo Construction Co.",
      slug: "demo",
    },
  });

  // Default pipeline stages
  const defaultStages = [
    { name: "Lead", color: "#94a3b8", order: 0 },
    { name: "Qualified", color: "#3b82f6", order: 1 },
    { name: "Proposal", color: "#8b5cf6", order: 2 },
    { name: "Negotiation", color: "#f59e0b", order: 3 },
    { name: "Won", color: "#22c55e", order: 4 },
    { name: "Lost", color: "#ef4444", order: 5 },
  ];

  for (const stage of defaultStages) {
    await prisma.pipelineStage.upsert({
      where: { tenantId_order: { tenantId: tenant.id, order: stage.order } },
      update: {},
      create: { tenantId: tenant.id, ...stage },
    });
  }

  console.log(`Seeded tenant: ${tenant.name} (${tenant.slug})`);
  console.log("Default pipeline stages created.");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
