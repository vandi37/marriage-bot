import {Bot, InlineKeyboard, InlineQueryResultBuilder, InputFile} from 'grammy';
import sequelize from './database';
import Marriage from './models/Marriage';
import {generateMention, getMention, loggerMention, matchesMention, parseMention} from "./mention";
import {Op} from "sequelize";
import humanizeDuration from "humanize-duration"
import {formatMarriages, generateKeyboard, getMarriages, page} from "./formatMarriages";
import {
    divorceButtons,
    divorceText,
    marriageInfoText,
    requestMarriageButtons,
    requestMarriageText
} from "./textNbuttons";
import logger, {objByCtx} from './logger'
import escape from "./escape";
import {v7 as uuid} from 'uuid';
import { getChatError } from './error';

const CREATOR = Number(process.env.CREATOR!)

const bot = new Bot(process.env.BOT_TOKEN!);

const start = async () => {
    await bot.init()
    await bot.api.setMyCommands([
        { command: "start", description: "Запустить бота" },
        { command: "help", description: "Помощь" },
    ]);
    const creator = await bot.api.getChat(CREATOR);
    const description = `Этот бот используется для создания неограниченного количества браков 😎  Создатель: @${creator.username!}`
    await bot.api.setMyDescription(description);
    await bot.api.setMyShortDescription(description);
    await bot.start({
        onStart: async () => {
            logger.info('Bot started', {username: bot.botInfo.username})
        },
        drop_pending_updates: true
    })
}

start().catch((err) => {
    logger.error('an error while starting te bot', {err})
    throw err
})

bot.command('start', async (ctx) => {
    await ctx.reply(`🔰 Привет! Я бот для браков!\n/help для полной информации`)
    logger.silly('Sent start info', objByCtx(ctx))
})

bot.command('help', async (ctx) => {
    await ctx.reply('📃 Команды бота:\n\n' +
        '/start — начать диалог с ботом\n' +
        '/help — помощь по боту\n' +
        '+брак @{username} — сделать предложению пользователю\n' +
        'развод или -брак {id} — развестись по индетификатору брака\n' +
        'браки — посмотреть все свои браки\n' +
        'брак {id} — посмотреть конкретный брак по индентификатору\n' +
        'стата — посмотреть общую статистику бота (количество браков и уникальных пользователей)\n\n' +
        `В боте доступен инлайн режим. если написать в любом чате @${bot.botInfo.username} — то появится возможность посмотреть все браки\n` +
        `Если написать в любом чате@${bot.botInfo.username} @{username} — то вы сможете сделать предложение пользователю не добавляя бота в чат\n` +
        `И наконец если написать в любом чате @${bot.botInfo.username} {id} — то появится выбор между просмотром и разводом по индетификатору брака`)
    logger.silly('Sent help info', objByCtx(ctx))
})

bot.hears(/^все\sбраки$/i).filter(ctx => ctx.from?.id === CREATOR, async (ctx) => {
    const all = await  Marriage.findAll();
    await ctx.replyWithDocument(new InputFile(Buffer.from(JSON.stringify(all.map(m => ({
                id: m.id,
                user1: m.user1,
                user2: m.user2,
                createdAt: m.createdAt,
            })), null, 2)), 'data.json'), {
            caption: '📚 Все браки'
        }
    )
    logger.info('Creator requested all marriages', objByCtx(ctx))
})

bot.hears(/^стата$/i, async (ctx) => {
    const userCount = await Marriage.countUniqueUsers()
    const totalCount = await Marriage.count()
    await ctx.reply(`📄 Количество браков: ${totalCount}\n👤 Количество уникальных пользователей ${userCount}`)
    logger.debug('User requested marriage stats', objByCtx(ctx))
})

