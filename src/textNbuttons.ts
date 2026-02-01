import {InlineKeyboard} from "grammy";
import {generateMention, stringifyMention} from "./mention";
import {ChatFullInfo, User} from "grammy/types";
import humanizeDuration from "humanize-duration";

export function requestMarriageText(mention: string | User, from: User) {
    return `💍 ${generateMention(mention)}, ${generateMention(from)} сделал вам предложение руки и сердца`
}

export function requestMarriageButtons(mention: string | User, from: User) {
    return new InlineKeyboard()
        .text('💝 Согласиться', `answer_${from.id}_${stringifyMention(mention)}`)
        .text('💔 Отказаться', `deny_${from.id}_${stringifyMention(mention)}`)
}

export function requestRandomMarriageText(from: User) {
    return `💍 Если хотите брак с ${generateMention(from)}`
}
export function requestRandomMarriageButtons(from: User){
    return new InlineKeyboard()
        .text('👉 Нажмите на эту кнопку', `anyone_${from.id}`)
}

export function divorceText(from: User, other: ChatFullInfo) {
    return `😰 ${generateMention(from)}, вы уверены, что хотите развестись с ${generateMention(other)}`
}
export function divorceButtons(marriageId: any) {
    return new InlineKeyboard()
        .text('✅ Да', `divorce_${marriageId}`)
        .text('❌ Нет', `divorce_deny_${marriageId}`)
}

export function marriageInfoText(from: User, other: ChatFullInfo, createdAt: Date) {
    const russianDuration = humanizeDuration(createdAt.valueOf() - Date.now(), {
        language: 'ru',
        largest: 2
    })
    return `🫶 Брак между ${generateMention(from)} и ${generateMention(other)}\n🕓 Длится ${russianDuration}`
}