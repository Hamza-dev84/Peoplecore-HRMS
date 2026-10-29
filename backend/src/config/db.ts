import mongoose from "mongoose";

const connectToDB = async (): Promise<void> => {
  try {
    const mongoURI = process.env.MONGO_URI;

    if (!mongoURI) {
      throw new Error("MONGO_URI is missing in environment variables");
    }

    await mongoose.connect(mongoURI);

    console.log("MongoDB connected");
  } catch (error) {
    console.error(error);
    throw error;
  }
};

export default connectToDB;