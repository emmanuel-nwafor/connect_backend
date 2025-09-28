# Connect Backend API

## Overview
This project serves as the backend for the CONNECT application, providing a robust API layer for user authentication, lodge management, real-time chat, and payment processing. It leverages Node.js with Next.js API Routes, Firebase Firestore for data persistence, Firebase Authentication, Cloudinary for media uploads, and Paystack for handling payment transactions.

## Features
- **User Authentication**: Firebase Authentication for secure user registration, login, and session management using JWTs.
- **Role-Based Access Control**: Differentiates between 'user' and 'admin' roles for managing access to specific resources and functionalities.
- **User Profile Management**: Endpoints for completing and updating user profiles, including personal details and profile images.
- **Lodge Management**: Comprehensive CRUD operations for managing property listings, accessible by administrators.
- **Lodge Search & Listing**: Allows users to browse all available lodges and search for specific properties based on criteria.
- **Favorites Management**: Users can add or remove lodges from their personal favorites list.
- **Booking System**: Integration with Paystack for processing lodge bookings, including webhook verification for transaction status updates.
- **Real-time Chat**: Supports direct messaging between users and administrators, facilitating communication regarding lodges or bookings.
- **OTP Verification**: Email-based One-Time Password (OTP) system for secure user verification during critical flows.
- **Cloudinary Integration**: Handles secure and efficient image uploads for lodge listings and user profiles.

## Getting Started
To get the Connect Backend API up and running on your local machine, follow these steps.

### Installation
1.  **Clone the Repository**:
    ```bash
    git clone https://github.com/emmanuel-nwafor/connect_backend.git
    ```
2.  **Navigate to Project Directory**:
    ```bash
    cd connect_backend/connect
    ```
3.  **Install Dependencies**:
    ```bash
    npm install
    ```
4.  **Run the Development Server**:
    ```bash
    npm run dev
    ```
    The application will be accessible at `http://localhost:3000`.

### Environment Variables
Create a `.env.local` file in the root of the project and populate it with the following required variables:

```ini
# Firebase Configuration (Next.js Public variables)
NEXT_PUBLIC_FIREBASE_API_KEY="YOUR_FIREBASE_API_KEY"
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN="YOUR_FIREBASE_AUTH_DOMAIN"
NEXT_PUBLIC_FIREBASE_PROJECT_ID="YOUR_FIREBASE_PROJECT_ID"
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET="YOUR_FIREBASE_STORAGE_BUCKET"
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID="YOUR_FIREBASE_MESSAGING_SENDER_ID"
NEXT_PUBLIC_FIREBASE_APP_ID="YOUR_FIREBASE_APP_ID"
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID="YOUR_FIREBASE_MEASUREMENT_ID"

# JWT Secret
JWT_SECRET="YOUR_STRONG_JWT_SECRET_KEY"

# Cloudinary Configuration
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME="YOUR_CLOUDINARY_CLOUD_NAME"
NEXT_PUBLIC_CLOUDINARY_API_KEY="YOUR_CLOUDINARY_API_KEY"
CLOUDINARY_API_SECRET="YOUR_CLOUDINARY_API_SECRET"
CLOUDINARY_UNSIGNED_PRESET="YOUR_CLOUDINARY_UNSIGNED_UPLOAD_PRESET" # Optional, if using unsigned uploads

# Nodemailer (Email for OTP) Configuration
EMAIL_USER="YOUR_EMAIL_ADDRESS"
EMAIL_PASS="YOUR_EMAIL_APP_PASSWORD" # For Gmail, use an App Password

# Paystack Configuration
PAYSTACK_SECRET_KEY="YOUR_PAYSTACK_SECRET_KEY"

# Frontend URL for Paystack Callbacks
NEXT_PUBLIC_FRONTEND_URL="http://localhost:3001" # Or your deployed frontend URL
```

## API Documentation
This section details the available API endpoints, their expected request payloads, and their corresponding responses and potential errors.

### Base URL
`/api`

### Endpoints

