const { cmd, commands } = require('../lib/command');
const fs = require('fs');
const config = require('../setting');

// ==================== BROADCAST COMMAND ====================
cmd({
    pattern: "broadcast",
    alias: ["bc", "announce"],
    desc: "Send message to all groups",
    category: "owner",
    react: "📢",
    use: '.broadcast <message>',
    filename: __filename
}, async (conn, mek, m, { from, isOwner, reply, q, args }) => {
    try {
        if (!isOwner) return reply('❌ This command is only for owner!');
        if (!q) return reply('❌ Please provide a message!');
        
        const groups = await conn.groupFetchAllParticipating();
        let success = 0;
        let failed = 0;
        
        for (const groupId of Object.keys(groups)) {
            try {
                await conn.sendMessage(groupId, { text: `📢 *BROADCAST*\n\n${q}` });
                success++;
                await new Promise(resolve => setTimeout(resolve, 1000));
            } catch (e) {
                failed++;
            }
        }
        
        reply(`✅ Broadcast sent to ${success} groups!\n❌ Failed: ${failed}`);
        console.log(`📢 Broadcast sent to ${success} groups`);
    } catch (e) {
        console.error('Broadcast error:', e);
        reply('❌ Error: ' + e.message);
    }
});

// ==================== UPDATE ENV COMMAND ====================
cmd({
    pattern: "update",
    desc: "Update environment variable",
    category: "owner",
    react: "⚙️",
    use: '.update KEY:value',
    filename: __filename
}, async (conn, mek, m, { from, isOwner, reply, q }) => {
    try {
        if (!isOwner) return reply('❌ This command is only for owner!');
        if (!q) return reply('❌ Please provide update!\nExample: .update MODE:private');
        
        const [key, value] = q.split(':').map(s => s.trim());
        if (!key || !value) return reply('❌ Invalid format! Use KEY:value');
        
        // Update in memory
        if (config[key]) {
            config[key] = value;
            reply(`✅ Updated ${key} = ${value}`);
        } else {
            reply(`❌ Key "${key}" not found in config`);
        }
    } catch (e) {
        console.error('Update error:', e);
        reply('❌ Error: ' + e.message);
    }
});

// ==================== RESTART COMMAND ====================
cmd({
    pattern: "restart",
    desc: "Restart the bot",
    category: "owner",
    react: "🔄",
    filename: __filename
}, async (conn, mek, m, { from, isOwner, reply }) => {
    try {
        if (!isOwner) return reply('❌ This command is only for owner!');
        
        await reply('🔄 Bot is restarting...');
        console.log('🔄 Bot restarting...');
        process.exit(0);
    } catch (e) {
        console.error('Restart error:', e);
        reply('❌ Error: ' + e.message);
    }
});

// ==================== CLEAR SESSION COMMAND ====================
cmd({
    pattern: "clearsession",
    alias: ["cs", "logout"],
    desc: "Clear session and logout",
    category: "owner",
    react: "🗑️",
    filename: __filename
}, async (conn, mek, m, { from, isOwner, reply }) => {
    try {
        if (!isOwner) return reply('❌ This command is only for owner!');
        
        const authDir = './auth_info_baileys';
        if (fs.existsSync(authDir)) {
            fs.rmSync(authDir, { recursive: true, force: true });
            reply('✅ Session cleared! Bot will restart...');
            setTimeout(() => process.exit(0), 2000);
        } else {
            reply('❌ No session found!');
        }
    } catch (e) {
        console.error('Clear session error:', e);
        reply('❌ Error: ' + e.message);
    }
});

// ==================== SET PREFIX COMMAND ====================
cmd({
    pattern: "setprefix",
    desc: "Change bot prefix",
    category: "owner",
    react: "🔰",
    use: '.setprefix .',
    filename: __filename
}, async (conn, mek, m, { from, isOwner, reply, q }) => {
    try {
        if (!isOwner) return reply('❌ This command is only for owner!');
        if (!q) return reply('❌ Please provide a prefix!');
        
        config.PREFIX = q;
        reply(`✅ Prefix changed to: ${q}`);
        console.log(`🔰 Prefix changed to: ${q}`);
    } catch (e) {
        console.error('Setprefix error:', e);
        reply('❌ Error: ' + e.message);
    }
});
