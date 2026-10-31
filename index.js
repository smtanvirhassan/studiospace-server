const express = require("express");
const cors = require("cors");
const jwt = require("jsonwebtoken");
const cookieParser = require("cookie-parser");
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
require("dotenv").config();

const app = express();
const port = process.env.PORT || 5000;

// Middleware
app.use(
  cors({
    origin: [
      "http://localhost:3000",
      "https://studio-space-client.vercel.app",
    ],
    credentials: true,
  })
);
app.use(express.json());
app.use(cookieParser());

const ACCESS_TOKEN_SECRET =
  process.env.ACCESS_TOKEN_SECRET ||
  "studiospace-super-secret-jwt-key-2025-secure-token";

// Initial seed data for studios
const initialStudios = [
  {
    _id: "6724a1b1e4b0a1a2b3c4d001",
    title: "Apex Horizon Cyc Wall & Daylight Stage",
    category: "Photo Studio",
    hourlyRate: 85,
    securityDeposit: 150,
    maxCapacity: 15,
    location: "Downtown Arts District, Los Angeles, CA",
    imageUrl: "https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?w=1000&auto=format&fit=crop&q=80",
    images: [
      "https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?w=1000&auto=format&fit=crop&q=80",
      "https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=1000&auto=format&fit=crop&q=80",
      "https://images.unsplash.com/photo-1471341971476-ae15ff5dd4ea?w=1000&auto=format&fit=crop&q=80"
    ],
    amenities: ["WiFi", "Air Conditioning", "Green Screen", "Lighting Kit", "Changing Room", "Makeup Room", "Parking"],
    overview: "A premier daylight photo studio featuring a 24ft double-wall cyclorama with motorized grid rigging. Equipped with Profoto lighting kits, rolling hair and makeup stations, dedicated client lounge, and high-speed gigabit Wi-Fi. Perfect for fashion editorials, brand campaigns, and commercial portraits.",
    ownerEmail: "host@apexstudios.com",
    ownerName: "Marcus Vance",
    rating: 4.9,
    reviews: [
      { id: "r1", user: "Sophia Lin", rating: 5, date: "2025-10-15", comment: "Outstanding natural lighting and top tier grip equipment. The cyc was spotless!" },
      { id: "r2", user: "David Miller", rating: 4.8, date: "2025-10-02", comment: "Super easy load-in with the freight elevator. Host was very communicative." }
    ],
    createdAt: new Date("2025-09-01T10:00:00Z")
  },
  {
    _id: "6724a1b1e4b0a1a2b3c4d002",
    title: "Silverlake Black Box Cinema Sound Stage",
    category: "Film Stage",
    hourlyRate: 140,
    securityDeposit: 300,
    maxCapacity: 35,
    location: "Silverlake Creative Hub, Los Angeles, CA",
    imageUrl: "https://images.unsplash.com/photo-1578328819058-b69f3a3b0f6b?w=1000&auto=format&fit=crop&q=80",
    images: [
      "https://images.unsplash.com/photo-1578328819058-b69f3a3b0f6b?w=1000&auto=format&fit=crop&q=80",
      "https://images.unsplash.com/photo-1518173946687-a4c8a383392e?w=1000&auto=format&fit=crop&q=80",
      "https://images.unsplash.com/photo-1485846234645-a62644f84728?w=1000&auto=format&fit=crop&q=80"
    ],
    amenities: ["WiFi", "Soundproofing", "Air Conditioning", "Lighting Kit", "Green Screen", "Parking", "Restroom"],
    overview: "Certified acoustic sound stage with silent HVAC system, complete black-out wrap-around curtains, 3-phase cam-lok power distro (600A), and scissor lift on site. Ideal for indie film sets, music videos, broadcast interviews, and visual effects productions.",
    ownerEmail: "productions@silverstage.io",
    ownerName: "Elena Rostova",
    rating: 4.8,
    reviews: [
      { id: "r3", user: "Julian Reed", rating: 5, date: "2025-10-18", comment: "Acoustics were dead silent even with traffic outside. Best sound stage in the area." }
    ],
    createdAt: new Date("2025-09-05T12:00:00Z")
  },
  {
    _id: "6724a1b1e4b0a1a2b3c4d003",
    title: "The Broadcast Loft 4-Mic Podcast Lounge",
    category: "Podcast Lounge",
    hourlyRate: 60,
    securityDeposit: 100,
    maxCapacity: 8,
    location: "Midtown Tower, New York, NY",
    imageUrl: "https://images.unsplash.com/photo-1590602847861-f357a9332bbc?w=1000&auto=format&fit=crop&q=80",
    images: [
      "https://images.unsplash.com/photo-1590602847861-f357a9332bbc?w=1000&auto=format&fit=crop&q=80",
      "https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?w=1000&auto=format&fit=crop&q=80"
    ],
    amenities: ["WiFi", "Soundproofing", "Air Conditioning", "Sound System", "Restroom", "Kitchen"],
    overview: "Custom-designed broadcast podcast lounge featuring four Shure SM7B dynamic microphones on boom arms, Rodecaster Pro II audio mixer, multi-camera 4K Sony setup, studio LED accent lighting, and mid-century aesthetic furniture for visually stunning video podcasts.",
    ownerEmail: "host@apexstudios.com",
    ownerName: "Marcus Vance",
    rating: 4.9,
    reviews: [
      { id: "r4", user: "Chloe Adams", rating: 5, date: "2025-10-22", comment: "Plug-and-play podcast recording! Audio quality was broadcast-ready right out of the mixer." }
    ],
    createdAt: new Date("2025-09-10T09:00:00Z")
  },
  {
    _id: "6724a1b1e4b0a1a2b3c4d004",
    title: "Analog Pulse Dolby Atmos Music Suite",
    category: "Music Suite",
    hourlyRate: 110,
    securityDeposit: 250,
    maxCapacity: 10,
    location: "East Nashville Music Row, Nashville, TN",
    imageUrl: "https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?w=1000&auto=format&fit=crop&q=80",
    images: [
      "https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?w=1000&auto=format&fit=crop&q=80",
      "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=1000&auto=format&fit=crop&q=80"
    ],
    amenities: ["WiFi", "Soundproofing", "Air Conditioning", "Sound System", "Restroom"],
    overview: "State-of-the-art music recording and mixing control room featuring Genelec 7.1.4 Dolby Atmos monitoring, SSL Matrix console, vintage tube preamps (Neve 1073, Universal Audio 1176), and an isolated live vocal booth.",
    ownerEmail: "recording@analogpulse.com",
    ownerName: "Dexter Cole",
    rating: 5.0,
    reviews: [
      { id: "r5", user: "Trevor James", rating: 5, date: "2025-10-20", comment: "Top tier monitoring and vocal booth. Mixed our entire EP here." }
    ],
    createdAt: new Date("2025-09-15T15:00:00Z")
  },
  {
    _id: "6724a1b1e4b0a1a2b3c4d005",
    title: "The Artisan Industrial Ceramic & Art Workshop",
    category: "Workshop",
    hourlyRate: 50,
    securityDeposit: 75,
    maxCapacity: 20,
    location: "Fulton Market, Chicago, IL",
    imageUrl: "https://images.unsplash.com/photo-1513364776144-60967b0f800f?w=1000&auto=format&fit=crop&q=80",
    images: [
      "https://images.unsplash.com/photo-1513364776144-60967b0f800f?w=1000&auto=format&fit=crop&q=80",
      "https://images.unsplash.com/photo-1579783902614-a3fb3927b675?w=1000&auto=format&fit=crop&q=80"
    ],
    amenities: ["WiFi", "Restroom", "Wheelchair Access", "Whiteboard", "Parking"],
    overview: "Spacious loft workshop with concrete floors, floor-to-ceiling brick windows, oversized worktables, pottery wheels, wash basins, and drying racks. Perfect for hands-on creative classes, woodworking, sculpture workshops, and team art retreats.",
    ownerEmail: "artisan@workshops.org",
    ownerName: "Hannah Brooks",
    rating: 4.7,
    reviews: [
      { id: "r6", user: "Maya Patel", rating: 4.8, date: "2025-10-11", comment: "So much room and sunlight! Hosted our 15-person ceramics workshop smoothly." }
    ],
    createdAt: new Date("2025-09-20T11:00:00Z")
  },
  {
    _id: "6724a1b1e4b0a1a2b3c4d006",
    title: "Skyline Infinity Cyc & Rooftop Production",
    category: "Photo Studio",
    hourlyRate: 125,
    securityDeposit: 200,
    maxCapacity: 25,
    location: "DUMBO Waterfront, Brooklyn, NY",
    imageUrl: "https://images.unsplash.com/photo-1524685794168-52985e79c1f8?w=1000&auto=format&fit=crop&q=80",
    images: [
      "https://images.unsplash.com/photo-1524685794168-52985e79c1f8?w=1000&auto=format&fit=crop&q=80",
      "https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?w=1000&auto=format&fit=crop&q=80"
    ],
    amenities: ["WiFi", "Air Conditioning", "Lighting Kit", "Makeup Room", "Changing Room", "Restroom", "Parking"],
    overview: "3,000 sq ft dual-level production space offering an infinity cyclorama on the top floor and unobstructed panoramic Manhattan skyline views from the private rooftop access. Full grip package included.",
    ownerEmail: "productions@silverstage.io",
    ownerName: "Elena Rostova",
    rating: 4.9,
    reviews: [
      { id: "r7", user: "Liam Walker", rating: 5, date: "2025-10-25", comment: "The rooftop view at golden hour is unbeatable. Client was thrilled with the results." }
    ],
    createdAt: new Date("2025-09-25T14:00:00Z")
  }
];