#### POST /api/auth/signup
Registers a new user with email and password or Google OAuth.
**Request**:
```json
{
  "email": "user@example.com",
  "password": "StrongPassword123",
  "isGoogle": false
}
```
**Response**:
```json
{
  "message": "Signup successful. Redirect to profile setup.",
  "uid": "firebase_user_id",
  "email": "user@example.com",
  "token": "jwt_token_string",
  "redirect": "/setup"
}
```
**Errors**:
- `400`: Email and password are required.
- `400`: Firebase registration error (e.g., "auth/email-already-in-use").

#### POST /api/auth/login
Authenticates a user with email and password or Google OAuth.
**Request**:
```json
{
  "email": "user@example.com",
  "password": "StrongPassword123",
  "isGoogle": false
}
```
**Response**:
```json
{
  "message": "Login successful",
  "uid": "firebase_user_id",
  "email": "user@example.com",
  "role": "user",
  "token": "jwt_token_string",
  "redirect": "/users"
}
```
**Errors**:
- `400`: Email and password are required.
- `400`: Firebase login error (e.g., "auth/invalid-credential").
- `403`: Please complete your profile first (returns token and redirect for profile setup).
- `404`: User not found in database.

#### POST /api/auth/send-otp
Sends a 4-digit OTP to the provided email address for verification.
**Request**:
```json
{
  "email": "user@example.com"
}
```
**Response**:
```json
{
  "otp": "1234"
}
```
**Errors**:
- `400`: Email is required.
- `500`: Failed to store OTP.
- `500`: Failed to send OTP email.

#### POST /api/auth/verify-otp
Verifies the provided OTP against the stored OTP.
**Request**:
```json
{
  "otp": "1234"
}
```
**Response**:
```json
{
  "success": true
}
```
**Errors**:
- `400`: OTP is required.
- `400`: No OTP record found.
- `400`: Invalid OTP.
- `500`: Failed to verify OTP.

#### POST /api/auth/forgot
*This endpoint is currently a placeholder and not implemented.*

#### POST /api/profile/complete
Completes a newly registered user's profile information.
**Request**:
```json
{
  "uid": "firebase_user_id",
  "fullName": "John Doe",
  "phone": "+2348012345678",
  "location": "Lagos, Nigeria",
  "imageUrl": "https://example.com/profile.jpg"
}
```
**Response**:
```json
{
  "message": "Profile completed successfully"
}
```
**Errors**:
- `400`: Missing required fields (uid, fullName, phone, location).
- `500`: Internal server error.

#### POST /api/users/setup
Updates additional user profile details, marking setup as complete.
**Request**:
```json
{
  "userId": "firebase_user_id",
  "fullName": "John Doe",
  "phone": "+2348012345678",
  "location": "Lagos, Nigeria",
  "address": "123 Main St",
  "bio": "A passionate lodge seeker.",
  "imageUrl": "https://example.com/profile.jpg",
  "isFirstTime": false
}
```
**Response**:
```json
{
  "message": "Profile updated successfully"
}
```
**Errors**:
- `400`: userId is required.
- `400`: Profile setup error.

#### GET /api/users/check-user
Checks if a user exists in the database and if their profile is completed.
**Request**:
Query parameter: `uid`
Example: `GET /api/users/check-user?uid=firebase_user_id`
**Response**:
```json
{
  "success": true,
  "exists": true,
  "data": {
    "email": "user@example.com",
    "role": "user",
    "profileCompleted": true,
    "createdAt": "2023-01-01T12:00:00Z",
    "fullName": "John Doe",
    "phone": "+2348012345678",
    "location": "Lagos, Nigeria",
    "imageUrl": "https://example.com/profile.jpg"
  },
  "skipOnboarding": true
}
```
**Errors**:
- `400`: Missing UID.
- `500`: Internal server error.

#### POST /api/users/first-timer
Marks a user as no longer a first-timer after initial onboarding.
**Request**:
```json
{
  "uid": "firebase_user_id"
}
```
**Response**:
```json
{
  "success": true
}
```
**Errors**:
- `400`: Request body error.

#### GET /api/profile/upload-profile
Retrieves the authenticated user's profile information.
**Request**:
Headers: `Authorization: Bearer <jwt_token>`
**Response**:
```json
{
  "success": true,
  "fullName": "John Doe",
  "email": "user@example.com",
  "imageUrl": "https://example.com/profile.jpg"
}
```
**Errors**:
- `401`: No token provided.
- `401`: Invalid token.
- `404`: User not found.
- `500`: Internal server error.

