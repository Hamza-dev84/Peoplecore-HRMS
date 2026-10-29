import mongoose from "mongoose";
import User, { ROLES } from "../models/User";
import asyncWrapper from "../utilities/asyncWrapper";
import ApiError from "../utilities/ApiError";
import { successResponse } from "../utilities/responseHandler";

const updateUserRole = asyncWrapper(async (req, res) => {
  const id = String(req.params.id);
  const { role } = req.body;

  if (!mongoose.isValidObjectId(id)) {
    throw new ApiError(400, "Invalid user id");
  }
  if (!(ROLES as readonly string[]).includes(role)) {
    throw new ApiError(400, `Role must be one of: ${ROLES.join(", ")}`);
  }
  if (req.user!.id === id) {
    throw new ApiError(400, "You cannot change your own role");
  }

  const user = await User.findByIdAndUpdate(
    id,
    { role },
    { new: true, runValidators: true }
  );

  if (!user) {
    throw new ApiError(404, "User not found");
  }

  successResponse({
    res,
    status: 200,
    message: "User role updated successfully",
    data: {
      user: { id: user._id, name: user.name, email: user.email, role: user.role },
    },
  });
});

export { updateUserRole };