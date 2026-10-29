import type { Response } from "express";

interface SuccessResponseParams {
  res: Response;
  data: unknown;
  message?: string;
  status?: number;
}

interface ErrorResponseParams {
  res: Response;
  message?: string;
  status?: number;
}

const successResponse = ({
  res,
  data,
  message = "Success",
  status = 201,
}: SuccessResponseParams) => {
  return res.status(status).json({
    success: true,
    message,
    data,
  });
};

const errorResponse = ({
  res,
  message = "Fail",
  status = 500,
}: ErrorResponseParams) => {
  return res.status(status).json({
    success: false,
    message,
  });
};

export { successResponse, errorResponse };
