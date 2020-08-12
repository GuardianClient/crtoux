/**
 * Simple Hypixel Discord verification bot.
 * Created by foobball, based off SkyblockZ's verification bot
 * 
 * Join SkyblockZ's Discord here: https://discord.gg/skyblock
 */

const Discord = require('discord.js');
const fetch = require('node-fetch');
const embed = require('./embed');
const icon = require('./icon.json');
const db = require('./db');
const fs = require('fs');

const client = new Discord.Client();
client.commands = new Discord.Collection();


let userAmount = 0;

/**
 * creds.json
 * 
 * Should be formatted as the following:
 * {
 *      "discord_secret": "abcdefghijklmnopqrstuv",
 *      "hypixel_key": "abcdefgh-1234-1abc-1abc-123abc123abc"
 * }
 */
const creds = require('./creds.json');
const { argv } = require('process');

/**
 * Prefix that the bot looks for
 */
const prefix = `c!`;


/**
 * Bot invite link
 */
const invite_link = `https://discord.com/oauth2/authorize?client_id=742906677371732070&scope=bot&permissions=1`;
const normalRanks = ['VIP', 'VIP+', 'MVP', 'MVP+', 'MVP++'];
const username_regex = `[a-zA-Z0-9_]{1,16}`;

function log(str) {
    let currentTime = new Date();
    currentTime = currentTime.toISOString();

    return console.log(`[${currentTime}] ${str}`);
}


async function createRole(msg, str, color, callback) {
    var existingRole = msg.guild.roles.cache.find(role => role.name == str);
    if (!existingRole) {
        db.getDB((currentDB) => {
            let newDB = currentDB;
            if (currentDB[msg.guild.id] == null || currentDB[msg.guild.id] == undefined) {
                newDB[msg.guild.id] = {};
            }
            if (currentDB[msg.guild.id][str] == null || currentDB[msg.guild.id][str] == undefined) {
                msg.guild.roles.create({
                    data: {
                        "name": str,
                        "permissions": 0,
                        "color": color
                    }
                }).then(role => {
                    db.getDB((currentDB) => {
                        if (newDB[msg.guild.id] == null || newDB[msg.guild.id] == undefined) newDB[msg.guild.id] = {};
                        newDB[msg.guild.id][role.name] = { name: role.name, id: role.id }

                        db.changeDB(newDB, () => {
                            callback(role);
                        });
                    })
                });
            } else {
                let channelID = currentDB[msg.guild.id][str];
                console.log(channelID);
                let serverRole = msg.guild.roles.cache.get(channelID.id);
                if (serverRole == null || serverRole == undefined) {
                    msg.guild.roles.create({
                        data: {
                            "name": str,
                            "permissions": 0,
                            "color": color
                        }
                    }).then(role => {
                        db.getDB((currentDB) => {
                            let newDB = currentDB;

                            if (newDB[msg.guild.id] == null || newDB[msg.guild.id] == undefined) newDB[msg.guild.id] = {};
                            newDB[msg.guild.id][role.name] = { name: role.name, id: role.id }

                            db.changeDB(newDB, () => {
                                callback(role);
                            });
                        })
                    });
                } else {
                    callback(serverRole);
                }
            }
        })
    } else {
        db.getDB((currentDB) => {
            let newDB = currentDB;
            if (newDB[msg.guild.id] == null || newDB[msg.guild.id] == undefined) {
                newDB[msg.guild.id] = {};
            }

            newDB[msg.guild.id][str] = { name: str, id: existingRole.id }
            callback(existingRole);
        });
    }
}

function massGuildDM() {
    let sentList = [];
    client.guilds.cache.forEach((guild) => {
        if (sentList.indexOf(guild.ownerID) == -1) {
            sentList.push(guild.ownerID);
            log(`Sent message to ${guild.ownerID}`);
            guild.owner.send(embed.create(
                'Crypixle Bot',
                'GREEN',
                'The bot now supports... Hypixel ranks!\nE.g. VIP, VIP+, MVP, MVP+, MVP++.\nYou must re-verify in order to recieve these new ranks.', [],
                icon.celeb,
                'Contact PayNow#8971 for support | Thanks for choosing Crypixle'
            ));
        } else {
            log(`Already sent message to ${guild.ownerID}`);
        }
    })
    console.log(sentList);
}

