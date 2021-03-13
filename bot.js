const { Telegraf } = require('telegraf'),
bot = new Telegraf(process.env.BOT_TOKEN, { polling: true }),
request = require('request'),
cheerio = require('cheerio'),
schedule = require('node-schedule'),
User = require('./user.model'),
dataUrls = ['http://kakoysegodnyaprazdnik.ru/', 'https://my-calend.ru/name-days/today'],
rule = '0 0 * * *',
dataParses = ['div.listing_wr div div.main span[itemprop="text"]', 'article.name-days-day table'];
let job = {};

bot.telegram.setWebhook('https://prazdnikbot.herokuapp.com/secret-path');

const getPages = async () => {
    const pages = [];
    for (url of dataUrls) {
        const html = await new Promise((resolve, reject) => {
            request.get(url, (err, res, body) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(body);
                }
            });
        });
        pages.push(html);
    }
    return pages;
}

const getMessages = pages => {
    const messages = {
        celebrations: [],
        nameDays: {
            men: [],
            girls: []
        }
    };

    let $ = cheerio.load(pages[0]);
    $(dataParses[0]).each((i, celebration) => messages.celebrations.push($(celebration).text()));

    $ = cheerio.load(pages[1]);
    $(dataParses[1]).each((i, table) => {
        const names = [];
        $('tr td a', table).each((i, name) => names.push($(name).text()));
        switch($(table.previousSibling).text()) {
            case 'Мужчины':
                messages.nameDays.men = names;
                break;
            case 'Женщины':
                messages.nameDays.girls = names;
        }
    });

    return messages;
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

const sendMessages = async user => {
    const today = new Date();
    const season = getSeason(today);
    const imageUrl = `https://source.unsplash.com/random/1600x900/?nature, ${season}&${today.getTime()}`;
    const pages = await getPages();
    const messages = getMessages(pages);
    let message = `*Праздники каждый день* 🎉✨🎆🌯\n\n🗓${today.toLocaleDateString('en-GB', {timeZone: 'Europe/Kiev'})}\n\n*Поздравляю с:*\n\n✅`;
    message += messages.celebrations.join('\n\n✅');
    message += '\n\n*Именины у:*';
    if (messages.nameDays.men.length) {
        message += `\n\n🕺🏻🕺🏻🕺🏻 ${messages.nameDays.men.join(', ')}`;
    }
    if (messages.nameDays.girls.length) {
        message += `\n\n💃🏻💃🏻💃🏻 ${messages.nameDays.girls.join(', ')}`;
    }
    message = message.split(/[()]/).join('\\(');
    bot.telegram.sendPhoto(user.chatId, imageUrl, { caption: message, parse_mode: 'MarkdownV2'});
}

const saveUser = data => {
    const user = new User(data);
    user.save((error, user) => {
        if (error) {
            console.log(`user already created: {name: ${data.name}, chatId: ${data.chatId}}`);
        } else {
            console.log(`saved: {name: ${user.name}, chatId: ${user.chatId}}`);
        }
    });
}

const doJob = user => {
    schedule.cancelJob(job[user.name]);
    job[user.name] = schedule.scheduleJob({rule: rule, tz: 'Europe/Kiev'},
    () => sendMessages(user));
}

const initBot = () => {
    User.find({}, (error, users) => {
        if (error) {
            console.log(error);
        } else {
            users.forEach(user => {
                doJob(user);
                if (user.name == 'f_pril') {
                    sendMessages(user);
                }
            });
        }
    });
}

const stop = reason => {
    bot.stop(reason);
    job.cancel(false);
    birthday.cancel(false);
    nameDay1.cancel(false);
    nameDay2.cancel(false);
    mongoose.connection.close(() => {
        console.log("Mongoose default connection is disconnected due to application termination");
        process.exit(0);
    });
}

bot.start(async ctx => {
    const user = {name: ctx.chat.username, chatId: ctx.chat.id};
    saveUser(user);     
    await sendMessages(user);
    doJob(user);
});

bot.help(ctx => ctx.reply('Список доступных команд:\n\n/start - начало работы\n/again - поздравить заново'));

bot.command('again', async ctx => {
    const user = {name: ctx.chat.username, chatId: ctx.chat.id}
    sendMessages(user);
});

bot.on('message', ctx => {
    ctx.reply('Отпиши моему хозяину в личку пжжж🙏🏻\n@f_pril');
});

initBot();

process.once('SIGINT', () => stop('SIGINT'));
process.once('SIGTERM', () => stop('SIGTERM'));

module.exports = bot;