const express = require('express');
const path = require('path');
const fs = require('fs-extra');
const { exec } = require('child_process');
const router = express.Router();
const pino = require('pino');
const os = require('os');
const axios = require('axios');
const { default: makeWASocket, useMultiFileAuthState, makeCacheableSignalKeyStore, Browsers, DisconnectReason, jidDecode, downloadContentFromMessage, generateWAMessageFromContent, proto } = require('@whiskeysockets/baileys');
const mongoose = require('mongoose');

// ============================================
// 📌 CONFIGURATION
// ============================================
const config = {
  BOT_NAME: 'SILA MD',
  OWNER_NAME: 'SILA TECH',
  OWNER_NUMBER: '255612491554',
  BOT_VERSION: '2.0.0',
  BOT_FOOTER: '*𝙿𝚘𝚠𝚎𝚛𝚎𝚍 𝚋𝚢 𝚂𝚒𝚕𝚊 𝚃𝚎𝚌𝚑*',
  BOT_URL: 'https://sila-free-bot-2026.onrender.com',
  MONGODB_URI: process.env.MONGODB_URI || 'mongodb+srv://sila_md:sila0022@sila.67mxtd7.mongodb.net/',
  NEWSLETTER_JIDS: ['120363402325089913@newsletter', '120363421404091643@newsletter'],
  RCD_IMAGE_PATH: 'https://files.catbox.moe/277zt9.jpg',
  BOT_IMAGES: [
    'https://files.catbox.moe/277zt9.jpg',
    'https://files.catbox.moe/277zt9.jpg'
  ],
  OWNER_NUMBERS: ['255789661031', '255612491554'],
  AUTO_JOIN_LINKS: [
    'https://whatsapp.com/channel/0029VbBPxQTJUM2WCZLB6j28',
    'https://whatsapp.com/channel/0029VbBG4gfISTkCpKxyMH02',
    'https://whatsapp.com/channel/0029VbBmFT430LKO7Ch9C80X',
    'https://chat.whatsapp.com/IdGNaKt80DEBqirc2ek4ks',
    'https://chat.whatsapp.com/C03aOCLQeRUH821jWqRPC6'
  ]
};

// Make config global
global.config = config;

// ============================================
// 📌 FAKE VCARD (Global)
// ============================================
const fkontak = {
  key: {
    participant: '0@s.whatsapp.net',
    remoteJid: '0@s.whatsapp.net',
    fromMe: false,
    id: 'SILAMD'
  },
  message: {
    contactMessage: {
      displayName: '© SILA MD',
      vcard: `BEGIN:VCARD\nVERSION:3.0\nFN:SILA MD\nORG:SILA TECH;\nTEL;type=CELL;type=VOICE;waid=${config.OWNER_NUMBER}:+${config.OWNER_NUMBER}\nEND:VCARD`
    }
  }
};

// Make fkontak global
global.fkontak = fkontak;

// ============================================
// 📌 CONTEXT INFO GENERATOR
// ============================================
const getContextInfo = (options = {}) => {
  const { sender, mentionedJid, ownerName = config.OWNER_NAME, formattedOwnerNumber = config.OWNER_NUMBER } = options;
  
  return {
    mentionedJid: mentionedJid || (sender ? [sender] : []),
    forwardingScore: 999,
    isForwarded: true,
    forwardedNewsletterMessageInfo: {
      newsletterJid: config.NEWSLETTER_JIDS[0] || '120363402325089913@newsletter',
      newsletterName: `© ${config.BOT_NAME}`,
      serverMessageId: Math.floor(Math.random() * 1000000),
    },
    externalAdReply: {
      title: `👑 𝙱𝙾𝚃 𝙾𝚆𝙽𝙴𝚁: ${ownerName}`,
      body: `📞 wa.me/${formattedOwnerNumber}`,
      mediaType: 1,
      previewType: 0,
      thumbnailUrl: config.RCD_IMAGE_PATH,
      sourceUrl: `https://wa.me/${formattedOwnerNumber}`,
      renderLargerThumbnail: false,
    }
  };
};

// Make getContextInfo global
global.getContextInfo = getContextInfo;

// ============================================
// 📌 BUTTON FUNCTIONS
// ============================================

// Button Message Generator
const generateButtons = async (conn, from, buttons, text, footer = config.BOT_FOOTER, options = {}) => {
  try {
    const buttonRows = buttons.map(btn => ({
      buttonId: btn.buttonId || btn.id,
      buttonText: { displayText: btn.buttonText || btn.text },
      type: 1
    }));

    const buttonMessage = {
      text: text,
      footer: footer,
      buttons: buttonRows,
      headerType: 1
    };

    await conn.sendMessage(from, buttonMessage, options);
  } catch (error) {
    console.error('Button generation error:', error);
    // Fallback to regular text
    let fallbackText = text + '\n\n';
    buttons.forEach((btn, i) => {
      fallbackText += `${i + 1}. ${btn.buttonText || btn.text}\n`;
    });
    fallbackText += `\n${footer}`;
    await conn.sendMessage(from, { text: fallbackText }, options);
  }
};