#### POST /api/profile/upload-profile
Uploads or updates the authenticated user's profile image.
**Request**:
Headers: `Authorization: Bearer <jwt_token>`
```json
{
  "imageUrl": "https://newimage.com/profile.jpg"
}
```
**Response**:
```json
{
  "success": true,
  "message": "Profile image updated",
  "fullName": "John Doe",
  "email": "user@example.com",
  "imageUrl": "https://newimage.com/profile.jpg"
}
```
**Errors**:
- `401`: No token provided.
- `401`: Invalid token.
- `400`: No imageUrl provided.
- `500`: Internal server error.

#### POST /api/profile/edit-profile
Updates the authenticated user's general profile details (full name, email, image).
**Request**:
Headers: `Authorization: Bearer <jwt_token>`
```json
{
  "fullName": "Jane Doe",
  "email": "jane.doe@example.com",
  "imageUrl": "https://newimage.com/jane_profile.jpg"
}
```
**Response**:
```json
{
  "success": true,
  "message": "Profile updated",
  "updatedFields": {
    "fullName": "Jane Doe",
    "email": "jane.doe@example.com"
  }
}
```
**Errors**:
- `401`: No token provided.
- `401`: Invalid token.
- `400`: Nothing to update.
- `500`: Internal server error.

#### GET /api/all-lodges
Retrieves a list of all available lodges, ordered by creation date.
**Request**:
No payload.
**Response**:
```json
{
  "success": true,
  "lodges": [
    {
      "id": "lodge_id_1",
      "title": "Cozy Apartment",
      "rentFee": 500,
      "bedrooms": 2,
      "bathrooms": 1,
      "description": "A beautiful and serene apartment.",
      "imageUrls": ["url1", "url2"],
      "location": "City Center",
      "propertyType": "Apartment",
      "createdAt": { "_seconds": 1678886400, "_nanoseconds": 0 }
    }
  ]
}
```
**Errors**:
- `500`: Failed to fetch lodges.

#### GET /api/all-lodges/{id}
Retrieves details for a single lodge by its ID.
**Request**:
Path parameter: `id`
Example: `GET /api/all-lodges/lodge_id_1`
**Response**:
```json
{
  "success": true,
  "lodge": {
    "id": "lodge_id_1",
    "title": "Cozy Apartment",
    "rentFee": 500,
    "bedrooms": 2,
    "bathrooms": 1,
    "description": "A beautiful and serene apartment.",
    "imageUrls": ["url1", "url2"],
    "location": "City Center",
    "propertyType": "Apartment",
    "createdAt": { "_seconds": 1678886400, "_nanoseconds": 0 }
  }
}
```
**Errors**:
- `400`: Missing lodge ID.
- `404`: Lodge not found.
- `500`: Internal Server Error.

#### POST /api/admin/save-lodge
Creates a new lodge listing.
**Request**:
```json
{
  "title": "Luxury Villa",
  "description": "Spacious villa with a great view.",
  "rentFee": 1500,
  "location": "Hilltop Estate",
  "propertyType": "Villa",
  "bedrooms": 4,
  "bathrooms": 3,
  "imageUrls": ["https://example.com/villa1.jpg", "https://example.com/villa2.jpg"],
  "kitchen": true,
  "balcony": true,
  "selfContained": false
}
```
**Response**:
```json
{
  "success": true,
  "id": "new_lodge_id"
}
```
**Errors**:
- `400`: Missing required fields (title, description, rentFee, location, propertyType, imageUrls).
- `500`: Firestore save failed.

#### GET /api/admin/edit-lodge/{id}
Retrieves details for a single lodge, primarily for admin editing purposes.
**Request**:
Path parameter: `id`
Example: `GET /api/admin/edit-lodge/lodge_id_1`
**Response**:
```json
{
  "success": true,
  "lodge": {
    "id": "lodge_id_1",
    "title": "Cozy Apartment",
    "rentFee": 500,
    "bedrooms": 2,
    "bathrooms": 1,
    "description": "A beautiful and serene apartment.",
    "imageUrls": ["url1", "url2"],
    "location": "City Center",
    "propertyType": "Apartment"
  }
}
```
**Errors**:
- `400`: Lodge ID required.
- `404`: Lodge not found.
- `500`: Internal server error.

