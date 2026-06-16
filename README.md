# Video Chat (WebRTC + Socket.IO)

A simple peer-to-peer video calling application built with WebRTC for real-time media streaming and Socket.IO for signaling. Users can create a call, share a generated Call ID, and connect with another participant directly through the browser.

---

## Overview

This project demonstrates the core concepts behind browser-based video calling:

* WebRTC for audio/video communication
* Socket.IO signaling server for exchanging SDP offers, answers, and ICE candidates
* React frontend for the user interface
* Express backend for room management and signaling

The application creates a unique Call ID that can be shared with another user. Once both participants join the same room, a direct peer-to-peer connection is established and video/audio streams are exchanged.

---

## Features

*  Real-time video and audio calling
*  Unique Call ID generation
*  WebRTC peer-to-peer communication
*  Socket.IO signaling server
*  Webcam and microphone access
*  Create and join calls
*  Hang-up functionality
*  STUN server configuration for NAT traversal

---

## Tech Stack

### Frontend

* React
* Vite
* Socket.IO Client
* WebRTC APIs

### Backend

* Node.js
* Express
* Socket.IO

---

## Project Structure

```text
video-chat/
│
├── backend/
│   ├── server.js
│   ├── package.json
│   └── .env
│
├── frontend/
│   ├── src/
│   │   ├── App.jsx
│   │   ├── App.css
│   │   └── main.jsx
│   │
│   ├── public/
│   ├── package.json
│   └── .env
│
└── README.md
```

---

## How It Works

### 1. Start Webcam

The user grants permission for camera and microphone access using:

```javascript
navigator.mediaDevices.getUserMedia({
  video: true,
  audio: true
});
```

The local stream is attached to the video element and added to the peer connection.

### 2. Create a Call

The caller:

* Generates a unique Call ID
* Joins a Socket.IO room
* Creates a WebRTC offer
* Sends the offer through the signaling server

### 3. Join a Call

The second participant:

* Enters the Call ID
* Retrieves the stored offer
* Creates an SDP answer
* Sends the answer back to the caller

### 4. Exchange ICE Candidates

Both peers exchange ICE candidates through Socket.IO until a direct connection is established.

### 5. Stream Media

Once negotiation is complete:

* Local video appears in the local stream panel
* Remote participant's video appears in the remote stream panel

---

## Installation

### Clone the Repository

```bash
git clone <repository-url>
cd video-chat
```

---

## Backend Setup

Navigate to the backend folder:

```bash
cd backend
```

Install dependencies:

```bash
npm install
```

Create a `.env` file:

```env
PORT=5000
```

Start the server:

```bash
node server.js
```

---

## Frontend Setup

Navigate to the frontend folder:

```bash
cd frontend
```

Install dependencies:

```bash
npm install
```

Create a `.env` file:

```env
VITE_BACKEND_URL=http://localhost:5000
```

Run the development server:

```bash
npm run dev
```

---

## Usage

### User 1

1. Open the application
2. Click **Start Webcam**
3. Click **Create a New Call**
4. Copy the generated Call ID

### User 2

1. Open the application
2. Click **Start Webcam**
3. Enter the received Call ID
4. Click **Answer**

After signaling completes, both users should see each other's video streams.

---

## Socket Events

### Client → Server

| Event           | Purpose                 |
| --------------- | ----------------------- |
| `join_room`     | Join a call room        |
| `offer`         | Send SDP offer          |
| `answer`        | Send SDP answer         |
| `ice-candidate` | Exchange ICE candidates |
| `hangup`        | End the call            |

### Server → Client

| Event           | Purpose                     |
| --------------- | --------------------------- |
| `offer`         | Deliver SDP offer           |
| `answer`        | Deliver SDP answer          |
| `ice-candidate` | Deliver ICE candidate       |
| `hangup`        | Notify peer that call ended |

---

## Environment Variables

### Backend

```env
PORT=5000
```

### Frontend

```env
VITE_BACKEND_URL=http://localhost:5000
```

---

## Current Limitations

* One active offer stored per room
* No authentication
* No TURN server support
* No screen sharing
* No chat functionality
* No participant presence indicators

---

## Future Improvements

* Add TURN servers for better connectivity
* Screen sharing support
* Text chat alongside video calls
* Call recording
* Multiple participants
* User authentication
* Better UI/UX
* Reconnection handling

---

## Learning Goals

This project was built primarily to understand:

* WebRTC connection lifecycle
* SDP offer/answer negotiation
* ICE candidate exchange
* Real-time communication with Socket.IO
* Media stream management in React

---

## License

This project is intended for learning and experimentation purposes. Feel free to modify and extend it as needed.
