import { Router } from 'express';
import {
  loginUser,
  logoutUser,
  registerUser,
} from '../controllers/user.controller.js';
import { upload } from '../middlewares/multer.middleware.js';
import { verifyJWT } from '../middlewares/auth.middleware.js';

const userRouter = Router();

// Adding a multer middleware to upload the files and store it in local files
userRouter.route('/register').post(
  upload.fields([
    { name: 'avatar', maxCount: 1 },
    { name: 'coverImage', maxCount: 1 },
  ]),
  registerUser
);

userRouter.route('/login').post(loginUser);

// Secured routes
userRouter.route('/logout').post(verifyJWT, logoutUser);

export default userRouter;
