/**
 * THE GOONZETTE DISCORD BOT
 * Version: 3.0
 * 
 * Features:
 * - Monitors Discord channels
 * - Summarizes daily discussions
 * - Sends summaries to website API
 * - Generates daily PDF compilations
 * 
 * Setup: See DISCORD-BOT-SETUP.md
 */

const { Client, GatewayIntentBits, Partials } = require('discord.js');
const fetch = require('node-fetch');
const fs = require('fs');
const path = require('path');

// ===================================
// CONFIGURATION
// ===================================

const CONFIG = {
    // Discord Bot Token (set in .env)
    DISCORD_TOKEN: process.env.DISCORD_TOKEN,
    
    // Your website URL (set in .env)
    WEBSITE_URL: process.env.WEBSITE_URL || 'https://your-site.netlify.app',
    
    // Supabase credentials (set in .env)
    SUPABASE_URL: process.env.SUPABASE_URL,
    SUPABASE_KEY: process.env.SUPABASE_KEY,
    
    // Anthropic API Key (set in .env)
    ANTHROPIC_API_KEY: process.env.ANTHROPIC_API_KEY,
    
    // Channels to monitor (configure these)
    MONITORED_CHANNELS: [
        'general',
        'sports',
        'gaming',
        'hot-takes',
        'nfl',
        'vikings',
        'chiefs'
    ],
    
    // Summary generation time (24-hour format)
    SUMMARY_TIME: '23:30', // 11:30 PM
    
    // PDF generation time (24-hour format)
    PDF_TIME: '23:59', // 11:59 PM
    
    // Minimum messages for daily summary
    MIN_MESSAGES_FOR_SUMMARY: 10,
    
    // Storage file for daily messages
    MESSAGES_FILE: './data/daily_messages.json'
};

// ===================================
// DISCORD CLIENT SETUP
// ===================================

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMembers
    ],
    partials: [Partials.Channel, Partials.Message]
});

// Store today's messages
let dailyMessages = {
    date: getTodayDate(),
    channels: {},
    totalMessages: 0
};

// ===================================
// BOT EVENTS
// ===================================

client.once('ready', () => {
    console.log(`✅ Discord Bot Online: ${client.user.tag}`);
    console.log(`📊 Monitoring ${CONFIG.MONITORED_CHANNELS.length} channels`);
    console.log(`⏰ Summary at ${CONFIG.SUMMARY_TIME}`);
    console.log(`📄 PDF generation at ${CONFIG.PDF_TIME}`);
    
    // Load previous messages if any
    loadDailyMessages();
    
    // Start scheduled tasks
    startScheduledTasks();
});

client.on('messageCreate', async (message) => {
    // Ignore bot messages
    if (message.author.bot) return;
    
    // Check if channel is monitored
    const channelName = message.channel.name;
    if (!CONFIG.MONITORED_CHANNELS.includes(channelName)) return;
    
    // Store message
    storeMessage(message);
});

// ===================================
// MESSAGE STORAGE
// ===================================

function storeMessage(message) {
    const today = getTodayDate();
    
    // Reset if new day
    if (dailyMessages.date !== today) {
        saveDailyMessages(); // Save yesterday's messages
        dailyMessages = {
            date: today,
            channels: {},
            totalMessages: 0
        };
    }
    
    const channelName = message.channel.name;
    
    // Initialize channel if needed
    if (!dailyMessages.channels[channelName]) {
        dailyMessages.channels[channelName] = [];
    }
    
    // Add message
    dailyMessages.channels[channelName].push({
        author: message.author.username,
        content: message.content,
        timestamp: message.createdAt.toISOString(),
        reactions: message.reactions.cache.size,
        attachments: message.attachments.size > 0
    });
    
    dailyMessages.totalMessages++;
    
    // Save periodically
    if (dailyMessages.totalMessages % 50 === 0) {
        saveDailyMessages();
    }
}

function saveDailyMessages() {
    try {
        const dataDir = path.dirname(CONFIG.MESSAGES_FILE);
        if (!fs.existsSync(dataDir)) {
            fs.mkdirSync(dataDir, { recursive: true });
        }
        
        fs.writeFileSync(
            CONFIG.MESSAGES_FILE,
            JSON.stringify(dailyMessages, null, 2)
        );
        
        console.log(`💾 Saved ${dailyMessages.totalMessages} messages`);
    } catch (error) {
        console.error('Error saving messages:', error);
    }
}

