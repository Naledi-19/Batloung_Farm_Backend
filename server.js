
const express = require("express");
const cors = require("cors");
require("dotenv").config();

const db = require("./config/database");

const supplierRoutes = require("./routes/supplierRoutes");
const fruitRoutes = require("./routes/fruitRoutes");
const vendorRoutes = require("./routes/vendorRoutes");
const purchaseRoutes = require("./routes/purchaseRoutes");
const salesRoutes = require("./routes/salesRoutes");
const stockRoutes = require("./routes/stockRoutes");
const reportRoutes = require("./routes/reportRoutes");

const errorHandler = require("./middleware/errorHandler");

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Home page
app.get("/", (req, res) => {
    res.json({
        message: "Batloung Farm API is running"
    });
});

// Database health check
app.get("/api/health", async (req, res) => {
    try {
        await db.query("SELECT 1");

        res.json({
            database: "Connected"
        });
    } catch (error) {
        res.status(503).json({
            database: "Unavailable"
        });
    }
});

// Register all API routes
app.use("/api/suppliers", supplierRoutes);
app.use("/api/fruits", fruitRoutes);
app.use("/api/vendors", vendorRoutes);
app.use("/api/purchases", purchaseRoutes);
app.use("/api/sales", salesRoutes);
app.use("/api/stock", stockRoutes);
app.use("/api/reports", reportRoutes);

// Handle errors
// Unknown API endpoint: return a useful JSON 404.
app.use((req, res) => {
    res.status(404).json({ message: 'API endpoint not found' });
});
app.use(errorHandler);

// Start server
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log("Server running on port " + PORT);
});
