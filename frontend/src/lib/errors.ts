import axios from "axios";

export const getErrorMessage = (error: unknown): string => {
  if (axios.isAxiosError(error)) {
    const message = (error.response?.data as { message?: string } | undefined)?.message;
    if (message) return message;
    if (error.code === "ERR_NETWORK") {
      return "Cannot reach the server. Please check your connection.";
    }
    return error.message;
  }

  if (error instanceof Error) return error.message;

  return "Something went wrong";
};