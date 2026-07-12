const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const path = require('path');
const swaggerUi = require('swagger-ui-express');

const env = require('./src/config/environment');
const requestLogger = require('./src/middlewares/requestLogger');
const apiLimiter = require('./src/middlewares/rateLimiter');
const errorHandler = require('./src/middlewares/errorHandler');
const { NotFoundError } = require('./src/utils/errors');
const routes = require('./src/routes');

// Initialize event handlers
require('./src/events/handlers');

const app = express();

// Security HTTP headers
app.use(helmet());

// Enable CORS
app.use(
  cors({
    origin: env.FRONTEND_URL,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

// Body parser, reading data from body into req.body
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));

// Custom request logger
app.use(requestLogger);

// Limit requests from same API
app.use('/api', apiLimiter);

// Serving static files (for local uploads)
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Swagger Documentation API Configuration
const swaggerDocument = require('./src/swagger/swagger.json');
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

// Mount REST routes
app.use('/api/v1', routes);

// Handle undefined routes
app.all('*', (req, res, next) => {
  next(new NotFoundError(`Can't find ${req.originalUrl} on this server`));
});

// Global Error Handler
app.use(errorHandler);

module.exports = app;
