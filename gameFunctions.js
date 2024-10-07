/** @format */

const PNG = require("pngjs").PNG;
const pixelmatch = require("pixelmatch");

const axios = require('axios');
const fs = require("fs");


async function loginFunc(page, payload) {
  try {
    const login_btn = page.locator(
      "#registration > div.popup-stretch__content > div > form > div.aligncenter.t1_14.mb10 > span"
    );
    await login_btn.click();

    const login = page.locator(
      "#login > div.popup-stretch__content > form > div:nth-child(2) > div > input[type=email]"
    );
    await login.fill(payload.login);

    const password = page.locator(
      "#login > div.popup-stretch__content > form > div:nth-child(3) > div > input[type=password]"
    );
    await password.fill(payload.password);

    await page.keyboard.press("Enter");

    await page.screenshot({ path: "screenshots/checking1.png" });
    await page.waitForTimeout(4000);

    await page.screenshot({ path: "screenshots/checking2.png" });

    console.log("Login function executed successfuly");
  } catch (err) {
    console.log(
      "An error has occured during execution of login function:",
      err
    );
  }
}

async function cookieFunc(page) {
  try {
    await page.waitForTimeout(Math.random() * 1000);
    const cookie_button = await page.locator("#cky-btn-accept");
    await cookie_button.click();

    console.log("Cookie function executed successfuly");
  } catch (err) {
    console.log(
      "An error has occured during execution of cookie function:",
      err
    );
  }
}

async function preventLogoutFunc(page) {
  let prevent = false

  while (!prevent) {

    if (!page) return

    await page.screenshot({
      path: "screenshots/preventlogout.png",
      clip: { x: 544, y: 208, width: 180, height: 180 },
    });


    const preventlogout = PNG.sync.read(
      fs.readFileSync("screenshots/preventlogout.png")
    );
    const idealprevent = PNG.sync.read(
      fs.readFileSync("ideal_screenshots/idealpreventlogout.png")
    );
    const { width, height } = preventlogout;

    const diff = new PNG({ width, height });

    const diffPixels = pixelmatch(
      preventlogout.data,
      idealprevent.data,
      diff.data,
      width,
      height,
      { threshold: 0.1 }
    );

    if (diffPixels < 50) {
      console.log("prevent")
      prevent = true
    }
    await page.waitForTimeout(5000);

  }

  throw new Error('reload')

}


async function progressFunc(page, socket) {

  let progressBarValue = "";
  const progress_bar = await page.locator(
    "#game_frame > div.webgl-content > div.game-loading-screen > div.game-loading-screen__container.zindex-2 > div.game-loading-indicator > div.game-loading-progress-bar > div.game-loading-progress-bar__progress-percents"
  );

  while (progressBarValue !== "100%") {
    progressBarValue = await progress_bar.innerHTML();
    await page.screenshot({ path: "screenshots/loading.png" });

    socket.emit("progress", progressBarValue);
    console.log(progressBarValue);
    await page.waitForTimeout(2000);
  }
  console.log("finished");

  console.log("Progress function executed successfuly");
  return true
}

async function secondProgressFunc(page) {
  await page.waitForTimeout(2000);

  await page.screenshot({
    path: "screenshots/secondprogress.png",
    clip: { x: 444, y: 48, width: 529, height: 40 },
  });

  const secondprogress = PNG.sync.read(
    fs.readFileSync("screenshots/secondprogress.png")
  );
  const isloaded = PNG.sync.read(
    fs.readFileSync("ideal_screenshots/isloaded.png")
  );
  const { width, height } = secondprogress;

  const diff = new PNG({ width, height });

  const diffPixels = pixelmatch(
    secondprogress.data,
    isloaded.data,
    diff.data,
    width,
    height,
    { threshold: 0.1 }
  );

  if (diffPixels > 5000) {
    await secondProgressFunc(page);
  }

  console.log("Second progress function executed successfuly");

}