function loadDailyMessages() {
    try {
        if (fs.existsSync(CONFIG.MESSAGES_FILE)) {
            const data = fs.readFileSync(CONFIG.MESSAGES_FILE, 'utf8');
            const loaded = JSON.parse(data);
            
            // Only load if same day
            if (loaded.date === getTodayDate()) {
                dailyMessages = loaded;
                console.log(`📂 Loaded ${dailyMessages.totalMessages} messages from today`);
            }
        }
    } catch (error) {
        console.error('Error loading messages:', error);
    }
}

// ===================================
// SCHEDULED TASKS
// ===================================

function startScheduledTasks() {
    // Check every minute
    setInterval(() => {
        const now = getCurrentTime();
        
        // Generate summary
        if (now === CONFIG.SUMMARY_TIME) {
            generateDailySummary();
        }
        
        // Generate PDF
        if (now === CONFIG.PDF_TIME) {
            generateDailyPDF();
        }
    }, 60000); // 1 minute
}

// ===================================
// SUMMARY GENERATION
// ===================================

async function generateDailySummary() {
    console.log('📝 Generating daily Discord summary...');
    
    if (dailyMessages.totalMessages < CONFIG.MIN_MESSAGES_FOR_SUMMARY) {
        console.log(`⚠️ Not enough messages (${dailyMessages.totalMessages}/${CONFIG.MIN_MESSAGES_FOR_SUMMARY})`);
        return;
    }
    
    try {
        // Generate summary for each channel
        const summaries = {};
        
        for (const [channelName, messages] of Object.entries(dailyMessages.channels)) {
            if (messages.length === 0) continue;
            
            const summary = await summarizeChannel(channelName, messages);
            summaries[channelName] = summary;
        }
        
        // Generate overall summary
        const overallSummary = await generateOverallSummary(summaries);
        
        // Send to website API
        await sendSummaryToWebsite(overallSummary, summaries);
        
        console.log('✅ Daily summary generated and sent!');
        
    } catch (error) {
        console.error('Error generating summary:', error);
    }
}

async function summarizeChannel(channelName, messages) {
    // Format messages for Claude
    const messageText = messages.map(m => 
        `@${m.author}: ${m.content}`
    ).join('\n');
    
    const prompt = `Summarize the key discussions, hot takes, and notable moments from the Discord #${channelName} channel today. Focus on:
- Main topics discussed
- Controversial takes or debates
- Funny/memorable moments
- Consensus opinions
- Recurring themes

Keep it concise (200-300 words) and capture the vibe of the conversation.

Messages:
${messageText.slice(0, 8000)}`; // Limit context

    try {
        const response = await fetch('https://api.anthropic.com/v1/messages', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-api-key': CONFIG.ANTHROPIC_API_KEY,
                'anthropic-version': '2023-06-01'
            },
            body: JSON.stringify({
                model: 'claude-sonnet-4-20250514',
                max_tokens: 500,
                messages: [{
                    role: 'user',
                    content: prompt
                }]
            })
        });
        
        const data = await response.json();
        return data.content[0].text;
        
    } catch (error) {
        console.error(`Error summarizing ${channelName}:`, error);
        return `Summary unavailable for #${channelName}`;
    }
}

async function generateOverallSummary(channelSummaries) {
    const summariesText = Object.entries(channelSummaries)
        .map(([channel, summary]) => `**#${channel}**\n${summary}`)
        .join('\n\n');
    
    const prompt = `Create a brief overview (150 words max) of today's Discord activity across all channels. Highlight the most interesting discussions and overall community vibe.

Channel Summaries:
${summariesText}`;

    try {
        const response = await fetch('https://api.anthropic.com/v1/messages', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-api-key': CONFIG.ANTHROPIC_API_KEY,
                'anthropic-version': '2023-06-01'
            },
            body: JSON.stringify({
                model: 'claude-sonnet-4-20250514',
                max_tokens: 300,
                messages: [{
                    role: 'user',
                    content: prompt
                }]
            })
        });
        
        const data = await response.json();
        return data.content[0].text;
        
    } catch (error) {
        console.error('Error generating overall summary:', error);
        return 'Overall summary unavailable';
    }
}

