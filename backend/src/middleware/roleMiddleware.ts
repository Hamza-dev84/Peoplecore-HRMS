import type { RequestHandler } from "express";
import type { Role } from "../models/User";
import ApiError from "../utilities/ApiError";

const authorizeRoles = (...roles: Role[]): RequestHandler => {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return next(new ApiError(403, "You do not have permission to perform this action"));
    }
    next();
  };
};

export default authorizeRoles;