const { Telegraf } = require('telegraf'),
bot = new Telegraf('1699318886:AAGwLmHIQkmZ2k9aqCbAJxbO-Ytrp60vvks'),
request = require('request'),
cheerio = require('cheerio'),
schedule = require('node-schedule'),
celebrationsUrl = 'http://kakoysegodnyaprazdnik.ru/';
let job, birthday, nameDay1, nameDay2;

bot.telegram.setWebhook('https://prazdnikbot.herokuapp.com/' + bot.telegram.token);

const getHtml = async () => {
    const html = await new Promise((resolve, reject) => {
        request.get(celebrationsUrl, (err, res, body) => {
            if (err) {
                reject(err);
            } else {
                resolve(body);
            }
        });
    });
    return html;
}

const getCelebrations = html => {
    const celebrations = [];
    const $ = cheerio.load(html);
    $('div.listing_wr div div.main span[itemprop="text"]')
    .each((i, celebration) => celebrations.push($(celebration).text()));
    return celebrations;
}

const getSeason = today => {
    const currentMonth = today.getMonth();
    let season;
    
    if (currentMonth >= 2 && currentMonth < 5) {
        season = 'spring';
    } else if (currentMonth >= 5 && currentMonth < 8) {
        season = 'summer';
    } else if (currentMonth >= 8 && currentMonth < 11) {
        season = 'autumn';
    } else {
        season = 'winter';
    }

    return season;
}

const sendCelebrations = (id, celebrations) => {
    let message = 'Витаю з:\n\n✅';
    message += celebrations.join('\n\n✅')
    bot.telegram.sendMessage(id, message);
}

const stop = reason => {
    bot.stop(reason);
    job.cancel(false);
    birthday.cancel(false);
    nameDay1.cancel(false);
    nameDay2.cancel(false);
}

bot.start(async ctx => {
    const today = new Date();
    const season = getSeason(today);
    const imagesUrl = `https://source.unsplash.com/random/1600x900/?nature, ${season}&${today.getTime()}`;    

    await ctx.replyWithPhoto(imagesUrl, { caption: 'Праздники каждый день 🎉✨🎆🌯' });

    const html = await getHtml();
    const celebrations = getCelebrations(html);
    schedule.cancelJob(job);
    schedule.cancelJob(birthday);
    schedule.cancelJob(nameDay1);
    schedule.cancelJob(nameDay2);
    job = schedule.scheduleJob({rule: '0 0 * * *', tz: 'Europe/Kiev'},
    () => sendCelebrations(ctx.chat.id, celebrations));
    birthday = schedule.scheduleJob({rule :'0 0 9 10 *', tz: 'Europe/Kiev'},
    () => ctx.reply('С ДНЬОМ РОДЖЕНИЯ!!🎉!🎂💞'));
    nameDay1 = schedule.scheduleJob({rule: '0 0 27 8 *', tz: 'Europe/Kiev'},
    () => ctx.reply('ПОЗДОРОВЛЯЮ С ИМЕНИНАМИ❤️🧡💛💚💙💜🤍🖤'));
    nameDay2 = schedule.scheduleJob({rule: '0 0 2 12 *', tz: 'Europe/Kiev'},
    () => ctx.reply('ПОЗДОРОВЛЯЮ С ИМЕНИНАМИ❤️🧡💛💚💙💜🤍🖤'));

    sendCelebrations(ctx.chat.id, celebrations);
});

bot.command('again', async ctx => {
    const html = await getHtml();
    const celebrations = getCelebrations(html);
    sendCelebrations(ctx.chat.id, celebrations);
});

bot.command('help', ctx => ctx.reply('Список доступных команд:\n\n/start - начало работы\n/again - поздравить заново'));

bot.on('message', ctx => {
    ctx.reply('Отпиши моему хозяину в личку пжжж🙏🏻\n@f_pril');
});

process.once('SIGINT', () => stop('SIGINT'));
process.once('SIGTERM', () => stop('SIGTERM'));

module.exports = bot;