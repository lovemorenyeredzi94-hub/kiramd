const fs = require('fs');
if (fs.existsSync('config.env')) require('dotenv').config({ path: './config.env' });

function convertToBool(text, fault = 'true') {
    return text === fault ? true : false;
}

module.exports = {
// No SESSION_ID needed - uses web pairing
AUTO_STATUS_SEEN: process.env.AUTO_STATUS_SEEN || "true",
AUTO_STATUS_REPLY: process.env.AUTO_STATUS_REPLY || "false",
AUTO_STATUS_REACT: process.env.AUTO_STATUS_REACT || "false",
AUTO_STATUS_MSG: process.env.AUTO_STATUS_MSG || "*SEEN YOUR STATUS BY KIRA-MD 🤍*",
AUTO_BIO: process.env.AUTO_BIO || "true",
GOODBYE: process.env.GOODBYE || "false",
ADMIN_EVENTS: process.env.ADMIN_EVENTS || "false",
PREFIX: process.env.PREFIX || ".",
BOT_NAME: process.env.BOT_NAME || "KIRA-MD",
STICKER_NAME: process.env.STICKER_NAME || "KIRA-MD",
CUSTOM_REACT: process.env.CUSTOM_REACT || "false",
CUSTOM_REACT_EMOJIS: process.env.CUSTOM_REACT_EMOJIS || "💝,💖,💗,❤️‍🩹,❤️,🧡,💛,💚,💙,💜,🤎,🖤,🤍",
DELETE_LINKS: process.env.DELETE_LINKS || "false",
OWNER_NUMBER: process.env.OWNER_NUMBER || "923237045919",
OWNER_NAME: process.env.OWNER_NAME || "ArslanMD Official",
SEND_WELCOME: process.env.SEND_WELCOME || "true",
READ_MESSAGE: process.env.READ_MESSAGE || "true",
READ_CMD_ONLY: process.env.READ_CMD_ONLY || "true",
AUTO_REACT: process.env.AUTO_REACT || "false",
ANTI_BAD: process.env.ANTI_BAD || "true",
ANTI_CALL: process.env.ANTI_CALL || "true",
MODE: process.env.MODE || "public",
ANTI_LINK: process.env.ANTI_LINK || "true",
AUTO_VOICE: process.env.AUTO_VOICE || "true",
AUTO_STICKER: process.env.AUTO_STICKER || "false",
AUTO_REPLY: process.env.AUTO_REPLY || "true",
ALWAYS_ONLINE: process.env.ALWAYS_ONLINE || "true",
PUBLIC_MODE: process.env.PUBLIC_MODE || "true",
AUTO_TYPING: process.env.AUTO_TYPING || "true",
READ_CMD: process.env.READ_CMD || "false",
DEV: process.env.DEV || "923237045919",
ANTI_VV: process.env.ANTI_VV || "true",
ANTI_BOT: process.env.ANTI_BOT || "true",
ANTI_DELETE: process.env.ANTI_DELETE || "true",
ANTI_DELETE_TYPE: process.env.ANTI_DELETE_TYPE || "same",
AUTO_RECORDING: process.env.AUTO_RECORDING || "true",
AUTO_BLOCK: process.env.AUTO_BLOCK || "false"
};