import * as mongoose from 'mongoose';

export const RoomSchema = new mongoose.Schema(
  {
    members: {
      type: [String],
      require: true,
    },
  },
  { timestamps: true },
);

export interface Room extends mongoose.Document {
  readonly members: string[];
}