#### PUT /api/admin/edit-lodge/{id}
Updates an existing lodge listing.
**Request**:
Path parameter: `id`
Example: `PUT /api/admin/edit-lodge/lodge_id_1`
```json
{
  "title": "Updated Cozy Apartment",
  "rentFee": 550,
  "description": "An updated description for the apartment.",
  "imageUrls": ["https://example.com/updated_image.jpg"],
  "bedrooms": 3
}
```
**Response**:
```json
{
  "success": true,
  "message": "Lodge updated successfully"
}
```
**Errors**:
- `400`: Lodge ID is required.
- `500`: Internal server error.

#### DELETE /api/admin/edit-lodge/{id}
Deletes a lodge listing by its ID.
**Request**:
Path parameter: `id`
Example: `DELETE /api/admin/edit-lodge/lodge_id_1`
**Response**:
```json
{
  "success": true,
  "message": "Lodge deleted successfully"
}
```
**Errors**:
- `400`: Lodge ID required.
- `500`: Internal server error.

#### GET /api/users/search
Searches for lodges based on a query string in their titles.
**Request**:
Query parameter: `q`
Example: `GET /api/users/search?q=cozy`
**Response**:
```json
{
  "success": true,
  "results": [
    {
      "id": "lodge_id_1",
      "title": "Cozy Apartment",
      "rentFee": 500,
      "location": "City Center"
    }
  ]
}
```
**Errors**:
- `400`: Missing query parameter 'q'.
- `500`: Internal server error.

#### GET /api/users/favorites
Retrieves the authenticated user's list of favorited lodges.
**Request**:
Headers: `Authorization: Bearer <jwt_token>`
**Response**:
```json
{
  "success": true,
  "favorites": [
    {
      "id": "lodge_id_1",
      "lodgeId": "lodge_id_1",
      "title": "Cozy Apartment",
      "imageUrl": "https://example.com/lodge1.jpg",
      "rentFee": 500,
      "location": "City Center",
      "createdAt": "2024-07-01T10:00:00Z"
    }
  ]
}
```
**Errors**:
- `401`: Unauthorized (no token).
- `403`: Invalid or expired token.
- `500`: Internal server error.

#### POST /api/users/favorites
Adds or removes a lodge from the authenticated user's favorites.
**Request**:
Headers: `Authorization: Bearer <jwt_token>`
```json
{
  "lodgeId": "lodge_id_1",
  "title": "Cozy Apartment",
  "imageUrl": "https://example.com/lodge1.jpg",
  "rentFee": 500,
  "location": "City Center"
}
```
**Response**:
```json
{
  "success": true,
  "isFavorite": true
}
```
(If already favorited, `isFavorite` will be `false` after removal)
**Errors**:
- `401`: Unauthorized.
- `403`: Invalid or expired token.
- `400`: lodgeId is required.
- `500`: Internal server error.

#### POST /api/users/reviews
Submits a review for a lodge.
**Request**:
```json
{
  "lodgeId": "lodge_id_1",
  "rating": 4,
  "comment": "Great place, really enjoyed my stay!"
}
```
**Response**:
```json
{
  "success": true
}
```
**Errors**:
- `400`: Missing required fields (lodgeId, rating, comment).
- `500`: Internal Server Error.

#### POST /api/users/book
Initiates a payment transaction for a lodge booking via Paystack.
**Request**:
Headers: `Authorization: Bearer <jwt_token>`
```json
{
  "lodgeId": "lodge_id_1",
  "amount": 500.00
}
```
**Response**:
```json
{
  "success": true,
  "authorizationUrl": "https://checkout.paystack.com/...",
  "bookingId": "new_booking_id"
}
```
**Errors**:
- `401`: No token provided.
- `401`: Invalid token.
- `404`: User not found.
- `400`: User email not found.
- `400`: Invalid JSON body.
- `400`: Missing required fields (lodgeId, amount).
- `400`: Invalid amount.
- `500`: Paystack secret key missing.
- `400`: Paystack initialization failed.
- `500`: Booking error.

