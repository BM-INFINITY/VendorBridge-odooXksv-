"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const dotenv_1 = __importDefault(require("dotenv"));
const auth_routes_1 = __importDefault(require("./routes/auth.routes"));
const vendor_routes_1 = __importDefault(require("./routes/vendor.routes"));
const rfq_routes_1 = __importDefault(require("./routes/rfq.routes"));
const quotation_routes_1 = __importDefault(require("./routes/quotation.routes"));
const approval_routes_1 = __importDefault(require("./routes/approval.routes"));
const purchase_order_routes_1 = __importDefault(require("./routes/purchase-order.routes"));
const invoice_routes_1 = __importDefault(require("./routes/invoice.routes"));
const report_routes_1 = __importDefault(require("./routes/report.routes"));
const activity_routes_1 = __importDefault(require("./routes/activity.routes"));
// Load environment variables
dotenv_1.default.config();
const app = (0, express_1.default)();
const PORT = process.env.PORT || 4000;
// Enable CORS
app.use((0, cors_1.default)({
    origin: process.env.CLIENT_URL || "http://localhost:5173",
    credentials: true,
}));
// Body Parser Middleware
app.use(express_1.default.json());
// API Endpoints
app.use("/api/auth", auth_routes_1.default);
app.use("/api/vendors", vendor_routes_1.default);
app.use("/api/rfqs", rfq_routes_1.default);
app.use("/api/quotations", quotation_routes_1.default);
app.use("/api/approvals", approval_routes_1.default);
app.use("/api/purchase-orders", purchase_order_routes_1.default);
app.use("/api/invoices", invoice_routes_1.default);
app.use("/api/reports", report_routes_1.default);
app.use("/api/activity-logs", activity_routes_1.default);
// Health check endpoint
app.get("/health", (req, res) => {
    res.json({ status: "OK", timestamp: new Date() });
});
// Start Express Server
app.listen(PORT, () => {
    console.log(`🚀 VendorBridge API Server running on port ${PORT}`);
});
