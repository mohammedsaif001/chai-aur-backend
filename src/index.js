import mongoose from 'mongoose';
import { DB_NAME } from './constants';

import express from 'express';
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
