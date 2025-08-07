import {Bot, InlineKeyboard} from "grammy";
import Marriage from "./models/Marriage";
import {generateMention} from "./mention";
import {ChatFullInfo, User} from "grammy/types";
import {Op} from "sequelize";
import { getChatError } from "./error";

export async function formatMarriages(user: User | ChatFullInfo, marriages: Marriage[], bot: Bot, page: number) {
    let s = `📚 Браки ${generateMention(user)}\n`;
    const promises = marriages.map(async (marriage) => {
        const otherId = marriage.user1 === user.id ? marriage.user2 : marriage.user1;
        const other = await bot.api.getChat(otherId).catch(getChatError(otherId));
        return `\n\\#\`${marriage.id}\` с ${generateMention(other)}`;
    });

    const marriageStrings = await Promise.all(promises);
    return s + marriageStrings.join('')+ `\n\n📑 Страница №${page}`;
}
export function generateKeyboard(userId: number, page: number) {
    return new InlineKeyboard()
        .text('⬅️', `view_${userId}_${Math.max(page -1, 0)}`)
        .text('➡️', `view_${userId}_${page + 1}`)
}

export const offset = (page: number) => 10 * (page - 1);

export async function getMarriages(userId: number, offset: number) {
    if (offset < 0) return []
    return await Marriage.findAll({
        where: {
            [Op.or]: [
                {user1: userId},
                {user2: userId},
            ]
        },
        order: [['id', 'ASC']],
        limit: 10,
        offset,
    })
}
