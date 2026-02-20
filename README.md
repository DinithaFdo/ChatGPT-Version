# Gemini-Powered Chatbot with Context Engineering

A production-grade, context-aware chatbot application built with Next.js 16 (App Router), Google Gemini 2.5 Flash, and MongoDB Atlas. Features persistent chat history, multi-session management, and context engineering for enhanced conversational AI responses.

![Next.js](https://img.shields.io/badge/Next.js-16.1.6-black)
![React](https://img.shields.io/badge/React-19.2.3-blue)
![MongoDB](https://img.shields.io/badge/MongoDB-Atlas-green)
![Gemini](https://img.shields.io/badge/Gemini-2.5%20Flash-orange)

## 🚀 Features

- **Context-Aware Conversations**: Loads and injects stored chat history per session for contextual responses
- **Multi-Session Management**: Create multiple chat sessions with persistent history
- **Session Switching**: Navigate between different conversation threads seamlessly
- **Real-time Chat Interface**: Modern, responsive UI with typing indicators and smooth animations
- **MongoDB Persistence**: All conversations stored in MongoDB Atlas with automatic retrieval
- **Session History Sidebar**: View and switch between all previous chat sessions
- **Optimistic UI Updates**: Instant message display with background API processing
- **Error Handling**: Comprehensive error management with user-friendly messages
- **Responsive Design**: Mobile-first design using Tailwind CSS 4
- **Auto-scroll**: Automatic scroll to newest messages

## 🛠️ Tech Stack

### Frontend

- **Next.js 16.1.6** - React framework with App Router
- **React 19.2.3** - UI library
- **Tailwind CSS 4** - Utility-first styling
- **TypeScript 5** - Type safety

### Backend

- **Next.js API Routes** - Serverless API endpoints
- **MongoDB Atlas** - Cloud database
- **Mongoose 9.2.1** - MongoDB ODM
- **Google Generative AI SDK 0.24.1** - Gemini API integration

### Other

- **UUID 13.0.0** - Session ID generation
- **ESLint 9** - Code linting

## 📁 Project Structure

```
chatgpt-version/
├── app/
│   ├── api/
│   │   └── chat/
│   │       └── route.js          # Chat API endpoints (GET & POST)
│   ├── chat/
│   │   └── page.jsx              # Main chat page
│   ├── globals.css               # Global styles
│   ├── layout.tsx                # Root layout
│   └── page.tsx                  # Home page
├── components/
│   └── ChatUI.jsx                # Main chat interface component
├── lib/
│   ├── db/
│   │   └── mongoose.js           # MongoDB connection singleton
│   └── models/
│       └── Chat.js               # Mongoose chat schema
├── scripts/
│   └── test-mongo-connection.mjs # MongoDB connection test utility
├── .env.local                    # Environment variables (not in git)
├── package.json
└── README.md
```

## 📋 Prerequisites

- **Node.js** 20.15.0 or higher
- **npm** 10.8.1 or higher
- **MongoDB Atlas Account** (free tier available)
- **Google AI Studio Account** (for Gemini API key)

## 🔧 Installation & Setup

### 1. Clone the Repository

```bash
git clone <your-repository-url>
cd chatgpt-version
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Set Up MongoDB Atlas

1. Create a free account at [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Create a new cluster
3. Create a database user with read/write permissions
4. Add your IP address to the IP whitelist (or use `0.0.0.0/0` for development)
5. Get your connection string

### 4. Get Gemini API Key

1. Visit [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Create a new API key
3. Copy the key for use in environment variables

### 5. Configure Environment Variables

Create a `.env.local` file in the root directory:

```env
# MongoDB Atlas connection string
# Replace <user>, <pass>, <cluster>, and <db> with your actual values
MONGODB_URI="your_connection_string"

# Gemini API Key from Google AI Studio
GEMINI_API_KEY="your_gemini_api_key_here"
```

**Note**: The example uses a non-SRV connection string to avoid DNS resolution issues. If using `mongodb+srv://`, ensure your DNS resolver supports SRV lookups.

### 6. Test MongoDB Connection (Optional)

```bash
node scripts/test-mongo-connection.mjs
```

Expected output: `Mongo OK`

### 7. Run the Development Server

```bash
npm run dev
```

Open [http://localhost:3000/chat](http://localhost:3000/chat) in your browser.

## 📡 API Reference

### Base URL

```
http://localhost:3000/api
```

### Endpoints

#### 1. POST `/api/chat`

Send a message and receive AI response with context awareness.

**Request Body:**

```json
{
  "sessionId": "string (UUID)",
  "message": "string (max 8000 chars)"
}
```

**Example Request:**

```bash
curl -X POST http://localhost:3000/api/chat \
  -H "Content-Type: application/json" \
  -d '{
    "sessionId": "dad92f78-9ae2-4b91-bb52-df8c8ede0311",
    "message": "What is the capital of France?"
  }'
```

**Success Response (200):**

```json
{
  "sessionId": "dad92f78-9ae2-4b91-bb52-df8c8ede0311",
  "reply": "The capital of France is Paris."
}
```

**Error Responses:**

- **400 Bad Request** - Missing or invalid parameters

```json
{
  "error": "sessionId is required."
}
```

- **400 Bad Request** - Message too long

```json
{
  "error": "message is too long (max 8000 chars)."
}
```

- **500 Internal Server Error** - Server or API error

```json
{
  "error": "Internal server error."
}
```

- **502 Bad Gateway** - Gemini API failure

```json
{
  "error": "No response generated by the model."
}
```

#### 2. GET `/api/chat`

Retrieve chat history for a specific session.

**Query Parameters:**

- `sessionId` (required): UUID of the chat session

**Example Request:**

```bash
curl "http://localhost:3000/api/chat?sessionId=dad92f78-9ae2-4b91-bb52-df8c8ede0311"
```

**Success Response (200):**

```json
{
  "sessionId": "dad92f78-9ae2-4b91-bb52-df8c8ede0311",
  "messages": [
    {
      "role": "user",
      "text": "What is the capital of France?"
    },
    {
      "role": "model",
      "text": "The capital of France is Paris."
    },
    {
      "role": "user",
      "text": "Tell me more about it"
    },
    {
      "role": "model",
      "text": "Paris is known as the City of Light..."
    }
  ]
}
```

**Empty History Response (200):**

```json
{
  "sessionId": "dad92f78-9ae2-4b91-bb52-df8c8ede0311",
  "messages": []
}
```

**Error Responses:**

- **400 Bad Request** - Missing sessionId

```json
{
  "error": "sessionId is required."
}
```

- **500 Internal Server Error** - Server error

```json
{
  "error": "Internal server error."
}
```

## 🗄️ Database Schema

### Chat Collection

```javascript
{
  "_id": ObjectId,
  "sessionId": String (unique, indexed),
  "messages": [
    {
      "role": String ("user" | "model"),
      "parts": [
        {
          "text": String
        }
      ]
    }
  ],
  "createdAt": Date,
  "updatedAt": Date
}
```

**Indexes:**

- `sessionId`: Single field index for fast session lookups

## 🎯 Usage Guide

### Starting a New Chat

1. Visit `/chat` route
2. On first visit, a new session is automatically created
3. Type your message and press "Send" or hit Enter
4. The AI responds with context from previous messages in the session

### Managing Multiple Sessions

1. Click the **hamburger menu (☰)** icon in the header to open the sidebar
2. Click **"New Chat"** to start a fresh conversation
3. View all previous sessions in the sidebar with previews
4. Click any session to switch to it and continue that conversation

### Session Persistence

- Sessions are stored in browser `localStorage` with metadata
- Full message history is stored in MongoDB Atlas
- Returning users see their last active session
- All sessions persist across page refreshes and browser restarts

## 🔒 Security Considerations

1. **Environment Variables**: Never commit `.env.local` to version control
2. **API Keys**: Rotate Gemini API keys regularly
3. **MongoDB Credentials**: Use strong passwords and restrict IP access
4. **Input Validation**: Messages are limited to 8000 characters
5. **Context Limiting**: Only last 30 messages are sent to Gemini to prevent token overflow

## 🚀 Deployment

### Vercel (Recommended)

1. Push your code to GitHub
2. Import project to [Vercel](https://vercel.com)
3. Add environment variables in Vercel dashboard:
   - `MONGODB_URI`
   - `GEMINI_API_KEY`
4. Deploy

### Other Platforms

Ensure the platform supports:

- Node.js 20+
- Environment variables
- Serverless functions

## 🧪 Testing

Test MongoDB connection:

```bash
node scripts/test-mongo-connection.mjs
```

Test API endpoints:

```bash
# Test POST endpoint
curl -X POST http://localhost:3000/api/chat \
  -H "Content-Type: application/json" \
  -d '{"sessionId":"test-123","message":"Hello"}'

# Test GET endpoint
curl "http://localhost:3000/api/chat?sessionId=test-123"
```

## 🐛 Troubleshooting

### DNS Resolution Issues

If you see `querySrv ECONNREFUSED` errors:

- Use the non-SRV connection string format shown in the env example
- Or add Google DNS servers: `8.8.8.8` and `1.1.1.1`

### Hydration Errors

If you see hydration mismatch warnings:

- These are typically from browser extensions injecting attributes
- Test in incognito mode to verify
- The app handles these gracefully

### Module Not Found Errors

```bash
npm install
```

## 📝 Development Scripts

```bash
# Start development server
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Run linter
npm run lint
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature-name`
3. Commit changes: `git commit -am 'Add feature'`
4. Push to branch: `git push origin feature-name`
5. Submit a pull request

## 📄 License

This project is private and for educational purposes.

## 🙏 Acknowledgments

- [Next.js](https://nextjs.org/) - React framework
- [Google Gemini](https://deepmind.google/technologies/gemini/) - AI model
- [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) - Database
- [Tailwind CSS](https://tailwindcss.com/) - Styling

## 📧 Support

For issues and questions, please open an issue in the repository.

---

Built with ❤️ using Next.js, Gemini AI, and MongoDB Atlas
