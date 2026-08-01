import { PrismaClient } from "../generated/client";
import * as bcrypt from "bcrypt";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding database...");

  const saltRounds = 12;
  const adminPasswordHash = await bcrypt.hash("admin123456", saltRounds);
  const staffPasswordHash = await bcrypt.hash("staff123456", saltRounds);
  const citizenPasswordHash = await bcrypt.hash("citizen123456", saltRounds);

  // Admin user
  const admin = await prisma.user.upsert({
    where: { email: "admin@cleancity.app" },
    update: {},
    create: {
      name: "Municipal Admin",
      email: "admin@cleancity.app",
      passwordHash: adminPasswordHash,
      role: "ADMIN",
    },
  });
  console.log(`👤 Admin created: ${admin.email}`);

  // Staff user
  const staff = await prisma.user.upsert({
    where: { email: "staff@cleancity.app" },
    update: {},
    create: {
      name: "Field Officer Dave",
      email: "staff@cleancity.app",
      passwordHash: staffPasswordHash,
      role: "STAFF",
    },
  });
  console.log(`👤 Staff created: ${staff.email}`);

  // Demo Citizen user
  const citizen = await prisma.user.upsert({
    where: { email: "citizen@cleancity.app" },
    update: {},
    create: {
      name: "Jane Citizen",
      email: "citizen@cleancity.app",
      passwordHash: citizenPasswordHash,
      role: "CITIZEN",
    },
  });
  console.log(`👤 Citizen created: ${citizen.email}`);

  console.log("✅ Seeding complete!");
}

main()
  .catch((e) => {
    console.error("❌ Seeding failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
