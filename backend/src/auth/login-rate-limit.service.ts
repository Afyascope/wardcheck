import { Injectable, HttpException, HttpStatus } from '@nestjs/common';

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

@Injectable()
export class LoginRateLimitService {
  private readonly attempts = new Map<string, RateLimitEntry>();
  private readonly maxAttempts = 10;
  private readonly windowMs = 15 * 60 * 1000; // 15 minutes

  constructor() {
    // Periodic cleanup of expired entries
    setInterval(() => this.cleanup(), 60_000);
  }

  checkLimit(key: string): void {
    const now = Date.now();
    const entry = this.attempts.get(key);

    if (!entry || now > entry.resetAt) {
      this.attempts.set(key, { count: 1, resetAt: now + this.windowMs });
      return;
    }

    entry.count += 1;

    if (entry.count > this.maxAttempts) {
      const retryAfter = Math.ceil((entry.resetAt - now) / 1000);
      throw new HttpException(
        `Too many login attempts. Try again in ${retryAfter} seconds.`,
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }
  }

  reset(key: string): void {
    this.attempts.delete(key);
  }

  private cleanup(): void {
    const now = Date.now();
    for (const [key, entry] of this.attempts) {
      if (now > entry.resetAt) {
        this.attempts.delete(key);
      }
    }
  }
}
