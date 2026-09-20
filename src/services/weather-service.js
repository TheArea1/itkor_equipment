import { config } from '../config/index.js';
import { AppError } from '../errors/index.js';

export async function getWeatherForLocation({ lat, lon }) {
  const url = new URL(config.weatherApiUrl);
  url.searchParams.set('latitude', lat);
  url.searchParams.set('longitude', lon);
  url.searchParams.set('hourly', 'precipitation,wind_speed_10m');
  url.searchParams.set('forecast_days', '1');
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), config.requestTimeoutMs);
  try {
    const response = await fetch(url, { signal: controller.signal });
    if (!response.ok) throw new Error(`Статус ${response.status}`);
    const data = await response.json();
    if (!data.hourly?.time) throw new Error('Ответ не содержит почасовой прогноз');
    const windows = data.hourly.time.map((time, i) => ({ time, precipitation: data.hourly.precipitation[i], windSpeed: data.hourly.wind_speed_10m[i], suitable: data.hourly.precipitation[i] === 0 && data.hourly.wind_speed_10m[i] < config.outdoorMaxWindSpeed }));
    return { location: { lat, lon }, rule: { precipitation: 0, maxWindSpeed: config.outdoorMaxWindSpeed }, windows };
  } catch (cause) {
    throw new AppError('Погодный сервис временно недоступен', { status: 503, code: 'WEATHER_UNAVAILABLE' });
  } finally { clearTimeout(timeout); }
}