#### GET /api/users/fetch-booking
Retrieves the authenticated user's booking history.
**Request**:
Headers: `Authorization: Bearer <jwt_token>`
**Response**:
```json
{
  "success": true,
  "bookings": [
    {
      "id": "booking_id_1",
      "lodgeId": "lodge_id_1",
      "amount": 500,
      "status": "success",
      "createdAtFormatted": "Jul 1, 2024, 10:00 AM"
    }
  ]
}
```
**Errors**:
- `401`: No token provided.
- `401`: Invalid token.
- `500`: Fetch bookings error.

#### GET /api/chats
Retrieves all chat conversations for the authenticated user.
**Request**:
Headers: `Authorization: Bearer <jwt_token>`
**Response**:
```json
{
  "success": true,
  "chats": [
    {
      "id": "chat_id_1",
      "participants": ["user_id_1", "user_id_2"],
      "lastMessage": "Hey there!",
      "lastUpdated": { "_seconds": 1678886400, "_nanoseconds": 0 }
    }
  ]
}
```
**Errors**:
- `401`: No token.
- `401`: Invalid token.
- `500`: Fetch chats error.

#### POST /api/chats/get-or-create
Retrieves an existing chat or creates a new one between the authenticated user and another specified user.
**Request**:
Headers: `Authorization: Bearer <jwt_token>`
```json
{
  "otherUserId": "target_user_id"
}
```
**Response**:
```json
{
  "success": true,
  "chatId": "existing_or_new_chat_id"
}
```
**Errors**:
- `401`: No token provided.
- `401`: Invalid token.
- `400`: Missing otherUserId.
- `500`: Chat creation error.

#### GET /api/messages/{chatId}
Retrieves messages for a specific chat.
**Request**:
Path parameter: `chatId`
Example: `GET /api/messages/chat_id_1`
**Response**:
```json
{
  "success": true,
  "messages": [
    {
      "id": "message_id_1",
      "senderId": "user_id_1",
      "text": "Hello!",
      "createdAt": "2024-07-01T10:00:00.000Z",
      "status": "delivered",
      "isAdmin": false
    }
  ]
}
```
**Errors**:
- `400`: Invalid chatId.
- `500`: Fetch messages error.

#### POST /api/messages/{chatId}
Sends a new message within a specific chat.
**Request**:
Headers: `Authorization: Bearer <jwt_token>`
Path parameter: `chatId`
Example: `POST /api/messages/chat_id_1`
```json
{
  "text": "Hi, how are you?"
}
```
**Response**:
```json
{
  "success": true,
  "id": "new_message_id",
  "message": {
    "id": "new_message_id",
    "senderId": "user_id_1",
    "text": "Hi, how are you?",
    "createdAt": "2024-07-01T10:05:00.000Z",
    "status": "delivered",
    "isAdmin": false
  }
}
```
**Errors**:
- `400`: Invalid chatId.
- `401`: No token provided.
- `401`: Invalid token.
- `400`: Message text required.
- `500`: Send message error.

#### POST /api/messages/send
Sends a direct message to a specific receiver. This endpoint appears to be a separate implementation from chat-specific messaging.
**Request**:
```json
{
  "token": "jwt_token_string",
  "message": "Direct message content",
  "receiverId": "target_user_id"
}
```
**Response**:
```json
{
  "success": true
}
```
**Errors**:
- `400`: Missing required fields (token, message, receiverId).
- `401`: Invalid token.
- `500`: Server error.

#### POST /api/cloudinary
Uploads an image or video file to Cloudinary.
**Request**:
```json
{
  "file": "data:image/jpeg;base64,...",
  "folder": "profile_images"
}
```
**Response**:
```json
{
  "url": "https://res.cloudinary.com/your_cloud_name/image/upload/.../image.jpg"
}
```
**Errors**:
- `400`: Invalid JSON.
- `400`: No file provided.
- `500`: Cloudinary upload failed.

