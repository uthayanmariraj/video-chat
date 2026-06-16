import 'dotenv/config'
import express from 'express'
import { createServer } from 'http'
import { Server } from 'socket.io'

const app = express()
const server = createServer(app)
const PORT = process.env.PORT
const io = new Server(server, {
    cors: {
        origin: "*"
    }
})
const activeOffers = new Map();

app.get('/', (req, res) => {
    res.send("<h1>hey</h1>")
})

io.on("connection", (socket) => {
    console.log("A user connected:", socket.id)
    socket.on("join_room", (data, callback) => {
        const { call_id } = data;
        try {
            socket.join(`call:${call_id}`);
            console.log(`Socket ${socket.id} joined room call:${call_id}`);

            const offer = activeOffers.get(call_id);
            callback({ status: "ok", data: { message: "Joined successfully", offer } });
        } catch (error) {
            callback({ status: "error", error: error.message });
        }
    });
    socket.on("offer", ({ room, offer }) => {
        activeOffers.set(room, offer);
        socket.to(`call:${room}`).emit("offer", { offer });
    });

    socket.on("answer", ({ room, answer }) => {
        socket.to(`call:${room}`).emit("answer", { answer });
    });

    socket.on("ice-candidate", ({ room, candidate, type }) => {
        socket.to(`call:${room}`).emit("ice-candidate", { candidate, type });
    });

    socket.on("hangup", ({ room }) => {
        activeOffers.delete(room);
        socket.to(`call:${room}`).emit("hangup");
    });

    socket.on("disconnect", () => {
        console.log("User disconnected:", socket.id)
    })
})

server.listen(PORT, () => {
    console.log(`server started at http://localhost:${PORT}`)
})