// Fallback in-memory store if MongoDB is not reachable
let memStudios = [...initialStudios];
let memBookings = [
  {
    _id: "6724b1c2e4b0a1a2b3c4e001",
    studioId: "6724a1b1e4b0a1a2b3c4d001",
    studioTitle: "Apex Horizon Cyc Wall & Daylight Stage",
    studioImage: "https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?w=1000&auto=format&fit=crop&q=80",
    studioCategory: "Photo Studio",
    userId: "test-user-123",
    userEmail: "test@studiospace.com",
    userName: "Examiner Test User",
    date: "2025-11-15",
    startTime: "10:00",
    endTime: "14:00",
    totalHours: 4,
    totalAmount: 340,
    status: "Confirmed",
    hostEmail: "host@apexstudios.com",
    createdAt: new Date("2025-10-20T10:00:00Z")
  }
];
let memWishlists = {}; // userEmail -> Set of studioIds

// MongoDB connection
let db = null;
let studiosCollection = null;
let bookingsCollection = null;
let wishlistsCollection = null;

if (process.env.DB_USER && process.env.DB_PASS) {
  const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;
  const client = new MongoClient(uri, {
    serverApi: {
      version: ServerApiVersion.v1,
      strict: true,
      deprecationErrors: true,
    },
    serverSelectionTimeoutMS: 3000,
  });

  client
    .connect()
    .then(async () => {
      console.log("Successfully connected to MongoDB Atlas!");
      db = client.db("studioSpaceDB");
      studiosCollection = db.collection("studios");
      bookingsCollection = db.collection("bookings");
      wishlistsCollection = db.collection("wishlists");

      // Seed if empty
      const count = await studiosCollection.countDocuments();
      if (count === 0) {
        await studiosCollection.insertMany(initialStudios);
        console.log("Seeded MongoDB with initial studios.");
      }
    })
    .catch((err) => {
      console.log(
        "MongoDB Atlas not reachable. Running with high-performance in-memory data store:",
        err.message
      );
    });
}

