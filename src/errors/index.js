export class AppError extends Error {
  constructor(message, { status = 500, code = 'INTERNAL_ERROR', details } = {}) {
    super(message);
    this.status = status;
    this.code = code;
    this.details = details;
  }
}
export class ValidationError extends AppError {
  constructor(details) { super('Некорректные данные запроса', { status: 422, code: 'VALIDATION_ERROR', details }); }
}
export class NotFoundError extends AppError {
  constructor(resource = 'Ресурс') { super(`${resource} не найден`, { status: 404, code: 'NOT_FOUND' }); }
}
export class ConflictError extends AppError {
  constructor(message) { super(message, { status: 409, code: 'CONFLICT' }); }
}
