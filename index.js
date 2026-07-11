const {
  default: makeWASocket,
  useMultiFileAuthState,
  DisconnectReason,
  jidNormalizedUser,
  getContentType,
  fetchLatestBaileysVersion,
  downloadContentFromMessage
} = require('@whiskeysockets/baileys');
const fs = require('fs');
const P = require('pino');
const config = require('./setting');
const axios = require('axios');
const path = require('path');
const express = require('express');
const QRCode = require('qrcode');

// Owner numbers
const ownerNumber = ["923237045919"];

// ==================== LOCAL FILES LOADER ====================
function loadLocalFiles() {
  console.log("📂 Loading local lib and plugins...");
  
  if (!fs.existsSync('./lib')) {
    console.log("❌ lib folder not found! Creating empty lib folder...");
    fs.mkdirSync('./lib', { recursive: true });
  } else {
    console.log("✅ lib folder found");
    const libFiles = fs.readdirSync('./lib').filter(f => f.endsWith('.js'));
    console.log(`📚 Found ${libFiles.length} lib files`);
  }
  
  if (!fs.existsSync('./plugins')) {
    console.log("❌ plugins folder not found! Creating empty plugins folder...");
    fs.mkdirSync('./plugins', { recursive: true });
  } else {
    console.log("✅ plugins folder found");
    const pluginFiles = fs.readdirSync('./plugins').filter(f => f.endsWith('.js'));
    console.log(`🔌 Found ${pluginFiles.length} plugin files`);
  }
  
  console.log("✅ Local files loaded successfully!");
}

loadLocalFiles();

// Message store for anti-delete
const messageStore = new Map();

// Group settings store
const groupSettings = new Map();

// Default welcome message
const DEFAULT_WELCOME = "╭──❍ *WELCOME* ❍──╮\n│\n├─❍ *User:* @user\n├─❍ *Group:* @group\n├─❍ *Members:* @count\n│\n╰──────────────────────❍\n\n> Enjoy your stay! 🎉";

// Default goodbye message
const DEFAULT_GOODBYE = "╭──❍ *GOODBYE* ❍──╮\n│\n├─❍ *User:* @user\n├─❍ *Group:* @group\n├─❍ *Left the group*\n│\n╰──────────────────────❍\n\n> We'll miss you! 👋";

// Session handling
const AUTH_DIR = path.join(__dirname, 'auth_info_baileys');

// ==================== EXPRESS SERVER FOR PAIRING ====================
const app = express();
const port = process.env.PORT || 9090;

// Store QR code and pairing state
let qrCodeData = null;
let pairingState = {
  phoneNumber: null,
  code: null,
  paired: false,
  sock: null
};

