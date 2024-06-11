// client.js
const io = require('socket.io-client');
const db = require('./database')
const playwright = require('playwright');
const fs = require('fs');


// init OCR

// pixelmatch
const PNG = require('pngjs').PNG;
const pixelmatch = require('pixelmatch');

// синхронизация дб после запуска
db.sequelize.sync({ force: true })
    .then(() => {
        console.log("Synced db.");
    })
    .catch((err) => {
        console.log("Failed to sync db: " + err.message);
    });


// Адрес сервера
const socket = io(process.env.API_URL+`/node`, {
    transports: ['websocket'], // Использование WebSocket транспорта
});



// Событие успешного подключения
socket.on('connect', () => {
    console.log('Connected to server');

    // Можно отправлять сообщения на сервер
    socket.emit('status', 'ready');
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
    console.log(process.env.API_URL+`/node`)
    console.error('Connection error:', error);
});



socket.on('run_account', async (payload) => {
    socket.emit('status', 'opening page');
    const browser = await playwright['chromium'].launch({ headless: false });
    const context = await browser.newContext();
    const page = await context.newPage();
    await page.goto(payload.address);
    // await page.waitForSelector('#registration > div.popup-stretch__content > div > form > div.aligncenter.t1_14.mb10 > span');
    // await page.screenshot({ path: `1.png`, fullPage: true });
    const login_btn = page.locator('#registration > div.popup-stretch__content > div > form > div.aligncenter.t1_14.mb10 > span')
    await login_btn.click();

    const login = page.locator("#login > div.popup-stretch__content > form > div:nth-child(2) > div > input[type=email]")
    await login.fill(payload.login)
    const password = page.locator("#login > div.popup-stretch__content > form > div:nth-child(3) > div > input[type=password]")
    await password.fill(payload.password)

    //add fucntion to repeat button click if bot check is failed
    //body > div.font2.error_tooltip.left
    // await login_button.click()
    await page.keyboard.press("Enter")

    await page.screenshot({ path: 'screenshots/checking1.png' });
    console.log('checking save 1')
    await page.waitForTimeout(2000);


    const bot_check_failed = page.locator('body > div.font2.error_tooltip.left')
    if (bot_check_failed) {
        const page2 = await context.newPage();
        await page2.waitForTimeout(500);
        await page2.goto('https://www.google.com/search?q=why+exploiting+software+is+unethical&rlz=1C1FHFK_ruKG1099KG1099&oq=why+exploiting+software+is+unethical&gs_lcrp=EgZjaHJvbWUyBggAEEUYOTIHCAEQIRigAdIBCTEwMTk0ajBqN6gCALACAA&sourceid=chrome&ie=UTF-8');
        await page2.waitForTimeout(500);
        await page2.close()
        const login_button = page.locator('#login > div.popup-stretch__content > form > div:nth-child(4) > button')
        await login_button.click()
    } 

    //await page.mouse.move(100, 300);
    //await login_button.click()

    await page.screenshot({ path: 'screenshots/checking2.png' });
    console.log('checking save 2')

    // const gameContainer = await page.locator('#gameContainer')
    let progressBarValue = '';
    
    try{

        const progress_bar = await page.locator('#game_frame > div.webgl-content > div.game-loading-screen > div.game-loading-screen__container.zindex-2 > div.game-loading-indicator > div.game-loading-progress-bar > div.game-loading-progress-bar__progress-percents')

        while (progressBarValue !== '100%') {
            progressBarValue = await progress_bar.innerHTML()
            await page.screenshot({ path: 'screenshots/loading.png' })
            socket.emit('progress', progressBarValue)
            console.log(progressBarValue)
            await page.waitForTimeout(2000)
        }
    }
    catch{
        console.log('no progress')

        await browser.close().then(() => {
            console.log('browser closed')
        });
        return 
    }


    
    console.log('finished')
    await page.screenshot({ path: 'screenshots/finished.png' })
    await page.waitForTimeout(2000)
    await page.screenshot({ path: 'cross.png', clip: { x: 1244, y: 52, width: 30, height: 28 } });


    const cross = PNG.sync.read(fs.readFileSync('cross.png'));
    const idealcross = PNG.sync.read(fs.readFileSync('idealcross.png'));
    const {width, height} = cross

    const diff = new PNG({width, height});

    pixelmatch(cross.data, idealcross.data, diff.data, width, height, {threshold: 0.1})

    fs.writeFileSync('difference.png', PNG.sync.write(diff));
    /* смотреть насколько загрузилась игра и слать статус в WS  (wait until 100%)
        Подождать вторую загрузку
        emit = game loaded
        нажать esc несколько раз, потом подождать секунду-две и снова нажать несколько раз
        emit = ready for opening
        скриншот аватарки, вытаскиваем доп данные (после MVP), шлем аватарку на бэк (послать картинку по WS)
        emit = saving banks
        Открываем клан, открываем подарки, заходим в триумфальные подарки
        скриншотим триумфальные подарки (открываем по необходимости)
        emit = saving chests
        Заходим в просто подарки
        скриншотим подарки, сохраняем скриншоты и записываем в БД ссылки на скриншоты
        нажимаем кнопки "удалить просроченные" и "получить сундуки" ПОСЛЕ ТОГО КАК УБЕДИЛИСЬ, ЧТО ВСЕ БЕЗ ИСКЛЮЧЕНИЯ СУНДУКИ ЗАСКРИНШОТИЛИСЬ
        Конец Фазы I

        emit = reading chests
        Запускаем процесс чтения через OCR 
        Каждый прочитанный сундук отправляем на бэк последовательно и сохраняем их в БД в postgres
        Конец Фазы II 

        emit = ready
        return    
    */


    // await page.screenshot({ path: `nodejs_chromium.png`, fullPage: true });

    await browser.close().then(() => {
        console.log('browser closed')
    });
})