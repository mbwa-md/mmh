const { cmd } = global;
const config = require('../config');

cmd({
    pattern: "ping",
    alias: ["p", "speed"],
    desc: "Check bot response time and system status",
    category: "general",
    react: "📍",
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
        const start = Date.now();
        await react("⚡");
        
        // Send initial ping message
        const pingMsg = await reply('*📍 Checking connection...*');
        
        const end = Date.now();
        const latency = end - start;
        
        // Get system info
        const totalMemMB = (os.totalmem() / (1024 * 1024)).toFixed(2);
        const freeMemMB = (os.freemem() / (1024 * 1024)).toFixed(2);
        const uptime = Math.floor((Date.now() - (socketCreationTime.get(senderNumber) || Date.now())) / 1000);
        const hours = Math.floor(uptime / 3600);
        const minutes = Math.floor((uptime % 3600) / 60);
        const seconds = Math.floor(uptime % 60);
        
        // Get OS info
        const osType = os.type();
        const platform = os.platform();
        const arch = os.arch();
        
        // Create detailed ping response
        const response = `*╭━━━〔 🐢 𝙿𝙸𝙽𝙶 𝙿𝙾𝙽𝙶 〕━━━┈⊷*
*┃🐢│ 𝙻𝚊𝚝𝚎𝚗𝚌𝚢: ${latency}ms*
*┃🐢│ 𝙳𝚎𝚕𝚝𝚊: ${end - start}ms*
*┃🐢│ 𝚃𝚒𝚖𝚎: ${new Date().toLocaleTimeString()}*
*┃🐢│ 𝙳𝚊𝚝𝚎: ${new Date().toLocaleDateString()}*
*╰━━━━━━━━━━━━━━━┈⊷*

*╭━━━〔 📊 𝚂𝚈𝚂𝚃𝙴𝙼 〕━━━┈⊷*
*┃🐢│ 𝙾𝚂: ${osType}*
*┃🐢│ 𝙿𝚕𝚊𝚝𝚏𝚘𝚛𝚖: ${platform}*
*┃🐢│ 𝙰𝚛𝚌𝚑: ${arch}*
*┃🐢│ 𝚃𝚘𝚝𝚊𝚕 𝙿𝚊𝚛𝚊: ${totalMemMB} MB*
*┃🐢│ 𝙵𝚛𝚎𝚎 𝙿𝚊𝚛𝚊: ${freeMemMB} MB*
*┃🐢│ 𝚄𝚙𝚝𝚒𝚖𝚎: ${hours}h ${minutes}m ${seconds}s*
*╰━━━━━━━━━━━━━━━┈⊷*

${config.BOT_FOOTER}`;

        // Edit the initial message with the final result
        await conn.sendMessage(from, {
            text: response,
            edit: pingMsg.key,
            contextInfo: getContextInfo({ sender })
        });
        
        await react("✅");
        
    } catch (error) {
        console.error('Ping error:', error);
        await react("❌");
        await reply('❌ Error checking ping: ' + error.message);
    }
});
