import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiError } from '../utils/ApiError.js';
import { User } from '../models/user.models.js';
import { uploadOnCloudinary } from '../utils/cloudinary/cloudinary.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import jwt from 'jsonwebtoken';

const generateAccessAndRefreshTokens = async (userId) => {
  try {
    const user = await User.findById(userId);
    const accessToken = await user.generateAccessToken();
    const refreshToken = await user.generateRefreshToken();

    user.refreshToken = refreshToken;

    // No validations here and saving it to datatbase after adding refreshToken
    await user.save({ validateBeforeSave: false });
    return { accessToken, refreshToken };
  } catch (error) {
    throw new ApiError(
      500,
      'Something went wrong while generating refesh and access token'
    );
  }
};

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
    return res
      .status(409)
      .json(
        new ApiResponse(409, null, 'User with email or username already exists')
      );
  // throw new ApiError(409, 'User with email or username already exists');

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

const loginUser = asyncHandler(async (req, res) => {
  // 1. Take input from user
  // 2. check if username or email exists
  // 3. find the user
  // 4. check password
  // 5. generate access and refresh token
  // 6. send cookies (secured)
  // 7. send the response

  // 1. Take input from user
  const { username, email, password } = req.body;

  // 2. check if username or email exists
  if (!username && !email)
    throw new ApiError(400, 'Username or email is required');

  // 3. find the user
  const user = await User.findOne({ $or: [{ username }, { email }] });
  if (!user) throw new ApiError(404, 'User does not exist');

  // 4. check password
  // user.isPasswordCorrect(password) this isPasswordCorrect is coming from user model which we created earlier in this we have to pass only input password and then this method will check using this.password in db
  const isPasswordValid = await user.isPasswordCorrect(password);
  if (!isPasswordValid) throw new ApiError(401, 'Invalid user credentials');

  // 5. generate access and refresh token
  const { accessToken, refreshToken } = await generateAccessAndRefreshTokens(
    user._id
  );

  // Fetching userdetails again because refresh token is appended in above
  const loggedInUser = await User.findById(user._id).select(
    '-password -refreshToken'
  );
  // 6. send cookies (secured)
  const options = {
    httpOnly: true,
    secure: true,
  };

  // 7. send the response
  return res
    .status(200)
    .cookie('accessToken', accessToken, options)
    .cookie('refreshToken', refreshToken, options)
    .json(
      new ApiResponse(
        200,
        { user: loggedInUser, accessToken, refreshToken },
        'User logged in successfully'
      )
    );
});

const logoutUser = asyncHandler(async (req, res) => {
  // getting userid from user object via request object  which was attached from middleware in verifyJwt
  await User.findByIdAndUpdate(
    req.user._id,
    {
      $set: { refreshToken: undefined },
    },
    { new: true } //new:true is because it will return the updated query result
  );

  const options = {
    httpOnly: true,
    secure: true,
  };

  return res
    .status(200)
    .clearCookie('accessToken', options)
    .clearCookie('refreshToken', options)
    .json(new ApiResponse(200, {}, 'User logged out successfully'));
});

const refreshAccessToken = asyncHandler(async (req, res) => {
  // 1. Accept Refresh token from cookies or body
  // 2. Decode the refresh token with the secret key
  // 3. After decoding get the id and find it in db
  // 4. If id doesnt match throw error
  // 5. If refresh token does not match with stored token in db throw error
  // 6. Generate new access and refresh token
  // 7. Finaly send the response

  // 1. Accept Refresh token from cookies or body
  const incomingRefreshToken =
    req.cookies.refreshToken || req.body.refreshToken;
  if (!incomingRefreshToken) {
    throw new ApiError(401, 'Unauthorized request');
  }

  try {
    // 2. Decode the refresh token with the secret key
    const decodedToken = jwt.verify(
      incomingAccessToken,
      process.env.REFRESH_TOKEN_SECRET
    );

    // 3. After decoding get the id and find it in db
    const user = await User.findById(decodedToken?._id);

    // 4. If id doesnt match throw error
    if (!user) {
      throw new ApiError(401, 'Invalid refresh token');
    }

    // 5. If refresh token does not match with stored token in db throw error
    if (incomingRefreshToken !== user?.refreshToken) {
      throw new ApiError(401, 'Refresh token is expired or used');
    }

    const options = {
      httpOnly: true,
      secure: true,
    };

    // 6. Generate new access and refresh token
    const { accessToken, refreshToken } = await generateAccessAndRefreshTokens(
      user._id
    );

    // 7. Finaly send the response
    return res
      .status(200)
      .cookie('accessToken', accessToken, options)
      .cookie('refreshToken', refreshToken, options)
      .json(
        new ApiResponse(
          200,
          { accessToken, refreshToken },
          'New access token & refresh token generated successfully'
        )
      );
  } catch (error) {
    throw new ApiError(401, error?.message || 'Invalid refresh token');
  }
});

const changeCurrentPassword = asyncHandler(async (req, res) => {
  const { oldPassword, newPassword } = req.body;
  const user = await User.findById(req?.user?._id);
  const isPasswordCorrect = await user.isPasswordCorrect(oldPassword);

  if (!isPasswordCorrect) {
    throw new ApiError(400, 'Invalid Old Password');
  }

  user.password = newPassword;
  await user.save({ validateBeforeSave: false });

  return res
    .status(200)
    .json(new ApiResponse(200, {}, 'Password updated successfully'));
});

const getCurrentUser = asyncHandler(async (req, res) => {
  return res.status.json(200, req?.user, 'Current User Fetched Successfully');
});

const updateAccount = asyncHandler(async (req, res) => {
  const { fullName, email } = req?.body;

  if (!fullName || !email) {
    throw new ApiError(400, 'All fields are required');
  }

  const user = await User.findByIdAndUpdate(
    req?.user?._id,
    {
      $set: {
        fullName,
        email,
      },
    },
    {
      new: true,
    }
  ).select('-password');

  return res
    .status(200)
    .json(new ApiResponse(200, user, 'Account details updated successfully'));
});

export {
  registerUser,
  loginUser,
  logoutUser,
  refreshAccessToken,
  changeCurrentPassword,
  getCurrentUser,
  updateAccount,
};