async function chestScanFunc(page, count, name, socket, accId, sId) {
  try {
    let scrollDiffPixels = 0;
    do {
      count++;
      await page.screenshot({
        path: "screenshots/scroll.png",
        clip: { x: 1090, y: 540, width: 30, height: 60 },
      });
      await page.mouse.click(180, 250); // clicks on banks button to prevent afk ad from showing up
      let chestBuffer = await page.screenshot({
        path: `screenshots/${name}s/${name}${count}.png`,
        clip: { x: 382, y: 193, width: 701, height: 80 },
      });

      let res = await axios.post(`${process.env.API_URL}/db`, { accountId: accId, sessionId: sId })
      let { uploadLink, downloadLink, chestId } = res.data

      axios.put(uploadLink, chestBuffer, {
        headers: {
          'Content-Type': 'image/png'
        }
      }).then((response) => {
        socket.emit('cheststatus', 'UPLOADED', chestId)
      }).catch((e) => {
        console.log(e)
      })

      const scroll = PNG.sync.read(fs.readFileSync("screenshots/scroll.png"));
      const scrollFinished = PNG.sync.read(
        fs.readFileSync("ideal_screenshots/scroll_finished.png")
      );
      const { width, height } = scroll;

      const scrollDiff = new PNG({ width, height });

      scrollDiffPixels = pixelmatch(
        scroll.data,
        scrollFinished.data,
        scrollDiff.data,
        width,
        height,
        { threshold: 0.1 }
      );
      await page.mouse.move(700, 370);
      await page.mouse.wheel(0, 500);
      await page.mouse.wheel(0, 500);
    } while (scrollDiffPixels > 7);

    await lastChestsFunc(page, name, count);
    await lastChestsUploadFunc(name, count, socket, accId, sId);
  } catch (err) {
    console.log(
      "An error has occured during an execution of chest scan function",
      err
    );
  }
}

async function clanCheckFunc(page) {
  try {
    await page.mouse.click(700, 640); // clicks on clan button
    await page.waitForTimeout(500);
    await page.mouse.click(700, 640); // clicks on clan button
    await page.waitForTimeout(500);
    await page.screenshot({
      path: "screenshots/clan.png",
      clip: { x: 140, y: 90, width: 1000, height: 34 },
    });

    const clan = PNG.sync.read(fs.readFileSync("screenshots/clan.png"));
    const hopefullyClan = PNG.sync.read(
      fs.readFileSync("ideal_screenshots/ideal_clan.png")
    );
    const { width, height } = clan;

    const clanDiff = new PNG({ width, height });

    const clanDiffPixels = pixelmatch(
      clan.data,
      hopefullyClan.data,
      clanDiff.data,
      width,
      height,
      { threshold: 0.1 }
    );

    if (clanDiffPixels > 1000) {
      await clanCheckFunc(page);
    }

    console.log("Clan check function executed successfuly");
  } catch (err) {
    console.log(
      "An error has occured during execution of clan check function:",
      err
    );
  }
}

async function isEmptyFunc(page) {
  await page.screenshot({
    path: "screenshots/triumphchestlistempty.png",
    clip: { x: 500, y: 225, width: 612, height: 350 },
  });

  await page.waitForTimeout(1000);
  const isEmptyList = PNG.sync.read(
    fs.readFileSync("screenshots/triumphchestlistempty.png")
  );
  const idealList = PNG.sync.read(
    fs.readFileSync("ideal_screenshots/ideal_list.png")
  );
  const { width, height } = isEmptyList;

  const diff = new PNG({ width, height });

  const diffPixels = pixelmatch(
    isEmptyList.data,
    idealList.data,
    diff.data,
    width,
    height,
    { threshold: 0.1 }
  );

  if (diffPixels < 5000) {
    console.log("empty");
    return true;
  } else {
    console.log("not empty");
    return false;
  }
}

async function noScrollFunc(page, count, name, socket) {
  /**
   * TODO Rewrite this function to have ONE PURPOSE
   */
  try {
    await page.screenshot({
      path: "screenshots/no_scroll.png",
      clip: { x: 1090, y: 160, width: 27, height: 450 },
    });

    const noScroll = PNG.sync.read(
      fs.readFileSync("screenshots/no_scroll.png")
    );
    const idealScroll = PNG.sync.read(
      fs.readFileSync("ideal_screenshots/ideal_scroll.png")
    );
    const { width, height } = noScroll;

    const diff = new PNG({ width, height });

    const diffPixels = pixelmatch(
      noScroll.data,
      idealScroll.data,
      diff.data,
      width,
      height,
      { threshold: 0.1 }
    );

    if (diffPixels > 100) {
      console.log("no scroll");

      count++;
      await lastChestsFunc(page, name, count, true);

      await noChestFunc(name);
      await lastChestsUploadFunc(name, count, socket)

      return true;
    } else {
      return false;
    }
  } catch (err) {
    console.log(
      "An error has occured during an execution of open banks page function",
      err
    );
  }
}

