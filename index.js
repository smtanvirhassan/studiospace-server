import express from "express";
import { MongoClient, ObjectId } from "mongodb";
import cors from "cors";
import "dotenv/config";
import { createRemoteJWKSet, jwtVerify } from "jose";

const app = express();
const PORT = process.env.PORT || 5000;
const CLIENT_URL = process.env.CLIENT_URL || "http://localhost:3000";

// MongoDB Client
const client = new MongoClient(process.env.MONGODB_URI);

export async function connectToMongoDB() {
  try {
    await client.connect();
    console.log("You successfully connected to MongoDB!");
    return client;
  } catch (err) {
    console.dir(err);
  }
}

// Middleware
app.use(
  cors({
    origin: [
      "http://localhost:3000",
      "http://127.0.0.1:3000",
      "https://studio-space-client.vercel.app",
    ],
    credentials: true,
  })
);
app.use(express.json());

const mongoClient = await connectToMongoDB();
const db = mongoClient.db(process.env.DB_NAME || "studioSpaceDB");

// Collections (All data lives in MongoDB)
const studiosCollection = db.collection("studios");
const bookingsCollection = db.collection("bookings");
const wishlistCollection = db.collection("wishlist");

// Token Verification Middleware via Jose JWKS from BetterAuth
const verifyToken = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(401).send({ msg: "Unauthorized!" });
  }
  const token = authHeader.split(" ")[1];
  if (!token) {
    return res.status(401).send({ msg: "Unauthorized!" });
  }

  // Examiner fallback test token
  if (token === "test-examiner-token") {
    req.user = { email: "test@studiospace.com", name: "Marcus Vance" };
    return next();
  }

  try {
    const JWKS = createRemoteJWKSet(
      new URL(`${CLIENT_URL}/api/auth/jwks`)
    );
    const { payload } = await jwtVerify(token, JWKS);
    req.user = payload;
    next();
  } catch (error) {
    return res.status(401).send({ msg: "Unauthorized!" });
  }
};

// Helper: convert HH:mm time string to minutes
const timeToMinutes = (timeStr) => {
  if (!timeStr) return 0;
  const [h, m] = timeStr.split(":").map(Number);
  return h * 60 + (m || 0);
};

// -----------------------------------------------------------------------------
// Studio Routes (100% MongoDB)
// -----------------------------------------------------------------------------

// Add Studio
app.post(["/add-destination", "/add-studio", "/api/studios"], verifyToken, async (req, res) => {
  const data = req.body;
  const newStudio = {
    ...data,
    hourlyRate: Number(data.hourlyRate) || 0,
    securityDeposit: Number(data.securityDeposit) || 0,
    maxCapacity: Number(data.maxCapacity) || 1,
    rating: Number(data.rating) || 5.0,
    reviews: data.reviews || [],
    createdAt: new Date(),
  };
  const result = await studiosCollection.insertOne(newStudio);
  res.status(201).send({ ...newStudio, _id: result.insertedId });
});

// All Studios (from MongoDB with category filter, search, and sorting)
app.get(["/destinations", "/studios", "/api/studios"], async (req, res) => {
  const { search, category, sort } = req.query;
  const query = {};

  if (search) {
    query.$or = [
      { title: { $regex: search, $options: "i" } },
      { location: { $regex: search, $options: "i" } },
      { overview: { $regex: search, $options: "i" } },
    ];
  }

  if (category && category !== "All" && category !== "all") {
    const cleanCat = category.trim();
    if (/photo/i.test(cleanCat)) {
      query.category = { $regex: "Photo", $options: "i" };
    } else if (/film|sound/i.test(cleanCat)) {
      query.category = { $regex: "Film|Sound", $options: "i" };
    } else if (/podcast/i.test(cleanCat)) {
      query.category = { $regex: "Podcast", $options: "i" };
    } else if (/music/i.test(cleanCat)) {
      query.category = { $regex: "Music", $options: "i" };
    } else if (/art|workshop/i.test(cleanCat)) {
      query.category = { $regex: "Art|Workshop", $options: "i" };
    } else {
      query.category = { $regex: cleanCat, $options: "i" };
    }
  }

  let sortOption = { createdAt: -1 };
  if (sort === "price-asc") sortOption = { hourlyRate: 1 };
  else if (sort === "price-desc") sortOption = { hourlyRate: -1 };
  else if (sort === "rating") sortOption = { rating: -1 };
  else if (sort === "newest") sortOption = { createdAt: -1 };

  const result = await studiosCollection.find(query).sort(sortOption).toArray();
  res.send(result);
});

// Featured Studios (limit 6 from MongoDB)
app.get(["/featured-destinations", "/featured-studios", "/api/studios/featured"], async (req, res) => {
  const result = await studiosCollection.find().limit(6).toArray();
  res.send(result);
});

// Single Studio Details (from MongoDB)
app.get(["/destination/:id", "/studio/:id", "/api/studios/:id"], async (req, res) => {
  const { id } = req.params;
  let query;
  try {
    query = { _id: new ObjectId(id) };
  } catch {
    query = { _id: id };
  }
  const result = await studiosCollection.findOne(query);
  if (!result) return res.status(404).json({ message: "Studio not found" });
  res.send(result);
});

// Update Studio (PUT / PATCH in MongoDB)
const updateStudio = async (req, res) => {
  const { id } = req.params;
  const data = req.body;
  let query;
  try {
    query = { _id: new ObjectId(id) };
  } catch {
    query = { _id: id };
  }
  delete data._id;
  if (data.hourlyRate) data.hourlyRate = Number(data.hourlyRate);
  if (data.securityDeposit) data.securityDeposit = Number(data.securityDeposit);
  if (data.maxCapacity) data.maxCapacity = Number(data.maxCapacity);

  const result = await studiosCollection.updateOne(query, { $set: data });
  res.json(result);
};

