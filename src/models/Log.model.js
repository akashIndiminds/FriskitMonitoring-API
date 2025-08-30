export default class Log {
  constructor({ id, message, type = "INFO", filePath, createdAt = new Date() }) {
    this.id = id;
    this.message = message;
    this.type = type;       // INFO, WARN, ERROR
    this.filePath = filePath;
    this.createdAt = createdAt;
  }
}
