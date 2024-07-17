import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiError } from '../utils/ApiError.js';
import { User } from '../models/user.models.js';
import { uploadOnCloudinary } from '../utils/cloudinary/cloudinary.js';
import { ApiResponse } from '../utils/ApiResponse.js';

const registerUser = asyncHandler(async (req, res) => {
  // 1. Get user detail from user
  // 2. Validate user data (check if not empty)
  // 3. check if user already exists: username, email
  // 4. check for images, check for avatar
  // 5. upload files to cloudinary(avatar) and get the url
  // 6. create user object - create entry in db
  // 7. check for user creation
  // 8. remove password and refresh token field from response
  // 9. return response

  // 1. Get user detail from user
  const { username, email, fullName, watchHistory, password, refreshToken } =
    req.body;

  // 2. Validate user data (check if not empty)
  if (
    [fullName, email, username, password].some((field) => field?.trim() === '')
  ) {
    throw new ApiError(400, 'All fields are required');
  }

  // 3. check if user already exists: username, email
  const existedUser = await User.findOne({
    $or: [{ username }, { email }],
  });

  if (existedUser)
    throw new ApiError(409, 'User with email or username already exists');

  // 4. check for images, check for avatar
  const avatarLocalPath = req?.files?.avatar?.[0]?.path;
  const coverImageLocalPath = req.files?.coverImage?.[0]?.path;
  if (!avatarLocalPath) throw new ApiError(400, 'Avatar File is Required');

  // 5. upload files to cloudinary(avatar) and get the url
  const avatar = await uploadOnCloudinary(avatarLocalPath);
  const coverImage = await uploadOnCloudinary(coverImageLocalPath);

  if (!avatar) throw new ApiError(400, 'Avatar File is Required');

  // 6. create user object - create entry in db
  const user = await User.create({
    fullName,
    avatar: avatar?.url,
    coverImage: coverImage?.url || '',
    email,
    password,
    username: username.toLowerCase(),
  });

  // 7. check for user creation
  const createdUserForResponse = await User.findById(user._id).select(
    '-password -refreshToken'
  );

  // 8. remove password and refresh token field from response
  // const createdUserForResponse = createdUser.select('-password -refreshToken');

  if (!createdUserForResponse)
    throw new ApiError(500, 'Something went wrong while registering User');

  // 9. return response
  return res
    .status(201)
    .json(
      new ApiResponse(
        201,
        createdUserForResponse,
        'User registered successfully'
      )
    );
});

export { registerUser };
