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

  await mongoose.connect(uri, {
    dbName: "epicdrive",
    serverSelectionTimeoutMS: 5000,
  });
  return mongoose.connection;
}

export { connectDatabase, databaseNameFromUri };
