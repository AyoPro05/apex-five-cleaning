import mongoose from "mongoose";

let dbConnected = false;
let connectionPromise = null;

export const getDatabaseUri = () =>
  process.env.MONGODB_URI ||
  process.env.DATABASE_URL ||
  (process.env.NODE_ENV === "production"
    ? null
    : process.env.MONGODB_URI_DEV || null);

export const isMongoReady = () => mongoose.connection.readyState === 1 && dbConnected;

export const connectToDatabase = async () => {
  const uri = getDatabaseUri();
  if (!uri) {
    const message =
      process.env.VERCEL === "1"
        ? "FATAL: MONGODB_URI environment variable is not defined in Vercel runtime."
        : "FATAL: MONGODB_URI environment variable is missing!";
    console.error(message);
    throw new Error("Missing MongoDB URI");
  }

  if (isMongoReady()) {
    return;
  }

  if (connectionPromise) {
    return connectionPromise;
  }

  connectionPromise = mongoose
    .connect(uri)
    .then(() => {
      dbConnected = true;
      connectionPromise = null;
    })
    .catch((error) => {
      dbConnected = false;
      connectionPromise = null;
      console.error("MongoDB connection failed:", error.message || error);
      throw error;
    });

  return connectionPromise;
};

export const connectDbMiddleware = async (req, res, next) => {
  try {
    await connectToDatabase();
    return next();
  } catch (error) {
    console.error("MongoDB connection unavailable");
    return res.status(503).json({
      message: "Database connection failed",
    });
  }
};
