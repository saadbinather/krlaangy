# Socket.IO Real-Time Voting Setup

This project now includes Socket.IO for real-time voting and commenting functionality. Users will see live updates when others vote or comment without needing to refresh the page.

## 🚀 Features

- **Real-time voting**: See votes update instantly across all connected clients
- **Live comments**: New comments appear immediately for all users
- **Connection status**: Visual indicator showing real-time connection status
- **Fallback support**: Falls back to REST API if Socket.IO is not connected

## 📦 Installation

Socket.IO dependencies are already installed:
- `socket.io` - Server-side Socket.IO
- `socket.io-client` - Client-side Socket.IO

## 🏃‍♂️ Running the Application

### Development Mode (with Socket.IO)
```bash
npm run dev
```
This runs the custom server with Socket.IO support.

### Standard Next.js Mode (without Socket.IO)
```bash
npm run dev:next
```
This runs the standard Next.js development server.

## 🔧 How It Works

### Server-Side (Socket.IO Server)
- Located in `src/lib/socket-server.ts`
- Handles real-time events for voting and commenting
- Manages plan rooms for targeted updates
- Integrates with Prisma for database operations

### Client-Side (Socket.IO Client)
- Located in `src/lib/socket.ts`
- Custom hook `useSocket()` for easy integration
- Automatic connection management
- Event listeners for real-time updates

### Main Component Integration
- `src/components/Main.tsx` uses Socket.IO for voting and commenting
- Optimistic UI updates for immediate feedback
- Fallback to REST API if Socket.IO is unavailable
- Real-time status indicator

## 🎯 Real-Time Events

### Voting Events
- `new-vote`: Emitted when a user votes
- `delete-vote`: Emitted when a user deletes their vote
- `plan-updated`: Broadcasted to all clients when a plan is updated
- `vote-error`: Error handling for voting operations

### Comment Events
- `new-comment`: Emitted when a user adds a comment
- `comment-error`: Error handling for comment operations

### Room Management
- `join-plan`: Join a specific plan's room for targeted updates
- `leave-plan`: Leave a plan's room

## 🎨 UI Components

### RealTimeStatus Component
- Shows connection status (Live/Offline/Connecting)
- Visual indicators with icons
- Located in top-right corner

## 🔄 Data Flow

1. **User votes** → Optimistic UI update → Socket.IO event → Server processes → Database update → Broadcast to all clients
2. **User comments** → Socket.IO event → Server processes → Database update → Broadcast to all clients
3. **Real-time updates** → All connected clients receive updated data → UI updates automatically

## 🛠️ Configuration

### Environment Variables
```env
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### Socket.IO Settings
- Path: `/api/socket`
- CORS enabled for development
- WebSocket and polling transport
- Automatic reconnection

## 🐛 Troubleshooting

### Connection Issues
1. Check if the custom server is running (`npm run dev`)
2. Verify Socket.IO path in client configuration
3. Check browser console for connection errors

### Fallback Behavior
If Socket.IO is not connected, the app automatically falls back to REST API calls, ensuring functionality even without real-time features.

## 📈 Performance Benefits

- **Reduced server load**: No need for polling
- **Better UX**: Instant feedback and updates
- **Scalable**: Room-based updates target only relevant clients
- **Reliable**: Fallback to REST API ensures functionality

## 🔮 Future Enhancements

- User typing indicators
- Real-time user presence
- Push notifications for new polls
- Analytics for voting patterns
- Mobile app support
