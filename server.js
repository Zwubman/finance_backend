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
import { authenticate } from "./Middlewares/auth.js";
import { registerUser } from "./Controllers/user.js";
import { registerEmployee } from "./Controllers/employee.js";
import path from "path";

dotenv.config();

const app = express();

app.use(
  cors({
    origin: "http://localhost:5173",
    credentials: true,
    methods: ["GET", "POST", "PATCH", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
  })
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use("/uploads", express.static(path.join(process.cwd(), "uploads")));

app.post("/login", login);
app.post("/verify-otp", verifyLoginOtp);
app.post("/logout", logout);
app.post("/refresh", refresh);

//public api
app.post("/user-register", registerUser);
app.post("/employee-register", registerEmployee);

// Protected routes
app.use("/api/v1", authenticate, routes);

// Start the server and connect to the database
const startServer = async () => {
  try {
    await sequelize.authenticate();
    console.log("Database connected...");

    const PORT = process.env.PORT || 3000;
    app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
    });

    await sequelize.sync({ alter: true });
    console.log("All models synced and tables created/updated");
  } catch (err) {
    console.error("Unable to connect to the database:", err);
  }
};

startServer();
