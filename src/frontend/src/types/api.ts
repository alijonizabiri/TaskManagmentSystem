export type ApiErrorPayload = {
  message?: string
  statusCode?: number
}

export class ApiError extends Error {
  status: number

  constructor(message: string, status: number) {
    super(message)
    this.status = status
  }
}
