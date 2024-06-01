// client.js
const io = require('socket.io-client');
const db = require('./database')
const playwright = require('playwright');

// синхронизация дб после запуска
db.sequelize.sync({ force: true })
    .then(() => {
        console.log("Synced db.");
    })
    .catch((err) => {
        console.log("Failed to sync db: " + err.message);
    });



// Адрес сервера
const socket = io('http://localhost:3000/node', {
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



socket.on('run_account', async (payload) => {
    const browser = await playwright['chromium'].launch({ headless: false });
    const context = await browser.newContext();
    const page = await context.newPage();
    await page.goto(payload.address);
    // await page.waitForSelector('#registration > div.popup-stretch__content > div > form > div.aligncenter.t1_14.mb10 > span');
    await page.screenshot({ path: `1.png`, fullPage: true });
    const login_btn = page.locator('#registration > div.popup-stretch__content > div > form > div.aligncenter.t1_14.mb10 > span')
    await login_btn.click();

    const login = page.locator("#login > div.popup-stretch__content > form > div:nth-child(2) > div > input[type=email]")
    await login.fill(payload.login)
    const password = page.locator("#login > div.popup-stretch__content > form > div:nth-child(3) > div > input[type=password]")
    await password.fill(payload.password)

    const login_button = page.locator('#login > div.popup-stretch__content > form > div:nth-child(4) > button')
    await login_button.click()
    await page.screenshot({ path: `nodejs_chromium.png`, fullPage: true });

    // await browser.close().then(() => {
    //     console.log('browser closed')
    // });
})