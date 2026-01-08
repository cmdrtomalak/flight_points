import 'dotenv/config';

export const config = {
  // Server ports
  port: parseInt(process.env.PORT || '3000', 10),
  frontendPort: parseInt(process.env.FRONTEND_PORT || '8095', 10),
  
  // Cache duration in days (configurable)
  cacheDurationDays: parseInt(process.env.CACHE_DURATION_DAYS || '5', 10),
  
  // Database
  dbPath: process.env.DB_PATH || './data/flights.db',
  
  // Airline credentials (for airlines that require login)
  credentials: {
    aeroplan: {
      username: process.env.AEROPLAN_USERNAME,
      password: process.env.AEROPLAN_PASSWORD,
    },
    asiamiles: {
      username: process.env.ASIAMILES_USERNAME,
      password: process.env.ASIAMILES_PASSWORD,
    },
    krisflyer: {
      username: process.env.KRISFLYER_USERNAME,
      password: process.env.KRISFLYER_PASSWORD,
    },
  },
  
  // Supported airlines (code -> display name)
  airlines: {
    'ac': 'Aeroplan (Air Canada)',
    'as': 'Alaska Airlines',
    'ba': 'British Airways',
    'cx': 'AsiaMiles (Cathay Pacific)',
    'ke': 'Korean Air SKYPASS',
    'nh': 'ANA Mileage Club',
    'qf': 'Qantas Frequent Flyer',
    'sq': 'Singapore KrisFlyer',
  } as Record<string, string>,
};

export type AirlineCode = keyof typeof config.airlines;