// Serve static files
app.use(express.static('public'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Main HTML page with pairing form
app.get('/', (req, res) => {
  const htmlPath = path.join(__dirname, 'lib', 'pair.html');
  if (fs.existsSync(htmlPath)) {
    res.sendFile(htmlPath);
  } else {
    res.send(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>KIRA-MD - Pair Your Device</title>
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            background: linear-gradient(135deg, #0a0a0f 0%, #1a0a2e 50%, #16213e 100%);
            min-height: 100vh;
            display: flex;
            justify-content: center;
            align-items: center;
            color: white;
            padding: 20px;
          }
          .container {
            background: rgba(255,255,255,0.05);
            backdrop-filter: blur(20px);
            border-radius: 20px;
            padding: 40px;
            max-width: 450px;
            width: 100%;
            border: 1px solid rgba(255,255,255,0.1);
            box-shadow: 0 25px 50px rgba(0,0,0,0.5);
          }
          .logo {
            text-align: center;
            margin-bottom: 30px;
          }
          .logo h1 {
            font-size: 2.5rem;
            background: linear-gradient(45deg, #00f3ff, #ff00ff);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
          }
          .logo p {
            color: #8a8aa3;
            margin-top: 5px;
          }
          .form-group {
            margin-bottom: 20px;
          }
          label {
            display: block;
            margin-bottom: 8px;
            color: #8a8aa3;
            font-weight: 500;
          }
          input {
            width: 100%;
            padding: 14px 18px;
            border-radius: 12px;
            border: 2px solid rgba(255,255,255,0.1);
            background: rgba(255,255,255,0.05);
            color: white;
            font-size: 1rem;
            transition: all 0.3s ease;
          }
          input:focus {
            outline: none;
            border-color: #00f3ff;
            box-shadow: 0 0 20px rgba(0,243,255,0.2);
          }
          input::placeholder {
            color: #4a4a5a;
          }
          button {
            width: 100%;
            padding: 14px;
            border: none;
            border-radius: 12px;
            background: linear-gradient(135deg, #00f3ff, #ff00ff);
            color: white;
            font-size: 1.1rem;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.3s ease;
          }
          button:hover {
            transform: scale(1.02);
            box-shadow: 0 10px 30px rgba(0,243,255,0.3);
          }
          button:disabled {
            opacity: 0.5;
            cursor: not-allowed;
            transform: none;
          }
          .status-box {
            margin-top: 20px;
            padding: 15px;
            border-radius: 12px;
            background: rgba(255,255,255,0.05);
            text-align: center;
            min-height: 60px;
            display: flex;
            align-items: center;
            justify-content: center;
            border: 1px solid rgba(255,255,255,0.05);
          }
          .status-box .loading {
            display: inline-block;
            width: 20px;
            height: 20px;
            border: 3px solid rgba(255,255,255,0.1);
            border-radius: 50%;
            border-top-color: #00f3ff;
            animation: spin 1s linear infinite;
            margin-right: 10px;
          }
          @keyframes spin {
            to { transform: rotate(360deg); }
          }
          .status-box .success {
            color: #00ff9d;
          }
          .status-box .error {
            color: #ff4757;
          }
          .status-box .info {
            color: #00f3ff;
          }
          .qr-container {
            text-align: center;
            margin-top: 20px;
            display: none;
          }
          .qr-container img {
            background: white;
            padding: 15px;
            border-radius: 12px;
            max-width: 200px;
          }
          .footer {
            text-align: center;
            margin-top: 20px;
            color: #4a4a5a;
            font-size: 0.8rem;
          }
          .country-code {
            display: flex;
            gap: 10px;
          }
          .country-code input:first-child {
            width: 30%;
          }
          .country-code input:last-child {
            width: 70%;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="logo">
            <h1>⚡ KIRA-MD</h1>
            <p>Pair your WhatsApp device</p>
          </div>
          
          <form id="pairForm">
            <div class="form-group">
              <label>📱 Phone Number</label>
              <div class="country-code">
                <input type="text" id="countryCode" value="92" placeholder="Code" readonly>
                <input type="text" id="phoneNumber" placeholder="3xxxxxxxxx" required>
              </div>
            </div>
            
            <button type="submit" id="pairBtn">🔗 Pair Device</button>
          </form>
          
          <div class="status-box" id="statusBox">
            <span style="color: #4a4a5a;">Enter your number to start pairing</span>
          </div>
          
          <div class="qr-container" id="qrContainer">
            <img id="qrImage" src="" alt="QR Code">
            <p style="margin-top: 10px; color: #8a8aa3; font-size: 0.9rem;">Scan with WhatsApp</p>
          </div>
          
          <div class="footer">
            Made with ❤️ by ArslanMD Official
          </div>
        </div>

        <script>
          const form = document.getElementById('pairForm');
          const phoneInput = document.getElementById('phoneNumber');
          const countryCode = document.getElementById('countryCode');
          const pairBtn = document.getElementById('pairBtn');
          const statusBox = document.getElementById('statusBox');
          const qrContainer = document.getElementById('qrContainer');
          const qrImage = document.getElementById('qrImage');
          
          let statusInterval = null;

          function setStatus(message, type = 'info') {
            const icons = {
              info: 'ℹ️',
              success: '✅',
              error: '❌',
              loading: '⏳'
            };
            statusBox.innerHTML = `<span class="${type}">${icons[type] || ''} ${message}</span>`;
          }

          function setLoading(message) {
            statusBox.innerHTML = `<span class="loading"></span><span>${message}</span>`;
          }

          async function checkPairingStatus() {
            try {
              const response = await fetch('/api/status');
              const data = await response.json();
              
              if (data.paired) {
                setStatus('✅ Bot is connected and running!', 'success');
                qrContainer.style.display = 'none';
                pairBtn.disabled = true;
                pairBtn.textContent = '✅ Connected';
                if (statusInterval) clearInterval(statusInterval);
                return;
              }
              
              if (data.qr) {
                qrContainer.style.display = 'block';
                qrImage.src = data.qr;
                setStatus('📱 Scan the QR code with WhatsApp', 'info');
              }
            } catch (e) {
              console.error('Status check error:', e);
            }
          }

          form.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const number = phoneInput.value.trim();
            if (!number) {
              setStatus('Please enter your phone number', 'error');
              return;
            }
            
            const fullNumber = countryCode.value + number;
            
            pairBtn.disabled = true;
            pairBtn.textContent = '⏳ Pairing...';
            setLoading('Requesting pairing code...');
            
            try {
              const response = await fetch('/api/pair', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ number: fullNumber })
              });
              
              const data = await response.json();
              
              if (data.success) {
                setStatus('📱 Waiting for confirmation on your WhatsApp...', 'info');
                qrContainer.style.display = 'none';
                
                // Start checking status
                if (statusInterval) clearInterval(statusInterval);
                statusInterval = setInterval(checkPairingStatus, 3000);
                
                // Check immediately
                setTimeout(checkPairingStatus, 2000);
              } else {
                setStatus('❌ ' + (data.error || 'Pairing failed'), 'error');
                pairBtn.disabled = false;
                pairBtn.textContent = '🔗 Pair Device';
              }
            } catch (error) {
              setStatus('❌ Error: ' + error.message, 'error');
              pairBtn.disabled = false;
              pairBtn.textContent = '🔗 Pair Device';
            }
          });

          // Check initial status
          checkPairingStatus();
          setInterval(checkPairingStatus, 5000);
        </script>
      </body>
      </html>
    `);
  }
});

// API endpoint for pairing
app.post('/api/pair', async (req, res) => {
  try {
    const { number } = req.body;
    
    if (!number || number.length < 10) {
      return res.json({ success: false, error: 'Invalid phone number' });
    }

    // Clean the number
    const cleanNumber = number.replace(/\D/g, '');
    const fullJid = cleanNumber + '@s.whatsapp.net';

    // If already paired, return success
    if (pairingState.paired) {
      return res.json({ success: true, paired: true });
    }

    // Store the phone number
    pairingState.phoneNumber = fullJid;
    
    // If we don't have a sock instance, start the pairing process
    if (!pairingState.sock) {
      await startPairing(fullJid);
    }

    res.json({ success: true, message: 'Pairing request sent. Check your WhatsApp.' });
  } catch (error) {
    console.error('Pairing error:', error);
    res.json({ success: false, error: error.message });
  }
});

// API endpoint to check status
app.get('/api/status', (req, res) => {
  res.json({
    paired: pairingState.paired,
    qr: qrCodeData,
    phoneNumber: pairingState.phoneNumber
  });
});

// ==================== PAIRING FUNCTION ====================
async function startPairing(phoneNumber) {
  console.log(`🔗 Starting pairing for ${phoneNumber}`);
  
  const { state, saveCreds } = await useMultiFileAuthState(AUTH_DIR);
  
  const { version } = await fetchLatestBaileysVersion();
  
  const sock = makeWASocket({
    logger: P({ level: 'silent' }),
    printQRInTerminal: false,
    browser: ['KIRA-MD', 'Chrome', '1.0.0'],
    auth: state,
    version: version
  });

  // Store sock reference
  pairingState.sock = sock;

  // Handle QR code
  sock.ev.on('connection.update', (update) => {
    const { connection, lastDisconnect, qr } = update;
    
    if (qr) {
      // Generate QR code as data URL
      QRCode.toDataURL(qr, (err, url) => {
        if (!err) {
          qrCodeData = url;
          console.log('✅ QR Code generated for web');
        }
      });
      console.log('📱 QR Code received');
    }
    
    if (connection === 'close') {
      const statusCode = lastDisconnect?.error?.output?.statusCode;
      
      if (statusCode === DisconnectReason.loggedOut) {
        console.log('❌ Device logged out');
        pairingState.paired = false;
        pairingState.sock = null;
        qrCodeData = null;
      } else if (statusCode === DisconnectReason.connectionReplaced) {
        console.log('❌ Connection replaced');
        pairingState.paired = false;
        pairingState.sock = null;
      } else if (lastDisconnect?.error?.message?.includes("Bad MAC")) {
        console.log('⚠️ Bad MAC error, retrying...');
        fs.rmSync(AUTH_DIR, { recursive: true, force: true });
        setTimeout(() => startPairing(phoneNumber), 3000);
      } else {
        console.log('🔄 Connection closed, reconnecting...');
        setTimeout(() => startPairing(phoneNumber), 3000);
      }
    } else if (connection === 'open') {
      console.log('✅ Bot connected to WhatsApp!');
      pairingState.paired = true;
      qrCodeData = null;
      
      // Load plugins and start the bot
      setupBot(sock);
    }
  });

  // Handle credentials update
  sock.ev.on('creds.update', saveCreds);

  // Handle pairing code if provided
  if (phoneNumber) {
    try {
      const code = await sock.requestPairingCode(phoneNumber);
      pairingState.code = code;
      console.log(`📱 Pairing code: ${code}`);
      console.log(`💡 Enter this code in WhatsApp: ${code}`);
    } catch (error) {
      console.error('Pairing code error:', error);
    }
  }

  return sock;
}

// ==================== BOT SETUP ====================
function setupBot(sock) {
  console.log("🤖 Setting up KIRA-MD bot...");
  
  const prefix = config.PREFIX || '.';
  console.log(`🤖 KIRA-MD Connected with prefix: "${prefix}"`);
  
  // Load required modules
  let functions, sms, botConfig;
  
  try {
    functions = require('./lib/functions');
    sms = require('./lib/msg').sms;
    botConfig = require('./lib/bot');
    console.log("✅ Lib files loaded successfully");
  } catch (err) {
    console.log("❌ Error loading lib files:", err);
    return;
  }
  
  const { getBuffer, getGroupAdmins, fetchJson, runtime, sleep, isUrl, getRandom } = functions;

  // Load plugins
  console.log("🔌 Loading plugins...");
  const pluginFiles = fs.readdirSync('./plugins/').filter(f => f.endsWith('.js'));
  let loadedCount = 0;
  
  for (const file of pluginFiles) {
    try {
      require('./plugins/' + file);
      loadedCount++;
      console.log(`  ✅ Loaded: ${file}`);
    } catch (err) {
      console.log(`  ❌ Failed to load ${file}: ${err.message}`);
    }
  }
  
  console.log(`✅ Plugins loaded: ${loadedCount}/${pluginFiles.length}`);

  // ==================== EVENT HANDLERS ====================
  
  // Anti-call feature
  const callMsg = `⚠️ *ANTI-CALL IS ACTIVE* ⚠️\n\nDear User,\n\nYou have attempted to call the bot. To ensure uninterrupted service, please refrain from calling.\n\nThank you for your understanding.\n\n${botConfig.COPYRIGHT || 'KIRA-MD'}`;
  
  sock.ev.on('call', async (calls) => {
    if (config.ANTI_CALL === 'true') {
      for (const call of calls) {
        if (call.status === 'offer') {
          await sock.sendMessage(call.from, { text: callMsg });
          await sock.rejectCall(call.id, call.from);
          console.log(`📞 Rejected call from ${call.from}`);
        }
      }
    }
  });

  // Emoji list for auto react
  const emojiList = ['😊', '👍', '😂', '❤️', '🔥', '🥰', '👌', '💯', '🤣', '😎', '✨', '⭐', '🌟', '💫', '⚡', '💥', '🙏', '🎉', '👏', '💯', '👑', '🤖', '🫡', '✅', '🔰', '💚', '💙', '💜', '🖤', '🤍', '💛', '🧡', '💖', '💝', '💞'];
  
  // ==================== GROUP PARTICIPANTS UPDATE (WELCOME/GOODBYE) ====================
  sock.ev.on('group-participants.update', async (update) => {
    try {
      const { id, participants, action } = update;
      
      if (!id || !participants || !action) return;
      
      const groupMetadata = await sock.groupMetadata(id).catch(() => null);
      if (!groupMetadata) return;
      
      const groupName = groupMetadata.subject || 'Group';
      const groupDesc = groupMetadata.desc || 'No description';
      const memberCount = groupMetadata.participants.length;
      
      const settings = groupSettings.get(id) || {
        welcome: true,
        goodbye: true,
        welcomeMsg: DEFAULT_WELCOME,
        goodbyeMsg: DEFAULT_GOODBYE,
        antilink: true,
        antibad: true
      };
      
      for (const participant of participants) {
        const participantJid = participant.split('@')[0];
        
        if (action === 'add' && settings.welcome) {
          try {
            const ppUrl = await getProfilePicture(sock, participant);
            let welcomeText = settings.welcomeMsg || DEFAULT_WELCOME;
            welcomeText = welcomeText
              .replace(/@user/g, `@${participantJid}`)
              .replace(/@group/g, groupName)
              .replace(/@count/g, memberCount)
              .replace(/@desc/g, groupDesc.substring(0, 100));
            
            await sock.sendMessage(id, {
              image: { url: ppUrl },
              caption: welcomeText,
              mentions: [participant]
            }).catch(async () => {
              await sock.sendMessage(id, { text: welcomeText, mentions: [participant] });
            });
            
            console.log(`👋 Welcome message sent to ${participantJid} in ${groupName}`);
          } catch (error) {
            console.error("❌ Welcome message error:", error);
          }
        } else if (action === 'remove' && settings.goodbye) {
          try {
            const ppUrl = await getProfilePicture(sock, participant).catch(() => 'https://n.uguu.se/BlGoHUJU.jpg');
            let goodbyeText = settings.goodbyeMsg || DEFAULT_GOODBYE;
            goodbyeText = goodbyeText
              .replace(/@user/g, `@${participantJid}`)
              .replace(/@group/g, groupName)
              .replace(/@count/g, memberCount);
            
            await sock.sendMessage(id, {
              image: { url: ppUrl },
              caption: goodbyeText,
              mentions: [participant]
            }).catch(async () => {
              await sock.sendMessage(id, { text: goodbyeText, mentions: [participant] });
            });
            
            console.log(`👋 Goodbye message sent for ${participantJid} in ${groupName}`);
          } catch (error) {
            console.error("❌ Goodbye message error:", error);
          }
        }
      }
    } catch (error) {
      console.error("❌ Welcome/Goodbye error:", error);
    }
  });

  // ==================== MESSAGE HANDLER ====================
  sock.ev.on('messages.upsert', async (messageUpdate) => {
    try {
      const msg = messageUpdate.messages[0];
      if (!msg || !msg.message) return;
      
      // Status handling
      if (msg.key && msg.key.remoteJid === 'status@broadcast') {
        if (config.AUTO_STATUS_MSG === 'true') {
          try {
            await sock.readMessages([msg.key]);
            const botJid = await jidNormalizedUser(sock.user.id);
            await sock.sendMessage(msg.key.remoteJid, {
              react: { key: msg.key, text: '💚' }
            }, { statusJidList: [msg.key.participant, botJid] }).catch(() => {});
          } catch (error) {}
        }
        if (config.AUTO_STATUS_REPLY === 'true' && msg.key.participant) {
          try {
            const statusReplyMsg = botConfig.STATUS_MSG || 'Thanks for status! ❤️';
            await sock.sendMessage(msg.key.participant, { text: statusReplyMsg }).catch(() => {});
          } catch (error) {}
        }
        return;
      }
      
      const msgType = getContentType(msg.message) || 'conversation';
      
      let body = '';
      if (msgType === 'conversation') {
        body = msg.message.conversation || '';
      } else if (msgType === 'extendedTextMessage') {
        body = msg.message.extendedTextMessage?.text || '';
      } else if (msgType === 'imageMessage') {
        body = msg.message.imageMessage?.caption || '';
      } else if (msgType === 'videoMessage') {
        body = msg.message.videoMessage?.caption || '';
      }
      
      const m = sms(sock, msg);
      
      const isCmd = body.startsWith(prefix);
      const command = isCmd ? body.slice(prefix.length).split(' ')[0].toLowerCase().trim() : '';
      const args = body.split(' ').slice(1);
      const q = args.join(' ');
      const from = msg.key.remoteJid;
      const sender = msg.key.participant || msg.key.remoteJid;
      const senderNumber = sender.split('@')[0];
      const botNumber = sock.user.id.split(':')[0] + '@s.whatsapp.net';
      const isGroup = from.endsWith('@g.us');
      const isOwner = ownerNumber.includes(senderNumber);
      const pushName = msg.pushName || senderNumber;
      const botNumberPure = sock.user.id.split(':')[0];
      const isMe = senderNumber === botNumberPure;
      
      let mentions = [];
      if (msgType === 'extendedTextMessage' && msg.message.extendedTextMessage?.contextInfo?.mentionedJid) {
        mentions = msg.message.extendedTextMessage.contextInfo.mentionedJid;
      }
      
      let groupMetadata, groupName, participants, groupAdmins, isBotAdmins, isAdmins;
      if (isGroup) {
        groupMetadata = await sock.groupMetadata(from).catch(() => ({}));
        groupName = groupMetadata?.subject || '';
        participants = groupMetadata?.participants || [];
        groupAdmins = participants.filter(p => p.admin).map(p => p.id);
        isBotAdmins = groupAdmins.includes(botNumber);
        isAdmins = groupAdmins.includes(sender);
      }
      
      let groupSetting = groupSettings.get(from) || {
        welcome: true,
        goodbye: true,
        welcomeMsg: DEFAULT_WELCOME,
        goodbyeMsg: DEFAULT_GOODBYE,
        antilink: true,
        antibad: true
      };
      
      const reply = (text) => {
        sock.sendMessage(from, { text }, { quoted: msg });
      };
      
      // Store message for anti-delete
      if (!msg.key.fromMe && msg.key.remoteJid !== 'status@broadcast') {
        messageStore.set(msg.key.id, msg);
        if (messageStore.size > 500) {
          const firstKey = messageStore.keys().next().value;
          messageStore.delete(firstKey);
        }
      }
      
      if (isCmd) {
        console.log(`🔍 Command: ${command} from ${pushName} (${senderNumber})`);
      }
      
      // Mode handling
      if (config.MODE === 'private' && isCmd && !isOwner) {
        return;
      }
      
      // Auto react
      if (config.AUTO_REACT === 'true' && !isCmd && !msg.key.fromMe && !isGroup) {
        const randomEmoji = emojiList[Math.floor(Math.random() * emojiList.length)];
        await m.react(randomEmoji).catch(() => {});
      }
      
      // Presence updates
      if (config.AUTO_TYPING === 'true' && !msg.key.fromMe) {
        await sock.sendPresenceUpdate('composing', from).catch(() => {});
      }
      
      if (config.ALWAYS_ONLINE === 'true') {
        await sock.sendPresenceUpdate('available').catch(() => {});
      }
      
      if (config.READ_MESSAGE === 'true' && !msg.key.fromMe) {
        await sock.readMessages([msg.key]).catch(() => {});
      }
      
      // ==================== GROUP COMMANDS ====================
      if (isCmd && isGroup) {
        // Welcome commands
        if (command === 'welcome') {
          if (!isAdmins && !isOwner) return reply('❌ Only admins can use this command!');
          const option = args[0]?.toLowerCase();
          if (option === 'on') {
            groupSetting.welcome = true;
            groupSettings.set(from, groupSetting);
            saveGroupSettings();
            reply('✅ Welcome messages turned ON!');
          } else if (option === 'off') {
            groupSetting.welcome = false;
            groupSettings.set(from, groupSetting);
            saveGroupSettings();
            reply('✅ Welcome messages turned OFF!');
          } else {
            reply(`Welcome is: ${groupSetting.welcome ? 'ON' : 'OFF'}\n.welcome on/off`);
          }
        }
        
        // Goodbye commands
        else if (command === 'goodbye') {
          if (!isAdmins && !isOwner) return reply('❌ Only admins can use this command!');
          const option = args[0]?.toLowerCase();
          if (option === 'on') {
            groupSetting.goodbye = true;
            groupSettings.set(from, groupSetting);
            saveGroupSettings();
            reply('✅ Goodbye messages turned ON!');
          } else if (option === 'off') {
            groupSetting.goodbye = false;
            groupSettings.set(from, groupSetting);
            saveGroupSettings();
            reply('✅ Goodbye messages turned OFF!');
          } else {
            reply(`Goodbye is: ${groupSetting.goodbye ? 'ON' : 'OFF'}\n.goodbye on/off`);
          }
        }
        
        // Set welcome message
        else if (command === 'setwelcome') {
          if (!isAdmins && !isOwner) return reply('❌ Only admins can use this command!');
          if (!q) return reply('Please provide a welcome message!\nAvailable: @user, @group, @count, @desc');
          groupSetting.welcomeMsg = q;
          groupSettings.set(from, groupSetting);
          saveGroupSettings();
          reply('✅ Welcome message updated!');
        }
        
        // Set goodbye message
        else if (command === 'setgoodbye') {
          if (!isAdmins && !isOwner) return reply('❌ Only admins can use this command!');
          if (!q) return reply('Please provide a goodbye message!\nAvailable: @user, @group, @count');
          groupSetting.goodbyeMsg = q;
          groupSettings.set(from, groupSetting);
          saveGroupSettings();
          reply('✅ Goodbye message updated!');
        }
        
        // Reset welcome
        else if (command === 'resetwelcome') {
          if (!isAdmins && !isOwner) return reply('❌ Only admins can use this command!');
          groupSetting.welcomeMsg = DEFAULT_WELCOME;
          groupSettings.set(from, groupSetting);
          saveGroupSettings();
          reply('✅ Welcome message reset to default!');
        }
        
        // Reset goodbye
        else if (command === 'resetgoodbye') {
          if (!isAdmins && !isOwner) return reply('❌ Only admins can use this command!');
          groupSetting.goodbyeMsg = DEFAULT_GOODBYE;
          groupSettings.set(from, groupSetting);
          saveGroupSettings();
          reply('✅ Goodbye message reset to default!');
        }
        
        // Welcome settings
        else if (command === 'welcomesettings' || command === 'wsettings') {
          if (!isAdmins && !isOwner) return reply('❌ Only admins can use this command!');
          const settingsMsg = `╭──❍ *WELCOME SETTINGS* ❍──╮
│
├─❍ *Welcome:* ${groupSetting.welcome ? '✅ ON' : '❌ OFF'}
├─❍ *Goodbye:* ${groupSetting.goodbye ? '✅ ON' : '❌ OFF'}
│
├─❍ *Welcome Msg:* ${groupSetting.welcomeMsg.substring(0, 40)}...
├─❍ *Goodbye Msg:* ${groupSetting.goodbyeMsg.substring(0, 40)}...
│
╰──────────────────────❍

.welcome on/off
.goodbye on/off
.setwelcome <text>
.setgoodbye <text>
.resetwelcome
.resetgoodbye`;
          reply(settingsMsg);
        }
      }
      
      // ==================== ANTI DELETE ====================
      if (config.ANTI_DELETE === 'true') {
        try {
          if (msg.message?.protocolMessage && msg.message.protocolMessage.type === 0) {
            if (msg.key.fromMe) return;
            
            const deletedMsgKey = msg.message.protocolMessage.key;
            const deletedMsg = messageStore.get(deletedMsgKey.id);
            
            if (deletedMsg) {
              const deletedBy = msg.key.participant || msg.key.remoteJid;
              const originalSender = deletedMsg.key.participant || deletedMsg.key.remoteJid;
              
              const sendTo = ownerNumber[0] + '@s.whatsapp.net';
              
              let originalContent = '';
              let messageType = '';
              const originalType = getContentType(deletedMsg.message);
              
              if (originalType === 'conversation') {
                originalContent = deletedMsg.message.conversation || '';
                messageType = 'Text';
              } else if (originalType === 'extendedTextMessage') {
                originalContent = deletedMsg.message.extendedTextMessage?.text || '';
                messageType = 'Text';
              } else if (originalType === 'imageMessage') {
                originalContent = deletedMsg.message.imageMessage?.caption || 'No caption';
                messageType = '🖼️ Image';
              } else if (originalType === 'videoMessage') {
                originalContent = deletedMsg.message.videoMessage?.caption || 'No caption';
                messageType = '🎥 Video';
              } else if (originalType === 'audioMessage') {
                originalContent = 'Audio message';
                messageType = '🎵 Audio';
              } else if (originalType === 'stickerMessage') {
                originalContent = 'Sticker';
                messageType = '🎨 Sticker';
              } else {
                originalContent = 'Media message';
                messageType = '📎 Media';
              }
              
              const chatType = from.includes('@g.us') ? '👥 Group' : '👤 Private Chat';
              let groupNameText = '';
              
              if (from.includes('@g.us') && groupName) {
                groupNameText = `\n├─❍ *Group:* ${groupName}`;
              }
              
              const now = new Date();
              const timeStr = now.toLocaleTimeString('en-PK', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
              const dateStr = now.toLocaleDateString('en-PK');
              
              const deleteMessage = `
╭──❍ *🚫 ANTI-DELETE ALERT* ❍──╮
│
├─❍ *Time:* ${timeStr}
├─❍ *Date:* ${dateStr}
├─❍ *Chat Type:* ${chatType}${groupNameText}
│
├─❍ *Deleted By:* @${deletedBy.split('@')[0]}
├─❍ *Original Sender:* @${originalSender.split('@')[0]}
│
├─❍ *Message Type:* ${messageType}
├─❍ *Content:* 
├─❍ \`${originalContent.substring(0, 500)}${originalContent.length > 500 ? '...' : ''}\`
│
╰──────────────────────❍
        
> _Message was deleted but bot saved it_ 🔰`;
              
              await sock.sendMessage(sendTo, {
                text: deleteMessage,
                mentions: [deletedBy, originalSender]
              }).catch(() => {});
              
              console.log(`🚫 Anti-delete: Message saved to inbox`);
            }
          }
        } catch (e) {
          console.error("Anti-delete error:", e);
        }
      }
      
    } catch (error) {
      console.error("❌ Message handler error:", error);
    }
  });
  
  console.log("✅ KIRA-MD bot is ready and listening!");
}

