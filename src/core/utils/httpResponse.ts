export type SuccessResponse<T> = {
  success: true;
  message: string;
  data?: T;
};

export type ErrorResponse<T> = {
  success: false;
  message: string;
  details?: T;
};

export const toSuccess = <T>(message: string, data?: T): SuccessResponse<T> => ({
  success: true,
  message,
  data,
});

export const toError = <T>(message: string, details?: T): ErrorResponse<T> => ({
  success: false,
  message,
  details,
});