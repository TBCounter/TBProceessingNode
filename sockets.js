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
const socket = io(process.env.API_URL + `/node`, {
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
    console.log(process.env.API_URL + `/node`)
    console.error('Connection error:', error);
});


//create another socket on RUN ACCOUNT COOKIES
socket.on('run_account', async (payload) => {
    // init page
    socket.emit('status', 'opening page');
    const browser = await playwright['chromium'].launch({ headless: false });
    const context = await browser.newContext();
    const page = await context.newPage();
    await page.goto(payload.address);

    await loginFunc(page, payload)

    //bot authentication required

    await cookieFunc(page)

    await progressFunc(page)

    //second progress

    await adSkipFunc(page)

    //saving avatar

    await openBanksFunc(page)
    await page.waitForTimeout(30000)


    /*  смотреть насколько загрузилась игра и слать статус в WS  (wait until 100%) (+)
        Подождать вторую загрузку (+)
        emit = game loaded (+)
        нажать esc несколько раз, потом подождать секунду-две и снова нажать несколько раз (+)
        emit = ready for opening (+)
        скриншот аватарки, вытаскиваем доп данные (после MVP), шлем аватарку на бэк (послать картинку по WS)
        emit = saving banks (+)
        Открываем клан, открываем подарки, заходим в триумфальные подарки (+)
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

async function loginFunc(page, payload) {
    try {
        const login_btn = page.locator('#registration > div.popup-stretch__content > div > form > div.aligncenter.t1_14.mb10 > span')
        await login_btn.click();

        const login = page.locator("#login > div.popup-stretch__content > form > div:nth-child(2) > div > input[type=email]")
        await login.fill(payload.login)

        const password = page.locator("#login > div.popup-stretch__content > form > div:nth-child(3) > div > input[type=password]")
        await password.fill(payload.password)

        await page.keyboard.press("Enter")

        await page.screenshot({ path: 'screenshots/checking1.png' });
        console.log('checking save 1')
        await page.waitForTimeout(4000);

        await page.screenshot({ path: 'screenshots/checking2.png' });
        console.log('checking save 2')

        console.log('Login function executed successfuly')
    } catch (err) {
        console.log('An error has occured during execution of login function:', err)
    }
}

async function cookieFunc(page) {
    try {
        await page.waitForTimeout(Math.random() * 1000);
        const cookie_button = await page.locator('#cky-btn-accept')
        await cookie_button.click()


        console.log('Cookie function executed successfuly')
    } catch (err) {
        console.log('An error has occured during execution of cookie function:', err)
    }
}

async function progressFunc(page) {
    try {
        let progressBarValue = '';
        const progress_bar = await page.locator('#game_frame > div.webgl-content > div.game-loading-screen > div.game-loading-screen__container.zindex-2 > div.game-loading-indicator > div.game-loading-progress-bar > div.game-loading-progress-bar__progress-percents')

        while (progressBarValue !== '100%') {
            progressBarValue = await progress_bar.innerHTML()
            await page.screenshot({ path: 'screenshots/loading.png' })
            socket.emit('progress', progressBarValue)
            console.log(progressBarValue)
            await page.waitForTimeout(2000)
        }
        console.log('finished')

        console.log('Progress function executed successfuly')
    } catch (err) {
        console.log('An error has occured during execution of progress function:', err)
    }
}

async function adSkipFunc(page) {
    try {
        await page.screenshot({ path: 'screenshots/finished.png' })
        await page.waitForTimeout(2000)
        await page.screenshot({ path: 'cross.png', clip: { x: 1244, y: 52, width: 30, height: 28 } });


        const cross = PNG.sync.read(fs.readFileSync('cross.png'));
        const idealcross = PNG.sync.read(fs.readFileSync('idealcross.png'));
        const { width, height } = cross

        const diff = new PNG({ width, height });

        const diffPixels = await pixelmatch(cross.data, idealcross.data, diff.data, width, height, { threshold: 0.1 })

        fs.writeFileSync('difference.png', PNG.sync.write(diff));

        if (diffPixels < 100) {
            console.log(diffPixels);

            await page.waitForTimeout(2000)
            await page.mouse.click(1244, 52);
            await page.waitForTimeout(2000)
        }

        socket.emit('status', 'game loaded')
        await page.screenshot({ path: 'screenshots/gameloaded.png' })
        console.log('game loaded')

        await page.waitForTimeout(2000)

        await page.keyboard.press('Escape');
        await page.keyboard.press('Escape');
        await page.keyboard.press('Escape');

        await page.waitForTimeout(2000)

        await page.keyboard.press('Escape');
        await page.keyboard.press('Escape');
        await page.keyboard.press('Escape');


        await page.screenshot({ path: 'screenshots/readyforopening.png' })
        socket.emit('status', 'ready for opening')
        console.log('ready for opening')


        console.log('Ad skip function executed successfuly')
    } catch (err) {
        console.log('An error has occured during execution of ad skip function:', err)
    }
}

async function openBanksFunc(page) {
    try {
        socket.emit('status', 'saving banks')
        console.log('saving banks')

        await page.waitForTimeout(1000)
        await page.screenshot({ path: 'screenshots/clicked.png', clip: { x: 700, y: 640, width: 60, height: 60 } });
        await page.mouse.click(700, 640);

        await page.waitForTimeout(1000)
        await page.mouse.click(180, 250);

        await page.waitForTimeout(1000)
        await page.mouse.click(700, 145);

        await page.screenshot({ path: 'screenshots/truimphchestlist.png' })


        console.log('Opening banks function executed successfuly')
    } catch (err) {
        console.log('An error has occured during execution of opening banks function:', err)
    }
}