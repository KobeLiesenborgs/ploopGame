
// Regexes that will or are currently being used to manipulate messages
const urlRegex = /^(http:\/\/www\.|https:\/\/www\.|http:\/\/|https:\/\/)?[a-z0-9]+([\-\.]{1}[a-z0-9]+)*\.[a-z]{2,5}(:[0-9]{1,5})?(\/.*)?$/gm
const customEmojiRegex = /<:([\w]+):[\d]+>/gm // detects discord custom emoji ids
const channelMentionRegex = /<#(\d+)>/gm
const mentionRegex = /<@([\W\S])([\d]+)>/gm

/* 
    user and role mentions are encoded in the message content as <@{prefix}{id}>
    so we need to convert those encodings into the names of the user or role
    but we need to figure out if each mention is a role mention or a user mention based on that prefix
*/

const replaceMentions = async msg => {
    const guild = msg.guild
    const { members, roles } = guild
    const mentions = [...msg.content.matchAll(mentionRegex)].map(match => ({ prefix: match[1], id: match[2] }))
    for (const { prefix, id } of mentions) {
        if (prefix === "!") {
            const username = (await members.fetch(id)).user.username
            msg.content = msg.content.replace(new RegExp(`<@${prefix}${id}>`, "g"), "@" + username)
        } else if (prefix === "&") {
            const name = (await roles.fetch(id)).name
            msg.content = msg.content.replace(new RegExp(`<@${prefix}${id}>`, "g"), "@" + name)
        }
    }
    return msg
}

/*
    channel mentions are encoded in the message content as <#{id}>
    so we need to convert those encodings into the name of the channel
*/

const replaceChannelMentions = async msg => {
    const guild = msg.guild
    const { channels } = guild
    const mentions = [...msg.content.matchAll(channelMentionRegex)].map(match => match[1])
    for (const id of mentions) {
        const name = (await channels.resolve(id)).name
        msg.content = msg.content.replace(new RegExp(`<#${id}>`, "g"), "#" + name)
    }
    return msg
}

module.exports = {
    replaceMentions,
    replaceChannelMentions,
    urlRegex,
    codeRegex,
    customEmojiRegex,
    channelMentionRegex,
    mentionRegex,
}