bot.hears(/^\+брак(\s.+)?$/i, async (ctx) => {
    if (ctx.message === undefined) return
    let mention = getMention(ctx)
    if (mention === undefined) {
        await ctx.reply('❌ Ты не указал своего партнера для брака')
        logger.debug('User hasn\'t entered a mention', objByCtx(ctx))
        return
    }
    await ctx.reply(requestMarriageText(mention, ctx.from), {
        reply_markup: requestMarriageButtons(mention, ctx.from),
        parse_mode: 'MarkdownV2',
        link_preview_options: {
            is_disabled: true,
        }
    });
    logger.debug('User requested marriage', {...objByCtx(ctx), mention: loggerMention(mention)})
});


bot.hears(/^((развод)|(-брак))\s(\d+)$/i, async (ctx) => {
    if (ctx.message === undefined) return
    const marriageId = ctx.match[4]
    const marriage = await Marriage.findOneWithUser(+marriageId, ctx.from.id)
    if (marriage === null) {
        await ctx.reply('❌ У тебя нет брака с этим id')
        logger.debug('User has no marriages with this id', {...objByCtx(ctx), marriageId})
        return
    }
    const other = await bot.api.getChat(marriage.user1 === ctx.from.id ? marriage.user2 : marriage.user1).catch(getChatError(marriage.user1 === ctx.from.id ? marriage.user2 : marriage.user1))
    await ctx.reply(divorceText(ctx.from, other), {
        reply_markup: divorceButtons(marriageId),
        parse_mode: 'MarkdownV2',
        link_preview_options: {
            is_disabled: true,
        }
    })
    logger.debug('User is preparing to divorce', {...objByCtx(ctx), marriageId, otherId: other.id})
});

bot.hears(/^браки$/i, async (ctx) => {
    if (ctx.message === undefined) return
    await ctx.reply(await formatMarriages(ctx.from, await getMarriages(ctx.from.id, 0), bot, 1), {
        reply_markup: generateKeyboard(ctx.from.id, 0),
        parse_mode: 'MarkdownV2',
        link_preview_options: {
            is_disabled: true,
        }
    })
    logger.debug('User paginated marriages', objByCtx(ctx))
});


bot.hears(/^брак\s(\d+)$/i, async (ctx) => {
    if (ctx.message === undefined) return
    const [_, marriageId] = ctx.match
    const marriage = await Marriage.findOne({
        where: {
            id: +marriageId,
            [Op.or]: [
                {user1: ctx.from.id},
                {user2: ctx.from.id}
            ]
        },
    })
    if (marriage === null) {
        await ctx.reply('❌ У тебя нет брака с этим id')
        logger.debug('User has no marriages with this id', {...objByCtx(ctx), marriageId})
        return
    }
    const other = await bot.api.getChat(marriage.user1 === ctx.from.id ? marriage.user2 : marriage.user1).catch(getChatError(marriage.user1 === ctx.from.id ? marriage.user2 : marriage.user1));
    await ctx.reply(marriageInfoText(ctx.from, other, marriage.createdAt),  {
        parse_mode: 'MarkdownV2',
        link_preview_options: {
            is_disabled: true,
        }
    })
    logger.debug('User got information about marriage', {...objByCtx(ctx),  marriage: marriage})
})

