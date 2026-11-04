
import dotenv from "dotenv";
dotenv.config();
import express from "express";
import cors from "cors";
import helmet from "helmet";
import cookieParser from "cookie-parser";
import path from "path";
import errorHandler from "./middleware/errorHandlerMiddleware";
import { apiLimiter } from "./middleware/rateLimiter";
import connectToDB from "./config/db";
import ApiError from "./utilities/ApiError";
import authRoutes from "./routes/authRoutes";
import userRoutes from "./routes/userRoutes";
import employeeRoutes from "./routes/employeeRoutes";
import attendanceRoutes from "./routes/attendanceRoutes";
import leaveRoutes from "./routes/leaveRoutes";
import notificationRoutes from "./routes/notificationRoutes";
import dashboardRoutes from "./routes/dashboardRoutes";
import reportRoutes from "./routes/reportRoutes";

const app = express();

if (process.env.NODE_ENV === "production") {
  app.set("trust proxy", 1);
}

app.use(helmet({ crossOriginResourcePolicy: { policy: "cross-origin" } }));
app.use(
  cors({
    origin: process.env.FRONTEND_URL || "http://localhost:3000",
    credentials: true,
  })
);
app.use(express.json());
app.use(express.urlencoded({ extended: true, limit: "10kb" }));
app.use(cookieParser());

app.use(
  "/uploads",
  express.static(path.join(process.cwd(), "uploads"), { dotfiles: "ignore" })
);

app.use("/api", apiLimiter);

app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/employees", employeeRoutes);
app.use("/api/attendance", attendanceRoutes);
app.use("/api/leaves", leaveRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/reports", reportRoutes);

app.use((req, res, next) => {
  next(new ApiError(404, `Route not found: ${req.method} ${req.originalUrl}`));
});

app.use(errorHandler);

const REQUIRED_ENV = ["MONGO_URI", "JWT_ACCESS_SECRET", "JWT_REFRESH_SECRET"];

const PORT = Number(process.env.PORT) || 5000;

const startServer = async (): Promise<void> => {
  const missing = REQUIRED_ENV.filter((key) => !process.env[key]);
  if (missing.length > 0) {
    throw new Error(`Missing environment variables: ${missing.join(", ")}`);
  }

  await connectToDB();

  app.listen(PORT, () => {
    console.log(`Server Running on PORT ${PORT}`);
  });
};

startServer().catch((error: unknown) => {
  console.error("Server startup failed:", error);
  process.exitCode = 1;
});