// Save group settings
function saveGroupSettings() {
  try {
    const settingsObj = {};
    for (const [groupId, settings] of groupSettings.entries()) {
      settingsObj[groupId] = settings;
    }
    const SETTINGS_FILE = path.join(__dirname, 'group_settings.json');
    fs.writeFileSync(SETTINGS_FILE, JSON.stringify(settingsObj, null, 2), 'utf8');
  } catch (e) {
    console.error("❌ Could not save group settings:", e);
  }
}

// Load group settings
function loadGroupSettings() {
  const SETTINGS_FILE = path.join(__dirname, 'group_settings.json');
  if (fs.existsSync(SETTINGS_FILE)) {
    try {
      const savedSettings = JSON.parse(fs.readFileSync(SETTINGS_FILE, 'utf8'));
      for (const [groupId, settings] of Object.entries(savedSettings)) {
        groupSettings.set(groupId, settings);
      }
      console.log("✅ Group settings loaded from file");
    } catch (e) {
      console.log("⚠️ Could not load group settings");
    }
  }
}

// Get profile picture
async function getProfilePicture(sock, jid) {
  try {
    const ppUrl = await sock.profilePictureUrl(jid, 'image');
    return ppUrl;
  } catch {
    return 'https://n.uguu.se/BlGoHUJU.jpg';
  }
}

