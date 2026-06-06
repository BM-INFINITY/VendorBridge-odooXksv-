import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import authRoutes from "./routes/auth.routes";
import vendorRoutes from "./routes/vendor.routes";
import rfqRoutes from "./routes/rfq.routes";
import quotationRoutes from "./routes/quotation.routes";
import approvalRoutes from "./routes/approval.routes";
import purchaseOrderRoutes from "./routes/purchase-order.routes";
import invoiceRoutes from "./routes/invoice.routes";
import reportRoutes from "./routes/report.routes";
import activityRoutes from "./routes/activity.routes";
import userRoutes from "./routes/user.routes";

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 4000;

// Enable CORS — allow Vercel frontend in prod, localhost in dev
const allowedOrigins = [
  "http://localhost:5173",
  "http://localhost:5174",
  ...(process.env.CLIENT_URL ? process.env.CLIENT_URL.split(",").map((o) => o.trim()) : []),
];

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (curl, Render health checks, etc.)
      if (!origin) return callback(null, true);
      if (allowedOrigins.includes(origin)) return callback(null, true);
      callback(new Error(`CORS: origin ${origin} not allowed`));
    },
    credentials: true,
  })
);

// Body Parser Middleware
app.use(express.json());

// API Endpoints
app.use("/api/auth", authRoutes);
app.use("/api/vendors", vendorRoutes);
app.use("/api/rfqs", rfqRoutes);
app.use("/api/quotations", quotationRoutes);
app.use("/api/approvals", approvalRoutes);
app.use("/api/purchase-orders", purchaseOrderRoutes);
app.use("/api/invoices", invoiceRoutes);
app.use("/api/reports", reportRoutes);
app.use("/api/activity-logs", activityRoutes);
app.use("/api/users", userRoutes);

// Health check endpoint
app.get("/health", (req, res) => {
  res.json({ status: "OK", timestamp: new Date() });
});

// Start Express Server
app.listen(PORT, () => {
  console.log(`🚀 VendorBridge API Server running on port ${PORT}`);
});
