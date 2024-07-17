import jwt from 'jsonwebtoken';
import { ApiError } from '../utils/ApiError.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { User } from '../models/user.models.js';

export const verifyJWT = asyncHandler(async (req, res, next) => {
  try {
    // Either get the accesstoken form the cookies or take it from the authorization header and remove the word Bearer as we using jwt
    const token =
      req.cookies?.accessToken ||
      req.header('Authorization')?.replace('Bearer ', '');
    if (!token) {
      throw new ApiError(401, 'Unauthorized request');
    }

    // Decoding the accessToken and getting the userInfo
    const decodedTokenInfo = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);

    // using id getting user details form db
    const user = await User.findById(decodedTokenInfo?._id).select(
      '-password -refreshToken'
    );

    //   If user is not found then throw error
    if (!user) {
      throw new ApiError(401, 'Invalid AccessToken');
    }

    // Explicitly adding the user object in the request so that i can logout from here
    req.user = user;
    next();
  } catch (error) {
    throw new ApiError(401, error?.message || 'Invalid AccessToken');
  }
});
