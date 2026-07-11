const { cmd, commands } = require('../lib/command');
const os = require('os');
const bot = require('../lib/bot');
const config = require('../setting');

// Helper function for runtime
function runtime(seconds) {
    seconds = Number(seconds);
    var d = Math.floor(seconds / (3600 * 24));
    var h = Math.floor(seconds % (3600 * 24) / 3600);
    var m = Math.floor(seconds % 3600 / 60);
    var s = Math.floor(seconds % 60);
    var dDisplay = d > 0 ? d + (d == 1 ? ' day, ' : ' days, ') : '';
    var hDisplay = h > 0 ? h + (h == 1 ? ' hour, ' : ' hours, ') : '';
    var mDisplay = m > 0 ? m + (m == 1 ? ' minute, ' : ' minutes, ') : '';
    var sDisplay = s > 0 ? s + (s == 1 ? ' second' : ' seconds') : '';
    return dDisplay + hDisplay + mDisplay + sDisplay;
}

// ==================== ALIVE COMMAND ====================
cmd({
    pattern: "alive",
    alias: ["ping", "status"],
    desc: "Check if the bot is alive",
    category: "main",
    react: "💚",
    filename: __filename
}, async (conn, mek, m, { from, pushname, reply }) => {
    try {
        const uptime = runtime(process.uptime());
        const memory = (process.memoryUsage().heapUsed / 1024 / 1024).toFixed(2);
        
        let aliveText = `╭──❍ *BOT STATUS* ❍──╮
│
├─❍ *Bot:* ${bot.BOT_NAME}
├─❍ *Uptime:* ${uptime}
├─❍ *Memory:* ${memory}MB
├─❍ *Prefix:* ${config.PREFIX}
├─❍ *Mode:* ${config.MODE}
│
╰──────────────────────❍

> ${bot.COPYRIGHT}`;

        await conn.sendMessage(from, {
            image: { url: bot.ALIVE_IMG || 'https://n.uguu.se/BlGoHUJU.jpg' },
            caption: aliveText
        }, { quoted: mek });
        
        console.log(`✅ Alive command used in ${from}`);
    } catch (e) {
        console.error('Alive error:', e);
        reply('❌ Error: ' + e.message);
    }
});

// ==================== MENU COMMAND ====================
cmd({
    pattern: "menu",
    alias: ["help", "commands"],
    desc: "Show all available commands",
    category: "main",
    react: "📜",
    filename: __filename
}, async (conn, mek, m, { from, pushname, reply, prefix }) => {
    try {
        // Group commands by category
        const categories = {};
        commands.forEach(cmd => {
            if (!cmd.dontAddCommandList) {
                const category = cmd.category || 'misc';
                if (!categories[category]) categories[category] = [];
                categories[category].push(cmd.pattern);
            }
        });

        let menuText = `╭──❍ *${bot.BOT_NAME} MENU* ❍──╮
│
├─❍ *User:* ${pushname}
├─❍ *Prefix:* ${prefix}
├─❍ *Commands:* ${commands.length}
│`;

        for (const [category, cmds] of Object.entries(categories)) {
            menuText += `\n├─❍ *${category.toUpperCase()}*\n`;
            cmds.forEach(cmd => {
                menuText += `│  ├─ ${prefix}${cmd}\n`;
            });
        }

        menuText += `│
╰──────────────────────❍

> ${bot.COPYRIGHT}`;

        await conn.sendMessage(from, {
            image: { url: bot.ALIVE_IMG || 'https://n.uguu.se/BlGoHUJU.jpg' },
            caption: menuText
        }, { quoted: mek });
        
        console.log(`✅ Menu command used in ${from}`);
    } catch (e) {
        console.error('Menu error:', e);
        reply('❌ Error: ' + e.message);
    }
});

// ==================== OWNER COMMAND ====================
cmd({
    pattern: "owner",
    alias: ["dev", "creator"],
    desc: "Get owner information",
    category: "main",
    react: "👑",
    filename: __filename
}, async (conn, mek, m, { from, reply }) => {
    try {
        const ownerInfo = `╭──❍ *OWNER INFO* ❍──╮
│
├─❍ *Name:* ${bot.OWNER_NAME || 'ArslanMD Official'}
├─❍ *Number:* ${bot.OWNER_NUMBER || '923237045919'}
├─❍ *Bot:* ${bot.BOT_NAME}
├─❍ *Version:* ${bot.VERSION || '9.0.0'}
│
╰──────────────────────❍

> ${bot.COPYRIGHT}`;

        await conn.sendMessage(from, {
            image: { url: bot.ALIVE_IMG || 'https://n.uguu.se/BlGoHUJU.jpg' },
            caption: ownerInfo
        }, { quoted: mek });
        
        console.log(`✅ Owner command used in ${from}`);
    } catch (e) {
        console.error('Owner error:', e);
        reply('❌ Error: ' + e.message);
    }
});

// ==================== SYSTEM INFO COMMAND ====================
cmd({
    pattern: "system",
    alias: ["sys", "stats"],
    desc: "Show system information",
    category: "main",
    react: "⚙️",
    filename: __filename
}, async (conn, mek, m, { from, reply }) => {
    try {
        const uptime = runtime(process.uptime());
        const memory = (process.memoryUsage().heapUsed / 1024 / 1024).toFixed(2);
        const totalMem = Math.round(os.totalmem() / 1024 / 1024);
        
        const sysInfo = `╭──❍ *SYSTEM INFO* ❍──╮
│
├─❍ *Uptime:* ${uptime}
├─❍ *Memory:* ${memory}MB / ${totalMem}MB
├─❍ *Platform:* ${os.platform()}
├─❍ *Arch:* ${os.arch()}
├─❍ *Node:* ${process.version}
│
╰──────────────────────❍

> ${bot.COPYRIGHT}`;

        await conn.sendMessage(from, {
            image: { url: bot.ALIVE_IMG || 'https://n.uguu.se/BlGoHUJU.jpg' },
            caption: sysInfo
        }, { quoted: mek });
        
        console.log(`✅ System command used in ${from}`);
    } catch (e) {
        console.error('System error:', e);
        reply('❌ Error: ' + e.message);
    }
});

// ==================== AUTO REPLY ====================
cmd({
    on: "body"
}, async (conn, mek, m, { from, body, isOwner }) => {
    try {
        if (config.AUTO_REPLY === 'true' && !isOwner) {
            const autoReplies = {
                'hello': '👋 Hello! How can I help you?',
                'hi': '👋 Hi there!',
                'hey': '👋 Hey! What\'s up?',
                'help': `Type ${config.PREFIX || '.'}menu to see all commands`,
                'ping': '🏓 Pong!',
                'bot': '🤖 I am KIRA-MD, your WhatsApp assistant!',
                'who are you': `🤖 I am ${bot.BOT_NAME}, a WhatsApp bot made by ${bot.OWNER_NAME}`,
                'thank you': '🙏 You\'re welcome!',
                'thanks': '🙏 You\'re welcome!',
                'good bot': '🤖 Thank you! I try my best!'
            };
            
            const lowerBody = body.toLowerCase().trim();
            for (const [key, reply] of Object.entries(autoReplies)) {
                if (lowerBody.includes(key)) {
                    await m.reply(reply);
                    break;
                }
            }
        }
    } catch (e) {
        console.error('Auto reply error:', e);
    }
});