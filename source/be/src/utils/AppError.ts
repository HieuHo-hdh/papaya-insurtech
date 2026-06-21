export class AppError extends Error {
  constructor(
    public statusCode: number,
    message: string,
    public details?: Record<string, string[]>,
  ) {
    super(message)
    this.name = 'AppError'
  }
}
