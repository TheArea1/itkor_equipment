import test from 'node:test';
import assert from 'node:assert/strict';
import { config } from '../src/config/index.js';
import { createRateLimit, requestId, securityHeaders } from '../src/middlewares/index.js';

const response = () => ({ headers: {}, setHeader(key, value) { this.headers[key] = value; } });

test('security middleware sets request id and protective headers', () => {
  const req = {};
  const res = response();
  requestId(req, res, () => {});
  securityHeaders(req, res, () => {});

  assert.match(req.requestId, /^[\da-f-]{36}$/i);
  assert.equal(res.headers['X-Content-Type-Options'], 'nosniff');
  assert.equal(res.headers['X-Frame-Options'], 'DENY');
});

test('rate limiter returns an application error after the configured limit', () => {
  const original = config.rateLimitMax;
  config.rateLimitMax = 1;
  const middleware = createRateLimit();
  const first = response();
  const second = response();
  middleware({ ip: '127.0.0.1' }, first, (error) => assert.equal(error, undefined));
  middleware({ ip: '127.0.0.1' }, second, (error) => assert.equal(error.status, 429));
  config.rateLimitMax = original;
});