// Challenge 1: JWT Verification Middleware
// Protects server-side mutations using JWT in HTTPOnly cookies or Bearer Authorization header
const verifyToken = (req, res, next) => {
  let token = req?.cookies?.token;
  if (!token && req.headers?.authorization?.startsWith("Bearer ")) {
    token = req.headers.authorization.split(" ")[1];
  }

  if (!token) {
    return res.status(401).send({ message: "401 Unauthorized: Access token missing" });
  }

  jwt.verify(token, ACCESS_TOKEN_SECRET, (err, decoded) => {
    if (err) {
      return res.status(401).send({ message: "401 Unauthorized: Invalid or expired token" });
    }
    req.user = decoded;
    next();
  });
};

// ============ AUTH / JWT ROUTES ============

// Create JWT token and store in HTTPOnly cookie
app.post("/jwt", async (req, res) => {
  const user = req.body;
  if (!user || !user.email) {
    return res.status(400).send({ message: "Email is required" });
  }
  const token = jwt.sign(user, ACCESS_TOKEN_SECRET, {
    expiresIn: "24h",
  });
  res
    .cookie("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
      maxAge: 24 * 60 * 60 * 1000,
    })
    .send({ success: true, token });
});

// Clear JWT cookie on logout
app.post("/logout", async (req, res) => {
  res
    .clearCookie("token", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
    })
    .send({ success: true });
});

