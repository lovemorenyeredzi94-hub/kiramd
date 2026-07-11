const { cmd, commands } = require('../lib/command');
const config = require('../setting');

// ==================== PROMOTE COMMAND ====================
cmd({
    pattern: "promote",
    desc: "Promote a member to admin",
    category: "group",
    react: "⬆️",
    use: '.promote @mention or reply',
    filename: __filename
}, async (conn, mek, m, { from, isGroup, isBotAdmins, isAdmins, reply, q, quoted }) => {
    try {
        if (!isGroup) return reply('❌ This command is only for groups!');
        if (!isBotAdmins) return reply('❌ I need to be an admin!');
        if (!isAdmins) return reply('❌ Only admins can use this!');
        
        let user = quoted?.sender || mek.message?.extendedTextMessage?.contextInfo?.mentionedJid?.[0];
        
        if (!user) {
            const number = q.replace(/[^0-9]/g, '');
            if (number) user = number + '@s.whatsapp.net';
        }
        
        if (!user) return reply('❌ Please mention or reply to a user!');
        
        await conn.groupParticipantsUpdate(from, [user], 'promote');
        reply(`✅ @${user.split('@')[0]} has been promoted to admin!`, { mentions: [user] });
    } catch (e) {
        console.error('Promote error:', e);
        reply('❌ Error: ' + e.message);
    }
});

// ==================== DEMOTE COMMAND ====================
cmd({
    pattern: "demote",
    desc: "Demote an admin to member",
    category: "group",
    react: "⬇️",
    use: '.demote @mention or reply',
    filename: __filename
}, async (conn, mek, m, { from, isGroup, isBotAdmins, isAdmins, reply, q, quoted }) => {
    try {
        if (!isGroup) return reply('❌ This command is only for groups!');
        if (!isBotAdmins) return reply('❌ I need to be an admin!');
        if (!isAdmins) return reply('❌ Only admins can use this!');
        
        let user = quoted?.sender || mek.message?.extendedTextMessage?.contextInfo?.mentionedJid?.[0];
        
        if (!user) {
            const number = q.replace(/[^0-9]/g, '');
            if (number) user = number + '@s.whatsapp.net';
        }
        
        if (!user) return reply('❌ Please mention or reply to a user!');
        
        await conn.groupParticipantsUpdate(from, [user], 'demote');
        reply(`✅ @${user.split('@')[0]} has been demoted to member!`, { mentions: [user] });
    } catch (e) {
        console.error('Demote error:', e);
        reply('❌ Error: ' + e.message);
    }
});

// ==================== KICK COMMAND ====================
cmd({
    pattern: "kick",
    alias: ["remove", "ban"],
    desc: "Remove a member from group",
    category: "group",
    react: "🚫",
    use: '.kick @mention or reply',
    filename: __filename
}, async (conn, mek, m, { from, isGroup, isBotAdmins, isAdmins, reply, q, quoted }) => {
    try {
        if (!isGroup) return reply('❌ This command is only for groups!');
        if (!isBotAdmins) return reply('❌ I need to be an admin!');
        if (!isAdmins) return reply('❌ Only admins can use this!');
        
        let user = quoted?.sender || mek.message?.extendedTextMessage?.contextInfo?.mentionedJid?.[0];
        
        if (!user) {
            const number = q.replace(/[^0-9]/g, '');
            if (number) user = number + '@s.whatsapp.net';
        }
        
        if (!user) return reply('❌ Please mention or reply to a user!');
        
        await conn.groupParticipantsUpdate(from, [user], 'remove');
        reply(`✅ @${user.split('@')[0]} has been removed from the group!`, { mentions: [user] });
    } catch (e) {
        console.error('Kick error:', e);
        reply('❌ Error: ' + e.message);
    }
});

// ==================== ADD COMMAND ====================
cmd({
    pattern: "add",
    alias: ["invite"],
    desc: "Add a member to the group",
    category: "group",
    react: "➕",
    use: '.add 923xxxxxxxxx',
    filename: __filename
}, async (conn, mek, m, { from, isGroup, isBotAdmins, isAdmins, reply, q }) => {
    try {
        if (!isGroup) return reply('❌ This command is only for groups!');
        if (!isBotAdmins) return reply('❌ I need to be an admin!');
        if (!isAdmins) return reply('❌ Only admins can use this!');
        
        if (!q) return reply('❌ Please provide a number!\nExample: .add 923xxxxxxxxx');
        
        const number = q.replace(/[^0-9]/g, '');
        if (number.length < 10) return reply('❌ Invalid number!');
        
        const user = number + '@s.whatsapp.net';
        await conn.groupParticipantsUpdate(from, [user], 'add');
        reply(`✅ @${number} has been added to the group!`, { mentions: [user] });
    } catch (e) {
        console.error('Add error:', e);
        reply('❌ Error: ' + e.message);
    }
});

