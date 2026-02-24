const { cmd } = global;
const config = require('../config');

cmd({
    pattern: "settings",
    alias: ["setting", "set"],
    desc: "View and manage bot settings",
    category: "settings",
    react: "⚙️",
    filename: __filename,
    use: "[option] [value]",
    isGroup: false,
    isOwner: true,  // Only owner can use
    isAdmin: false,
    isBotAdmin: false
}, async (conn, mek, m, { 
    from, sender, senderNumber, pushName, body, command, args, text, 
    prefix, isGroup, isOwner, isAdmin, isBotAdmin, botNumber, 
    quoted, quotedMsg, mentionedJid, groupMetadata, setting,
    reply, react, sendImage, sendVideo, sendAudio, sendDocument, sendSticker
}) => {
    try {
        await react("⚙️");
        
        const option = args[0]?.toLowerCase();
        const value = args[1]?.toLowerCase();
        
        // Display all settings if no option provided
        if (!option) {
            let settingsText = `*╭━━━〔 🐢 ${config.BOT_NAME} SETTINGS 〕━━━┈⊷*\n`;
            
            for (const [key, val] of Object.entries(setting)) {
                const status = val === 'true' ? '🟢 ON' : val === 'false' ? '🔴 OFF' : val;
                settingsText += `*┃🐢│ ${key}:* ${status}\n`;
            }
            
            settingsText += `*╰━━━━━━━━━━━━━━━┈⊷*\n\n`;
            settingsText += `*╭──〔 📝 AVAILABLE OPTIONS 〕───╮*\n`;
            settingsText += `*│ 🐢 autorecording - Auto recording status*\n`;
            settingsText += `*│ 🐢 autotyping - Auto typing status*\n`;
            settingsText += `*│ 🐢 anticall - Anti-call feature*\n`;
            settingsText += `*│ 🐢 welcome - Welcome message*\n`;
            settingsText += `*│ 🐢 goodbye - Goodbye message*\n`;
            settingsText += `*│ 🐢 autoread - Auto read messages*\n`;
            settingsText += `*│ 🐢 autoview - Auto view status*\n`;
            settingsText += `*│ 🐢 autolike - Auto like status*\n`;
            settingsText += `*│ 🐢 mode - Work mode (public/private/groups/inbox)*\n`;
            settingsText += `*│ 🐢 setprefix - Change prefix*\n`;
            settingsText += `*│ 🐢 setemoji - Change bot emoji*\n`;
            settingsText += `*│ 🐢 antilink - Anti-link feature*\n`;
            settingsText += `*│ 🐢 autosticker - Auto sticker*\n`;
            settingsText += `*│ 🐢 autovoice - Auto voice*\n`;
            settingsText += `*╰──────────────────────────╯*\n\n`;
            settingsText += `*╭──〔 📖 USAGE 〕───╮*\n`;
            settingsText += `*│ ${setting.PREFIX}${command} <option> <value>*\n`;
            settingsText += `*│ ${setting.PREFIX}${command} mode public*\n`;
            settingsText += `*│ ${setting.PREFIX}${command} setprefix .*\n`;
            settingsText += `*│ ${setting.PREFIX}${command} setemoji 🐢*\n`;
            settingsText += `*╰──────────────────────╯*\n\n`;
            settingsText += config.BOT_FOOTER;
            
            await sendImage(config.RCD_IMAGE_PATH, settingsText);
            await react("✅");
            return;
        }
        
        // Handle specific settings
        const settingsMap = {
            'autorecording': { key: 'AUTO_RECORDING', desc: 'Auto recording' },
            'autorec': { key: 'AUTO_RECORDING', desc: 'Auto recording' },
            'autotyping': { key: 'AUTO_TYPING', desc: 'Auto typing' },
            'autotype': { key: 'AUTO_TYPING', desc: 'Auto typing' },
            'anticall': { key: 'ANTI_CALL', desc: 'Anti-call' },
            'acall': { key: 'ANTI_CALL', desc: 'Anti-call' },
            'welcome': { key: 'WELCOME_ENABLE', desc: 'Welcome message' },
            'goodbye': { key: 'GOODBYE_ENABLE', desc: 'Goodbye message' },
            'autoread': { key: 'READ_MESSAGE', desc: 'Auto read' },
            'autoview': { key: 'AUTO_VIEW_STATUS', desc: 'Auto view status' },
            'autolike': { key: 'AUTO_LIKE_STATUS', desc: 'Auto like status' },
            'mode': { key: 'WORK_TYPE', desc: 'Work mode' },
            'setprefix': { key: 'PREFIX', desc: 'Prefix' },
            'setemoji': { key: 'ST_EMOJI', desc: 'Bot emoji' },
            'antilink': { key: 'ANTI_LINK', desc: 'Anti-link' },
            'autosticker': { key: 'AUTO_STICKER', desc: 'Auto sticker' },
            'autovoice': { key: 'AUTO_VOICE', desc: 'Auto voice' }
        };
        
        const settingKey = settingsMap[option]?.key;
        
        if (!settingKey) {
            return await reply(`*❌ Invalid option: ${option}*\n\n*Available options:*\n${Object.keys(settingsMap).join(', ')}`);
        }
        
        // View current value
        if (!value) {
            const currentValue = setting[settingKey];
            const status = currentValue === 'true' ? '🟢 ON' : currentValue === 'false' ? '🔴 OFF' : currentValue;
            return await reply(`*⚙️ ${settingsMap[option].desc}*\n*Current:* ${status}\n\n*Usage:* ${setting.PREFIX}${command} ${option} <value>`);
        }
        
        // Update value
        let newValue = value;
        
        // Validate value
        if (settingKey === 'WORK_TYPE') {
            const validModes = ['public', 'private', 'groups', 'inbox'];
            if (!validModes.includes(value)) {
                return await reply(`*❌ Invalid mode: ${value}*\n*Available modes:* ${validModes.join(', ')}`);
            }
        } else if (settingKey === 'PREFIX') {
            if (value.length > 3) {
                return await reply(`*❌ Prefix too long (max 3 characters)*`);
            }
        } else if (settingKey === 'ST_EMOJI') {
            // Any emoji is valid
        } else if (['AUTO_RECORDING', 'AUTO_TYPING', 'ANTI_CALL', 'WELCOME_ENABLE', 'GOODBYE_ENABLE', 
                   'READ_MESSAGE', 'AUTO_VIEW_STATUS', 'AUTO_LIKE_STATUS', 'ANTI_LINK', 
                   'AUTO_STICKER', 'AUTO_VOICE'].includes(settingKey)) {
            if (value !== 'on' && value !== 'off' && value !== 'true' && value !== 'false') {
                return await reply(`*❌ Invalid value: ${value}*\n*Use:* on/off or true/false`);
            }
            newValue = value === 'on' ? 'true' : value === 'off' ? 'false' : value;
        }
        
        // Update in database
        await updateSettings(senderNumber, { [settingKey]: newValue });
        
        // Get updated settings
        const updatedSetting = await getSettings(senderNumber);
        
        const status = newValue === 'true' ? '🟢 ON' : newValue === 'false' ? '🔴 OFF' : newValue;
        
        await reply(`*✅ ${settingsMap[option].desc} updated successfully!*\n\n*New value:* ${status}\n\n${config.BOT_FOOTER}`);
        
        await react("✅");
        
    } catch (error) {
        console.error('Settings error:', error);
        await react("❌");
        await reply('❌ Error updating settings: ' + error.message);
    }
});
