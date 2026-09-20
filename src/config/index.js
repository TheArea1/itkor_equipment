import process from 'node:process';

const number = (name, fallback) => {
  const value = Number(process.env[name]);
  return Number.isFinite(value) && value > 0 ? value : fallback;
};

export const config = {
  port: number('PORT', 3000),
  nodeEnv: process.env.NODE_ENV ?? 'development',
  corsOrigins: (process.env.CORS_ORIGINS ?? 'http://localhost:3000').split(',').map((x) => x.trim()).filter(Boolean),
  rateLimitWindowMs: number('RATE_LIMIT_WINDOW_MS', 60_000),
  rateLimitMax: number('RATE_LIMIT_MAX', 100),
  bodyLimit: process.env.BODY_LIMIT ?? '100kb',
  weatherApiUrl: process.env.WEATHER_API_URL ?? 'https://api.open-meteo.com/v1/forecast',
  requestTimeoutMs: number('REQUEST_TIMEOUT_MS', 5_000),
  outdoorMaxWindSpeed: number('OUTDOOR_MAX_WIND_SPEED', 12),
};
