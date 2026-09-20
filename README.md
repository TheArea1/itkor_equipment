# ITKOR 2 - API заявок на обслуживание

REST API на Express для справочника оборудования производственной площадки и заявок на его техническое обслуживание. Данные хранятся в памяти процесса; работа с ними изолирована репозиториями, поэтому хранилище можно заменить без изменения контроллеров и сервисов.

## Запуск

Требуется Node.js 20+.

```bash
npm install
copy .env.example .env
npm start
```

Сервис будет доступен по `http://localhost:3000`. Проверка: `GET /api/health`.

| Переменная | Значение по умолчанию | Назначение |
| --- | --- | --- |
| `PORT` | `3000` | Порт HTTP-сервера |
| `NODE_ENV` | `development` | Режим окружения |
| `CORS_ORIGINS` | `http://localhost:3000` | Разрешённые источники через запятую |
| `RATE_LIMIT_WINDOW_MS` | `60000` | Окно лимита запросов |
| `RATE_LIMIT_MAX` | `100` | Запросов с одного IP в окне |
| `BODY_LIMIT` | `100kb` | Максимальный JSON body |
| `WEATHER_API_URL` | Open-Meteo | URL погодного API |
| `REQUEST_TIMEOUT_MS` | `5000` | Таймаут погодного API |
| `OUTDOOR_MAX_WIND_SPEED` | `12` | Максимальная скорость ветра, м/с |

## API

| Метод | Путь | Описание |
| --- | --- | --- |
| GET | `/api/health` | Доступность сервиса |
| GET, POST | `/api/equipment` | Список и создание оборудования |
| GET, PATCH, DELETE | `/api/equipment/:id` | Карточка, обновление и удаление |
| GET | `/api/equipment/:id/requests` | Заявки оборудования |
| GET | `/api/equipment/:id/weather` | Погодные окна для наружных работ |
| GET, POST | `/api/requests` | Список и создание заявок |
| GET, PATCH, DELETE | `/api/requests/:id` | Карточка, обновление и удаление |
| PATCH | `/api/requests/:id/status` | Изменение статуса |

Списки принимают `page`, `limit` (1-100), `sortBy`, `sortOrder=asc|desc`. Оборудование фильтруется по `type`, `status`, `fromDate`, `toDate`; заявки - по `status`, `priority`, `equipmentId`, `fromDate`, `toDate`. Формат списка: `{ "data": [], "meta": { "total": 0, "page": 1, "limit": 20 } }`.

## Модель и примеры

Оборудование содержит серверный UUID `id`, `name` (3-100), `type` (`turbine`, `inverter`, `sensor`, `substation`), уникальный `serialNumber`, `location: { lat, lon }`, `status` и не будущую дату `installedAt`.

Заявка содержит серверные `id`, `createdAt`, `updatedAt`, ссылку `equipmentId`, `title` (5-120), `description` (до 2000), `priority`, `status` и необязательный `plannedAt`. Неизвестные и служебные поля тела игнорируются.

```http
POST /api/equipment
Content-Type: application/json

{"name":"Turbine A-01","type":"turbine","serialNumber":"WT-001","location":{"lat":56.84,"lon":60.61},"status":"operational","installedAt":"2025-01-01"}
```

Ответ `201` возвращает `{ "data": { ... } }` и заголовок `Location`.

Статусы заявки: `new → in_progress → done`, `new → rejected`, `in_progress → rejected`. `done` и `rejected` терминальные; недопустимый переход возвращает `409`.

```http
PATCH /api/requests/:id/status
Content-Type: application/json

{"status":"in_progress"}
```

Погода запрашивается у Open-Meteo по координатам оборудования. Час пригоден, если осадки равны нулю и скорость ветра строго меньше `OUTDOOR_MAX_WIND_SPEED`. Недоступность внешнего API возвращает `503`, не останавливая сервер.

## Ошибки и безопасность

Все ошибки имеют общий формат:

```json
{"error":{"code":"VALIDATION_ERROR","message":"Некорректные данные запроса","details":[{"field":"priority","message":"Недопустимый приоритет"}],"requestId":"..."}}
```

Используются `404`, `409`, `422`, `429`, `503` и `500` по назначению. Каждый запрос получает `X-Request-Id`, а логи содержат метод, путь, статус, длительность и тот же идентификатор. CORS разрешает только источники из `CORS_ORIGINS`; API не использует cookies. Вручную настроены защитные заголовки, JSON ограничен `BODY_LIMIT`, а `/api` защищён лимитом частоты с заголовками `RateLimit-*`.

## Структура

`routes → controllers → services → repositories`; `app.js` собирает приложение, а `server.js` только запускает его. В `validators` находится переиспользуемый middleware валидации, в `middlewares` - CORS, лимит, идентификатор запроса, журналирование и единая обработка ошибок. Коллекция Postman: `docs/postman/ITKOR 2 Maintenance API.postman_collection.json`.
