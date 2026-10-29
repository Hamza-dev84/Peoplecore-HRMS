import jwt from "jsonwebtoken";
import crypto from "crypto";
import type { CookieOptions } from "express";

export const signAccessToken = (userId: string): string =>
  jwt.sign({ id: userId }, process.env.JWT_ACCESS_SECRET as string, {
    expiresIn: "15m",
  });

export const signRefreshToken = (userId: string): string =>
  jwt.sign({ id: userId }, process.env.JWT_REFRESH_SECRET as string, {
    expiresIn: "7d",
  });

export const verifyAccessToken = (token: string): { id: string } =>
  jwt.verify(token, process.env.JWT_ACCESS_SECRET as string) as { id: string };

export const verifyRefreshToken = (token: string): { id: string } =>
  jwt.verify(token, process.env.JWT_REFRESH_SECRET as string) as { id: string };

export const hashToken = (token: string): string =>
  crypto.createHash("sha256").update(token).digest("hex");

export const getRefreshCookieOptions = (): CookieOptions => {
  const isProd = process.env.NODE_ENV === "production";
  return {
    httpOnly: true,
    secure: isProd,
    sameSite: isProd ? "none" : "lax",
    maxAge: 7 * 24 * 60 * 60 * 1000,
    path: "/api/auth",
  };
};

export const generateRandomToken = (): { token: string; hashedToken: string } => {
  const token = crypto.randomBytes(32).toString("hex");
  return { token, hashedToken: hashToken(token) };
};