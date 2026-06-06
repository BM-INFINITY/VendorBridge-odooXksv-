import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding VendorBridge database...");

  // ------------------------------------------------------------------
  // Seed: Admin User
  // ------------------------------------------------------------------
  const adminPassword = await bcrypt.hash("123", 12);

  const admin = await prisma.user.upsert({
    where: { email: "admin@vendorbridge.com" },
    update: { password: adminPassword },
    create: {
      firstName: "System",
      lastName: "Admin",
      email: "admin@vendorbridge.com",
      password: adminPassword,
      role: "ADMIN",
      country: "United States",
      additionalInfo: "System administrator account",
    },
  });

  console.log(`✅ Admin user created: ${admin.email}`);

  // ------------------------------------------------------------------
  // Seed: Procurement Officer
  // ------------------------------------------------------------------
  const officerPassword = await bcrypt.hash("123", 12);

  const officer = await prisma.user.upsert({
    where: { email: "officer@vendorbridge.com" },
    update: { password: officerPassword },
    create: {
      firstName: "Jane",
      lastName: "Smith",
      email: "officer@vendorbridge.com",
      password: officerPassword,
      role: "PROCUREMENT_OFFICER",
      country: "United States",
    },
  });

  console.log(`✅ Procurement Officer created: ${officer.email}`);

  // ------------------------------------------------------------------
  // Seed: Manager
  // ------------------------------------------------------------------
  const managerPassword = await bcrypt.hash("123", 12);

  const manager = await prisma.user.upsert({
    where: { email: "manager@vendorbridge.com" },
    update: { password: managerPassword },
    create: {
      firstName: "John",
      lastName: "Manager",
      email: "manager@vendorbridge.com",
      password: managerPassword,
      role: "MANAGER",
      country: "United States",
    },
  });

  console.log(`✅ Manager created: ${manager.email}`);

  // ------------------------------------------------------------------
  // Seed: Vendor User
  // ------------------------------------------------------------------
  const vendorPassword = await bcrypt.hash("123", 12);

  const vendorUser = await prisma.user.upsert({
    where: { email: "vendor@techsupplies.com" },
    update: { password: vendorPassword },
    create: {
      firstName: "Tech",
      lastName: "Supplies",
      email: "vendor@techsupplies.com",
      password: vendorPassword,
      role: "VENDOR",
      country: "United States",
    },
  });

  console.log(`✅ Vendor user created: ${vendorUser.email}`);

  // ------------------------------------------------------------------
  // Seed: Sample Vendor Records
  // ------------------------------------------------------------------
  const vendor1 = await prisma.vendor.upsert({
    where: { email: "contact@techsupplies.com" },
    update: {},
    create: {
      vendorName: "Tech Supplies Co.",
      companyName: "Tech Supplies International Ltd.",
      contactPerson: "Alice Johnson",
      email: "contact@techsupplies.com",
      phone: "+1-555-0101",
      address: "123 Tech Park, San Francisco, CA 94105",
      status: "ACTIVE",
      createdById: admin.id,
    },
  });

  const vendor2 = await prisma.vendor.upsert({
    where: { email: "info@officeworld.com" },
    update: {},
    create: {
      vendorName: "Office World",
      companyName: "Office World Supplies Inc.",
      contactPerson: "Bob Williams",
      email: "info@officeworld.com",
      phone: "+1-555-0202",
      address: "456 Commerce Ave, New York, NY 10001",
      status: "ACTIVE",
      createdById: admin.id,
    },
  });

  console.log(`✅ Sample vendors created: ${vendor1.vendorName}, ${vendor2.vendorName}`);

  console.log("\n🎉 Seeding complete!");
  console.log("\n📋 Test Credentials:");
  console.log("   Admin:               admin@vendorbridge.com     / 123");
  console.log("   Procurement Officer: officer@vendorbridge.com   / 123");
  console.log("   Manager:             manager@vendorbridge.com   / 123");
  console.log("   Vendor:              vendor@techsupplies.com    / 123");
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error("❌ Seeding failed:", e);
    await prisma.$disconnect();
    process.exit(1);
  });
