const { Telegraf, Markup } = require('telegraf');
const axios = require('axios');
const https = require('https');
const express = require('express');
const AliExpressLibrary = require('./afflinker.js');
const AliExpressLibraryCart = require('./cart.js');
const app = express();
const botToken = process.env.token;
const appkey = process.env.appkeys;
const secertkey = process.env.secertkeys;
const tarckin_id = process.env.tarckin_ids;
const IdChannel = process.env.Idchannel;
const Channel = process.env.channel;
const link_cart = process.env.cart;
const bot = new Telegraf(botToken);
const aliExpressLib = new AliExpressLibrary(appkey, secertkey, tarckin_id);
const aliExpressLibCart = new AliExpressLibraryCart(appkey, secertkey, tarckin_id);
app.use(express.json());
app.use(bot.webhookCallback('/bot'))
app.get('/', (req, res) => { res.sendStatus(200) });
app.get('/ping', (req, res) => { res.status(200).json({ message: 'Ping successful' }); });
function keepAppRunning() {
    setInterval(() => {
        https.get(`${process.env.RENDER_EXTERNAL_URL}/ping`, (resp) => {
            if (resp.statusCode === 200) {
                console.log('Ping successful');
            } else {
                console.error('Ping failed');
            }
        });
    }, 5 * 60 * 1000);
}


bot.command(['start', 'help'], async (ctx) => {
    const replyMarkup = await {
        inline_keyboard: [

            [{ text: 'اشترك في قناة', url: Channel }],
            [{ text: '🛒 تخفيض العملات على منتجات السلة 🛒', callback_data: 'cart' },],

        ],
    };



    const welcomeMessage = `
        مرحبًا بكم في بوت 
        مهمة هذا البوت 🤖 معرفة أقل سعر للمنتج المراد شراءه 😍 حيث يعطيك 3 روابط
        ⏪رابط تخفيض النقاط (العملات) حيث يقوم بزيادة التخفيض من 1%-2% لتصل حتى الى 24% حسب المنتج 🔥
        ⏪رابط عروض السوبر 🔥
        ⏪ رابط العرض المحدود 🔥
        🔴انسخ رابط المنتج وضعه في البوت وقارن بين الروابط الثلاث واشتري بأقل سعر وقم بتثبيت البوت (épinglée) لتسهيل استعماله.
    `;

    await ctx.reply(welcomeMessage, { reply_markup: replyMarkup });
});

bot.action("cart", (ctx) => {
    // ctx.answerCbQuery('Button pressed!');
    const cartMessage = `
            طريقة الاستفادة من تخفيض العملات على منتجات السلة
            🔸 أولاً ادخل إلى تطبيق Aliexpress ثم السلة واختر المنتجات
            🔸 ثانيًا ادخل من هذا الرابط  ${link_cart} بعد ذلك اضغط على الزر "payer" أو "دفع"
            🔸 بعد ظهور صفحة الدفع، اضغط على أيقونة المشاركة في الأعلى وقم بنسخ الرابط
            🔸 ثم قم بلصق الرابط هنا في البوت وانتظر لحظة حتى يعطيك رابطًا آخر للدخول من خلاله وستجد السعر قد انخفض
        `;

    ctx.reply(cartMessage);
})
async function isUserSubscribed(user_id) {
    try {
        const user_info = await bot.telegram.getChatMember(IdChannel, user_id);
        console.log(user_info);
        return ['member', 'administrator', 'creator'].includes(user_info.status);
    } catch (e) {
        console.error(`حدث خطأ: ${e.message}`);
        return false;
    }
}
async function sendPhotoAndMessage(ctx, img_s, messageLink, replyMarkup1) {
    try {
        // إرسال الصورة
        await ctx.sendPhoto({ url: img_s });

        // إرسال النص بعد الصورة
        await ctx.sendMessage(messageLink, { reply_markup: replyMarkup1 });
    } catch (error) {
        console.error('Error sending photo and message:', error);
        // يمكنك إضافة إجراءات إضافية هنا إذا كنت ترغب في التعامل مع الأخطاء
    }
}

