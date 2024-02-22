import mongoose, { Schema } from "mongoose";

export interface IAccount extends mongoose.Document {
  id: string;
  balance: number;
}

const AccountSchema = new Schema<IAccount>(
  {
    id: {
      type: String,
      required: true,
      unique: true,
    },
    balance: {
      type: Number,
      required: true,
    },
  },
  {
    versionKey: false,
    toObject: {
      transform: function (_doc, ret) {
        delete ret._id;
      },
    },
  }
);

export default mongoose.model<IAccount>("Account", AccountSchema);
