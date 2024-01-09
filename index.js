const { Telegraf, Markup } = require('telegraf');
const axios = require('axios');
botToken = process.env.token
appkey = process.env.appkeys
secertkey = process.env.secertkeys
tarckin_id = process.env.tarckin_ids
const IdChannel = process.env.Idchannel;
const Channel = process.env.channel;
const link_cart = process.env.cart;
const bot = new Telegraf(botToken);

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
            🔸 ثانيًا ادخل من هذا الرابط ${link_cart}بعد ذلك اضغط على الزر "payer" أو "دفع"
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
                ctx.reply('انتظر قليلا...');
                let link1;
                let link2;
                let link3;


                const responseAff = await axios.get(`https://pine-three-fog.glitch.me/links/?links=${text}&value1=${appkey}&value2=${secertkey}&value3=${tarckin_id}`);
                const data = responseAff.data;
                link1 = data.link1;
                link2 = data.link2;
                link3 = data.link3;
                id = data.id;
                if (link1 == undefined) {
                    trade = data.trade

                    ctx.sendPhoto({ url: "https://i.ibb.co/qpq5PR6/photo-2023-09-07-13-07-58.jpg" }, { caption: trade });
                } else {

                    try {
                        const response = await axios.get(`https://coinzy-u0g3.onrender.com/fetch?id=${id}`);
                        const data = response.data;

                        const normalData = data.normal;
                        const title = normalData.name;
                        const img_s = normalData.image;
                        const price_org = normalData.normal;
                        const shipping = normalData.shipping;
                        const review = normalData.rate;
                        const store = normalData.store;
                        const sales = normalData.sales;
                        const totalRates = normalData.totalRates;
                        const storeRate = normalData.storeRate;

                        const points = data.points;
                        const disprice = points.total;
                        const realprice = points.discountPrice;
                        const discountCoinsFetch = normalData.discount;
                        const discountCoinsPoint = points.discount;

                        const superL = data.super;
                        const supprice = superL.price;

                        const limited = data.limited;
                        const limprice = limited.price;
                        const coupon = normalData.coupon;
                        let couponList = "";

                        if (coupon === "لا يوجد كوبونات ❎") {
                            couponList = normalData.coupon;
                        } else {
                            couponList = "";
                            normalData.coupon.forEach(coupons => {
                                const code = coupons.code;
                                const detail = coupons.detail.replace('طلبات تزيد على US ', '');
                                const desc = coupons.desc.replace('US ', '');
                                couponList += `🎁${desc}/${detail} :${code}\n`;
                            });
                        }


                        const messageLink = `
التخفيض لـ${title}
السعر الاصلي : (${realprice})
✈️ الشحن : (${shipping})
🛒 إسم المتجر : ${store}
📊 معدل تقييم  المتجر : ${storeRate}
عدد المبيعات : ${sales}
--------🔥الكوبونات 🔥------
${couponList}
--------🔥 الروابط التخفيضية 🔥------
                        
🏷 نسبة تخفيض بالعملات قبل  :  (${discountCoinsFetch})
🏷 نسبة تخفيض بعد  : (${discountCoinsPoint})
                        
التقييم : ${review}
التقييمات : ${totalRates}
🌟رابط تخفيض النقاط: (${disprice})
${link1}
🔥 رابط تخفيض السوبر: (${supprice})
${link2}
📌رابط العرض المحدود:(${limprice})
${link3}
                    `;

                        const replyMarkup1 = {
                            inline_keyboard: [
                                [{ text: '🛒 تخفيض العملات على منتجات السلة 🛒', callback_data: 'cart' }],
                            ],
                        };
                        sendPhotoAndMessage(ctx, img_s, messageLink, replyMarkup1);

                        // ctx.sendPhoto({ url: img_s });
                        // ctx.sendMessage(messageLink, { reply_markup: replyMarkup1 });
                    } catch (error) {
                        const messageLink = `
                        🌟رابط تخفيض النقاط:
                        ${link1}
                        🔥 رابط تخفيض السوبر: 
                        ${link2}
                        📌رابط العرض المحدود:
                        ${link3}
                    `;
                        ctx.reply(messageLink);
                    }
                }
            }
        } catch (e) {
            ctx.reply('حدث خطأ غير متوقع حاول مرة اخرى');
        }
    } else {
        const replyMarkup2 = {
            inline_keyboard: [
                [{ text: 'اشتراك', url: Channel }],
            ],
        };
        ctx.reply(' اأنت غير مشترك في القناة.',{reply_markup:replyMarkup2});
    }
});
bot.launch({ webhook: { domain: process.env.RENDER_EXTERNAL_URL, port: process.env.PORT }, allowedUpdates: ['message', 'callback_query'], })
    .then(() => {
        console.log('Bot is running');
    })
    .catch((error) => {
        console.error('Error starting the bot:', error);
    });