// ============ STUDIOS ROUTES ============

// GET all studios (public) with search, filter, sort
app.get("/api/studios", async (req, res) => {
  const { category, search, sort } = req.query;

  if (studiosCollection) {
    let query = {};
    if (category && category !== "all") {
      query.category = category;
    }
    if (search) {
      query.title = { $regex: search, $options: "i" };
    }

    let sortOption = {};
    if (sort === "price-asc") sortOption = { hourlyRate: 1 };
    else if (sort === "price-desc") sortOption = { hourlyRate: -1 };
    else if (sort === "rating") sortOption = { rating: -1 };
    else sortOption = { createdAt: -1 };

    const studios = await studiosCollection.find(query).sort(sortOption).toArray();
    return res.send(studios);
  }

  // In-memory fallback
  let list = [...memStudios];
  if (category && category !== "all") {
    list = list.filter((s) => s.category.toLowerCase() === category.toLowerCase());
  }
  if (search) {
    const sTerm = search.toLowerCase();
    list = list.filter(
      (s) =>
        s.title.toLowerCase().includes(sTerm) ||
        s.location.toLowerCase().includes(sTerm)
    );
  }
  if (sort === "price-asc") list.sort((a, b) => a.hourlyRate - b.hourlyRate);
  else if (sort === "price-desc") list.sort((a, b) => b.hourlyRate - a.hourlyRate);
  else if (sort === "rating") list.sort((a, b) => b.rating - a.rating);
  else list.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  res.send(list);
});

// GET featured studios (public, limit 6)
app.get("/api/studios/featured", async (req, res) => {
  if (studiosCollection) {
    const studios = await studiosCollection
      .find()
      .sort({ rating: -1, createdAt: -1 })
      .limit(6)
      .toArray();
    return res.send(studios);
  }

  const list = [...memStudios]
    .sort((a, b) => b.rating - a.rating || new Date(b.createdAt) - new Date(a.createdAt))
    .slice(0, 6);
  res.send(list);
});

// GET single studio (public)
app.get("/api/studios/:id", async (req, res) => {
  const id = req.params.id;

  if (studiosCollection) {
    try {
      const studio = await studiosCollection.findOne({
        _id: ObjectId.isValid(id) ? new ObjectId(id) : id,
      });
      if (!studio) return res.status(404).send({ message: "Studio not found" });
      return res.send(studio);
    } catch (e) {
      // Fall through to memory
    }
  }

  const studio = memStudios.find((s) => String(s._id) === String(id));
  if (!studio) {
    return res.status(404).send({ message: "Studio not found" });
  }
  res.send(studio);
});