// ==================== MUTE/UNMUTE COMMAND ====================
cmd({
    pattern: "mute",
    desc: "Close group (only admins can send messages)",
    category: "group",
    react: "🔇",
    filename: __filename
}, async (conn, mek, m, { from, isGroup, isBotAdmins, isAdmins, reply }) => {
    try {
        if (!isGroup) return reply('❌ This command is only for groups!');
        if (!isBotAdmins) return reply('❌ I need to be an admin!');
        if (!isAdmins) return reply('❌ Only admins can use this!');
        
        await conn.groupSettingUpdate(from, 'announcement');
        reply('🔇 Group has been muted! Only admins can send messages.');
    } catch (e) {
        console.error('Mute error:', e);
        reply('❌ Error: ' + e.message);
    }
});

cmd({
    pattern: "unmute",
    desc: "Open group (everyone can send messages)",
    category: "group",
    react: "🔊",
    filename: __filename
}, async (conn, mek, m, { from, isGroup, isBotAdmins, isAdmins, reply }) => {
    try {
        if (!isGroup) return reply('❌ This command is only for groups!');
        if (!isBotAdmins) return reply('❌ I need to be an admin!');
        if (!isAdmins) return reply('❌ Only admins can use this!');
        
        await conn.groupSettingUpdate(from, 'not_announcement');
        reply('🔊 Group has been unmuted! Everyone can send messages.');
    } catch (e) {
        console.error('Unmute error:', e);
        reply('❌ Error: ' + e.message);
    }
});

// ==================== TAG ALL COMMAND ====================
cmd({
    pattern: "tagall",
    alias: ["everyone", "all"],
    desc: "Mention all group members",
    category: "group",
    react: "📢",
    use: '.tagall <message>',
    filename: __filename
}, async (conn, mek, m, { from, isGroup, participants, q, reply }) => {
    try {
        if (!isGroup) return reply('❌ This command is only for groups!');
        
        const members = participants.map(p => p.id);
        const message = q || '📢 Attention everyone!';
        
        let text = `╭──❍ *TAG ALL* ❍──╮\n│\n├─❍ ${message}\n│\n`;
        members.forEach(member => {
            text += `├─ @${member.split('@')[0]}\n`;
        });
        text += `│\n╰──────────────────────❍`;

        await conn.sendMessage(from, {
            text: text,
            mentions: members
        }, { quoted: mek });
        
        console.log(`✅ Tagall used in ${from}`);
    } catch (e) {
        console.error('Tagall error:', e);
        reply('❌ Error: ' + e.message);
    }
});

// ==================== GROUP INFO COMMAND ====================
cmd({
    pattern: "groupinfo",
    alias: ["gcinfo", "ginfo"],
    desc: "Get group information",
    category: "group",
    react: "ℹ️",
    filename: __filename
}, async (conn, mek, m, { from, isGroup, groupMetadata, reply }) => {
    try {
        if (!isGroup) return reply('❌ This command is only for groups!');
        
        const metadata = groupMetadata || await conn.groupMetadata(from);
        const admins = metadata.participants.filter(p => p.admin).length;
        const members = metadata.participants.length;
        
        const info = `╭──❍ *GROUP INFO* ❍──╮
│
├─❍ *Name:* ${metadata.subject}
├─❍ *Members:* ${members}
├─❍ *Admins:* ${admins}
├─❍ *Created:* ${new Date(metadata.creation * 1000).toLocaleDateString()}
├─❍ *Description:* ${metadata.desc || 'No description'}
│
╰──────────────────────❍`;

        const pp = await conn.getProfilePicture(from).catch(() => null);
        
        if (pp) {
            await conn.sendMessage(from, {
                image: { url: pp },
                caption: info
            }, { quoted: mek });
        } else {
            await reply(info);
        }
        
        console.log(`✅ Groupinfo used in ${from}`);
    } catch (e) {
        console.error('Groupinfo error:', e);
        reply('❌ Error: ' + e.message);
    }
});

// ==================== GROUP LINK COMMAND ====================
cmd({
    pattern: "grouplink",
    alias: ["gclink", "link"],
    desc: "Get group invite link",
    category: "group",
    react: "🔗",
    filename: __filename
}, async (conn, mek, m, { from, isGroup, isBotAdmins, isAdmins, reply }) => {
    try {
        if (!isGroup) return reply('❌ This command is only for groups!');
        if (!isBotAdmins) return reply('❌ I need to be an admin!');
        if (!isAdmins) return reply('❌ Only admins can use this!');
        
        const code = await conn.groupInviteCode(from);
        reply(`🔗 Group Link: https://chat.whatsapp.com/${code}`);
    } catch (e) {
        console.error('Grouplink error:', e);
        reply('❌ Error: ' + e.message);
    }
});