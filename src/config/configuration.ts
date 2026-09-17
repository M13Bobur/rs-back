export default () => ({
  nodeEnv: process.env.NODE_ENV ?? 'development',
  port: parseInt(process.env.PORT ?? '4000', 10),
  mongodb: {
    uri: process.env.MONGODB_URI ?? 'mongodb://127.0.0.1:27017/recovery-service',
  },
  cors: {
    origin: process.env.FRONTEND_URL ?? 'http://localhost:3000',
  },
  jwt: {
    secret: process.env.JWT_SECRET ?? 'development-jwt-secret-change-me',
    expiresIn: process.env.JWT_EXPIRES_IN ?? '7d',
  },
  app: {
    name: 'Telefon ta\'mirlash xizmati API',
  },
  shop: {
    name: process.env.SHOP_NAME ?? "Telefon ta'mirlash markazi",
    phone: process.env.SHOP_PHONE ?? '+998 90 123 45 67',
    address: process.env.SHOP_ADDRESS ?? "Toshkent sh., Namuna ko'cha 1",
  },
  telegram: {
    enabled: process.env.TELEGRAM_ENABLED === 'true',
    botToken: process.env.TELEGRAM_BOT_TOKEN ?? '',
  },
  alerts: {
    overdueRepairDays: parseInt(process.env.ALERT_OVERDUE_REPAIR_DAYS ?? '7', 10),
    largeDebtThreshold: parseInt(
      process.env.ALERT_LARGE_DEBT_THRESHOLD ?? '5000000',
      10,
    ),
    scanIntervalMs: parseInt(
      process.env.ALERT_SCAN_INTERVAL_MS ?? String(30 * 60 * 1000),
      10,
    ),
  },
});
