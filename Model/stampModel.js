import mongoose, { Schema } from "mongoose";

const StampSchema = new Schema(
  {
    name: {
      type: String,
      required: [true, "Stamp name is required"],
      trim: true,
    },
    description: {
      type: String,
      required: [true, "Stamp description is required"],
    },
    price: {
      type: Number,
      required: [true, "Stamp price is required"],
      min: [0, "Price must be a positive number"],
    },
    stock: {
      type: Number,
      required: [true, "Stock is required"],
      min: [0, "Stock cannot be negative"],
      default: 0,
    },
    images: {
      type: [
        {
          publicId: { type: String, required: [true, "publicId is required"] },
          publicUrl: { type: String, required: [true, "publicUrl is required"] },
        },
      ],
      default: [],
    },
    active: {
      type: Boolean,
      default: true,
    },
    beginDate: {
      type: Date,
      required: [true, "Begin date is required"],
    },
    endDate: {
      type: Date,
      default: new Date("9999-12-31T00:00:00.000Z"),
      immutable: true,
    },
  },
  { timestamps: true }
);

const stampModel = mongoose.model("Stamp", StampSchema);

export default stampModel;