// ==================== CHECK FOR EXISTING SESSION ====================
async function checkExistingSession() {
  const CREDS = path.join(AUTH_DIR, 'creds.json');
  
  if (fs.existsSync(CREDS)) {
    try {
      console.log("🔄 Found existing session, attempting to connect...");
      
      const { state, saveCreds } = await useMultiFileAuthState(AUTH_DIR);
      const { version } = await fetchLatestBaileysVersion();
      
      const sock = makeWASocket({
        logger: P({ level: 'silent' }),
        printQRInTerminal: false,
        browser: ['KIRA-MD', 'Chrome', '1.0.0'],
        auth: state,
        version: version
      });
      
      sock.ev.on('connection.update', (update) => {
        const { connection, lastDisconnect } = update;
        
        if (connection === 'close') {
          const statusCode = lastDisconnect?.error?.output?.statusCode;
          
          if (statusCode === DisconnectReason.loggedOut) {
            console.log('❌ Session expired, please pair again');
            pairingState.paired = false;
            pairingState.sock = null;
            fs.rmSync(AUTH_DIR, { recursive: true, force: true });
          } else if (statusCode === DisconnectReason.connectionReplaced) {
            console.log('❌ Connection replaced');
            pairingState.paired = false;
            pairingState.sock = null;
          } else {
            console.log('🔄 Connection closed, reconnecting...');
          }
        } else if (connection === 'open') {
          console.log('✅ Bot reconnected successfully!');
          pairingState.paired = true;
          pairingState.sock = sock;
          setupBot(sock);
        }
      });
      
      sock.ev.on('creds.update', saveCreds);
      
      // Store sock reference
      pairingState.sock = sock;
      
      // Check if connection is already open
      setTimeout(() => {
        if (sock.user) {
          console.log('✅ Bot is already connected');
          pairingState.paired = true;
          setupBot(sock);
        }
      }, 3000);
      
      return sock;
      
    } catch (error) {
      console.error('❌ Failed to load session:', error);
      fs.rmSync(AUTH_DIR, { recursive: true, force: true });
      return null;
    }
  }
  
  return null;
}

// ==================== START SERVER ====================
// Load group settings
loadGroupSettings();

// Check for existing session
checkExistingSession();

// Start Express server
app.listen(port, '0.0.0.0', () => {
  console.log(`🌐 Web server running on port ${port}`);
  console.log(`🔗 Open: http://localhost:${port} to pair your device`);
});

console.log(`🤖 KIRA-MD Bot is running!`);
console.log(`📱 Visit the web interface to pair your device`);