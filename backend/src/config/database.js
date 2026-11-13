import mongoose from "mongoose";

function databaseNameFromUri(uri) {
  return uri ? "epicdrive" : "";
}

async function connectDatabase() {
  const uri = process.env.MONGODB_URI?.trim();
  if (!uri) {
    throw new Error("MONGODB_URI is not configured.");
  }
  if (!/^mongodb(?:\+srv)?:\/\//i.test(uri)) {
    throw new Error("MONGODB_URI must use the mongodb or mongodb+srv protocol.");
  }
  let parsedUri;
  try {
    parsedUri = new URL(uri);
  } catch {
    throw new Error("MONGODB_URI must be a valid MongoDB connection string.");
  }
  if (!parsedUri.hostname) {
    throw new Error("MONGODB_URI must include a MongoDB host.");
  }

  await mongoose.connect(uri, {
    dbName: "epicdrive",
    connectTimeoutMS: 10_000,
    serverSelectionTimeoutMS: 15_000,
  });
  return mongoose.connection;
}

export { connectDatabase, databaseNameFromUri };
