/** @format */

// client.js
const io = require("socket.io-client");
const playwright = require("playwright");
const { v4: uuidv4 } = require("uuid");
const fs = require("fs");
// import functions
const {
  loginFunc,
  cookieFunc,
  progressFunc,
  secondProgressFunc,
  chestScanFunc,
  clanCheckFunc,
  isEmptyFunc,
  noScrollFunc,
  noChestFunc,
  adSkipFunc,
  openBanksPageFunc,
  preventLogoutFunc,
  openChests,
  gameLoaded,
  gameLoaded2,
} = require("./gameFunctions");

// Адрес сервера
const socket = io(process.env.API_URL + `/node`, {
  transports: ["websocket"], // Использование WebSocket транспорта
  pingTimeout: 60000, // Время ожидания пинга в миллисекундах (60 секунд)
  pingInterval: 25000, // Интервал между пингами (25 секунд)
});

// Событие успешного подключения
socket.on("connect", () => {
  console.log("Connected to server");
});

// Событие получения сообщения от сервера
socket.on("message", (data) => {
  console.log("Received message from server:", data);
});

// Событие отключения
socket.on("disconnect", () => {
  console.log("Disconnected from server");
});

// Событие ошибки
socket.on("connect_error", (error) => {
  console.error("Connection error:", error);
  console.log(process.env.API_URL);
});

function logMemoryUsage() {
  const used = process.memoryUsage();
  console.log(`Memory Usage: RSS: ${used.rss}, Heap Total: ${used.heapTotal}, Heap Used: ${used.heapUsed}`);
}

async function closeBrowser(browser, uuid, status = "ERROR") {
  await browser.close().then(() => {
    console.log("browser closed");
    socket.emit("status", { sessionId: "", message: "ready" });
    socket.emit("session_status", {
      sessionId: uuid,
      end_time: new Date(),
      status,
    });
  });
}


async function checkGameLoadOrTimeout(page, browser, uuid) {
  console.log("page opened");

  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      console.log("Timeout reached. Closing browser...");
      closeBrowser(browser, uuid);
      reject(new Error("Timeout reached"));
    }, 30000);

    const interval = setInterval(async () => {
      if ((await gameLoaded(page)) || (await gameLoaded2(page))) {
        console.log("Game is loading");
        socket.emit("game is loading");
        clearInterval(interval);
        clearTimeout(timeout);
        resolve(); // завершить промис успешно
      }
    }, 3000);
  });
}


