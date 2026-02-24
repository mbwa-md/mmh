const { cmd } = global;
const config = require('../config');
const axios = require('axios');
const yts = require('yt-search');

cmd({
    pattern: "song",
    alias: ["mp3", "audio", "play", "music"],
    desc: "Download audio from YouTube",
    category: "download",
    react: "🎵",
    filename: __filename,
    use: "<song name or YouTube URL>",
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
        await react("🎵");
        
        const query = args.join(" ");
        if (!query) {
            return await reply(`*❌ 𝙿𝚕𝚎𝚊𝚜𝚎 𝚙𝚛𝚘𝚟𝚒𝚍𝚎 𝚊 𝚜𝚘𝚗𝚐 𝚗𝚊𝚖𝚎 𝚘𝚛 𝚈𝚘𝚞𝚃𝚞𝚋𝚎 𝚄𝚁𝙻*\n\n*𝚄𝚜𝚊𝚐𝚎:* ${setting.PREFIX}${command} song name\n*𝙴𝚡𝚊𝚖𝚙𝚕𝚎:* ${setting.PREFIX}${command} shape of you`);
        }
        
        await reply("*🔍 Searching for audio...*");
        
        // Search for the song
        let video;
        if (query.includes('youtube.com') || query.includes('youtu.be')) {
            video = { 
                url: query, 
                title: 'YouTube Audio', 
                timestamp: 'N/A', 
                views: 'N/A',
                thumbnail: config.RCD_IMAGE_PATH,
                author: { name: 'YouTube' }
            };
        } else {
            const search = await yts(query);
            if (!search || !search.videos.length) {
                return await reply("*❌ 𝙽𝚘 𝚛𝚎𝚜𝚞𝚕𝚝𝚜 𝚏𝚘𝚞𝚗𝚍*");
            }
            video = search.videos[0];
        }
        
        // Send video info
        const caption = `*╭━━━〔 🎵 𝙰𝚄𝙳𝙸𝙾 𝙸𝙽𝙵𝙾 〕━━━┈⊷*
*┃🐢│ 𝚃𝚒𝚝𝚕𝚎: ${video.title}*
*┃🐢│ 𝙳𝚞𝚛𝚊𝚝𝚒𝚘𝚗: ${video.timestamp}*
*┃🐢│ 𝚅𝚒𝚎𝚠𝚜: ${video.views}*
*┃🐢│ 𝙰𝚞𝚝𝚑𝚘𝚛: ${video.author?.name || 'Unknown'}*
*┃🐢│ 𝙻𝚒𝚗𝚔: ${video.url}*
*╰━━━━━━━━━━━━━━━┈⊷*

*⬇️ 𝙳𝚘𝚠𝚗𝚕𝚘𝚊𝚍𝚒𝚗𝚐...*`;
        
        await sendImage(video.thumbnail || config.RCD_IMAGE_PATH, caption);
        
        // Try multiple APIs for downloading
        let audioUrl = null;
        let audioTitle = video.title;
        
        // API 1: Yupra
        try {
            const apiUrl1 = `https://api.yupra.my.id/api/downloader/ytmp3?url=${encodeURIComponent(video.url)}`;
            const res1 = await axios.get(apiUrl1, {
                timeout: 30000,
                headers: { 'User-Agent': 'Mozilla/5.0' }
            });
            
            if (res1.data?.result?.audio?.url) {
                audioUrl = res1.data.result.audio.url;
                audioTitle = res1.data.result.title || video.title;
                console.log("✅ Using Yupra API");
            }
        } catch (e) {
            console.log("❌ Yupra API failed:", e.message);
        }
        
        // API 2: Okatsu (fallback)
        if (!audioUrl) {
            try {
                const apiUrl2 = `https://okatsu-rolezapiiz.vercel.app/downloader/ytmp3?url=${encodeURIComponent(video.url)}`;
                const res2 = await axios.get(apiUrl2, {
                    timeout: 30000,
                    headers: { 'User-Agent': 'Mozilla/5.0' }
                });
                
                if (res2.data?.url) {
                    audioUrl = res2.data.url;
                    audioTitle = res2.data.title || video.title;
                    console.log("✅ Using Okatsu API");
                }
            } catch (e) {
                console.log("❌ Okatsu API failed:", e.message);
            }
        }
        
        // API 3: Alternative API (backup)
        if (!audioUrl) {
            try {
                const apiUrl3 = `https://api.siputzx.my.id/api/downloader/ytmp3?url=${encodeURIComponent(video.url)}`;
                const res3 = await axios.get(apiUrl3, { timeout: 30000 });
                
                if (res3.data?.result?.url) {
                    audioUrl = res3.data.result.url;
                    console.log("✅ Using Siputzx API");
                }
            } catch (e) {
                console.log("❌ Siputzx API failed:", e.message);
            }
        }
        
        if (!audioUrl) {
            throw new Error("All APIs failed");
        }
        
        // Download the audio
        const audioResponse = await axios.get(audioUrl, {
            responseType: 'arraybuffer',
            timeout: 60000,
            headers: { 'User-Agent': 'Mozilla/5.0' }
        });
        
        const audioBuffer = Buffer.from(audioResponse.data);
        
        // Send the audio
        await sendAudio(audioBuffer, false);
        
        // Send success message
        await reply(`✅ *${audioTitle}* has been downloaded successfully!\n\n${config.BOT_FOOTER}`);
        
        await react("✅");
        
    } catch (error) {
        console.error("❌ Song error:", error);
        
        if (error.message.includes("All APIs failed")) {
            await reply("*❌ 𝙰𝚕𝚕 𝚍𝚘𝚠𝚗𝚕𝚘𝚊𝚍 𝚊𝚙𝚒𝚜 𝚏𝚊𝚒𝚕𝚎𝚍*\n*𝚃𝚛𝚢 𝚊𝚐𝚊𝚒𝚗 𝚕𝚊𝚝𝚎𝚛 𝚘𝚛 𝚌𝚘𝚗𝚝𝚊𝚌𝚝 𝚊𝚍𝚖𝚒𝚗*");
        } else if (error.message.includes("timeout")) {
            await reply("*❌ 𝚁𝚎𝚚𝚞𝚎𝚜𝚝 𝚝𝚒𝚖𝚎𝚍 𝚘𝚞𝚝*\n*𝚃𝚛𝚢 𝚊𝚐𝚊𝚒𝚗 𝚕𝚊𝚝𝚎𝚛*");
        } else {
            await reply("*❌ 𝙴𝚛𝚛𝚘𝚛 𝚍𝚘𝚠𝚗𝚕𝚘𝚊𝚍𝚒𝚗𝚐 𝚊𝚞𝚍𝚒𝚘*\n*𝙲𝚑𝚎𝚌𝚔 𝚢𝚘𝚞𝚛 𝚒𝚗𝚝𝚎𝚛𝚗𝚎𝚝 𝚌𝚘𝚗𝚗𝚎𝚌𝚝𝚒𝚘𝚗*");
        }
        
        await react("❌");
    }
});