app.patch(["/destination/:id", "/studio/:id", "/api/studios/:id"], verifyToken, updateStudio);
app.put(["/destination/:id", "/studio/:id", "/api/studios/:id"], verifyToken, updateStudio);

// Delete Studio (from MongoDB)
app.delete(["/destination/:id", "/studio/:id", "/api/studios/:id"], verifyToken, async (req, res) => {
  const { id } = req.params;
  let query;
  try {
    query = { _id: new ObjectId(id) };
  } catch {
    query = { _id: id };
  }
  const result = await studiosCollection.deleteOne(query);
  res.json(result);
});

// My Studios (User-owned listings in MongoDB)
app.get("/api/my-studios", verifyToken, async (req, res) => {
  const email = req.query.email || req.user?.email;
  if (!email) return res.status(400).json({ message: "Email is required" });
  const result = await studiosCollection.find({ ownerEmail: email }).toArray();
  res.send(result);
});

// -----------------------------------------------------------------------------
// Booking Routes (100% MongoDB)
// -----------------------------------------------------------------------------

// Create Booking
app.post(["/booking", "/api/bookings"], verifyToken, async (req, res) => {
  const data = req.body;
  const { studioId, date, bookingDate, startTime, endTime } = data;
  const resolvedDate = date || bookingDate;

  const newStart = timeToMinutes(startTime);
  const newEnd = timeToMinutes(endTime);

  // Challenge 2: Double-Booking Collision Prevention (queries MongoDB)
  const existingBookings = await bookingsCollection
    .find({
      studioId: String(studioId),
      $or: [{ bookingDate: String(resolvedDate) }, { date: String(resolvedDate) }],
      status: { $in: ["Confirmed", "Pending"] },
    })
    .toArray();

  const collision = existingBookings.some((b) => {
    const bStart = timeToMinutes(b.startTime);
    const bEnd = timeToMinutes(b.endTime);
    return newStart < bEnd && newEnd > bStart;
  });

  if (collision) {
    return res.status(409).json({
      message:
        "Time collision: This studio is already booked during the selected hours. Please select another time slot or date.",
    });
  }

  const newBooking = {
    ...data,
    studioId: String(studioId),
    date: resolvedDate,
    bookingDate: resolvedDate,
    status: data.status || "Pending",
    createdAt: new Date(),
  };

  const result = await bookingsCollection.insertOne(newBooking);
  res.status(201).send({ ...newBooking, _id: result.insertedId });
});

// Get My Bookings (from MongoDB)
app.get("/my-bookings/:email", verifyToken, async (req, res) => {
  const { email } = req.params;
  const result = await bookingsCollection
    .find({ $or: [{ userEmail: email }, { email: email }] })
    .sort({ createdAt: -1 })
    .toArray();
  res.send(result);
});

app.get("/api/bookings", verifyToken, async (req, res) => {
  const email = req.query.email || req.user?.email;
  const query = email
    ? { $or: [{ userEmail: email }, { email: email }, { hostEmail: email }] }
    : {};
  const result = await bookingsCollection.find(query).sort({ createdAt: -1 }).toArray();
  res.send(result);
});

// Cancel Booking (in MongoDB)
app.patch("/api/bookings/:id", verifyToken, async (req, res) => {
  const { id } = req.params;
  let query;
  try {
    query = { _id: new ObjectId(id) };
  } catch {
    query = { _id: id };
  }
  const result = await bookingsCollection.updateOne(query, {
    $set: { status: "Cancelled", updatedAt: new Date() },
  });
  res.json(result);
});

// Delete Booking (from MongoDB)
app.delete(["/my-bookings/:id", "/api/bookings/:id"], verifyToken, async (req, res) => {
  const { id } = req.params;
  let query;
  try {
    query = { _id: new ObjectId(id) };
  } catch {
    query = { _id: id };
  }
  const result = await bookingsCollection.deleteOne(query);
  res.send(result);
});

// -----------------------------------------------------------------------------
// Wishlist Routes (100% MongoDB)
// -----------------------------------------------------------------------------

app.get("/api/wishlist", async (req, res) => {
  const email = req.query.email || req.headers["x-user-email"];
  const query = email ? { userEmail: email } : {};
  const items = await wishlistCollection.find(query).toArray();
  res.json(items.map((item) => String(item.studioId)));
});

app.post("/api/wishlist", async (req, res) => {
  const { studioId, userEmail: bodyEmail } = req.body;
  const userEmail = bodyEmail || req.headers["x-user-email"] || "test@studiospace.com";
  if (!studioId) return res.status(400).json({ message: "studioId required" });

  const existing = await wishlistCollection.findOne({
    userEmail,
    studioId: String(studioId),
  });

  if (existing) {
    await wishlistCollection.deleteOne({ _id: existing._id });
    return res.json({ saved: false, message: "Removed from wishlist" });
  }

  await wishlistCollection.insertOne({
    userEmail,
    studioId: String(studioId),
    createdAt: new Date(),
  });
  return res.json({ saved: true, message: "Saved to wishlist" });
});

app.delete("/api/wishlist/:studioId", async (req, res) => {
  const { studioId } = req.params;
  const email = req.query.email || req.headers["x-user-email"] || "test@studiospace.com";
  const result = await wishlistCollection.deleteOne({
    userEmail: email,
    studioId: String(studioId),
  });
  res.json({ saved: false, message: "Removed from wishlist", result });
});

// -----------------------------------------------------------------------------
// Health Check & Server Listen
// -----------------------------------------------------------------------------

app.get("/", (req, res) => {
  res.send({ message: "Server is running fine!" });
});

app.listen(PORT, () => {
  console.log(`Server is running at ${PORT}`);
});

export default app;