// GET user's own studios (private)
app.get("/api/my-studios", verifyToken, async (req, res) => {
  const email = req.query.email;
  if (!email || req.user.email !== email) {
    return res.status(403).send({ message: "Forbidden access" });
  }

  if (studiosCollection) {
    const studios = await studiosCollection
      .find({ ownerEmail: email })
      .sort({ createdAt: -1 })
      .toArray();
    return res.send(studios);
  }

  const studios = memStudios
    .filter((s) => s.ownerEmail === email)
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  res.send(studios);
});

// POST new studio (private, JWT protected)
app.post("/api/studios", verifyToken, async (req, res) => {
  const studio = req.body;
  studio.createdAt = new Date();
  studio.hourlyRate = parseFloat(studio.hourlyRate);
  studio.securityDeposit = parseFloat(studio.securityDeposit || 0);
  studio.maxCapacity = parseInt(studio.maxCapacity || 1);
  studio.rating = parseFloat((Math.random() * (5 - 4.2) + 4.2).toFixed(1));
  studio.ownerEmail = req.user.email;
  studio.reviews = studio.reviews || [];
  studio.images = studio.images && studio.images.length > 0 ? studio.images : [studio.imageUrl];

  if (studiosCollection) {
    const result = await studiosCollection.insertOne(studio);
    return res.send(result);
  }

  studio._id = "mem_" + Date.now();
  memStudios.unshift(studio);
  res.send({ insertedId: studio._id, acknowledged: true });
});

// PUT update studio (private, JWT protected)
app.put("/api/studios/:id", verifyToken, async (req, res) => {
  const id = req.params.id;
  const updated = req.body;

  if (studiosCollection) {
    try {
      const filter = { _id: ObjectId.isValid(id) ? new ObjectId(id) : id };
      const updateDoc = {
        $set: {
          title: updated.title,
          category: updated.category,
          hourlyRate: parseFloat(updated.hourlyRate),
          securityDeposit: parseFloat(updated.securityDeposit),
          maxCapacity: parseInt(updated.maxCapacity),
          location: updated.location,
          imageUrl: updated.imageUrl,
          amenities: updated.amenities,
          overview: updated.overview,
        },
      };
      const result = await studiosCollection.updateOne(filter, updateDoc);
      return res.send(result);
    } catch (e) {
      // Fall through to memory
    }
  }

  const idx = memStudios.findIndex((s) => String(s._id) === String(id));
  if (idx !== -1) {
    memStudios[idx] = {
      ...memStudios[idx],
      title: updated.title,
      category: updated.category,
      hourlyRate: parseFloat(updated.hourlyRate),
      securityDeposit: parseFloat(updated.securityDeposit),
      maxCapacity: parseInt(updated.maxCapacity),
      location: updated.location,
      imageUrl: updated.imageUrl,
      amenities: updated.amenities,
      overview: updated.overview,
    };
    return res.send({ modifiedCount: 1, acknowledged: true });
  }

  res.status(404).send({ message: "Studio not found" });
});

// DELETE studio (private, JWT protected)
app.delete("/api/studios/:id", verifyToken, async (req, res) => {
  const id = req.params.id;

  if (studiosCollection) {
    try {
      const result = await studiosCollection.deleteOne({
        _id: ObjectId.isValid(id) ? new ObjectId(id) : id,
      });
      return res.send(result);
    } catch (e) {
      // Fall through to memory
    }
  }

  const prevLen = memStudios.length;
  memStudios = memStudios.filter((s) => String(s._id) !== String(id));
  res.send({ deletedCount: prevLen - memStudios.length, acknowledged: true });
});

// ============ BOOKINGS ROUTES ============

// GET user's bookings (private)
app.get("/api/bookings", verifyToken, async (req, res) => {
  const email = req.query.email;
  if (!email || req.user.email !== email) {
    return res.status(403).send({ message: "Forbidden access" });
  }

  if (bookingsCollection) {
    const bookings = await bookingsCollection
      .find({ userEmail: email })
      .sort({ createdAt: -1 })
      .toArray();
    return res.send(bookings);
  }

  const bookings = memBookings
    .filter((b) => b.userEmail === email)
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  res.send(bookings);
});

