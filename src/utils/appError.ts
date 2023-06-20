class AppError extends Error {
  statusCode: number;
  status: string;
  isOperational: boolean;
  
  constructor(message: string, statusCode: number) {
    super(message);

    this.statusCode = statusCode;
    this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
    this.isOperational = true;

    // We write this here since when we're debugging we will probably check the stackTrace when trying to solve a bug. So we don't pollute it and show this class in it we use this to ignore this step
    Error.captureStackTrace(this, this.constructor);
  }
}

export default AppError;