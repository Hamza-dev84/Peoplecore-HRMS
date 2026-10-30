import dotenv from "dotenv";
dotenv.config();
import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import errorHandler from "./middleware/errorHandlerMiddleware";
import connectToDB from "./config/db";
import authRoutes from "./routes/authRoutes"
import userRoutes from "./routes/userRoutes";
import employeeRoutes from "./routes/employeeRoutes";
import attendanceRoutes from "./routes/attendanceRoutes";
import leaveRoutes from "./routes/leaveRoutes";
import notificationRoutes from "./routes/notificationRoutes";
import path from "path";

const app = express();

app.use(
  cors({
    origin: process.env.FRONTEND_URL || "http://localhost:3000",
    credentials: true,
  })
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

app.use("/uploads", express.static(path.join(process.cwd(), "uploads")));
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/employees", employeeRoutes);
app.use("/api/attendance", attendanceRoutes);
app.use("/api/leaves", leaveRoutes);
app.use("/api/notifications", notificationRoutes);

app.use(errorHandler);

const PORT = Number(process.env.PORT) || 5000;

const startServer = async (): Promise<void> => {
  await connectToDB();

  app.listen(PORT, () => {
    console.log(`Server Running on PORT ${PORT}`);
  });
};

startServer().catch((error: unknown) => {
  console.error("Server startup failed:", error);
  process.exitCode = 1;
});