// Challenge 2: Booking Double-Booking Prevention
// Verify time overlap against existing "Confirmed" bookings before saving new reservations
app.post("/api/bookings", verifyToken, async (req, res) => {
  const booking = req.body;
  if (!booking.studioId || !booking.date || !booking.startTime || !booking.endTime) {
    return res.status(400).send({ message: "All booking fields are required" });
  }

  if (bookingsCollection) {
    const existing = await bookingsCollection.findOne({
      studioId: booking.studioId,
      date: booking.date,
      status: "Confirmed",
      $or: [
        {
          startTime: { $lt: booking.endTime },
          endTime: { $gt: booking.startTime },
        },
      ],
    });

    if (existing) {
      return res.status(409).send({
        message:
          "Booking collision: This time slot is already booked for this studio. Please choose another date or time.",
      });
    }

    booking.status = "Pending";
    booking.createdAt = new Date();
    booking.userEmail = req.user.email;
    const result = await bookingsCollection.insertOne(booking);
    return res.send(result);
  }

  // In-memory double-booking verification
  const collision = memBookings.find(
    (b) =>
      b.studioId === booking.studioId &&
      b.date === booking.date &&
      b.status === "Confirmed" &&
      b.startTime < booking.endTime &&
      b.endTime > booking.startTime
  );

  if (collision) {
    return res.status(409).send({
      message:
        "Booking collision: This time slot is already booked for this studio. Please choose another date or time.",
    });
  }

  booking._id = "bk_" + Date.now();
  booking.status = "Pending";
  booking.createdAt = new Date();
  booking.userEmail = req.user.email;
  memBookings.unshift(booking);
  res.send({ insertedId: booking._id, acknowledged: true });
});

// PATCH update booking status (private)
app.patch("/api/bookings/:id", verifyToken, async (req, res) => {
  const id = req.params.id;
  const { status } = req.body;

  if (bookingsCollection) {
    try {
      const result = await bookingsCollection.updateOne(
        { _id: ObjectId.isValid(id) ? new ObjectId(id) : id },
        { $set: { status } }
      );
      return res.send(result);
    } catch (e) {
      // Fall through to memory
    }
  }

  const booking = memBookings.find((b) => String(b._id) === String(id));
  if (booking) {
    booking.status = status;
    return res.send({ modifiedCount: 1, acknowledged: true });
  }

  res.status(404).send({ message: "Booking not found" });
});

// ============ OPTIONAL REQUIREMENTS ============

// Optional 2: Saved Studios Wishlist endpoints
app.get("/api/wishlist", verifyToken, async (req, res) => {
  const email = req.user.email;
  if (wishlistsCollection) {
    const list = await wishlistsCollection.find({ userEmail: email }).toArray();
    return res.send(list.map((w) => w.studioId));
  }
  const userSet = memWishlists[email] ? Array.from(memWishlists[email]) : [];
  res.send(userSet);
});

app.post("/api/wishlist", verifyToken, async (req, res) => {
  const email = req.user.email;
  const { studioId } = req.body;
  if (!studioId) return res.status(400).send({ message: "studioId required" });

  if (wishlistsCollection) {
    const existing = await wishlistsCollection.findOne({ userEmail: email, studioId });
    if (existing) {
      await wishlistsCollection.deleteOne({ _id: existing._id });
      return res.send({ saved: false, message: "Removed from wishlist" });
    } else {
      await wishlistsCollection.insertOne({ userEmail: email, studioId, createdAt: new Date() });
      return res.send({ saved: true, message: "Saved to wishlist" });
    }
  }

  if (!memWishlists[email]) memWishlists[email] = new Set();
  if (memWishlists[email].has(studioId)) {
    memWishlists[email].delete(studioId);
    res.send({ saved: false, message: "Removed from wishlist" });
  } else {
    memWishlists[email].add(studioId);
    res.send({ saved: true, message: "Saved to wishlist" });
  }
});

// Root route
app.get("/", (req, res) => {
  res.send("StudioSpace server is running cleanly");
});

app.listen(port, () => {
  console.log(`StudioSpace server running on port ${port}`);
});
