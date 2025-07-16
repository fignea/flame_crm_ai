// Configuración de variables de entorno para testing
process.env.NODE_ENV = 'test';
process.env.DATABASE_URL = process.env.DATABASE_URL || 'postgresql://flame_ai_user:flame_ai_pass@localhost:5432/flame_ai_test?schema=public';
process.env.JWT_SECRET = 'test-jwt-secret-key-for-testing-only';
process.env.JWT_REFRESH_SECRET = 'test-refresh-jwt-secret-key-for-testing-only';
process.env.JWT_EXPIRES_IN = '1h';
process.env.JWT_REFRESH_EXPIRES_IN = '7d';
process.env.LOG_LEVEL = 'error';
process.env.RATE_LIMIT_REQUESTS = '100';
process.env.RATE_LIMIT_WINDOW = '1';
process.env.LOGIN_ATTEMPTS_LIMIT = '5';
process.env.LOGIN_LOCKOUT_TIME = '15';
process.env.FRONTEND_URL = 'http://localhost:3000';
process.env.BACKEND_URL = 'http://localhost:8080';

// Silenciar logs durante las pruebas
process.env.LOG_LEVEL = 'silent'; 