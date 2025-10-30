import { createParamDecorator, ExecutionContext } from '@nestjs/common';

/**
 * Get the current authenticated user from the request
 *
 * @example
 * create(@CurrentUser() user: any) {
 * }
 */
export const CurrentUser = createParamDecorator(
  (data: string | undefined, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    const user = request.user;

    return data ? user?.[data] : user;
  },
);
