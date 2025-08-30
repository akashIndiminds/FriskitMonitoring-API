export default class AppError {
  constructor({ code, message, stack, createdAt = new Date() }) {
    this.code = code;
    this.message = message;
    this.stack = stack;
    this.createdAt = createdAt;
  }
}
