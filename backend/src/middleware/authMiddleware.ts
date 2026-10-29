import User from "../models/User";
import asyncWrapper from "../utilities/asyncWrapper";
import ApiError from "../utilities/ApiError";
import { verifyAccessToken } from "../utilities/token";

const protect = asyncWrapper(async (req, res, next) => {
  const header = req.headers.authorization;

  if (!header || !header.startsWith("Bearer ")) {
    throw new ApiError(401, "Not authenticated");
  }

  const token = header.split(" ")[1];

  let payload: { id: string };
  try {
    payload = verifyAccessToken(token);
  } catch {
    throw new ApiError(401, "Invalid or expired token");
  }

  const user = await User.findById(payload.id);
  if (!user || !user.isActive) {
    throw new ApiError(401, "User not found or inactive");
  }

  req.user = user;
  next();
});

export default protect;