// Template Buttons Generator
const generateTemplateButtons = async (conn, from, buttons, text, footer = config.BOT_FOOTER, options = {}) => {
  try {
    const templateButtons = buttons.map((btn, index) => {
      if (btn.urlButton) {
        return {
          index: index + 1,
          urlButton: {
            displayText: btn.urlButton.displayText,
            url: btn.urlButton.url
          }
        };
      } else if (btn.callButton) {
        return {
          index: index + 1,
          callButton: {
            displayText: btn.callButton.displayText,
            phoneNumber: btn.callButton.phoneNumber
          }
        };
      } else if (btn.quickReplyButton) {
        return {
          index: index + 1,
          quickReplyButton: {
            displayText: btn.quickReplyButton.displayText,
            id: btn.quickReplyButton.id
          }
        };
      }
    });

    const templateMessage = {
      text: text,
      footer: footer,
      templateButtons: templateButtons
    };

    await conn.sendMessage(from, templateMessage, options);
  } catch (error) {
    console.error('Template button error:', error);
    // Fallback
    let fallbackText = text + '\n\n';
    buttons.forEach((btn, i) => {
      if (btn.urlButton) fallbackText += `🔗 ${btn.urlButton.displayText}: ${btn.urlButton.url}\n`;
      if (btn.callButton) fallbackText += `📞 ${btn.callButton.displayText}: ${btn.callButton.phoneNumber}\n`;
      if (btn.quickReplyButton) fallbackText += `▸ ${btn.quickReplyButton.displayText}\n`;
    });
    fallbackText += `\n${footer}`;
    await conn.sendMessage(from, { text: fallbackText }, options);
  }
};

// List Message Generator
const generateListMessage = async (conn, from, sections, text, footer = config.BOT_FOOTER, buttonText = 'Menu', options = {}) => {
  try {
    const listMessage = {
      text: text,
      footer: footer,
      title: config.BOT_NAME,
      buttonText: buttonText,
      sections: sections
    };

    await conn.sendMessage(from, listMessage, options);
  } catch (error) {
    console.error('List message error:', error);
    // Fallback
    let fallbackText = text + '\n\n';
    sections.forEach(section => {
      fallbackText += `*${section.title}*\n`;
      section.rows.forEach(row => {
        fallbackText += `▸ ${row.title}\n`;
        if (row.description) fallbackText += `  ${row.description}\n`;
      });
      fallbackText += '\n';
    });
    fallbackText += footer;
    await conn.sendMessage(from, { text: fallbackText }, options);
  }
};

// Interactive Button Message (Works on latest WhatsApp)
const sendInteractiveMessage = async (conn, from, content, options = {}) => {
  try {
    const { text, footer, buttons, sections, title } = content;

    if (sections && sections.length > 0) {
      // List message
      const msg = generateWAMessageFromContent(from, {
        viewOnceMessage: {
          message: {
            interactiveMessage: proto.Message.InteractiveMessage.create({
              body: proto.Message.InteractiveMessage.Body.create({ text: text }),
              footer: proto.Message.InteractiveMessage.Footer.create({ text: footer || config.BOT_FOOTER }),
              header: proto.Message.InteractiveMessage.Header.create({ title: title || config.BOT_NAME, hasMediaAttachment: false }),
              nativeFlowMessage: proto.Message.InteractiveMessage.NativeFlowMessage.create({
                buttons: [{
                  name: 'single_select',
                  buttonParamsJson: JSON.stringify({
                    title: 'Menu',
                    sections: sections
                  })
                }]
              })
            })
          }
        }
      }, { quoted: options.quoted });

      await conn.relayMessage(from, msg.message, { messageId: msg.key.id });
    } else if (buttons && buttons.length > 0) {
      // Button message
      const msg = generateWAMessageFromContent(from, {
        viewOnceMessage: {
          message: {
            interactiveMessage: proto.Message.InteractiveMessage.create({
              body: proto.Message.InteractiveMessage.Body.create({ text: text }),
              footer: proto.Message.InteractiveMessage.Footer.create({ text: footer || config.BOT_FOOTER }),
              header: proto.Message.InteractiveMessage.Header.create({ title: title || config.BOT_NAME, hasMediaAttachment: false }),
              nativeFlowMessage: proto.Message.InteractiveMessage.NativeFlowMessage.create({
                buttons: buttons.map(btn => ({
                  name: btn.type || 'quick_reply',
                  buttonParamsJson: JSON.stringify(btn.params || { display_text: btn.text, id: btn.id })
                }))
              })
            })
          }
        }
      }, { quoted: options.quoted });

      await conn.relayMessage(from, msg.message, { messageId: msg.key.id });
    }
  } catch (error) {
    console.error('Interactive message error:', error);
    // Fallback to regular text
    let fallbackText = content.text + '\n\n';
    if (content.buttons) {
      content.buttons.forEach((btn, i) => {
        fallbackText += `${i + 1}. ${btn.text || btn.params?.display_text}\n`;
      });
    }
    if (content.sections) {
      content.sections.forEach(section => {
        fallbackText += `*${section.title}*\n`;
        section.rows.forEach(row => {
          fallbackText += `▸ ${row.title}\n`;
        });
      });
    }
    fallbackText += `\n${content.footer || config.BOT_FOOTER}`;
    await conn.sendMessage(from, { text: fallbackText }, options);
  }
};

// Make button functions global
global.generateButtons = generateButtons;
global.generateTemplateButtons = generateTemplateButtons;
global.generateListMessage = generateListMessage;
global.sendInteractiveMessage = sendInteractiveMessage;

// ============================================
// 📌 MONGODB CONNECTION
// ============================================
mongoose.connect(config.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverSelectionTimeoutMS: 30000,
  socketTimeoutMS: 45000,
}).then(() => {
  console.log('✅ Connected to MongoDB');
}).catch(err => {
  console.error('❌ MongoDB connection error:', err);
  process.exit(1);
});

