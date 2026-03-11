import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import sequelize from "./Config/database.js";
import "./Models/account_transfer.js";
import "./Models/user.js";
import "./Models/asset.js";
import "./Models/bank_account.js";
import "./Models/budget_plan.js";
import "./Models/employee.js";
import "./Models/expense.js";
import "./Models/loan.js";
import "./Models/project.js";
import "./Models/payroll.js";
import "./Utils/scheduled_task.js";
import routes from "./Routes/index.js";
import { login, logout, refresh, verifyLoginOtp } from "./Controllers/auth.js";
import cookieParser from "cookie-parser";
import { authenticate } from "./Middlewares/auth.js";
import { registerUser } from "./Controllers/user.js";
import { registerEmployee } from "./Controllers/employee.js";
import { forgotPassword, verifyPasswordResetOtp, resetPassword } from "./Controllers/user.js";
import path from "path";

dotenv.config();

const app = express();

app.use(
  cors({
    // origin: "https://finance.system.teamworksc.com",
    origin: "https://finance-backend-a3we.onrender.com",
    credentials: true,
    methods: ["GET", "POST", "PATCH", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
  })
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use("/uploads", express.static(path.join(process.cwd(), "uploads")));
app.get("/", (req, res, next)=>{
return res.json("welcome to finance system")
})
app.post("/login", login);
app.post("/verify-otp", verifyLoginOtp);
app.post("/logout", logout);
app.post("/refresh", refresh);

// Password reset routes
app.post("/forgot-password", forgotPassword);
app.post("/verify-password-otp", verifyPasswordResetOtp);
app.post("/reset-password", resetPassword);

//public api
app.post("/user-register", registerUser);
app.post("/employee-register", registerEmployee);

// Protected routes
app.use("/api/v1", authenticate, routes);

// Start the server and connect to the database
import http from "http";
import { initWebSocket } from "./Utils/notifications.js";

const startServer = async () => {
  try {
    await sequelize.authenticate();
    console.log("Database connected...");

    const PORT = process.env.PORT || 3000;
    const server = http.createServer(app);

    // initialize websocket server attached to the HTTP server
    initWebSocket(server);

    server.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
    });

    await sequelize.sync({ alter: true });
    console.log("All models synced and tables created/updated");
  } catch (err) {
    console.error("Unable to connect to the database:", err);
  }
};

startServer();
