import { isAxiosError } from 'axios'

export const getErrorMessage = (error: unknown, fallback = 'Ocurrió un error inesperado'): string => {
  if (typeof error === 'string') {
    return error
  }

  if (isAxiosError(error)) {
    const apiMessage = error.response?.data?.message
    if (typeof apiMessage === 'string' && apiMessage.trim().length > 0) {
      return apiMessage
    }
    if (typeof error.message === 'string' && error.message.trim().length > 0) {
      return error.message
    }
  }

  if (error instanceof Error && error.message) {
    return error.message
  }

  return fallback
}

export const logError = (context: string, error: unknown) => {
  if (import.meta.env.DEV) {
    // eslint-disable-next-line no-console
    console.error(`[${context}]`, error)
  }
}
