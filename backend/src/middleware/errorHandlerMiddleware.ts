import type { ErrorRequestHandler } from "express";
import { errorResponse } from "../utilities/responseHandler";

const errorHandler: ErrorRequestHandler = (err, req, res, next) => {
  let status: number = err.statusCode || 500;
  let message: string = err.message;

  if (err.name === "ValidationError" && err.errors) {
    status = 400;
    message = Object.values(err.errors)
      .map((e) => (e as { message: string }).message)
      .join(", ");
  } else if (err.code === 11000) {
    status = 409;
    message = "Record already exists";
  } else if (err.name === "MulterError") {
    status = 400;
    message =
      err.code === "LIMIT_FILE_SIZE"
        ? "Image must be 2MB or smaller"
        : "Invalid file upload. Use field name 'image'";
  }

  if (status === 500) {
    console.error(err);
    message = "Internal Server Error";
  }

  errorResponse({ res, message, status });
};

export default errorHandler;