import { Router } from 'express';
import {
  changeCurrentPassword,
  getCurrentUser,
  getUserChannelProfile,
  getWatchHistory,
  loginUser,
  logoutUser,
  refreshAccessToken,
  registerUser,
  updateAccount,
  updateUserAvatar,
  updateUserCoverImage,
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
userRouter.route('/refresh-token').post(verifyJWT, refreshAccessToken);
userRouter.route('/change-password').post(verifyJWT, changeCurrentPassword);
userRouter.route('/current-user').get(verifyJWT, getCurrentUser);
userRouter.route('/update-account').patch(verifyJWT, updateAccount);
// file uploads
userRouter
  .route('/avatar')
  .patch(verifyJWT, upload.single('avatar'), updateUserAvatar);
userRouter
  .route('/coverImage')
  .patch(verifyJWT, upload.single('coverImage'), updateUserCoverImage);
userRouter.route('/channel/:username').get(verifyJWT, getUserChannelProfile);
userRouter.route('/history').get(verifyJWT, getWatchHistory);

export default userRouter;