// ===================================
// SEND TO WEBSITE
// ===================================

async function sendSummaryToWebsite(overallSummary, channelSummaries) {
    const today = getTodayDate();
    
    const payload = {
        date: today,
        overall_summary: overallSummary,
        channel_summaries: channelSummaries,
        total_messages: dailyMessages.totalMessages,
        raw_messages: dailyMessages.channels
    };
    
    try {
        // Store in Supabase
        const response = await fetch(`${CONFIG.SUPABASE_URL}/rest/v1/discord_summaries`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'apikey': CONFIG.SUPABASE_KEY,
                'Authorization': `Bearer ${CONFIG.SUPABASE_KEY}`,
                'Prefer': 'return=minimal'
            },
            body: JSON.stringify(payload)
        });
        
        if (response.ok) {
            console.log('✅ Summary saved to database');
        } else {
            console.error('❌ Failed to save summary:', await response.text());
        }
        
    } catch (error) {
        console.error('Error sending summary to website:', error);
    }
}

// ===================================
// PDF GENERATION
// ===================================

async function generateDailyPDF() {
    console.log('📄 Generating daily PDF...');
    
    try {
        // Trigger PDF generation on website
        const response = await fetch(`${CONFIG.WEBSITE_URL}/api/generate-pdf`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                date: getTodayDate(),
                trigger: 'bot'
            })
        });
        
        if (response.ok) {
            console.log('✅ PDF generation triggered');
        } else {
            console.error('❌ PDF generation failed:', await response.text());
        }
        
    } catch (error) {
        console.error('Error generating PDF:', error);
    }
}

// ===================================
// BOT COMMANDS
// ===================================

client.on('messageCreate', async (message) => {
    if (!message.content.startsWith('!goonzette')) return;
    
    const args = message.content.slice(11).trim().split(/ +/);
    const command = args[0];
    
    switch (command) {
        case 'summary':
            await handleSummaryCommand(message);
            break;
            
        case 'stats':
            await handleStatsCommand(message);
            break;
            
        case 'help':
            await handleHelpCommand(message);
            break;
    }
});

async function handleSummaryCommand(message) {
    if (dailyMessages.totalMessages === 0) {
        message.reply('No messages collected today yet!');
        return;
    }
    
    const summary = `**Today's Discord Activity:**
📊 Total Messages: ${dailyMessages.totalMessages}
📺 Active Channels: ${Object.keys(dailyMessages.channels).length}

Generating full summary...`;
    
    message.reply(summary);
    
    // Generate and send summary
    await generateDailySummary();
    message.channel.send('✅ Daily summary generated and sent to website!');
}

async function handleStatsCommand(message) {
    const channelStats = Object.entries(dailyMessages.channels)
        .map(([name, msgs]) => `**#${name}**: ${msgs.length} messages`)
        .join('\n');
    
    message.reply(`**Today's Stats:**
Total Messages: ${dailyMessages.totalMessages}

${channelStats || 'No activity yet today'}`);
}

async function handleHelpCommand(message) {
    message.reply(`**Goonzette Bot Commands:**
\`!goonzette summary\` - Generate today's Discord summary
\`!goonzette stats\` - Show message stats
\`!goonzette help\` - Show this message

The bot automatically:
- Monitors selected channels
- Generates daily summaries at ${CONFIG.SUMMARY_TIME}
- Triggers PDF generation at ${CONFIG.PDF_TIME}`);
}

// ===================================
// UTILITY FUNCTIONS
// ===================================

function getTodayDate() {
    return new Date().toISOString().split('T')[0];
}

function getCurrentTime() {
    const now = new Date();
    return `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
}

// ===================================
// START BOT
// ===================================

client.login(CONFIG.DISCORD_TOKEN).catch(error => {
    console.error('Failed to login to Discord:', error);
    process.exit(1);
});

// Graceful shutdown
process.on('SIGINT', () => {
    console.log('\n💾 Saving messages before shutdown...');
    saveDailyMessages();
    console.log('👋 Bot shutting down...');
    client.destroy();
    process.exit(0);
});

console.log('🚀 Starting Goonzette Discord Bot v3.0...');
