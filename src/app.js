import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';

const app = express();

// To allow Cors origin
app.use(
  cors({
    origin: process.env.CORS_ORIGIN,
    credentials: true,
  })
);

// Configuration for json formatter for body fields
app.use(express.json({ limit: '16kb' }));

// Configuration for url params
app.use(
  express.urlencoded({
    extended: true,
    limit: '16kb',
  })
);

// Storing Static files under public folder
app.use(express.static('public'));

// For doing Crud using cookies in client server
app.use(cookieParser());

export { app };
