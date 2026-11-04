import rateLimit from "express-rate-limit";
import { errorResponse } from "../utilities/responseHandler";

const isProduction = (): boolean => process.env.NODE_ENV === "production";

const handler = (req: unknown, res: Parameters<typeof errorResponse>[0]["res"]): void => {
  errorResponse({
    res,
    message: "Too many requests, please try again later",
    status: 429,
  });
};

export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: () => (isProduction() ? 300 : 3000),
  standardHeaders: "draft-7",
  legacyHeaders: false,
  handler,
});

export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: () => (isProduction() ? 10 : 100),
  standardHeaders: "draft-7",
  legacyHeaders: false,
  handler,
});