bot.callbackQuery(/^answer_(\d+)_(\w+)$/, async (ctx) => {
    const [_, senderId, mention] = ctx.match;

    if (!matchesMention(parseMention(mention), ctx.from)) {
        await ctx.answerCallbackQuery('❌ Это не для тебя')
        logger.silly('User touched wrong callback query', objByCtx(ctx))
        return
    }
    const sender = await bot.api.getChat(+senderId).catch(getChatError(+senderId));
    if (await Marriage.marriageExists(+senderId,ctx.from.id)) {
        await ctx.editMessageText(`❌ ${generateMention(ctx.from)} и ${generateMention(sender)} уже вместе`, {
            reply_markup: new InlineKeyboard(),
            parse_mode: 'MarkdownV2',
            link_preview_options: {
                is_disabled: true,
            }
        })
        logger.debug('User is already married', {...objByCtx(ctx), otherId: sender.id})
        return
    }
    const {id} = await Marriage.create({
        user1: sender.id,
        user2: ctx.from.id,
    })

    await ctx.editMessageText(`💍 зарегистрирован брак \\#\`${id}\`\\.\n${generateMention(ctx.from)} принял предложение о браке с ${generateMention(sender)}`, {
        reply_markup: new InlineKeyboard(),
        parse_mode: 'MarkdownV2',
        link_preview_options: {
            is_disabled: true,
        }
    })
    logger.debug('User got married', {...objByCtx(ctx), marriageId: id, senderId: sender.id})
});
bot.callbackQuery(/^deny_(\d+)_(\w+)$/, async (ctx) => {
    const [_, senderId, mention] = ctx.match;
    if (!matchesMention(parseMention(mention), ctx.from)) {
        await ctx.answerCallbackQuery('❌ Это не для тебя')
        logger.silly('User touched wrong callback query', objByCtx(ctx))
        return
    }
    const sender = await bot.api.getChat(+senderId).catch(getChatError(+senderId));
    await ctx.editMessageText(`💔 ${generateMention(sender)}, ${generateMention(ctx.from)} отказался от вашего предложения`, {
        reply_markup: new InlineKeyboard(),
        parse_mode: 'MarkdownV2',
        link_preview_options: {
            is_disabled: true,
        }
    })
    logger.debug('User denied marring request', {...objByCtx(ctx), senderId: sender.id})
})
bot.callbackQuery(/^divorce_(\d+)$/, async (ctx) => {
    const [_, marriageId] = ctx.match;

    const marriage = await sequelize.transaction(async (transaction) => {
        const marriage = await Marriage.findOne({
            where: {
                id: +marriageId,
                [Op.or]: [
                    {user1: ctx.from.id},
                    {user2: ctx.from.id}
                ]
            },
            transaction
        })
        if (marriage === null) return null;
        await marriage.destroy({transaction})
        return marriage
    });
    if (marriage === null) {
        await ctx.answerCallbackQuery('❌ Это не для тебя')
        logger.silly('User touched wrong callback query', objByCtx(ctx))
        return null
    }
    const other = await bot.api.getChat(marriage.user1 === ctx.from.id ? marriage.user2 : marriage.user1).catch(getChatError(marriage.user1 === ctx.from.id ? marriage.user2 : marriage.user1));
    const russianDuration = humanizeDuration(marriage.createdAt.valueOf() - Date.now(), {
        language: 'ru',
        largest: 2
    })
    await ctx.editMessageText(
        `💔 ${generateMention(other)}, сожалеем\\.\n${generateMention(ctx.from)} подал на развод\\.\\.\\. Ваш брак просуществовал ${russianDuration}`, {
            reply_markup: new InlineKeyboard(),
            parse_mode: 'MarkdownV2',
            link_preview_options: {
                is_disabled: true,
            }
        })
    logger.debug('User divorces', {...objByCtx(ctx), otherId: other.id, marriageId: marriage.id})
})
bot.callbackQuery(/^divorce_deny_(\d+)$/, async (ctx) => {
    const [_, marriageId] = ctx.match;

    const marriage = await Marriage.findOne({
        where: {
            id: +marriageId,
            [Op.or]: [
                {user1: ctx.from.id},
                {user2: ctx.from.id}
            ]
        }
    })
    if (marriage === null || (ctx.from.id !== marriage.user1 && ctx.from.id !== marriage.user2)) {
        await ctx.answerCallbackQuery('❌ Это не для тебя')
        logger.silly('User touched wrong callback query', objByCtx(ctx))
        return
    }
    const other = await bot.api.getChat(marriage.user1 === ctx.from.id ? marriage.user2 : marriage.user1).catch(getChatError(marriage.user1 === ctx.from.id ? marriage.user2 : marriage.user1));
    await ctx.editMessageText(`💕 ${generateMention(ctx.from)}, ваш брак с ${generateMention(other)} сохранен`, {
        reply_markup: new InlineKeyboard(),
        parse_mode: 'MarkdownV2',
        link_preview_options: {
            is_disabled: true,
        }
    })
    logger.debug('User canceled divorce request', {...objByCtx(ctx), marriageId: marriage.id, otherId: other.id})
})