socket.on("run_cookie", async (payload) => {
  const uuid = uuidv4();

  function emitStatus(message) {
    socket.emit("status", { sessionId: uuid, message });
  }

  setInterval(() => {
    logMemoryUsage()
  }, 5000)

  socket.emit("session", {
    sessionId: uuid,
    startTime: new Date(),
    accountId: payload.accountId,
  });
  const { cookie, open } = payload;

  let cookieName = [];
  let cookieValue = [];

  const cookies = {};

  for (let n = 0; n < Object.keys(cookie).length; n++) {
    cookieName[n] = Object.keys(cookie)[n];
    cookieValue[n] = Object.values(cookie)[n];

    cookies[n] = {
      name: cookieName[n],
      value: cookieValue[n],
      domain: ".totalbattle.com",
      path: "/",
      secure: true,
      httpOnly: true,
    };
  }

  emitStatus("opening page");
  console.log("run account");

  console.log(process.env.HEADLESS === "true");
  const browser = await playwright["chromium"].launch({
    headless: process.env.HEADLESS === "true",
  });
  console.log("browser opened");
  const context = await browser.newContext();
  const page = await context.newPage().catch((e) => {
    console.log(e);
    closeBrowser(browser, uuid);
  });
  await context.addCookies(Object.values(cookies)).catch((e) => {
    console.log(e);
    closeBrowser(browser, uuid);
  });
  page.goto(payload.address).catch((e) => {
    console.log(e);
  });


  await checkGameLoadOrTimeout(page, browser, uuid)

  console.log("page opened");
  let count = 0;

  //const mainPageBuffer = await page.screenshot()

  //upload(mainPageBuffer, 'mainPage.png')

  cookieFunc(page);

  const resultProgress = await progressFunc(page, socket).catch(async (err) => {
    await page.screenshot({ path: "screenshots/error.png" });
    socket.emit("error", "wrong cookies");
    console.log(
      "An error has occured during execution of progress function:",
      err
    );
    await closeBrowser(browser, uuid, "ERROR");
    return false;
  });

  if (!resultProgress) {
    return;
  }

  let exitCondition = false
  do {
    exitCondition = await secondProgressFunc(page).catch((e) => {
      console.log(e);
      closeBrowser(browser, uuid, "ERROR");
    });
  } while (!exitCondition)

  //preventLogoutFunc(page).catch(() => {
  //  closeBrowser(browser, uuid, "ERROR");
  //})
  await adSkipFunc(page, emitStatus);

  await openBanksPageFunc(page, emitStatus);
  //saving avatar

  let isEmpty = await isEmptyFunc(page);

  if (!isEmpty) {
    const noScrollExec = await noScrollFunc(
      page,
      count,
      "triumphchest",
      socket
    );
    console.log(noScrollExec);
    if (!noScrollExec) {
      await chestScanFunc(
        page,
        count,
        "triumphchest",
        socket,
        payload.accountId,
        uuid,
        browser,
        closeBrowser
      );
    }
  }

  await page.mouse.click(500, 145); // clicks on chests button

  isEmpty = await isEmptyFunc(page);

  if (!isEmpty) {
    const noScrollExec = await noScrollFunc(page, count, "chest", socket);
    console.log(noScrollExec);
    if (!noScrollExec) {
      try {
        await chestScanFunc(
          page,
          count,
          "chest",
          socket,
          payload.accountId,
          uuid,
          browser,
          closeBrowser
        );
      } catch (err) {
        console.log(err)
        await chestScanFunc(page,
          count,
          "chest",
          socket,
          payload.accountId,
          uuid,
          browser,
          closeBrowser)
      }
    }
  }

  if (open) {
    console.log("open chests");
    await openChests(page);
  }

  await closeBrowser(browser, uuid, "DONE");
});

socket.on("run_account", async (payload) => {
  // emitStatus("error")
  return;
  // init page
  socket.emit("status", "opening page");
  console.log("run account");
  const browser = await playwright["chromium"].launch({ headless: false });
  console.log("browser opened");
  const context = await browser.newContext();
  const page = await context.newPage();
  await page.goto(payload.address).catch((e) => {
    console.log(e);
    closeBrowser(browser);
  });
  console.log("page opened");

  await loginFunc(page, payload);

  //bot authentication required

  await cookieFunc(page);

  await progressFunc(page);

  await secondProgressFunc(page);

  await adSkipFunc(page);

  //saving avatar

  await openBanksPageFunc(page);

  await chestScanFunc(
    page,
    count,
    "triumphchest",
    socket,
    payload.accountId,
    uuid
  );

  await chestScanFunc(page, count, "chest", socket, payload.accountId, uuid);

  socket.emit("status", "ready");
  await page.waitForTimeout(30000);

  /*  смотреть насколько загрузилась игра и слать статус в WS  (wait until 100%) (+)
        Подождать вторую загрузку (+)
        emit = game loaded (+)
        нажать esc несколько раз, потом подождать секунду-две и снова нажать несколько раз (+)
        emit = ready for opening (+)
        скриншот аватарки, вытаскиваем доп данные (после MVP), шлем аватарку на бэк (послать картинку по WS)
        emit = saving banks (+)
        Открываем клан, открываем подарки, заходим в триумфальные подарки (+)
        скриншотим триумфальные подарки (открываем по необходимости) (+)
        emit = saving chests
        Заходим в просто подарки (+)
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

  await closeBrowser(browser, "DONE");
});
