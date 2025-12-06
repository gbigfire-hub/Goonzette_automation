#!/usr/bin/env node

/**
 * AUTO-GENERATE DAILY ARTICLES
 * Runs automatically to generate articles from all authors
 */

require('dotenv').config();
const fetch = require('node-fetch');

const CONFIG = {
    ANTHROPIC_API_KEY: process.env.ANTHROPIC_API_KEY || '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',
    SUPABASE_URL: process.env.SUPABASE_URL || 'https://sticaujrrlejqxdaipob.supabase.co',
    SUPABASE_KEY: process.env.SUPABASE_SERVICE_KEY,
};

const AUTHORS = {
    claudia: {
        name: "Claudia Pochita",
        key: "claudia_pochita",
        topics: ["Social media trends", "Digital culture shift", "Gen Z phenomena", "Internet aesthetics", "Online discourse"]
    },
    tommy: {
        name: "Tommy Whārangi",
        key: "tommy_wharangi",
        topics: ["Discord highlights", "NFL week recap", "Sports hot takes", "Gaming community", "Vikings analysis"]
    },
    naomi: {
        name: "Naomi Kayano",
        key: "naomi_kayano",
        topics: ["Labor market update", "Economic trends", "Tech industry news", "Workplace culture", "Pacific Rim analysis"]
    },
    dave: {
        name: "Dave Standing There",
        key: "dave_standing_there",
        topics: ["Sovereignty news", "Tribal law update", "Federal policy", "Indigenous rights", "Treaty developments"]
    }
};

const AUTHOR_STYLES = {
    claudia_pochita: `You are Claudia Pochita, a French cultural critic. Write in your distinctive style:
- Run-on sentences mirroring online chaos
- French melancholy with sharp observation
- Postcolonial analysis of digital spaces
- Sophisticated vocabulary with occasional French phrases
- Critical yet empathetic tone
Write a 600-800 word article.`,

    tommy_wharangi: `You are Tāmati "Tommy" Whārangi, Māori ex-NFL player and Discord chronicler. Write in your style:
- Mix Māori phrases, NFL speak, and internet slang
- Reference whakataukī (proverbs) alongside calling things "mid"
- Professional athlete perspective meets online culture
- Irreverent but insightful
Write a 600-800 word article.`,

    naomi_kayano: `You are Naomi Kayano (萱野ナオミ), Japanese professor. Write in your style:
- Academic rigor made accessible
- Data-driven insights with human stories
- Transpacific East-West comparisons
- Sociological and economic frameworks
- Occasional Japanese terms with explanations
Write a 600-800 word article.`,

    dave_standing_there: `You are Dave Standing There (Hoocąk Haci Nįįc), Ho-Chunk attorney. Write in your style:
- Sharp legal analysis with cultural commentary
- Question power structures directly
- Strategic thinking about negotiations
- Indigenous-centered perspective
- Professional yet accessible tone
Write a 600-800 word article.`
};

// ===================================
// MAIN FUNCTION
// ===================================

async function main() {
    console.log('🤖 AUTO-GENERATING DAILY ARTICLES');
    console.log('Time:', new Date().toLocaleString());
    console.log('');

    if (!CONFIG.SUPABASE_KEY) {
        console.error('❌ Error: SUPABASE_SERVICE_KEY not set');
        process.exit(1);
    }

    // Generate articles for 2 random authors each day
    const allAuthors = ['tommy', 'claudia', 'naomi', 'dave'];
    const authorsToday = selectRandomAuthors(allAuthors, 2);
    
    console.log(`📝 Today's authors: ${authorsToday.join(', ')}`);
    console.log('');
    
    for (const authorKey of authorsToday) {
        const author = AUTHORS[authorKey];
        const topic = selectRandomTopic(author.topics);
        
        console.log(`\n📝 Generating article by ${author.name}`);
        console.log(`   Topic: ${topic}`);
        
        try {
            // Get Discord summary only for Tommy
            let context = '';
            let useDiscord = false;
            
            if (authorKey === 'tommy') {
                context = await getDiscordSummary();
                if (context) {
                    console.log('   ✅ Loaded Discord summary');
                    useDiscord = true;
                } else {
                    console.log('   ⚠️  No Discord summary available - using general topic');
                }
            }
            
            await generateAndPublish(author.key, topic, context, useDiscord);
            console.log('   ✅ Article published');
            
            // Wait 2 seconds between articles
            await sleep(2000);
            
        } catch (error) {
            console.error(`   ❌ Error: ${error.message}`);
        }
    }
    
    console.log('\n✅ Daily articles generated successfully!');
    console.log(`🌐 View at: https://the-goonzette.netlify.app`);
}

// ===================================
// ARTICLE GENERATION
// ===================================

