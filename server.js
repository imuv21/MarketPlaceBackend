import { createServer } from 'http';
import { Server } from 'socket.io';
import { app } from "./app.js";
import { allowedOrigins } from './app.js';
import dotenv from 'dotenv';
dotenv.config();

const PORT = process.env.PORT;
const NODE_ENV = process.env.NODE_ENV;
const server = createServer(app);

const io = new Server(server, {
    path: "/socket.io",
    cors: {
        origin: function (origin, callback) {
            if (!origin || allowedOrigins.includes(origin)) {
                callback(null, true);
            } else {
                callback(new Error('Not allowed by CORS'));
            }
        },
        methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
        credentials: true
    }
});
app.set('socketio', io);

// Socket.io
io.on('connection', (socket) => {
    console.log(`User connected with id ${socket.id}`);

    // User joins a room with their userId and receiverId (both are needed to identify the chat)
    socket.on('joinRoom', ({ senderId, receiverId }) => {
        const roomId = [senderId, receiverId].sort().join('_'); // Ensure the room ID is the same for both users
        socket.join(roomId);
        console.log(`User ${senderId} joined room: ${roomId}`);
    });

    // Handle sending and broadcasting a message
    socket.on('newMessage', (message) => {
        const { senderId, receiverId, content } = message;
        const roomId = [senderId, receiverId].sort().join('_');
        const timestamp = new Date().toISOString();

        const msgPayload = {
            sender: { _id: senderId },
            receiver: { _id: receiverId },
            content,
            timestamp,
        };

        // Emit the message to all clients in the room (sender and receiver)
        io.to(roomId).emit('newMessage', msgPayload);
        console.log(`Message from ${senderId} to ${receiverId}: ${content}`);
    });

    socket.on('disconnect', () => {
        console.log(`User disconnected with id ${socket.id}`);
    });
});

// Listening to ports
server.listen(PORT, () => {
    if (NODE_ENV !== 'pro') {
        console.log(`Server listening at http://localhost:${PORT}`);
    } else {
        console.log('Server is running in production mode');
    }
});

// import cluster from 'cluster';
// import os from 'os';
// const totalCpus = os.cpus().length;

//Cluster logic (deploying on render that's why not using it right now)
// if (cluster.isPrimary) {
//     console.log('Forking...');
//     for (let i = 0; i < totalCpus; i++) {
//         cluster.fork();
//     }
//     console.log('Forking complete!');
// } else {
//     //Listening to ports
//     server.listen(PORT, () => {
//         if (NODE_ENV !== 'pro') {
//             console.log(`Server listening at http://localhost:${PORT}`);
//         } else {
//             console.log('Server is running in production mode');
//         }
//     });
// }