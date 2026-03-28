import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable, of } from 'rxjs';
import { tap } from 'rxjs/operators';
import Redis from 'ioredis';

const IDEMPOTENCY_TTL = 86400;
const MUTATING_METHODS = ['POST', 'PUT', 'PATCH'];

@Injectable()
export class IdempotencyInterceptor implements NestInterceptor {
  private redis: Redis;

  constructor() {
    const redisUrl = process.env.REDIS_PUBLIC_URL;

    if (!redisUrl) {
      throw new Error('REDIS_PUBLIC_URL not set');
    }

    this.redis = new Redis(redisUrl, {
      maxRetriesPerRequest: null,
    });
  }

  async intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Promise<Observable<any>> {
    const request = context.switchToHttp().getRequest();
    const response = context.switchToHttp().getResponse();

    if (!MUTATING_METHODS.includes(request.method)) return next.handle();

    const key = request.headers['idempotency-key'];
    if (!key) return next.handle();

    const redisKey = `idempotency:${key}`;
    const cached = await this.redis.get(redisKey);

    if (cached) {
      const { statusCode, body } = JSON.parse(cached);
      response.status(statusCode);
      return of(body);
    }

    return next.handle().pipe(
      tap(async (body) => {
        await this.redis.setex(
          redisKey,
          IDEMPOTENCY_TTL,
          JSON.stringify({ statusCode: response.statusCode, body }),
        );
      }),
    );
  }
}
