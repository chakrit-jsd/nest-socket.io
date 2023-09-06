import * as mongoose from 'mongoose';

export const TextSchema = new mongoose.Schema(
  {
    room: {
      ref: 'Rooms',
      type: mongoose.Schema.Types.ObjectId,
      require: true,
    },

    text: {
      type: String,
      max: 200,
      require: true,
    },

    author: {
      type: String,
      require: true,
    },
  },
  { timestamps: true },
);

export interface Text extends mongoose.Document {
  readonly room: mongoose.Schema.Types.ObjectId;
  readonly text: string;
  readonly author: string;
}
