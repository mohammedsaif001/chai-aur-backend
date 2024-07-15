import dotenv from 'dotenv';
import connectDB from './db/index.js';
import { app } from './app.js';
dotenv.config({
  path: './env',
});

connectDB()
  .then(() => {
    app.listen(process.env.PORT || 8000, () => {
      console.log('\n Server is running at port: ', process.env.PORT);
    });
  })
  .catch((err) => {
    console.log('MONGO db Connection failed !!!', err);
  });

/*
import express from 'express';
require('dotenv').config({ path: './env' });
import mongoose from 'mongoose';
import { DB_NAME } from './constants';
const app = express()(async () => {
  try {
    await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`);
    app.on('error', (err) => {
      console.log('ERROR: Cannot Cannot to database', err);
      throw err;
    });

    app.listen(process.env.PORT, () => {
      console.log('App is Listening on Port ', process.env.PORT);
    });
  } catch (error) {
    console.error('ERROR: ', error);
    throw err;
  }
})();
*/
