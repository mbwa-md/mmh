const { cmd } = global;
const config = require('../config');

cmd({
    pattern: "menu",
    alias: ["help", "cmds", "commands"],
    desc: "Display all available commands",
    category: "general",
    react: "📜",
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
        await react("📜");
        
        // Get all commands and group by category
        const categories = {};
        const totalCommands = commands.length;
        
        commands.forEach(cmd => {
            const category = cmd.category || 'misc';
            if (!categories[category]) {
                categories[category] = [];
            }
            categories[category].push(cmd);
        });
        
        // Build menu message
        let menuText = `*╭━━━〔 🐢 ${config.BOT_NAME} 〕━━━┈⊷*
*┃🐢│ 𝙱𝚘𝚝 𝙽𝚊𝚖𝚎: ${config.BOT_NAME}*
*┃🐢│ 𝙾𝚠𝚗𝚎𝚛: ${config.OWNER_NAME}*
*┃🐢│ 𝚅𝚎𝚛𝚜𝚒𝚘𝚗: ${config.BOT_VERSION}*
*┃🐢│ 𝙿𝚛𝚎𝚏𝚒𝚡: ${setting.PREFIX}*
*┃🐢│ 𝙲𝚘𝚖𝚖𝚊𝚗𝚍𝚜: ${totalCommands}*
*┃🐢│ 𝚆𝚘𝚛𝚔 𝚃𝚢𝚙𝚎: ${setting.WORK_TYPE}*
*╰━━━━━━━━━━━━━━━┈⊷*\n\n`;
        
        // Add commands by category
        for (const [category, cmds] of Object.entries(categories)) {
            menuText += `*╭──〔 ${category.toUpperCase()} 〕───╮*\n`;
            
            cmds.forEach((cmd, index) => {
                const cmdName = cmd.pattern;
                const cmdDesc = cmd.desc || 'No description';
                const cmdUse = cmd.use ? ` ${cmd.use}` : '';
                menuText += `*│ 🐢 ${setting.PREFIX}${cmdName}${cmdDesc ? ' - ' + cmdDesc : ''}*\n`;
            });
            
            menuText += `*╰──────────────────────╯*\n\n`;
        }
        
        // Add footer
        menuText += `*╭━━━〔 📢 𝙸𝙽𝙵𝙾 〕━━━┈⊷*\n`;
        menuText += `*┃🐢│ 𝚄𝚜𝚎: ${setting.PREFIX}<command> <args>*\n`;
        menuText += `*┃🐢│ 𝙴𝚡: ${setting.PREFIX}ping ${setting.PREFIX}song song name*\n`;
        menuText += `*┃🐢│ 𝙲𝚘𝚗𝚝𝚊𝚌𝚝: wa.me/${config.OWNER_NUMBER}*\n`;
        menuText += `*╰━━━━━━━━━━━━━━━┈⊷*\n\n`;
        menuText += config.BOT_FOOTER;
        
        // Send menu with image
        await conn.sendMessage(from, {
            image: { url: config.BOT_IMAGES[0] || config.RCD_IMAGE_PATH },
            caption: menuText,
            contextInfo: getContextInfo({ sender })
        }, { quoted: fkontak });
        
        await react("✅");
        
    } catch (error) {
        console.error('Menu error:', error);
        await react("❌");
        await reply('❌ Error loading menu: ' + error.message);
    }
});