function getRankRoles(msg, callback) {
    try {
        let returnData = {
            "VIP": null,
            "VIP_PLUS": null,
            "MVP": null,
            "MVP_PLUS": null,
            "MVP_PLUS_PLUS": null,
            "err": false
        };
        createRole(msg, 'MVP++', 'GOLD', (roleMVP3) => {
            returnData["MVP_PLUS_PLUS"] = (roleMVP3);
            createRole(msg, 'MVP+', 'BLUE', (roleMVP2) => {
                returnData["MVP_PLUS"] = (roleMVP2);
                createRole(msg, 'MVP', 'BLUE', (roleMVP) => {
                    returnData["MVP"] = (roleMVP);
                    createRole(msg, 'VIP+', 'GREEN', (roleVIP2) => {
                        returnData["VIP_PLUS"] = (roleVIP2);
                        createRole(msg, 'VIP', 'GREEN', (roleVIP) => {
                            returnData["VIP"] = (roleVIP);
                            callback(returnData);
                        });
                    });
                });
            });
        });
    } catch (e) {
        log(e);
        returnData["err"] = true;
        callback(returnData);
    }
}

client.on('ready', () => {
    log(`Bot online as ${client.user.tag}`);

    //massGuildDM();

    client.guilds.cache.forEach((guild) => {
        guild.members.cache.forEach(() => {
            userAmount++;
        })
    })
    client.user.setActivity(`c!help | ${Number(userAmount).toLocaleString()} users | crypixlebot.cf`);
    setInterval(() => {
        userAmount = 0;
        client.guilds.cache.forEach((guild) => {
            guild.members.cache.forEach(() => {
                userAmount++;
            })
        })
        client.user.setActivity(`c!help | ${Number(userAmount).toLocaleString()} users | crypixle.cf`);
    }, 60000)
});


