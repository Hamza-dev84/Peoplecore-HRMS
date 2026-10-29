// function ApiError(statusCode: number, message: string) {
//   return {
//     statusCode,
//     message,
//   };
// }

// export default ApiError;



class ApiError extends Error {
  statusCode: number;

  constructor(statusCode: number, message: string) {
    super(message);
    this.statusCode = statusCode;
  }
}

export default ApiError;