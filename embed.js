const Discord = require('discord.js');

module.exports = {
    create(title, color, desc, fields, thumbnail, footer) {
        let embed = new Discord.MessageEmbed();

        embed.setTitle(title);
        embed.setColor(color);
        embed.setDescription(desc);

        if (thumbnail !== null) embed.setThumbnail(thumbnail);

        for (let i = 0; i < fields.length; i++) {
            embed.addField(fields[i].title, fields[i].desc, fields[i].stack);
        }

        if (footer == null) embed.setFooter('|  Coded by PayNow#8971  |  crypixlebot.cf  |', 'https://cdn.discordapp.com/attachments/742906204266823911/742917266865127494/SPOILER_GuardianClient_server_pfp_1.png?size=256');
        else embed.setFooter(footer, 'https://cdn.discordapp.com/attachments/742906204266823911/742917266865127494/SPOILER_GuardianClient_server_pfp_1.png?size=256');

        return embed;
    },
};