client.on('message', msg => {
    function isDM() {
        return msg.guild == undefined;
    }

    if (msg.content.startsWith(`${prefix}verify `) && !isDM()) {
        let username = msg.content.split(' ')[1];
        username = username.match(username_regex);

        if (username) {
            username = username[0];

            if (username.length > 2) {
                log(`Attempting to verify \"${username}\" for ${msg.author.username}#${msg.author.discriminator}`);
                msg.channel.send(`${icon.loading} Please wait, whilst verifying with hypixel`).then(loading => {
                    let capName;
                    fetch(`https://api.slothpixel.me/api/players/${username}?key=${creds.hypixel_key}`)
                        .then(resp => resp.json())
                        .then(body => {
                            if (!body.err) {
                                let discord;
                                let rank;
                                capName = body.username;
                                log(capName);
                                console.log(body["links"]);
                                if (body["links"] == undefined) discord = null
                                else {
                                    if (body["links"].DISCORD == undefined) discord = null;
                                    else discord = body["links"].DISCORD;
                                }

                                if (body.rank == undefined) rank = null;
                                else {
                                    rank = body.rank;
                                    if (rank) log(`Authing as ${rank}`);
                                    else log(`Authing as non`);
                                }

                                if (!discord) discord = `None`;
                                if (`${msg.author.username}#${msg.author.discriminator}` == discord) {
                                    var verifiedRole = msg.guild.roles.cache.find(role => role.name == "Verified");
                                    if (verifiedRole == undefined) {
                                        msg.guild.roles.create({
                                            data: {
                                                "name": "Verified",
                                                "permissions": 0
                                            }
                                        }).then(role => {
                                            msg.member.roles.add(role);

                                            if (rank) {
                                                if (normalRanks.indexOf(rank.replace(/_PLUS/g, "+")) !== -1) {
                                                    getRankRoles(msg, (currentRank) => {
                                                        msg.member.roles.add(currentRank[rank]);
                                                    });
                                                } else {
                                                    var color = 'RED';
                                                    if (rank == 'HELPER') color = 'BLUE';
                                                    if (rank == 'MOD' || rank == 'MODERATOR') color = 'GREEN';

                                                    createRole(msg, rank.replace(/_PLUS/g, "+"), color, (abnormalrank) => {
                                                        msg.member.roles.add(abnormalrank);
                                                    })
                                                    getRankRoles(msg, () => {});
                                                }
                                            }

                                            msg.member.setNickname(`${capName}`).then(() => {
                                                loading.edit(`${icon.check} You're all set! Your Hypixel and Discord account were linked successfully.`);
                                                msg.author.send(`${icon.check} You're all set! Your Hypixel and Discord account were linked successfully.`);
                                                log('Successfully authed user');
                                            }).catch(e => {
                                                //console.error(e);
                                                loading.edit(`${icon.check} You were successfully verified, but since you have higher permissions then the bot, it was unable to change your nickname.`);
                                            });
                                        }).catch(e => {
                                            console.error(e);
                                            loading.edit(`${icon.x} An unknown error occurred while trying to give you the verified role.`);
                                        });
                                    } else {
                                        msg.member.roles.add(verifiedRole);
                                        if (rank) {
                                            if (normalRanks.indexOf(rank.replace(/_PLUS/g, "+")) !== -1) {
                                                getRankRoles(msg, (currentRank) => {
                                                    msg.member.roles.add(currentRank[rank]);
                                                });
                                            } else {
                                                var color = 'RED';
                                                if (rank == 'HELPER') color = 'BLUE';
                                                if (rank == 'MOD' || rank == 'MODERATOR') color = 'GREEN';

                                                createRole(msg, rank.replace(/_PLUS/g, "+"), color, (abnormalrank) => {
                                                    msg.member.roles.add(abnormalrank);
                                                })
                                                getRankRoles(msg, () => {});
                                            }
                                        }

                                        msg.member.setNickname(`${username}`).then(() => {
                                            loading.edit(`${icon.check} You're all set! Your Hypixel and Discord account were linked successfully.`);
                                            log('Successfully authed user');
                                        }).catch(e => {
                                            log('Successfully authed user');
                                            loading.edit(`${icon.check} You were successfully verified, but since you have higher permissions then the bot, it was unable to change your nickname.`);
                                        });
                                    } } else {
                                        loading.edit(`${icon.x} Your Discord tag does not match that account's currently set for linking Hypixel and Discord: https://gfycat.com/immediateforthrightchipmunk **`);
                                }
                            } else {
                                msg.channel.send(`${icon.x} **The Hypixel API encountered an error.** Please try again later.`);
                            }
                        })
                        .catch((e) => {
                            console.error(e);
                            loading.edit(`${icon.x} **An error occurred while attempting to contact the Hypixel API.** Please try again later.`);
                        });
                });
            } else {
                msg.channel.send(`${icon.x} Sorry, please **check the length of your Minecraft username** and try again.`);
            }
        } else {
            msg.channel.send(`${icon.x} Sorry, please **double check the Minecraft username entered** and try again.`);
        }
    } else if (isDM() && msg.content.startsWith(`${prefix}verify `)) {
        msg.channel.send(`${icon.x} Please send this command into the server you're trying to verify in.`);
    } else if (msg.content.startsWith(`${prefix}verify`)) {
        if (isDM()) {
            msg.channel.send(`${icon.x} Please send this command into the server you're trying to verify in.`);
        } else {
            msg.channel.send(`${icon.x} No username found\nThe command should be formatted like so: \`${prefix}verify DaggyPop\`, where "DaggyPop" is your username.`);
        }
    } else if (msg.content.startsWith(`${prefix}invite`)) {
        msg.channel.send(`You can invite me to your own server using the following link: ${invite_link}`);
    } else if (msg.content == `${prefix}unverify`) {
        if (!isDM()) {
            msg.channel.send(`${icon.loading} Please wait, unverifying user...`).then((loading) => {
                var verifiedRole = msg.guild.roles.cache.find(role => role.name == "Verified");
                if (verifiedRole == null || verifiedRole == undefined) {
                    loading.edit(`${icon.x} The \`Verified\` role doesn't exist! You were not unverified.`);
                } else {
                    if (msg.member.roles.cache.find(role => role.name == "Verified")) {
                        msg.member.roles.remove(verifiedRole).then(() => {
                            db.getDB((currentDB) => {
                                let rankRoles = [];
                                var guildID = msg.guild.id.toString();
                                if (currentDB[guildID] == null) {
                                    rankRoles = ['VIP', 'VIP+', 'MVP', 'MVP+', 'MVP++', 'HELPER'];

                                    for (var i = 0; i < rankRoles.length; i++) {
                                        let rankRole = msg.member.roles.cache.find(role => role.name == rankRoles[i])
                                        if (rankRole !== null && rankRole !== undefined) {
                                            msg.member.roles.remove(rankRole);
                                        }
                                    }
                                } else {
                                    let keys = [];
                                    for (var k in currentDB[msg.guild.id]) keys.push(k);

                                    for (var i = 0; i < keys.length; i++) {
                                        rankRoles.push(currentDB[msg.guild.id][keys[i]].id);
                                    }

                                    for (var i = 0; i < rankRoles.length; i++) {
                                        let rankRole = msg.member.roles.cache.find(role => role.id == rankRoles[i])
                                        if (rankRole !== null && rankRole !== undefined) {
                                            msg.member.roles.remove(rankRole);
                                        }
                                    }
                                }
                                msg.member.setNickname(`${msg.author.username}`).then(() => {
                                    loading.edit(`${icon.check} You were successfully unverified.`);
                                    msg.author.send(`${icon.check} You were successfully unverified.`);
                                }).catch(() => {
                                    loading.edit(`${icon.check} You were successfully unverified, but your nickname couldn't be reset.\nThis can be due to your rank on the server being higher than the bot's.`);
                                    msg.author.send(`${icon.check} You were successfully unverified, but your nickname couldn't be reset.\nThis can be due to your rank on the server being higher than the bot's.`);
                                });
                            })
                        }).catch(() => {
                            loading.edit(`${icon.x} An unknown error occurred while attempting to remove the \`Verified\` role.`);
                        });
                    } else {
                        loading.edit(`${icon.x} Error while unverifying: You are not currently verified.`);
                    }
                }
            });
        } else {
            msg.channel.send(`${icon.x} Please use this command in a text channel.`);
        }
    } else if (msg.content == `${prefix}help`) {
        msg.channel.send(
            embed.create(
                `Helpful Command List`,
                `GREEN`,
                `Very helpful list of commands from Crypixle`, [{
                    "title": "`Crypixle Hypixel Verification System`",
                    "desc": `**${prefix}verify (MINECRAFT IN-GAME-NAME))**: Links your Hypixel and Discord acounts.\n` +
                        `**${prefix}unverify**: Unverify's you from the API.\n` +
                        `**${prefix}support**: If you need support.`,
                    "stack": false
                }, {
                    "title": "`Other`",
                    "desc": `**${prefix}help**: Displays this message.\n` +
                        `**${prefix}invite**: Gives you the link to invite the bot to your own server.\n` +
                        `**${prefix}donate**: Gives you a link to where you can donate.`,
                    "stack": false
                }],
                icon.thinking
            )
        );

    } else if (msg.content == `${prefix}support`) {
        msg.channel.send(
            embed.create(
                `Support`,
                `GREEN`,
                `Need some Support`, [{
                    "title": "`Information`",
                    "desc": `Contact PayNow#8971 on Discord.\n`,
                    "stack": false
                }, {
                    "title": "`Discord`",
                    "desc": `Join our Discord https://discord.gg/4YZq6Nv.\n`,
                    "stack": false
                }],
                icon.thinking
            )
        );
    } else if (msg.content.startsWith(`${prefix}suggest `)) {
        msg.channel.send(`:+1: Thank you for your suggestion.`);
        let suggestion = msg.content.split(' ')
        suggestion.shift();
        suggestion = suggestion.join(' ');
        console.log(`New suggestion from ${msg.author.tag}: ${suggestion}`);
        console.log(`New suggestion from ${msg.author.tag}: ${suggestion}`);
        console.log(`New suggestion from ${msg.author.tag}: ${suggestion}`);
    } else if (msg.content == `${prefix}donate`) {
        msg.channel.send(`If you want to support the bot donate at https://crypixlebot.cf`);
    } else if (msg.content == `${prefix}settings`) {
        if (msg.guild !== null && msg.guild !== undefined) {
            if (msg.member.guild.me.hasPermission('ADMINISTRATOR')) {
                msg.channel.send(`**Current Server Settings:**\n` +
                    `${icon.check} \`MsgNewUsers\` - Messages new users on join.\n` +
                    `${icon.check} \`GiveRankRoles\` - Gives users their Hypixel rank role.\n\n` +
                    `**Change settings:**\nYou cannot currently change settings.`);
            } else {
                msg.channel.send(`${icon.x} You must have the \`ADMINISTRATOR\` permission to view and change settings.`);
            }
        } else {
            msg.channel.send(`${icon.x} This command cannot be used in DMs.`);
        }

    }
});

client.on("guildCreate", guild => {
    log(`added to ${guild.name}`);
    guild.owner.send(
        embed.create(
            'Thanks for adding Crypixle Bot',
            'GREEN',
            'Make sure to configure your permissions properly. When a user joins, they will get a direct message asking them to link their Hypixel and Discord accounts. They will be given the `Hypixel Linked` role when verified successfully.',
            'This bot allows you to verify your players',
            icon.boost
        )
    );
});

client.on("guildMemberAdd", member => {
    member.send(
        embed.create(
            `Thanks for joining ${member.guild.name}!`,
            `GREEN`,
            `In order to prevent spam and scams, verify yourself by linking your Minecraft and Discord account.`, [{
                "title": `How to verify`,
                "desc": `Type \`${prefix}verify Username\`, where username is your Minecraft username, in the server where you want to be verified.`,
                "stack": false
            }], icon.boost
        )
    );

})

client.login(creds.discord_secret);