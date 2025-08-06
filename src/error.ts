import { GrammyError } from "grammy"
import { ChatFullInfo } from "grammy/types"

export function getChatError(id: number): (err: any) => ChatFullInfo {
    return err => {
        console.error(err)
        if (err instanceof GrammyError && err.description === 'Bad Request: chat not found')
            return {
                id,
                type: "private",
                first_name: 'ошибка получения пользователя',
            } as ChatFullInfo.PrivateChat
        throw err
    }
}