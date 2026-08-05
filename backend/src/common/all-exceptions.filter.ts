import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { randomUUID } from 'crypto';

/**
 * Turns any unhandled error into a safe JSON response.
 *
 * Two things matter here: an unexpected error must never leak a stack trace or
 * SQL fragment to the client, and it must still be diagnosable — so each one
 * gets a reference id that appears both in the response and the server log.
 */
@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger('Exception');

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const isHttp = exception instanceof HttpException;
    const status = isHttp
      ? exception.getStatus()
      : HttpStatus.INTERNAL_SERVER_ERROR;

    if (isHttp) {
      // Deliberate, already-safe errors pass through unchanged.
      return response.status(status).json(exception.getResponse());
    }

    const reference = randomUUID().slice(0, 8);
    const err = exception as Error;

    this.logger.error(
      `[${reference}] ${request.method} ${request.url} — ${err?.message ?? 'Unknown error'}`,
      err?.stack,
    );

    return response.status(status).json({
      statusCode: status,
      error: 'Internal Server Error',
      message:
        'Something went wrong on our side. Quote the reference below if you contact support.',
      reference,
    });
  }
}
