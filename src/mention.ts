import { Context} from "grammy";
import {ChatFullInfo, User } from "grammy/types";
import escape from "./escape";

export function getMention(ctx: Context) {
    if (ctx.message?.reply_to_message?.from) return ctx.message.reply_to_message.from

    const entities = ctx.message?.entities || ctx.message?.caption_entities ;
    if (!entities || !entities.length) return undefined;

    const text = ctx.message.text || ctx.message.caption || '';

    for (const entity of entities) {
        if (entity.type === 'mention') {
            const mention = text.substring(entity.offset, entity.offset + entity.length);
            return mention.substring(1);
        }
        if (entity.type === 'text_mention' && entity.user) return entity.user
    }
}

export function generateMention(mention: User | string | ChatFullInfo) {
    if (typeof mention === 'string') return `@${escape(mention)}`;
    if (mention.username !== undefined) return `[${escape(mention.first_name ?? mention.title)}](t.me/${mention.username})`
    return `[${escape(mention.first_name ?? mention.title)}](tg://user?id=${mention.id})`
}

export function stringifyMention(mention: User | string) {
    if (typeof mention === 'string') return mention;
    return `${mention.id}`
}
export function parseMention(s: string) {
    const n = +s
    if (Number.isNaN(n)) return s
    return n
}

export function matchesMention(mention: string | number, user: User ) {
    if (typeof mention === 'string') return mention === user.username
    return mention === user.id
}
export function loggerMention(mention: string | User) {
    if (typeof mention === 'string') return mention;
    return mention.id
}