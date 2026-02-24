const { cmd } = global;
const config = require('../config');

cmd({
    pattern: "alive",
    alias: ["online", "status"],
    desc: "Check if bot is online and responsive",
    category: "general",
    react: "🟢",
    filename: __filename,
    use: "",
    isGroup: false,
    isOwner: false,
    isAdmin: false,
    isBotAdmin: false
}, async (conn, mek, m, { 
    from, sender, senderNumber, pushName, body, command, args, text, 
    prefix, isGroup, isOwner, isAdmin, isBotAdmin, botNumber, 
    quoted, quotedMsg, mentionedJid, groupMetadata, setting,
    reply, react, sendImage, sendVideo, sendAudio, sendDocument, sendSticker
}) => {
    try {
        await react("🟢");
        
        // Get uptime
        const startTime = socketCreationTime.get(senderNumber) || Date.now();
        const uptime = Math.floor((Date.now() - startTime) / 1000);
        const hours = Math.floor(uptime / 3600);
        const minutes = Math.floor((uptime % 3600) / 60);
        const seconds = Math.floor(uptime % 60);
        
        // Get system info
        const totalMemMB = (os.totalmem() / (1024 * 1024)).toFixed(2);
        const freeMemMB = (os.freemem() / (1024 * 1024)).toFixed(2);
        const cpuArch = os.arch();
        const platform = os.platform();
        
        // Create alive message
        const aliveMessage = `*╭━━━〔 🐢 ${config.BOT_NAME} 〕━━━┈⊷*
*┃🐢│ 𝙾𝚗𝚕𝚒𝚗𝚎: ✅ 𝙰𝚌𝚝𝚒𝚟𝚎*
*┃🐢│ 𝙾𝚠𝚗𝚎𝚛: ${config.OWNER_NAME}*
*┃🐢│ 𝙿𝚕𝚊𝚝𝚏𝚘𝚛𝚖: ${platform}*
*┃🐢│ 𝙰𝚛𝚌𝚑𝚒𝚝𝚎𝚌𝚝𝚞𝚛𝚎: ${cpuArch}*
*┃🐢│ 𝙿𝚊𝚛𝚊: ${totalMemMB} MB*
*┃🐢│ 𝙵𝚛𝚎𝚎: ${freeMemMB} MB*
*┃🐢│ 𝚄𝚙𝚝𝚒𝚖𝚎: ${hours}h ${minutes}m ${seconds}s*
*┃🐢│ 𝚃𝚒𝚖𝚎: ${new Date().toLocaleTimeString()}*
*╰━━━━━━━━━━━━━━━┈⊷*

*╭━━━〔 📢 𝙸𝙽𝙵𝙾 〕━━━┈⊷*
*┃🐢│ 𝙱𝚘𝚝 𝙸𝚜 𝙰𝚕𝚒𝚟𝚎 𝙰𝚗𝚍 𝚁𝚎𝚊𝚍𝚢!*
*┃🐢│ 𝚃𝚢𝚙𝚎 ${setting.PREFIX}menu 𝚏𝚘𝚛 𝚌𝚘𝚖𝚖𝚊𝚗𝚍𝚜*
*┃🐢│ 𝙲𝚘𝚗𝚝𝚊𝚌𝚝: wa.me/${config.OWNER_NUMBER}*
*╰━━━━━━━━━━━━━━━┈⊷*

${config.BOT_FOOTER}`;

        // Send alive message with image
        await conn.sendMessage(from, {
            image: { url: config.BOT_IMAGES[0] || config.RCD_IMAGE_PATH },
            caption: aliveMessage,
            contextInfo: getContextInfo({ sender })
        }, { quoted: fkontak });
        
        await react("✅");
        
    } catch (error) {
        console.error('Alive error:', error);
        await react("❌");
        await reply('❌ Error checking alive status: ' + error.message);
    }
});
