"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const dotenv_1 = __importDefault(require("dotenv"));
const auth_routes_1 = __importDefault(require("./routes/auth.routes"));
const sql_routes_1 = __importDefault(require("./routes/sql.routes"));
const schema_routes_1 = __importDefault(require("./routes/schema.routes"));
const dashboard_routes_1 = __importDefault(require("./routes/dashboard.routes"));
const prisma_1 = require("./prisma");
const user_routes_1 = __importDefault(require("./routes/user.routes"));
dotenv_1.default.config();
const app = (0, express_1.default)();
app.use((0, helmet_1.default)());
app.use((0, cors_1.default)({
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    credentials: true,
}));
app.use(express_1.default.json({ limit: '10mb' }));
// Routes
app.use('/api/user', user_routes_1.default);
app.use('/api/auth', auth_routes_1.default);
app.use('/api/sql', sql_routes_1.default);
app.use('/api/schema', schema_routes_1.default);
app.use('/api/dashboard', dashboard_routes_1.default);
// Health check
app.get('/health', async (req, res) => {
    try {
        await prisma_1.prisma.$queryRaw `SELECT 1`;
        res.json({ status: 'ok', database: 'connected' });
    }
    catch (error) {
        res.status(500).json({ status: 'error', database: 'disconnected' });
    }
});
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
