import { HttpException, HttpStatus } from '@nestjs/common';

export class AccountLockedException extends HttpException {
  constructor(lockedUntil: Date) {
    const remainingTime = Math.ceil((lockedUntil.getTime() - Date.now()) / 60000); // minutes
    super(
      {
        statusCode: HttpStatus.LOCKED,
        message: `Tu cuenta ha sido bloqueada temporalmente debido a múltiples intentos fallidos de inicio de sesión. Por favor, intenta nuevamente en ${remainingTime} minuto(s).`,
        error: 'Cuenta Bloqueada',
        lockedUntil: lockedUntil.toISOString(),
        retryAfter: Math.ceil((lockedUntil.getTime() - Date.now()) / 1000), // seconds
      },
      HttpStatus.LOCKED, // 423
    );
  }
}