#### POST /api/paystack/webhook
Receives and processes webhook events from Paystack, typically for updating booking statuses.
**Request**:
Raw request body from Paystack (JSON event data).
Headers: `x-paystack-signature`
```json
{
  "event": "charge.success",
  "data": {
    "status": "success",
    "reference": "PAYSTACK_REFERENCE",
    "metadata": {
      "bookingId": "firebase_booking_id",
      "userId": "firebase_user_id",
      "lodgeId": "lodge_id"
    }
  }
}
```
**Response**:
`Webhook processed` (HTTP 200 OK)
**Errors**:
- `401`: Invalid signature.
- `500`: Server error.

#### GET /api/admin/all-users
Retrieves a list of all registered users for administrative purposes.
**Request**:
No payload.
**Response**:
```json
{
  "users": [
    {
      "id": "user_id_1",
      "email": "user1@example.com",
      "initials": "JD",
      "createdAt": "7/1/2024"
    }
  ]
}
```
**Errors**:
- `500`: Failed to fetch users.

#### GET /api/admin/all-users/{id}
*This endpoint is currently a placeholder and not implemented.*

#### GET /api/admin/fetch-users-chats
Retrieves a list of users with the "user" role, intended for initiating chats by administrators.
**Request**:
No payload.
**Response**:
```json
{
  "success": true,
  "users": [
    {
      "id": "user_id_1",
      "fullName": "John Doe",
      "email": "john.doe@example.com",
      "initials": "JD",
      "createdAt": "7/1/2024",
      "imageUrl": "https://example.com/profile.jpg"
    }
  ]
}
```
**Errors**:
- `500`: Failed to fetch users for chat.

#### GET /api/users/fetch-admins
Retrieves a list of all registered admin users.
**Request**:
Headers: `Authorization: Bearer <jwt_token>`
**Response**:
```json
{
  "success": true,
  "admins": [
    {
      "id": "admin_id_1",
      "fullName": "Admin User",
      "imageUrl": "https://example.com/admin.jpg",
      "email": "admin@example.com"
    }
  ]
}
```
**Errors**:
- `401`: Unauthorized.
- `403`: Invalid token.
- `500`: Internal server error.

#### GET /api/admin/notifications
*This endpoint is currently a placeholder and not implemented.*

#### GET /api/profile/notifications
*This endpoint is currently a placeholder and not implemented.*

#### GET /api/users/notifications
*This endpoint is currently a placeholder and not implemented.*

## Technologies Used

| Technology | Category       | Description                                  |
| :--------- | :------------- | :------------------------------------------- |
| Node.js    | Runtime        | JavaScript runtime for server-side execution |
| Next.js    | Web Framework  | React framework for API routes and server-side logic |
| Firebase   | BaaS           | Database (Firestore) & Authentication      |
| Cloudinary | Media Mgmt.    | Cloud-based image and video management       |
| Paystack   | Payment Gateway| Online payment processing for Nigeria        |
| JWT        | Security       | Token-based authentication                 |
| Nodemailer | Email Sending  | Sending emails for OTP verification          |
| ESLint     | Linting        | Code quality and consistency                 |

## Contributing
We welcome contributions to the Connect Backend API! To contribute, please follow these steps:

1.  **Fork the repository**.
2.  **Create a new branch** for your feature or bug fix: `git checkout -b feature/your-feature-name`.
3.  **Implement your changes** and ensure they adhere to the project's coding standards.
4.  **Write comprehensive tests** for your changes.
5.  **Commit your changes**: `git commit -m 'feat: Add new feature'`.
6.  **Push to your branch**: `git push origin feature/your-feature-name`.
7.  **Open a Pull Request** to the `main` branch of the original repository, providing a clear description of your changes.

## Author Info
**Emmanuel Nwafor**
- LinkedIn: [Your LinkedIn Profile](https://linkedin.com/in/your_username)
- Twitter: [Your Twitter Profile](https://twitter.com/your_username)
- Portfolio: [Your Portfolio Website](https://your-portfolio.com)

## License
This project is not currently licensed. Please contact the author for licensing information.

[![Readme was generated by Dokugen](https://img.shields.io/badge/Readme%20was%20generated%20by-Dokugen-brightgreen)](https://www.npmjs.com/package/dokugen)