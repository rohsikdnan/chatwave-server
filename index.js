const express = require('express');
const cors = require('cors');
const socketio = require('socket.io');
const http = require('http');

const PORT = 4000;

const app = express();
app.use(cors());

app.get('/api', (req, res) => {
    res.send('hhii')
})

const server = http.createServer(app);
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));

const io = socketio(server, {
    cors: {
        origin: 'http://localhost:5173/'
    }
})

let users = [];

const addUser = (user) => {
    users.push(user)
    users = users.reduce((acc, user) => {
        const existingUser = acc.find(u => u.id === user.id && u.email !== null);
        if (!existingUser && user.email !== null) {
            acc.push(user);
        }
        return acc;
    }, []);
}

const removeUser = (id) => {
    const index = users.findIndex((user) => user.id === id);

    users = users.filter(user => user.id !== id);
}

const getUser = (id) => users.find((user) => user.id === id);


io.on('connection', (socket) => {
    console.log(socket.id, 'connected')
    socket.on('newUser', (email) => {
        addUser({
            email,
            id: socket.id,
            typing: {
                status: false,
                to: null
            }
        });
        io.emit('newUserResponse', users);
    });

    socket.on('typing', (from, status, to) => {
        const user = users.find((user) => user.email === from);
        if (user) {
            user.typing.to = to;
            user.typing.status = status;
        }
        io.emit('newUserResponse', users);
    });


    socket.on('disconnect', () => {
        console.log(socket.id, '🔥: A user disconnected');
        removeUser(socket.id);
        io.emit('newUserResponse', users);
    });
});
