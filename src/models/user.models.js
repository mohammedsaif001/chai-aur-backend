import mongoose, { Schema } from 'mongoose';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';

const userSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    fullName: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    avatar: {
      type: String, // cloudinary url
      required: true,
    },
    coverImage: {
      type: String, // cloudinary url
    },
    watchHistory: [
      {
        type: Schema.Types.ObjectId,
        ref: 'Video',
      },
    ],
    password: {
      type: String,
      required: [true, 'Password is required'],
    },
    refreshToken: {
      type: String,
    },
  },
  { timestamps: true }
);

// Writing function keyword instead of arrow function is because the pre hook requires the reference for this keyword

// 'pre' middleware is used when we want to do some computation just before saving in db (in this case)
userSchema.pre('save', async function (next) {
  if (this.isModified('password')) {
    // only do hashing if password is updated or else consider the scenario when im updating avatar and my password is getting updated again so thats why adding it in if condition
    this.password = await bcrypt.hash(this.password, 10); //10 is # of rounds to do hashing
  }
  next();
});

// Check if password is correct
userSchema.methods.isPasswordCorrect = async function (password) {
  // takes 2 params , the string to be compared and the hashed string if both are equal as in the string after hashing is same as stored hashed string then its same
  return await bcrypt.compare(password, this.password);
};

// Generating Access Token
userSchema.methods.generateAccessToken = async function () {
  return jwt.sign(
    {
      _id: this._id, // getting from mongodb
      email: this.email,
      username: this.username,
      fullName: this.fullName,
    },
    process.env.ACCESS_TOKEN_SECRET,
    {
      expiresIn: process.env.ACCESS_TOKEN_EXPIRY,
    }
  );
};

// Generating Refresh Token
userSchema.methods.generateAccessToken = async function () {
  return jwt.sign(
    {
      _id: this._id, // getting from mongodb
    },
    process.env.REFRESH_TOKEN_SECRET,
    {
      expiresIn: process.env.REFRESH_TOKEN_EXPIRY,
    }
  );
};

export const User = mongoose.model('User', userSchema);
