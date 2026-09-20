import { createApp } from './app.js';
import { config } from './config/index.js';
const app = createApp();
app.listen(config.port, () => console.info(JSON.stringify({ level: 'info', message: `API listening on ${config.port}` })));