async function noChestFunc(name) {
  try {
    console.log("executing no chest func...");
    for (let n = 1; n < 5; n++) {
      console.log("for loop started, iteration:" + n);
      const noChest = PNG.sync.read(
        fs.readFileSync(`screenshots/${name}s/${name}${n}.png`)
      );
      const emptyChest = PNG.sync.read(
        fs.readFileSync("ideal_screenshots/no_chest.png")
      );
      const { width, height } = noChest;

      const diff = new PNG({ width, height });

      const diffPixels = pixelmatch(
        noChest.data,
        emptyChest.data,
        diff.data,
        width,
        height,
        { threshold: 0.1 }
      );
      console.log("no chest or yes chest: " + diffPixels);
      if (diffPixels < 10000) {
        console.log(`chest ${n} deleted`);
        fs.unlinkSync(`screenshots/${name}s/${name}${n}.png`);
      }
    }
  } catch (err) {
    console.log(
      "An error has occured during an execution of no chest function",
      err
    );
  }
}
async function adSkipFunc(page, emitStatus) {
  try {
    await page.screenshot({ path: "screenshots/finished.png" });
    await page.waitForTimeout(2000);
    await page.screenshot({
      path: "screenshots/cross.png",
      clip: { x: 1244, y: 52, width: 30, height: 28 },
    });

    const cross = PNG.sync.read(fs.readFileSync("screenshots/cross.png"));
    const idealcross = PNG.sync.read(
      fs.readFileSync("ideal_screenshots/idealcross.png")
    );
    const { width, height } = cross;

    const diff = new PNG({ width, height });

    const diffPixels = pixelmatch(
      cross.data,
      idealcross.data,
      diff.data,
      width,
      height,
      { threshold: 0.1 }
    );

    fs.writeFileSync("difference.png", PNG.sync.write(diff));

    if (diffPixels < 100) {
      // console.log(diffPixels);

      await page.waitForTimeout(2000);
      await page.mouse.click(1244, 52);
      await page.waitForTimeout(2000);
    }

    emitStatus("game loaded")
    await page.screenshot({ path: "screenshots/gameloaded.png" });
    console.log("game loaded");

    await page.waitForTimeout(2000);

    await page.keyboard.press("Escape");
    await page.keyboard.press("Escape");
    await page.keyboard.press("Escape");

    await page.waitForTimeout(2000);

    await page.keyboard.press("Escape");
    await page.keyboard.press("Escape");
    await page.keyboard.press("Escape");

    await page.screenshot({ path: "screenshots/readyforopening.png" });
    emitStatus("ready for opening");
    console.log("ready for opening");

    console.log("Ad skip function executed successfuly");
  } catch (err) {
    console.log(
      "An error has occured during execution of ad skip function:",
      err
    );
  }
}

async function openBanksPageFunc(page, emitStatus) {
  try {
    emitStatus("saving banks"); // вынести вне функции
    console.log("saving banks");

    await clanCheckFunc(page);

    await page.waitForTimeout(1000);
    await page.mouse.click(180, 250); // clicks on banks button

    await page.waitForTimeout(1000);
    await page.mouse.click(700, 145);

    // clicks on triumph chests button
  } catch (err) {
    console.log(
      "An error has occured during an execution of open banks page function",
      err
    );
  }
}

async function lastChestsFunc(page, name, count, lastChests) {
  try {
    let x = 0;
    if (lastChests) {
      x = x + 5;
    }
    await page.screenshot({
      path: `screenshots/${name}s/${name}${count}.png`,
      clip: { x: 382, y: 198 - x, width: 701, height: 80 },
    });

    count++;
    await page.screenshot({
      path: `screenshots/${name}s/${name}${count}.png`,
      clip: { x: 382, y: 298 - x, width: 701, height: 80 },
    });

    count++;
    await page.screenshot({
      path: `screenshots/${name}s/${name}${count}.png`,
      clip: { x: 382, y: 398 - x, width: 701, height: 80 },
    });

    count++;
    await page.screenshot({
      path: `screenshots/${name}s/${name}${count}.png`,
      clip: { x: 382, y: 498 - x, width: 701, height: 80 },
    });

  } catch (err) {
    console.log(
      "An error has occured during an execution of last chests function",
      err
    );
  }
}

async function lastChestsUploadFunc(name, count, socket, accId, sId) {
  try {
    count--
    for (let n = 1; n < 5; n++) {
      count++
      if (fs.existsSync(`screenshots/${name}s/${name}${count}.png`)) {
        const chestBuffer = fs.readFileSync(`screenshots/${name}s/${name}${count}.png`)
        let res = await axios.post(`${process.env.API_URL}/db`)
        let { uploadLink, downloadLink, chestId } = res.data

        await axios.put(uploadLink, chestBuffer, {
          headers: {
            'Content-Type': 'image/png'
          }
        })

        socket.emit('cheststatus', 'UPLOADED', chestId)

        //upload(chestBuffer, `${name + count}_${await chestid}.png`);
      }

    }
  } catch (err) {
    console.log(
      "An error has occured during an execution of last chests function",
      err
    );
  }
}

module.exports = {
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
  preventLogoutFunc
};
