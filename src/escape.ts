export default function escape(text: string): string {
    return text.replace(/[_*[\]()~`>#+\-=|{}.!]/g, "\\$&");
}