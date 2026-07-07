class ResponseError extends Error {
  constructor(statusCode,message) {
    super(message);
    this.statusCode = statusCode;
  }
}
export {
    ResponseError
}