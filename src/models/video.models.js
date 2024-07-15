import { Schema, model } from 'mongoose';
import mongooseAggregatePaginate from 'mongoose-aggregate-paginate-v2';

const videoSchema = new Schema(
  {
    videoFile: {
      type: String, // cloudinary url
      required: [true, 'Video file is required'],
    },
    thumbnail: {
      type: String, // cloudinary url
      required: [true, 'Thumbnail is required'],
    },
    title: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      required: true,
    },
    duration: {
      type: Number, //Information taken from cloudinarys
      required: true,
    },
    views: {
      type: Number,
      default: 0,
    },
    isPublished: {
      type: Boolean,
      default: true,
    },
    owner: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  { timestamps: true }
);

// To add watchhistory in user model
videoSchema.plugin(mongooseAggregatePaginate);

export const Video = model('Video', videoSchema);
