const connectDB = async (retries = 30) => {
  try {
    await mongoose.connect(config.mongoUri, {
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    });
  } catch (error) {
    console.error(`Error connecting to MongoDB: ${error.message}`);
    if (retries > 0) {
      console.log(`Retrying in 5 seconds... (${retries} attempts left)`);
      await connectDB(retries - 1);
    } else {
      console.error("Failed to connect to MongoDB after multiple attempts");
      process.exit(1);
    }
  }
};

connectDB(); 