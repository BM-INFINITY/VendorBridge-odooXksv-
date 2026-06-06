import { PrismaClient } from "@prisma/client";

const API_URL = "http://localhost:4000";

async function runTest() {
  console.log("🚀 Starting End-to-End Procurement Workflow Test...");

  // 1. Log in as Procurement Officer
  console.log("\n🔑 1. Logging in as Procurement Officer...");
  const officerLoginRes = await fetch(`${API_URL}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      email: "officer@vendorbridge.com",
      password: "123",
    }),
  });
  const officerLoginData = (await officerLoginRes.json()) as any;
  if (!officerLoginData.success) {
    throw new Error(`Officer login failed: ${JSON.stringify(officerLoginData)}`);
  }
  const officerToken = officerLoginData.data.token;
  console.log("✅ Officer logged in successfully.");

  // 2. Create RFQ
  console.log("\n📦 2. Creating a new RFQ...");
  const prisma = new PrismaClient();
  const activeVendor = await prisma.vendor.findFirst({
    where: { email: "vendor@techsupplies.com" },
  });
  if (!activeVendor) {
    throw new Error("Active vendor 'vendor@techsupplies.com' not found in database.");
  }

  const rfqRes = await fetch(`${API_URL}/api/rfqs`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${officerToken}`,
    },
    body: JSON.stringify({
      title: "Test RFQ for Laptop Procurement",
      category: "IT",
      deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      description: "Testing automated selection and approval flow.",
      vendorIds: [activeVendor.id],
      items: [
        {
          itemName: "Developer Laptop Pro",
          quantity: 5,
          unit: "pcs",
        },
      ],
    }),
  });
  const rfqData = (await rfqRes.json()) as any;
  if (!rfqData.success) {
    throw new Error(`RFQ creation failed: ${JSON.stringify(rfqData)}`);
  }
  const rfqId = rfqData.data.id;
  console.log(`✅ RFQ created with ID: ${rfqId}`);

  // 3. Publish RFQ
  console.log("\n📢 3. Publishing RFQ to vendors...");
  const publishRes = await fetch(`${API_URL}/api/rfqs/${rfqId}/publish`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${officerToken}`,
    },
  });
  const publishData = (await publishRes.json()) as any;
  if (!publishData.success) {
    throw new Error(`RFQ publish failed: ${JSON.stringify(publishData)}`);
  }
  console.log("✅ RFQ published successfully.");

  // 4. Log in as Vendor
  console.log("\n🔑 4. Logging in as Vendor...");
  const vendorLoginRes = await fetch(`${API_URL}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      email: "vendor@techsupplies.com",
      password: "123",
    }),
  });
  const vendorLoginData = (await vendorLoginRes.json()) as any;
  if (!vendorLoginData.success) {
    throw new Error(`Vendor login failed: ${JSON.stringify(vendorLoginData)}`);
  }
  const vendorToken = vendorLoginData.data.token;
  console.log("✅ Vendor logged in successfully.");

  // 5. Submit Quotation
  console.log("\n💰 5. Submitting Quotation as Vendor...");
  const rfqItem = rfqData.data.items[0];
  const quoteRes = await fetch(`${API_URL}/api/quotations/submit`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${vendorToken}`,
    },
    body: JSON.stringify({
      rfqId: rfqId,
      deliveryTimeline: "10 Days",
      notes: "Testing bid selection and approval flow.",
      items: [
        {
          rfqItemId: rfqItem.id,
          unitPrice: 1500,
          quantity: 5,
          taxPercentage: 10,
        },
      ],
    }),
  });
  const quoteData = (await quoteRes.json()) as any;
  if (!quoteData.success) {
    throw new Error(`Quotation submission failed: ${JSON.stringify(quoteData)}`);
  }
  const quotationId = quoteData.data.id;
  console.log(`✅ Quotation submitted with ID: ${quotationId}`);

  // 6. Log in as Officer to award bid
  console.log("\n🏆 6. Awarding bid as Procurement Officer...");
  const awardRes = await fetch(`${API_URL}/api/quotations/${quotationId}/select`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${officerToken}`,
    },
  });
  const awardData = (await awardRes.json()) as any;
  if (!awardData.success) {
    throw new Error(`Quotation awarding failed: ${JSON.stringify(awardData)}`);
  }
  console.log("✅ Bid awarded. Status updated to SELECTED and approval record created.");

  // 7. Log in as Manager to approve
  console.log("\n🔑 7. Logging in as Manager...");
  const managerLoginRes = await fetch(`${API_URL}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      email: "manager@vendorbridge.com",
      password: "123",
    }),
  });
  const managerLoginData = (await managerLoginRes.json()) as any;
  if (!managerLoginData.success) {
    throw new Error(`Manager login failed: ${JSON.stringify(managerLoginData)}`);
  }
  const managerToken = managerLoginData.data.token;
  console.log("✅ Manager logged in successfully.");

  // Find the pending approval record
  const approvals = await prisma.approval.findMany({
    where: { rfqId, status: "PENDING" },
  });
  if (approvals.length === 0) {
    throw new Error("No pending approval record found for the RFQ.");
  }
  const approvalId = approvals[0].id;
  console.log(`Found pending approval ID: ${approvalId}`);

  // 8. Approve the request
  console.log("\n✍️ 8. Approving request as Manager...");
  const approveRes = await fetch(`${API_URL}/api/approvals/${approvalId}/approve`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${managerToken}`,
    },
    body: JSON.stringify({
      remarks: "E2E Test: Approved. Competitive pricing.",
    }),
  });
  const approveData = (await approveRes.json()) as any;
  if (!approveData.success) {
    throw new Error(`Manager approval failed: ${JSON.stringify(approveData)}`);
  }
  console.log("✅ Manager approved the request. Purchase Order should be generated automatically.");

  // 9. Verify Purchase Order creation
  console.log("\n🔍 9. Verifying Purchase Order in database...");
  const purchaseOrders = await prisma.purchaseOrder.findMany({
    where: { rfqId },
    include: { items: true },
  });
  if (purchaseOrders.length === 0) {
    throw new Error("❌ Purchase Order was NOT generated!");
  }
  const po = purchaseOrders[0];
  console.log("🎉 SUCCESS! Purchase Order generated successfully:");
  console.log(`- PO Number: ${po.poNumber}`);
  console.log(`- Status: ${po.status}`);
  const totalPoAmount = po.items.reduce((sum, item) => sum + Number(item.totalAmount), 0);
  console.log(`- Total Amount: ${totalPoAmount}`);
  console.log(`- Items Count: ${po.items.length}`);

  await prisma.$disconnect();
}

runTest().catch((err) => {
  console.error(err);
  process.exit(1);
});