bot.callbackQuery(/^view_(\d+)_(-?\d+)$/, async (ctx) => {
    const [_, userId, offset] = ctx.match;
    const marriages = await getMarriages(+userId, +offset);
    if (marriages.length === 0) {
        await ctx.answerCallbackQuery()
        return
    }
    const text = await formatMarriages(await bot.api.getChat(+userId).catch(getChatError(+userId)), marriages, bot, page(+offset))
    const keyboard =  generateKeyboard(+userId, 0)

    await ctx.editMessageText(text, {
        reply_markup: keyboard,
        parse_mode: 'MarkdownV2',
        link_preview_options: {
            is_disabled: true,
        }
    })
    logger.debug('User watched next page of marriages', {...objByCtx(ctx), page: page(+offset), viewingId: +userId})
})

bot.inlineQuery(/^$/, async (ctx) => {
    await ctx.answerInlineQuery([
        InlineQueryResultBuilder.article(
            uuid(), '🧐 Ваши браки', {
                description: 'Посмотреть список ваших браков',
                reply_markup: generateKeyboard(ctx.from.id, 0)})
            .text(await formatMarriages(ctx.from, await getMarriages(ctx.from.id, 0), bot, 1), {
                parse_mode: 'MarkdownV2',
                link_preview_options: {
                    is_disabled: true,
                },
            }),
    ], {cache_time: 1})
    logger.debug('Sent inline query with paginated marriages info', objByCtx(ctx))
})

bot.inlineQuery(/^\s*@(\w+)$/, async (ctx) => {
    const [_, username] = ctx.match
    await ctx.answerInlineQuery([
        InlineQueryResultBuilder.article(
            uuid(), '💍 Предложение',
            {
                description: `Сделать предложение @${username}`,
                reply_markup: requestMarriageButtons(username, ctx.from),
            })
            .text(requestMarriageText(username, ctx.from), {
                parse_mode: 'MarkdownV2',
                link_preview_options: {
                    is_disabled: true,
                }
            })
    ], {cache_time: 1})
    logger.debug('Sent inline query with marriage request', objByCtx(ctx))
})

bot.inlineQuery(/^(\d+)$/, async (ctx) => {
    const [_, marriageId] = ctx.match
    const marriage = await Marriage.findOneWithUser(+marriageId, ctx.from.id)
    if (marriage === null) return
    const other = await bot.api.getChat(marriage.user1 === ctx.from.id ? marriage.user2 : marriage.user1).catch(getChatError(marriage.user1 === ctx.from.id ? marriage.user2 : marriage.user1))


    await ctx.answerInlineQuery([
        InlineQueryResultBuilder.article(
            uuid(), '💔 Развод', {
                description: `Развод в браке #${marriageId}`,
                reply_markup: divorceButtons(marriageId),
            })
            .text(divorceText(ctx.from, other), {
                parse_mode: 'MarkdownV2',
                link_preview_options: {
                    is_disabled: true,
                }}),
        InlineQueryResultBuilder.article(
            uuid(),'🧐 Посмотреть брак', {
                description:`Посмотреть информацию о браке #${marriageId}`,
                reply_markup: new InlineKeyboard()})
            .text(marriageInfoText(ctx.from, other, marriage.createdAt),  {
                parse_mode: 'MarkdownV2',
                link_preview_options: {
                    is_disabled: true,
                }
            })
    ], {cache_time: 1})
    logger.debug('Sent inline query with divorce request and marriage info', {...objByCtx(ctx), marriageId, otherId: other.id})
})


bot.catch(async (err) => {
    logger.error('an error in the bot', {name: err.name, message: err.message, err: err.error, stack: err.stack})
    await bot.api.sendMessage(CREATOR, `❌ Ошибка в работе бота: ${escape(err.name)}\n\n${escape(err.message)}\n`
        + `\`\`\`\n${escape(JSON.stringify(err.error))}${escape(err.stack ?? '')}\`\`\``, {parse_mode: 'MarkdownV2'})
})

process.once('SIGINT', () => bot.stop());
process.once('SIGTERM', () => bot.stop());
