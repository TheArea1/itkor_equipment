import { randomUUID } from 'node:crypto';
import { config } from '../config/index.js';
import { AppError } from '../errors/index.js';

export const asyncHandler = (handler) => (req, res, next) => Promise.resolve(handler(req, res, next)).catch(next);
export const validate = (validator) => (req, _res, next) => { try { validator(req); next(); } catch (error) { next(error); } };
export function requestId(req, res, next) { req.requestId = randomUUID(); res.setHeader('X-Request-Id', req.requestId); next(); }
export function logger(req, res, next) { const started = performance.now(); res.on('finish', () => console.info(JSON.stringify({ level: 'info', requestId: req.requestId, method: req.method, path: req.originalUrl, status: res.statusCode, durationMs: Math.round(performance.now() - started) }))); next(); }
export function cors(req, res, next) {
  const origin = req.headers.origin;
  if (origin && config.corsOrigins.includes(origin)) res.setHeader('Access-Control-Allow-Origin', origin);
  res.setHeader('Vary', 'Origin'); res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PATCH,DELETE,OPTIONS'); res.setHeader('Access-Control-Allow-Headers', 'Content-Type,X-Request-Id');
  if (req.method === 'OPTIONS') return res.status(204).end(); next();
}
export function securityHeaders(_req, res, next) { res.setHeader('X-Content-Type-Options', 'nosniff'); res.setHeader('X-Frame-Options', 'DENY'); res.setHeader('Referrer-Policy', 'no-referrer'); res.setHeader('Content-Security-Policy', "default-src 'none'"); next(); }
export function createRateLimit() { const clients = new Map(); return (req, res, next) => { const now = Date.now(); const key = req.ip; const current = clients.get(key); const state = !current || current.resetAt <= now ? { count: 0, resetAt: now + config.rateLimitWindowMs } : current; state.count += 1; clients.set(key, state); res.setHeader('RateLimit-Limit', config.rateLimitMax); res.setHeader('RateLimit-Remaining', Math.max(0, config.rateLimitMax - state.count)); res.setHeader('RateLimit-Reset', Math.ceil(state.resetAt / 1000)); if (state.count > config.rateLimitMax) return next(new AppError('Превышен лимит запросов', { status: 429, code: 'RATE_LIMITED' })); next(); }; }
export function notFound(req, _res, next) { next(new AppError(`Маршрут ${req.method} ${req.originalUrl} не найден`, { status: 404, code: 'NOT_FOUND' })); }
export function errorHandler(error, req, res, _next) { const requestId = req.requestId ?? randomUUID(); const known = error instanceof AppError; const badJson = error instanceof SyntaxError && error.status === 400; const status = badJson ? 400 : (error.status ?? 500); const code = badJson ? 'BAD_JSON' : (error.code ?? 'INTERNAL_ERROR'); console.error(JSON.stringify({ level: 'error', requestId, status, code, message: error.message })); const message = known || badJson || config.nodeEnv !== 'production' ? (badJson ? 'Некорректный JSON' : error.message) : 'Внутренняя ошибка сервера'; res.setHeader('X-Request-Id', requestId).status(status).json({ error: { code, message, ...(error.details ? { details: error.details } : {}), requestId } }); }
