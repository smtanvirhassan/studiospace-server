# StudioSpace - Server

Backend API server for StudioSpace - Peer-to-Peer Creative Workspace & Production Studio Sharing Platform.

## Tech Stack
- Express.js
- MongoDB
- JWT (HTTPOnly Cookies)
- Cookie Parser
- CORS

## API Endpoints

### Auth
- `POST /jwt` - Generate JWT token
- `POST /logout` - Clear JWT cookie

### Studios
- `GET /api/studios` - Get all studios (with filters)
- `GET /api/studios/featured` - Get featured studios (limit 6)
- `GET /api/studios/:id` - Get single studio
- `GET /api/my-studios` - Get user's studios (protected)
- `POST /api/studios` - Add new studio (protected)
- `PUT /api/studios/:id` - Update studio (protected)
- `DELETE /api/studios/:id` - Delete studio (protected)

### Bookings
- `GET /api/bookings` - Get user's bookings (protected)
- `POST /api/bookings` - Create booking (protected, double-booking prevention)
- `PATCH /api/bookings/:id` - Update booking status (protected)

## Local Setup
1. Clone the repository
2. Run `npm install`
3. Create `.env` file with DB_USER, DB_PASS, ACCESS_TOKEN_SECRET
4. Run `npm start` or `node index.js`