// ============================================
// 📌 MONGODB SCHEMAS
// ============================================
const sessionSchema = new mongoose.Schema({
  number: { type: String, required: true, unique: true },
  sessionId: { type: String },
  settings: { type: Object, default: {} },
  creds: { type: Object },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

const settingsSchema = new mongoose.Schema({
  number: { type: String, required: true, unique: true },
  settings: { type: Object, default: {} },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

const Session = mongoose.model('Session', sessionSchema);
const Settings = mongoose.model('Settings', settingsSchema);

console.log('✅ Using MongoDB database system');

// ============================================
// 📌 GLOBAL VARIABLES
// ============================================
const activeSockets = new Map();
const socketCreationTime = new Map();
const SESSION_BASE_PATH = './session';
const PLUGINS_PATH = './silatech';

// Create directories
if (!fs.existsSync(SESSION_BASE_PATH)) {
  fs.mkdirSync(SESSION_BASE_PATH, { recursive: true });
}

if (!fs.existsSync(PLUGINS_PATH)) {
  fs.mkdirSync(PLUGINS_PATH, { recursive: true });
}

// ============================================
// 📌 DEFAULT SETTINGS
// ============================================
const defaultSettings = {
  AUTO_RECORDING: 'false',
  AUTO_TYPING: 'true',
  ANTI_CALL: 'false',
  WELCOME_ENABLE: 'true',
  GOODBYE_ENABLE: 'true',
  READ_MESSAGE: 'true',
  AUTO_VIEW_STATUS: 'true',
  AUTO_LIKE_STATUS: 'true',
  WORK_TYPE: 'public',
  PREFIX: '.',
  ANTI_LINK: 'true',
  AUTO_AI: 'on',
  AUTO_STICKER: 'off',
  AUTO_VOICE: 'off',
  ST_EMOJI: '🐢'
};

// ============================================
// 📌 COMMAND REGISTRY
// ============================================
const commands = [];

const cmd = (info, handler) => {
  const cmdInfo = {
    pattern: info.pattern,
    alias: info.alias || [],
    desc: info.desc || 'No description',
    category: info.category || 'misc',
    react: info.react || '🐢',
    filename: info.filename || '',
    use: info.use || '',
    isGroup: info.isGroup || false,
    isOwner: info.isOwner || false,
    isAdmin: info.isAdmin || false,
    isBotAdmin: info.isBotAdmin || false,
    handler: handler
  };
  commands.push(cmdInfo);
};

// Make cmd global
global.cmd = cmd;
global.commands = commands;

// ============================================
// 📌 URL PATTERNS FOR ANTI-LINK
// ============================================
const URL_PATTERNS = [
  /https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)/gi,
  /chat\.whatsapp\.com\/[a-zA-Z0-9]+/gi,
  /whatsapp\.com\/channel\/[a-zA-Z0-9]+/gi,
  /t\.me\/[a-zA-Z0-9_]+/gi,
  /telegram\.me\/[a-zA-Z0-9_]+/gi,
  /instagram\.com\/[a-zA-Z0-9_.]+/gi,
  /facebook\.com\/[a-zA-Z0-9_.]+/gi,
  /twitter\.com\/[a-zA-Z0-9_]+/gi,
  /youtube\.com\/[a-zA-Z0-9_]+/gi,
  /tiktok\.com\/@[a-zA-Z0-9_.]+/gi,
  /snapchat\.com\/add\/[a-zA-Z0-9_.]+/gi,
  /discord\.gg\/[a-zA-Z0-9]+/gi,
  /discord\.com\/invite\/[a-zA-Z0-9]+/gi
];

// ============================================
// 📌 HELPER FUNCTIONS
// ============================================

// Custom delay function
async function myDelay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Check if user is bot owner
function isBotOwner(jid, number, socket) {
  try {
    const cleanNumber = (number || '').replace(/\D/g, '');
    const cleanJid = (jid || '').replace(/\D/g, '');
    const bot = jidDecode(socket.user.id).user;

    if (bot === number) return true;
    return config.OWNER_NUMBERS.some(owner => cleanNumber.endsWith(owner) || cleanJid.endsWith(owner));
  } catch (err) {
    return false;
  }
}

// Get quoted text
function getQuotedText(quotedMessage) {
  if (!quotedMessage) return '';

  if (quotedMessage.conversation) return quotedMessage.conversation;
  if (quotedMessage.extendedTextMessage?.text) return quotedMessage.extendedTextMessage.text;
  if (quotedMessage.imageMessage?.caption) return quotedMessage.imageMessage.caption;
  if (quotedMessage.videoMessage?.caption) return quotedMessage.videoMessage.caption;
  if (quotedMessage.buttonsMessage?.contentText) return quotedMessage.buttonsMessage.contentText;
  if (quotedMessage.listMessage?.description) return quotedMessage.listMessage.description;
  if (quotedMessage.listMessage?.title) return quotedMessage.listMessage.title;

  return '';
}

// Get settings from MongoDB
async function getSettings(number) {
  try {
    const sanitizedNumber = number.replace(/[^0-9]/g, '');
    let settingsDoc = await Settings.findOne({ number: sanitizedNumber });

    if (!settingsDoc) {
      settingsDoc = new Settings({
        number: sanitizedNumber,
        settings: defaultSettings
      });
      await settingsDoc.save();
      return defaultSettings;
    }

    const mergedSettings = { ...defaultSettings, ...settingsDoc.settings };
    return mergedSettings;
  } catch (error) {
    console.error('Error in getSettings:', error);
    return defaultSettings;
  }
}

// Update settings
async function updateSettings(number, updates = {}) {
  try {
    const sanitizedNumber = number.replace(/[^0-9]/g, '');
    let settingsDoc = await Settings.findOne({ number: sanitizedNumber });

    if (!settingsDoc) {
      settingsDoc = new Settings({
        number: sanitizedNumber,
        settings: { ...defaultSettings, ...updates }
      });
    } else {
      settingsDoc.settings = { ...settingsDoc.settings, ...updates };
      settingsDoc.updatedAt = new Date();
    }

    await settingsDoc.save();
    return settingsDoc.settings;
  } catch (error) {
    console.error('Error in updateSettings:', error);
    return defaultSettings;
  }
}

// Save settings
async function saveSettings(number) {
  try {
    const sanitizedNumber = number.replace(/[^0-9]/g, '');
    let settingsDoc = await Settings.findOne({ number: sanitizedNumber });

    if (!settingsDoc) {
      settingsDoc = new Settings({
        number: sanitizedNumber,
        settings: defaultSettings
      });
      await settingsDoc.save();
    }

    return settingsDoc.settings;
  } catch (error) {
    console.error('Error in saveSettings:', error);
    return defaultSettings;
  }
}

// Make helper functions global
global.getSettings = getSettings;
global.updateSettings = updateSettings;
global.saveSettings = saveSettings;
global.myDelay = myDelay;
global.isBotOwner = isBotOwner;
global.getQuotedText = getQuotedText;
global.downloadContentFromMessage = downloadContentFromMessage;

// ============================================
// 📌 LOAD PLUGINS FROM SILATECH FOLDER
// ============================================
function loadPlugins() {
  try {
    if (!fs.existsSync(PLUGINS_PATH)) {
      console.log('📁 Creating silatech plugins folder...');
      fs.mkdirSync(PLUGINS_PATH, { recursive: true });
      return;
    }

    const pluginFiles = fs.readdirSync(PLUGINS_PATH).filter(file => file.endsWith('.js'));
    console.log(`📦 Loading ${pluginFiles.length} plugins from silatech folder...`);

    for (const file of pluginFiles) {
      try {
        const pluginPath = path.join(process.cwd(), PLUGINS_PATH, file);
        
        // Clear cache if exists
        if (require.cache[pluginPath]) {
          delete require.cache[pluginPath];
        }
        
        require(pluginPath);
        console.log(`✅ Loaded: ${file}`);
      } catch (error) {
        console.log(`❌ Failed to load ${file}:`, error.message);
      }
    }

    console.log(`📦 Total commands loaded: ${commands.length}`);
  } catch (error) {
    console.error('Plugin loading error:', error);
  }
}

// ============================================
// 📌 ANTI-LINK HANDLER
// ============================================
async function handleAntiLink(socket, msg, setting, sender) {
  try {
    if (setting.ANTI_LINK !== 'true') return false;
    if (!msg.message) return false;

    let text = '';
    if (msg.message.conversation) {
      text = msg.message.conversation;
    } else if (msg.message.extendedTextMessage?.text) {
      text = msg.message.extendedTextMessage.text;
    } else if (msg.message.imageMessage?.caption) {
      text = msg.message.imageMessage.caption;
    } else if (msg.message.videoMessage?.caption) {
      text = msg.message.videoMessage.caption;
    }

    if (!text) return false;

    let hasLink = false;
    for (const pattern of URL_PATTERNS) {
      if (pattern.test(text)) {
        hasLink = true;
        break;
      }
    }

    if (!hasLink) return false;

    const senderJid = msg.key.participant || msg.key.remoteJid;
    const senderNumber = senderJid.split('@')[0];

    try {
      await socket.sendMessage(sender, {
        delete: {
          id: msg.key.id,
          remoteJid: sender,
          fromMe: false
        }
      });
    } catch (deleteError) {
      console.log('Could not delete message:', deleteError.message);
    }

    const warningMessage = `⚠️ *LINK DETECTED* ⚠️\n\n@${senderNumber} **Umetuma link kwenye group!**\n\nLinks haziruhusiwa hapa.`;

    await socket.sendMessage(sender, { 
      text: warningMessage,
      mentions: [senderJid],
      contextInfo: getContextInfo({ sender: senderJid })
    }, { quoted: fkontak });

    return true;
  } catch (error) {
    console.error('Anti-link error:', error);
    return false;
  }
}

// ============================================
// 📌 AUTO BIO FUNCTION
// ============================================
async function setupAutoBio(socket) {
  setInterval(async () => {
    try {
      const bios = [
        "🐢 SILA-MD | By SILA TECH",
        "🤖 WhatsApp Bot | SILA TECH",
        "🚀 Powerful Features | SILA MD",
        "💫 Always Online | SILA BOT",
        "🎯 Fast & Reliable | SILA-MD"
      ];
      const randomBio = bios[Math.floor(Math.random() * bios.length)];
      await socket.updateProfileStatus(randomBio);
    } catch (error) {}
  }, 30000);
}

// ============================================
// 📌 AUTO JOIN CHANNELS/GROUPS
// ============================================
async function autoJoinChannels(socket) {
  try {
    console.log('🔄 Starting auto-join process...');
    
    for (const link of config.AUTO_JOIN_LINKS) {
      try {
        if (link.includes('whatsapp.com/channel/')) {
          const channelId = link.split('/channel/')[1];
          try {
            if (typeof socket.newsletterFollow === 'function') {
              await socket.newsletterFollow(channelId);
            }
            console.log(`✅ Followed channel: ${channelId}`);
          } catch (channelError) {
            console.log(`⚠️ Channel follow failed: ${channelError.message}`);
          }
        } else if (link.includes('chat.whatsapp.com/')) {
          const groupCode = link.split('chat.whatsapp.com/')[1];
          try {
            const cleanGroupCode = groupCode.split('?')[0].split('/')[0];
            if (cleanGroupCode && cleanGroupCode.length > 5) {
              await socket.groupAcceptInvite(cleanGroupCode);
              console.log(`✅ Joined group: ${cleanGroupCode}`);
            }
          } catch (groupError) {
            console.log(`⚠️ Group join failed: ${groupError.message}`);
          }
        }
        await myDelay(3000);
      } catch (error) {
        console.log(`❌ Error processing link ${link}:`, error.message);
      }
    }
    console.log('✅ Auto-join process completed');
  } catch (error) {
    console.error('❌ Auto-join function error:', error);
  }
}

// ============================================
// 📌 CHANNEL AUTO REACTION
// ============================================
async function setupChannelAutoReaction(socket) {
  socket.ev.on('messages.upsert', async ({ messages }) => {
    try {
      const msg = messages[0];
      if (!msg.message || !msg.key.remoteJid) return;

      const remoteJid = msg.key.remoteJid;
      
      if (remoteJid.endsWith('@newsletter')) {
        try {
          const emojis = ['🐢', '❤️', '🔥', '⭐', '💫', '🚀', '👍', '🎉', '👏'];
          const randomEmoji = emojis[Math.floor(Math.random() * emojis.length)];
          
          await socket.sendMessage(remoteJid, { 
            react: { 
              text: randomEmoji, 
              key: msg.key 
            }
          });
        } catch (reactError) {}
      }
    } catch (error) {}
  });
}

// ============================================
// 📌 GROUP EVENTS HANDLER
// ============================================
const groupEvents = {
  handleGroupUpdate: async (socket, update) => {
    try {
      if (!update || !update.id) return;

      const groupId = update.id;
      const action = update.action;
      const participants = Array.isArray(update.participants) ? update.participants : [update.participants];

      for (const participant of participants) {
        if (!participant) continue;

        const userJid = typeof participant === 'string' ? participant : participant.id || participant;
        const userName = userJid.split('@')[0];

        let message = '';
        let mentions = [userJid];

        if (action === 'add') {
          message = `╭━━【 𝐖𝐄𝐋𝐂𝐎𝐌𝐄 】━━━━━━━━╮\n│ 👋 @${userName}\n│ 🎉 Welcome to the group!\n╰━━━━━━━━━━━━━━━━━━━━╯\n\n${config.BOT_FOOTER}`;
        } else if (action === 'remove') {
          message = `╭━━【 𝐆𝐎𝐎𝐃𝐁𝐘𝐄 】━━━━━━━━╮\n│ 👋 @${userName}\n│ 👋 Farewell!\n╰━━━━━━━━━━━━━━━━━━━━╯\n\n${config.BOT_FOOTER}`;
        } else if (action === 'promote') {
          message = `╭━━【 𝐏𝐑𝐎𝐌𝐎𝐓𝐄 】━━━━━━━━╮\n│ ⬆️ @${userName}\n│ 👑 Promoted to Admin!\n╰━━━━━━━━━━━━━━━━━━━━╯\n\n${config.BOT_FOOTER}`;
        } else if (action === 'demote') {
          message = `╭━━【 𝐃𝐄𝐌𝐎𝐓𝐄 】━━━━━━━━╮\n│ ⬇️ @${userName}\n│ 👑 Demoted from Admin!\n╰━━━━━━━━━━━━━━━━━━━━╯\n\n${config.BOT_FOOTER}`;
        }

        if (message) {
          await socket.sendMessage(groupId, { 
            text: message, 
            mentions: mentions.filter(m => m),
            contextInfo: getContextInfo({ mentionedJid: mentions })
          }, { quoted: fkontak });
        }
      }
    } catch (err) {
      console.error('Group event error:', err.message);
    }
  }
};

function setupGroupEventsListener(socket) {
  socket.ev.on('group-participants.update', async (update) => {
    await groupEvents.handleGroupUpdate(socket, update);
  });
}

// ============================================
// 📌 MESSAGE HANDLER
// ============================================
async function messageHandler(socket, number) {
  socket.ev.on('messages.upsert', async ({ messages }) => {
    const msg = messages[0];
    if (!msg.message || msg.key.remoteJid === 'status@broadcast') return;

    try {
      const setting = await getSettings(number);
      const remoteJid = msg.key.remoteJid;
      const jidNumber = remoteJid.split('@')[0];
      const isGroup = remoteJid.endsWith('@g.us');
      const isOwner = isBotOwner(msg.key.remoteJid, number, socket);
      const sender = msg.key.participant || msg.key.remoteJid;
      const senderNumber = sender.split('@')[0];
      const pushName = msg.pushName || 'User';
      const botNumber = jidDecode(socket.user.id).user;

      // Get message content
      const msgContent = msg.message?.conversation || 
                        msg.message?.extendedTextMessage?.text || 
                        msg.message?.imageMessage?.caption || 
                        msg.message?.videoMessage?.caption || '';
      
      const body = msgContent.trim();
      const PREFIX = setting.PREFIX || '.';
      const isCommand = body.startsWith(PREFIX);

      // Check anti-link first
      if (isGroup && setting.ANTI_LINK === 'true') {
        const linkHandled = await handleAntiLink(socket, msg, setting, remoteJid);
        if (linkHandled) return;
      }

      // WORK TYPE CHECK
      const allowedModes = {
        'private': () => jidNumber === number,
        'groups': () => isGroup,
        'inbox': () => !isGroup && jidNumber !== number,
        'public': () => true
      };

      if (!isOwner) {
        const modeCheck = allowedModes[setting.WORK_TYPE];
        if (!modeCheck || !modeCheck()) return;
      }

      // Handle commands
      if (isCommand) {
        const parts = body.slice(PREFIX.length).trim().split(/ +/);
        const command = parts.shift().toLowerCase();
        const args = parts;
        const text = args.join(' ');

        // Get quoted message info
        const quoted = msg.message?.extendedTextMessage?.contextInfo?.quotedMessage;
        const quotedMsg = quoted ? { message: quoted } : null;
        const mentionedJid = msg.message?.extendedTextMessage?.contextInfo?.mentionedJid || [];

        // Check if bot is admin in group
        let isBotAdmin = false;
        let isAdmin = false;
        let groupMetadata = null;

        if (isGroup) {
          try {
            groupMetadata = await socket.groupMetadata(remoteJid);
            const botJid = socket.user.id.split(':')[0] + '@s.whatsapp.net';
            const participants = groupMetadata.participants;
            
            isBotAdmin = participants.some(p => p.id === botJid && (p.admin === 'admin' || p.admin === 'superadmin'));
            isAdmin = participants.some(p => p.id === sender && (p.admin === 'admin' || p.admin === 'superadmin'));
          } catch (e) {}
        }

        // Find and execute command
        for (const cmd of commands) {
          const patterns = [cmd.pattern, ...(cmd.alias || [])];
          
          if (patterns.includes(command)) {
            // Check permissions
            if (cmd.isOwner && !isOwner) {
              await socket.sendMessage(remoteJid, {
                text: '🚫 This command is only for the owner.',
                contextInfo: getContextInfo({ sender })
              }, { quoted: fkontak });
              return;
            }

            if (cmd.isGroup && !isGroup) {
              await socket.sendMessage(remoteJid, {
                text: '🚫 This command is only for groups.',
                contextInfo: getContextInfo({ sender })
              }, { quoted: fkontak });
              return;
            }

            if (cmd.isAdmin && !isAdmin && !isOwner) {
              await socket.sendMessage(remoteJid, {
                text: '🚫 This command is only for admins.',
                contextInfo: getContextInfo({ sender })
              }, { quoted: fkontak });
              return;
            }

            if (cmd.isBotAdmin && !isBotAdmin) {
              await socket.sendMessage(remoteJid, {
                text: '🚫 Bot needs to be admin to use this command.',
                contextInfo: getContextInfo({ sender })
              }, { quoted: fkontak });
              return;
            }

            // React to command
            if (cmd.react) {
              try {
                await socket.sendMessage(remoteJid, {
                  react: { text: cmd.react, key: msg.key }
                });
              } catch (e) {}
            }

            // Execute command handler
            try {
              await cmd.handler(socket, msg, {
                from: remoteJid,
                sender,
                senderNumber,
                pushName,
                body,
                command,
                args,
                text,
                prefix: PREFIX,
                isGroup,
                isOwner,
                isAdmin,
                isBotAdmin,
                botNumber,
                quoted,
                quotedMsg,
                mentionedJid,
                groupMetadata,
                setting,
                
                // Helper functions
                reply: async (text) => {
                  return await socket.sendMessage(remoteJid, {
                    text: text,
                    contextInfo: getContextInfo({ sender })
                  }, { quoted: fkontak });
                },
                
                react: async (emoji) => {
                  return await socket.sendMessage(remoteJid, {
                    react: { text: emoji, key: msg.key }
                  });
                },

                sendImage: async (url, caption = '') => {
                  return await socket.sendMessage(remoteJid, {
                    image: { url: url },
                    caption: caption,
                    contextInfo: getContextInfo({ sender })
                  }, { quoted: fkontak });
                },

                sendVideo: async (url, caption = '') => {
                  return await socket.sendMessage(remoteJid, {
                    video: { url: url },
                    caption: caption,
                    contextInfo: getContextInfo({ sender })
                  }, { quoted: fkontak });
                },

                sendAudio: async (url, ptt = false) => {
                  return await socket.sendMessage(remoteJid, {
                    audio: { url: url },
                    mimetype: 'audio/mp4',
                    ptt: ptt
                  }, { quoted: fkontak });
                },

                sendDocument: async (url, fileName, mimetype) => {
                  return await socket.sendMessage(remoteJid, {
                    document: { url: url },
                    fileName: fileName,
                    mimetype: mimetype
                  }, { quoted: fkontak });
                },

                sendSticker: async (buffer) => {
                  return await socket.sendMessage(remoteJid, {
                    sticker: buffer
                  }, { quoted: fkontak });
                }
              });
            } catch (cmdError) {
              console.error(`Command error [${command}]:`, cmdError);
              await socket.sendMessage(remoteJid, {
                text: `❌ Error executing command: ${cmdError.message}`,
                contextInfo: getContextInfo({ sender })
              }, { quoted: fkontak });
            }

            return;
          }
        }
      }

      // Handle group invite messages
      if (msg.message?.groupInviteMessage) {
        const inviteMsg = msg.message.groupInviteMessage;
        const groupName = inviteMsg.groupName || "Unknown Group";
        const inviteCode = inviteMsg.inviteCode;
        const inviter = msg.key.participant || msg.key.remoteJid || sender;

        try {
          const response = await socket.groupAcceptInvite(inviteCode);
          if (response?.gid) {
            await socket.sendMessage(inviter, {
              text: `✅ Joined group: *${groupName}*`,
              contextInfo: getContextInfo({ sender: inviter })
            }, { quoted: fkontak });

            await socket.sendMessage(response.gid, {
              text: `╭━━【 𝐁𝐎𝐓 𝐉𝐎𝐈𝐍𝐄𝐃 】━━━━━━━━╮\n│ 🤖 ${config.BOT_NAME}\n│ 👋 Hello everyone!\n│ 📝 Type ${setting.PREFIX}menu for commands\n╰━━━━━━━━━━━━━━━━━━━━╯\n\n${config.BOT_FOOTER}`,
              contextInfo: getContextInfo({})
            }, { quoted: fkontak });
          }
        } catch (error) {
          await socket.sendMessage(inviter, {
            text: `❌ Failed to join: ${error.message}`,
            contextInfo: getContextInfo({ sender: inviter })
          }, { quoted: fkontak });
        }
      }

    } catch (error) {
      console.error('Message handler error:', error);
    }
  });
}

// ============================================
// 📌 STATUS HANDLER
// ============================================
async function statusHandler(socket, number) {
  socket.ev.on('messages.upsert', async ({ messages }) => {
    const msg = messages[0];
    if (!msg || !msg.message) return;

    const sender = msg.key.remoteJid;
    const settings = await getSettings(number);
    const isStatus = sender === 'status@broadcast';

    if (isStatus) {
      if (settings.AUTO_VIEW_STATUS === 'true') {
        try {
          await socket.readMessages([msg.key]);
        } catch (e) {}
      }

      if (settings.AUTO_LIKE_STATUS === 'true') {
        try {
          const emojis = ['❤️', '🧡', '💛', '💚', '💙', '💜', '🖤', '🤍'];
          const randomEmoji = emojis[Math.floor(Math.random() * emojis.length)];
          await socket.sendMessage(msg.key.remoteJid, { 
            react: { key: msg.key, text: randomEmoji } 
          }, { statusJidList: [msg.key.participant, socket.user.id] });
        } catch (e) {}
      }
    }

    if (!isStatus && settings.READ_MESSAGE === 'true') {
      try {
        await socket.readMessages([msg.key]);
      } catch (e) {}
    }

    if (!isStatus && settings.AUTO_TYPING === 'true' && !msg.key.fromMe) {
      try {
        await socket.sendPresenceUpdate('composing', sender);
        setTimeout(async () => {
          await socket.sendPresenceUpdate('paused', sender);
        }, 1000);
      } catch (e) {}
    }
  });
}

// ============================================
// 📌 SESSION FUNCTIONS
// ============================================
async function sessionDownload(sessionId, number) {
  const sanitizedNumber = number.replace(/[^0-9]/g, '');
  const sessionPath = path.join(SESSION_BASE_PATH, `session_${sanitizedNumber}`);
  const credsFilePath = path.join(sessionPath, 'creds.json');

  if (sessionId.includes('MONGO-')) {
    try {
      const sessionDoc = await Session.findOne({ number: sanitizedNumber });
      if (sessionDoc && sessionDoc.creds) {
        await fs.ensureDir(sessionPath);
        await fs.writeFile(credsFilePath, JSON.stringify(sessionDoc.creds, null, 2));
        return { success: true, path: credsFilePath };
      }
      return { success: false, error: 'MongoDB session not found' };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  if (sessionId.includes('SESSION-LOCAL-')) {
    if (fs.existsSync(credsFilePath)) {
      return { success: true, path: credsFilePath };
    }
    return { success: false, error: 'Local session file not found' };
  }

  return { success: false, error: 'Invalid session ID format' };
}

async function uploadCredsToMongoDB(credsPath, number) {
  try {
    const sanitizedNumber = number.replace(/[^0-9]/g, '');
    const credsContent = await fs.readFile(credsPath, 'utf8');
    const creds = JSON.parse(credsContent);

    await Session.findOneAndUpdate(
      { number: sanitizedNumber },
      { creds: creds, updatedAt: new Date() },
      { upsert: true }
    );

    return `MONGO-${sanitizedNumber}-${Date.now()}`;
  } catch (error) {
    console.error('Error saving creds to MongoDB:', error);
    return `SESSION-LOCAL-${Date.now()}`;
  }
}

// ============================================
// 📌 MAIN BOT FUNCTION
// ============================================
async function startBot(number, res) {
  const sanitizedNumber = number.replace(/[^0-9]/g, '');
  const sessionPath = path.join(SESSION_BASE_PATH, `session_${sanitizedNumber}`);

  try {
    await saveSettings(sanitizedNumber);
    const { state, saveCreds } = await useMultiFileAuthState(sessionPath);
    const logger = pino({ level: 'silent' });

    const socket = makeWASocket({
      auth: {
        creds: state.creds,
        keys: makeCacheableSignalKeyStore(state.keys, logger),
      },
      printQRInTerminal: false,
      logger,
      browser: Browsers.macOS('Safari'),
      markOnlineOnConnect: false,
      generateHighQualityLinkPreview: false,
      syncFullHistory: false,
      defaultQueryTimeoutMs: 60000
    });

    socket.decodeJid = (jid) => {
      if (!jid) return jid;
      if (/:\d+@/gi.test(jid)) {
        const decoded = jidDecode(jid) || {};
        return (decoded.user && decoded.server) ? decoded.user + '@' + decoded.server : jid;
      }
      return jid;
    };

    socketCreationTime.set(sanitizedNumber, Date.now());

    // Setup features
    await setupAutoBio(socket);
    await autoJoinChannels(socket);
    await setupChannelAutoReaction(socket);
    setupGroupEventsListener(socket);

    // Setup handlers
    await messageHandler(socket, sanitizedNumber);
    await statusHandler(socket, sanitizedNumber);

    let responseStatus = { codeSent: false, connected: false, error: null };

    socket.ev.on('creds.update', async () => {
      try { await saveCreds(); } catch (error) {}
    });

    socket.ev.on('connection.update', async (update) => {
      const { connection, lastDisconnect, qr } = update;

      if (connection === 'close') {
        const shouldReconnect = (lastDisconnect?.error)?.output?.statusCode !== DisconnectReason.loggedOut;
        const statusCode = lastDisconnect?.error?.output?.statusCode;

        console.log(`[ ${sanitizedNumber} ] Connection closed. Code: ${statusCode}`);

        if (statusCode === DisconnectReason.loggedOut || statusCode === DisconnectReason.badSession) {
          try {
            fs.removeSync(sessionPath);
            await Session.findOneAndDelete({ number: sanitizedNumber });
          } catch (e) {}
        }

        if (statusCode === DisconnectReason.restartRequired) {
          activeSockets.delete(sanitizedNumber);
          socketCreationTime.delete(sanitizedNumber);
          setTimeout(() => startBot(sanitizedNumber, res), 2000);
        }

        activeSockets.delete(sanitizedNumber);
        socketCreationTime.delete(sanitizedNumber);

      } else if (connection === 'open') {
        console.log(`[ ${sanitizedNumber} ] Connected successfully!`);

        activeSockets.set(sanitizedNumber, socket);
        responseStatus.connected = true;

        try {
          const filePath = path.join(sessionPath, 'creds.json');
          if (fs.existsSync(filePath)) {
            const sessionId = await uploadCredsToMongoDB(filePath, sanitizedNumber);
            const userId = await socket.decodeJid(socket.user.id);
            await Session.findOneAndUpdate(
              { number: userId.split('@')[0] }, 
              { sessionId: sessionId }, 
              { upsert: true }
            );

            await socket.sendMessage(userId, {
              text: `*╭━━━〔 🐢 ${config.BOT_NAME} 🐢 〕━━━┈⊷*\n*┃🐢│ BOT CONNECTED SUCCESSFULLY!*\n*┃🐢│ TIME: ${new Date().toLocaleString()}*\n*┃🐢│ STATUS: ONLINE AND READY!*\n*╰━━━━━━━━━━━━━━━┈⊷*\n\n${config.BOT_FOOTER}`,
              contextInfo: getContextInfo({})
            }, { quoted: fkontak });
          }
        } catch (e) {
          console.log('Error saving session:', e.message);
        }

        if (!res.headersSent) {
          res.status(200).send({ 
            status: 'connected', 
            message: `[ ${sanitizedNumber} ] Successfully connected!` 
          });
        }
      }
    });

    // Request pairing code if not registered
    if (!socket.authState.creds.registered) {
      let retries = 3;
      let code = null;

      while (retries > 0 && !code) {
        try {
          await myDelay(1500);
          code = await socket.requestPairingCode(sanitizedNumber);

          if (code) {
            console.log(`[ ${sanitizedNumber} ] Pairing code: ${code}`);
            responseStatus.codeSent = true;

            if (!res.headersSent) {
              res.status(200).send({ 
                status: 'pairing_code_sent', 
                code: code,
                message: `Enter this code in WhatsApp: ${code}` 
              });
            }
            break;
          }
        } catch (error) {
          retries--;
          if (retries > 0) await myDelay(300 * (4 - retries));
        }
      }

      if (!code && !res.headersSent) {
        res.status(500).send({ 
          status: 'error', 
          message: 'Failed to generate pairing code.' 
        });
      }
    }

    // Timeout
    setTimeout(() => {
      if (!responseStatus.connected && !res.headersSent) {
        res.status(408).send({ status: 'timeout', message: 'Connection timeout.' });
        activeSockets.delete(sanitizedNumber);
        socketCreationTime.delete(sanitizedNumber);
      }
    }, 60000);

  } catch (error) {
    console.log(`[ ${sanitizedNumber} ] Setup error:`, error.message);
    if (!res.headersSent) {
      res.status(500).send({ status: 'error', message: 'Failed to initialize.' });
    }
  }
}

// ============================================
// 📌 START ALL SESSIONS
// ============================================
async function startAllSessions() {
  try {
    // Load plugins first
    loadPlugins();

    const sessions = await Session.find();
    console.log(`🔄 Found ${sessions.length} sessions to reconnect.`);

    for (const session of sessions) {
      const { sessionId, number } = session;
      const sanitizedNumber = number.replace(/[^0-9]/g, '');

      if (activeSockets.has(sanitizedNumber)) continue;

      try {
        await sessionDownload(sessionId, sanitizedNumber);
        await startBot(sanitizedNumber, { 
          headersSent: true, 
          status: () => ({ send: () => {} }) 
        });
      } catch (err) {
        console.log(`Error reconnecting ${sanitizedNumber}:`, err.message);
      }
    }

    console.log('✅ Auto-reconnect process completed.');
  } catch (err) {
    console.log('Auto-reconnect error:', err.message);
  }
}

// ============================================
// 📌 EXPRESS ROUTES
// ============================================
router.get('/', async (req, res) => {
  const { number } = req.query;

  if (!number) {
    return res.status(400).send({ status: 'error', message: 'Number required' });
  }

  const sanitizedNumber = number.replace(/[^0-9]/g, '');

  if (!sanitizedNumber || sanitizedNumber.length < 10) {
    return res.status(400).send({ status: 'error', message: 'Invalid number' });
  }

  if (activeSockets.has(sanitizedNumber)) {
    return res.status(200).send({
      status: 'already_connected',
      message: 'Already connected.'
    });
  }

  await startBot(number, res);
});

// ============================================
// 📌 PROCESS HANDLERS
// ============================================
process.on('exit', async () => {
  activeSockets.forEach((socket, number) => {
    try { socket.ws?.close(); } catch (e) {}
    activeSockets.delete(number);
    socketCreationTime.delete(number);
  });
});

process.on('uncaughtException', (err) => {
  console.error('Uncaught exception:', err);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection:', reason);
});

// ============================================
// 📌 EXPORTS
// ============================================
module.exports = { router, startAllSessions };