bot.on('text', async (ctx) => {
    const chatId = ctx.chat.id;
    const text = ctx.message.text;
    const userIdToCheck = ctx.message.from.id;

    if (await isUserSubscribed(userIdToCheck)) {
        console.log('t')
        try {
            if (text === "/start") {
                console.log("ok");
            } else {
                try {


                    const extractLinks = (text) => {
                        const urlPattern = /http[s]?:\/\/(?:[a-zA-Z]|[0-9]|[$-_@.&+]|[!*\\(\\),]|(?:%[0-9a-fA-F][0-9a-fA-F]))+/g;
                        const linksRedirect = text.match(urlPattern) || [];
                        return linksRedirect;
                    };
                    const idCatcher = async (id) => {
                        if (/^\d+$/.test(id)) {
                            return id;
                        } else if (id.includes("aliexpress.com")) {
                            if (/\/(\d+)\.html/.test(id)) {
                                return id.match(/\/(\d+)\.html/)[1];
                            } else {
                                try {
                                    const response = await axios.head(id, { maxRedirects: 0, validateStatus: (status) => status >= 200 && status < 400 });
                                    const decodedUrl = decodeURIComponent(response.headers.location);
                                    const regex = /\/(\d+)\.html/;
                                    const match = decodedUrl.match(regex);
                                    if (match && match[1]) {
                                        return match[1];
                                    } else if (decodedUrl.includes('/item/')) {
                                        // Handle the additional AliExpress URL pattern directly
                                        const regexItem = /\/(\d+)\.html/;
                                        const matchItem = decodedUrl.match(regexItem);
                                        if (matchItem && matchItem[1]) {
                                            return matchItem[1];
                                        }
                                    }
                                } catch (error) {
                                    console.error('Error occurred while fetching the URL:', error);
                                    res.status(400).json({ ok: false, error: 'Invalid URL provided' });
                                    return null;
                                }
                            }
                        }
                        console.error('Invalid ID or URL provided');
                        return null;
                    };



                    // ctx.message.text
                    ctx.reply('انتظر قليلا ...')
                        .then((message) => {
                            const links = extractLinks(`${ctx.message.text}`)

                            if (links[0].includes("/p/trade/confirm.html")) {

                                const match = links[0].match(/availableProductShopcartIds=([\d,]+)/);

                                if (match) {
                                    let numbersText = match[1];
                                    numbersText = numbersText.replaceAll(',', '%2C');
                                    const finalUrl = `https://www.aliexpress.com/p/trade/confirm.html?availableProductShopcartIds=${numbersText}&extraParams=%7B%22channelInfo%22%3A%7B%22sourceType%22%3A%22620%22%7D%7D&aff_fcid=`;
                                    console.log(finalUrl);
                                    try {
                                        aliExpressLibCart.getData(finalUrl).then((data) => {
                                            console.log(data)
                                            cart = `
 رابط السلة 
 ${data}                                   
                                    `
                                            ctx.sendMessage(cart)
                                        })

                                    } catch (error) {
                                        console.error(error.message);
                                    }
                                }
                            }

                            else {
                                idCatcher(links[0]).then(response_link => {

                                    aliExpressLib.getData(response_link)
                                        .then((coinPi) => {
                                            console.log("coinPi : ", coinPi)
                                          
                                            ctx.replyWithPhoto({ url: coinPi.info.normal.image },
                                                {


                                                    caption: `


🌟رابط تخفيض النقاط: ${coinPi.info.points.total}
${coinPi.aff.points}

🔥 رابط تخفيض السوبر: ${coinPi.info.super.price}
${coinPi.aff.super}

📌رابط العرض المحدود: ${coinPi.info.limited.price}
${coinPi.aff.limited}

` ,
                                                    parse_mode: "HTML",
                                                    ...Markup.inlineKeyboard([
                                                        Markup.button.callback("🛒 تخفيض العملات على منتجات السلة 🛒", "cart"),

                                                    ])
                                                }).then(() => {
                                                    ctx.deleteMessage(message.message_id)
                                                })


                                        });


                                })
                            }
                        })

                        .catch(error => {
                            console.error(error.message);
                        });

                } catch (error) {
                    const messageLink = `
🌟رابط تخفيض النقاط: ${coinPi.info.points.discount}
${coinPi.aff.points}

🔥 رابط تخفيض السوبر: ${coinPi.info.super.price}
${coinPi.aff.super}

📌رابط العرض المحدود: ${coinPi.info.limited.price}
${coinPi.aff.limited}

                    `;
                    ctx.reply(messageLink);
                }

            }////d
        } catch (e) {
            ctx.reply('حدث خطأ غير متوقع');
        }
    } else {
        const replyMarkup2 = {
            inline_keyboard: [
                [{ text: 'اشتراك', url: Channel }],
            ],
        };
        ctx.reply(' اأنت غير مشترك في القناة.', { reply_markup: replyMarkup2 });
    }
});
app.listen(3000, () => {
    bot.telegram.setWebhook(`${process.env.RENDER_EXTERNAL_URL}/bot`)
        .then(() => {
            console.log('Webhook Set ✅ & Server is running on port 3000 💻');
            keepAppRunning();
        });
});
// bot.launch({ webhook: { domain: process.env.RENDER_EXTERNAL_URL, port: process.env.PORT }, allowedUpdates: ['message', 'callback_query'], })
//     .then(() => {
//         console.log('Bot is running');
//     })
//     .catch((error) => {
//         console.error('Error starting the bot:', error);
//     });
