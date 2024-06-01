// client.js
const io = require('socket.io-client');

const db = require('./database')


// синхронизация дб после запуска
db.sequelize.sync({ force: true })
    .then(() => {
        console.log("Synced db.");
    })
    .catch((err) => {
        console.log("Failed to sync db: " + err.message);
    });



// Адрес сервера
const socket = io('http://localhost:3000', {
    transports: ['websocket'], // Использование WebSocket транспорта
});

// Событие успешного подключения
socket.on('connect', () => {
    console.log('Connected to server');

    // Можно отправлять сообщения на сервер
    socket.emit('message', 'Hello from client!');
});

// Событие получения сообщения от сервера
socket.on('message', (data) => {
    console.log('Received message from server:', data);
});

// Событие отключения
socket.on('disconnect', () => {
    console.log('Disconnected from server');
});

// Событие ошибки
socket.on('connect_error', (error) => {
    console.error('Connection error:', error);
});
