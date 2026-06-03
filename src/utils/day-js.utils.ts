import * as dayjs from 'dayjs';
import * as utc from 'dayjs/plugin/utc';
import * as timezone from 'dayjs/plugin/timezone';
import { ConfigService } from '@nestjs/config';

const configService: ConfigService = new ConfigService();

// 1. Activate the plugins
dayjs.extend(utc);
dayjs.extend(timezone);

// 2. Set the global default time zone to South Africa
dayjs.tz.setDefault(configService.get<string>('TZ') || 'Africa/Johannesburg');

// 3. Export this configured instance
export { dayjs };