async function generateAndPublish(authorKey, topic, context = '', useDiscord = false) {
    const style = AUTHOR_STYLES[authorKey];
    
    let userPrompt = `Write an article about: ${topic}\n\n`;
    
    // Only include Discord context if it actually exists
    if (context && useDiscord && authorKey === 'tommy_wharangi') {
        userPrompt += `REAL Discord Activity from Yesterday:\n${context}\n\n`;
        userPrompt += `IMPORTANT INSTRUCTIONS:\n`;
        userPrompt += `- Reference ONLY the specific Discord moments provided above\n`;
        userPrompt += `- Do NOT invent or fabricate any Discord conversations, usernames, or events\n`;
        userPrompt += `- If the Discord context is vague or minimal, focus more on the general topic\n`;
        userPrompt += `- Use Discord examples naturally when they fit the narrative\n\n`;
    } else if (authorKey === 'tommy_wharangi') {
        // Tommy without Discord data
        userPrompt += `NOTE: No Discord activity data available today.\n`;
        userPrompt += `Write about ${topic} from your general perspective without referencing specific Discord conversations.\n`;
        userPrompt += `Do NOT invent or make up Discord activity, usernames, or server events.\n\n`;
    }
    
    userPrompt += `Write a complete article (600-800 words) in your distinctive voice. Include a compelling title.`;
    
    // Call Claude API
    const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'x-api-key': CONFIG.ANTHROPIC_API_KEY,
            'anthropic-version': '2023-06-01'
        },
        body: JSON.stringify({
            model: 'claude-sonnet-4-20250514',
            max_tokens: 2500,
            messages: [{
                role: 'user',
                content: `${style}\n\n${userPrompt}`
            }]
        })
    });
    
    if (!response.ok) {
        throw new Error(`API Error: ${response.status}`);
    }
    
    const data = await response.json();
    const articleText = data.content[0].text;
    
    // Parse title and content
    const lines = articleText.split('\n').filter(l => l.trim());
    let title = lines[0].replace(/^#\s*/, '').replace(/^Title:\s*/i, '').trim();
    let content = lines.slice(1).join('\n\n').trim();
    
    if (content.length < 100) {
        const allText = articleText.trim();
        const firstPeriod = allText.indexOf('.');
        if (firstPeriod > 0 && firstPeriod < 150) {
            title = allText.substring(0, firstPeriod + 1);
            content = allText.substring(firstPeriod + 1).trim();
        } else {
            title = `Daily Take: ${topic}`;
            content = allText;
        }
    }
    
    // Save to database (only save context if Discord was actually used)
    await publishArticle(authorKey, title, content, topic, useDiscord ? context : null);
}

async function publishArticle(authorKey, title, content, topic, discordContext) {
    const today = new Date().toISOString().split('T')[0];
    
    const payload = {
        author: authorKey,
        title: title,
        content: content,
        topic: topic,
        discord_context: discordContext || null,
        article_date: today,
        published: true
    };
    
    const response = await fetch(`${CONFIG.SUPABASE_URL}/rest/v1/articles`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'apikey': CONFIG.SUPABASE_KEY,
            'Authorization': `Bearer ${CONFIG.SUPABASE_KEY}`,
            'Prefer': 'return=minimal'
        },
        body: JSON.stringify(payload)
    });
    
    if (!response.ok) {
        const error = await response.text();
        throw new Error(`Database error: ${response.status} - ${error}`);
    }
}

async function getDiscordSummary() {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const date = yesterday.toISOString().split('T')[0];
    
    try {
        const response = await fetch(
            `${CONFIG.SUPABASE_URL}/rest/v1/discord_summaries?date=eq.${date}&select=*`,
            {
                headers: {
                    'apikey': CONFIG.SUPABASE_KEY,
                    'Authorization': `Bearer ${CONFIG.SUPABASE_KEY}`
                }
            }
        );
        
        if (!response.ok) return null;
        
        const data = await response.json();
        if (!data || data.length === 0) return null;
        
        const summary = data[0];
        let context = `Discord Activity (${summary.total_messages} messages):\n\n`;
        
        if (summary.overall_summary) {
            context += `${summary.overall_summary}\n\n`;
        }
        
        if (summary.channel_summaries) {
            context += 'Channel Highlights:\n';
            Object.entries(summary.channel_summaries).forEach(([channel, text]) => {
                context += `\n#${channel}:\n${text}\n`;
            });
        }
        
        return context.trim();
    } catch (error) {
        console.warn('Could not load Discord summary:', error.message);
        return null;
    }
}

function selectRandomTopic(topics) {
    return topics[Math.floor(Math.random() * topics.length)];
}

function selectRandomAuthors(authors, count) {
    // Shuffle array using Fisher-Yates algorithm
    const shuffled = [...authors];
    for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    // Return first 'count' authors
    return shuffled.slice(0, count);
}

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

// Run
main().catch(error => {
    console.error('❌ Fatal error:', error);
    process.exit(1);
});
