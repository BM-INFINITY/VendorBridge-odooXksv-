"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const prisma = new client_1.PrismaClient();
async function main() {
    console.log("🌱 Seeding VendorBridge database...");
    // ------------------------------------------------------------------
    // Seed: Admin User
    // ------------------------------------------------------------------
    const adminPassword = await bcryptjs_1.default.hash("Admin@1234", 12);
    const admin = await prisma.user.upsert({
        where: { email: "admin@vendorbridge.com" },
        update: {},
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
    const officerPassword = await bcryptjs_1.default.hash("Officer@1234", 12);
    const officer = await prisma.user.upsert({
        where: { email: "officer@vendorbridge.com" },
        update: {},
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
    const managerPassword = await bcryptjs_1.default.hash("Manager@1234", 12);
    const manager = await prisma.user.upsert({
        where: { email: "manager@vendorbridge.com" },
        update: {},
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
    const vendorPassword = await bcryptjs_1.default.hash("Vendor@1234", 12);
    const vendorUser = await prisma.user.upsert({
        where: { email: "vendor@techsupplies.com" },
        update: {},
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
    console.log("   Admin:               admin@vendorbridge.com     / Admin@1234");
    console.log("   Procurement Officer: officer@vendorbridge.com   / Officer@1234");
    console.log("   Manager:             manager@vendorbridge.com   / Manager@1234");
    console.log("   Vendor:              vendor@techsupplies.com    / Vendor@1234");
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
