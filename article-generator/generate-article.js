#!/usr/bin/env node

/**
 * THE GOONZETTE ARTICLE GENERATOR
 * Version: 3.1
 * 
 * Standalone CLI tool for generating Daily Gooner articles
 * Articles are published directly to database, then displayed on website
 * 
 * Usage:
 *   node generate-article.js --author claudia --topic "TikTok brain rot"
 *   node generate-article.js --author tommy --use-discord
 *   node generate-article.js --interactive
 */

require('dotenv').config();
const fetch = require('node-fetch');
const readline = require('readline');

// ===================================
// CONFIGURATION
// ===================================

const CONFIG = {
    ANTHROPIC_API_KEY: process.env.ANTHROPIC_API_KEY || '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',
    SUPABASE_URL: process.env.SUPABASE_URL || 'https://sticaujrrlejqxdaipob.supabase.co',
    SUPABASE_KEY: process.env.SUPABASE_SERVICE_KEY,
};

// ===================================
// AUTHORS
// ===================================

const AUTHORS = {
    claudia: {
        name: "Claudia Pochita",
        displayName: "Claudia Pochita",
        key: "claudia_pochita",
        style: `You are Claudia Pochita, a French cultural critic and opinion writer for The Goonzette. You are of mixed French and Lao-Thai heritage (grandparents from French Indochina), educated at Sciences Po Paris. Your writing style is characterized by:
- Run-on sentences that mirror chaotic online thinking
- Mixing French melancholy with biting social observation
- Examining how digital spaces replicate colonial power structures
- Dissecting how ragebait has become our generation's opium
- Sharp cultural commentary on youth culture and internet absurdities
- Sophisticated vocabulary with occasional French phrases
- Deeply critical yet somehow empathetic tone

Write an article that embodies this style. Be acerbic, philosophical, and unflinchingly honest about digital culture's dark corners.`,
        topics: ["Digital Culture", "Social Media", "Youth Culture", "Internet Phenomena"]
    },
    
    dave: {
        name: "Dave Standing There",
        displayName: "Dave Standing There (Hoocąk Haci Nįįc)",
        key: "dave_standing_there",
        style: `You are Dave Standing There (Hoocąk Haci Nįįc), a Federal Indian Law attorney and Ho-Chunk Nation member. Your writing combines:
- Sharp legal analysis with cultural commentary
- Questioning whose rules apply in sovereignty disputes
- Direct, unflinching examination of power structures
- References to tribal law, treaty rights, and federal policy
- Strategic thinking about negotiations and legal tactics
- Indigenous perspective on contemporary issues
- Professional yet accessible tone
- Occasional references to Ho-Chunk culture and language

Write an article that combines legal insight with cultural analysis. Be strategic, precise, and unapologetically indigenous-centered.`,
        topics: ["Sovereignty", "Indigenous Rights", "Legal Analysis", "Treaty Rights"]
    },
    
    naomi: {
        name: "Naomi Kayano",
        displayName: "Naomi Kayano (萱野ナオミ)",
        key: "naomi_kayano",
        style: `You are Naomi Kayano (萱野ナオミ), a Japanese reporter and professor of mixed Ainu and Yamato heritage. Your writing features:
- Academic rigor made accessible
- Transpacific perspective comparing East and West
- Analysis of ethnicity, gender, and capital intersections
- Data-driven insights with human stories
- References to both Japanese and American contexts
- Sociological and economic frameworks
- Occasional Japanese terms with English explanations
- Balanced, analytical yet empathetic tone

Write an article that bridges cultures and disciplines. Be scholarly but readable, combining data with narrative.`,
        topics: ["Economics", "Labor", "Identity Politics", "Comparative Sociology"]
    },
    
    tommy: {
        name: "Tommy Whārangi",
        displayName: "Tāmati 'Tommy' Whārangi",
        key: "tommy_wharangi",
        style: `You are Tāmati "Tommy" Whārangi, a Māori former NFL player who now documents Discord chaos. Your writing mixes:
- NFL insider speak with internet slang
- Māori colloquialisms and occasional te reo phrases (with translations)
- Professional athlete perspective meets extremely online shitposter
- References to traditional whakataukī (proverbs) alongside calling things "mid"
- Discord drama transformed into cultural commentary
- Sports analysis meets digital anthropology
- Irreverent but insightful tone
- Proud Māori voice in American football spaces

Write a "Discord Dispatch" that chronicles yesterday's online chaos. Be funny, insightful, and uniquely positioned between indigenous culture, NFL culture, and internet culture.`,
        topics: ["NFL", "Sports", "Discord Culture", "Gaming", "Vikings", "Chiefs"]
    }
};

// ===================================
// MAIN FUNCTION
// ===================================

async function main() {
    console.log('🤖 THE GOONZETTE ARTICLE GENERATOR v3.1\n');
    
    // Check configuration
    if (!CONFIG.SUPABASE_KEY) {
        console.error('❌ Error: SUPABASE_SERVICE_KEY not set in .env file');
        console.error('   Get it from: Supabase Dashboard → Settings → API → service_role key');
        process.exit(1);
    }
    
    // Parse command line arguments
    const args = process.argv.slice(2);
    
    if (args.includes('--interactive') || args.length === 0) {
        await interactiveMode();
    } else {
        await cliMode(args);
    }
}

// ===================================
// INTERACTIVE MODE
// ===================================

async function interactiveMode() {
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
    });
    
    const question = (query) => new Promise((resolve) => rl.question(query, resolve));
    
    try {
        console.log('📝 Interactive Article Generator\n');
        
        // Select author
        console.log('Available authors:');
        console.log('  1. Claudia Pochita (Cultural Critic)');
        console.log('  2. Dave Standing There (Legal/Sovereignty)');
        console.log('  3. Naomi Kayano (Economics/Sociology)');
        console.log('  4. Tommy Whārangi (Discord/Sports)\n');
        
        const authorChoice = await question('Select author (1-4): ');
        const authorKeys = ['claudia', 'dave', 'naomi', 'tommy'];
        const authorKey = authorKeys[parseInt(authorChoice) - 1];
        
        if (!authorKey) {
            console.error('❌ Invalid author selection');
            rl.close();
            return;
        }
        
        const author = AUTHORS[authorKey];
        console.log(`\n✅ Selected: ${author.displayName}\n`);
        
        // Get topic
        const topic = await question('Article topic: ');
        if (!topic.trim()) {
            console.error('❌ Topic required');
            rl.close();
            return;
        }
        
        // Get context
        let context = '';
        if (authorKey === 'tommy') {
            const useDiscord = await question('Auto-load Discord summary? (y/n): ');
            if (useDiscord.toLowerCase() === 'y') {
                context = await getDiscordSummary();
                if (context) {
                    console.log('✅ Discord summary loaded\n');
                }
            } else {
                context = await question('Manual context (optional, press enter to skip): ');
            }
        } else {
            context = await question('Additional context (optional, press enter to skip): ');
        }
        
        rl.close();
        
        // Generate article
        console.log('\n🤖 Generating article...\n');
        await generateAndPublish(authorKey, topic, context);
        
    } catch (error) {
        console.error('❌ Error:', error.message);
        rl.close();
    }
}

// ===================================
// CLI MODE
// ===================================

async function cliMode(args) {
    const authorIndex = args.indexOf('--author');
    const topicIndex = args.indexOf('--topic');
    const contextIndex = args.indexOf('--context');
    const useDiscord = args.includes('--use-discord');
    
    if (authorIndex === -1 || topicIndex === -1) {
        console.error('Usage: node generate-article.js --author <author> --topic <topic> [--context <context>] [--use-discord]');
        console.error('\nAuthors: claudia, dave, naomi, tommy');
        console.error('\nExamples:');
        console.error('  node generate-article.js --author claudia --topic "TikTok brain rot"');
        console.error('  node generate-article.js --author tommy --topic "Vikings preview" --use-discord');
        console.error('  node generate-article.js --interactive');
        process.exit(1);
    }
    
    const authorKey = args[authorIndex + 1];
    const topic = args[topicIndex + 1];
    let context = contextIndex !== -1 ? args[contextIndex + 1] : '';
    
    if (!AUTHORS[authorKey]) {
        console.error(`❌ Unknown author: ${authorKey}`);
        console.error('Available: claudia, dave, naomi, tommy');
        process.exit(1);
    }
    
    // Load Discord summary if requested
    if (useDiscord) {
        console.log('📊 Loading Discord summary...');
        const discordContext = await getDiscordSummary();
        if (discordContext) {
            context = discordContext;
            console.log('✅ Discord summary loaded\n');
        }
    }
    
    console.log(`\n🤖 Generating article by ${AUTHORS[authorKey].displayName}...`);
    console.log(`📝 Topic: ${topic}\n`);
    
    await generateAndPublish(authorKey, topic, context);
}

// ===================================
// ARTICLE GENERATION
// ===================================

async function generateAndPublish(authorKey, topic, context = '') {
    const author = AUTHORS[authorKey];
    
    try {
        // Build prompt
        let userPrompt = `Write an article about: ${topic}\n\n`;
        
        if (context.trim()) {
            if (authorKey === 'tommy') {
                userPrompt += `REAL Discord Activity:\n${context}\n\n`;
                userPrompt += `IMPORTANT INSTRUCTIONS:\n`;
                userPrompt += `- Reference ONLY the specific Discord moments provided above\n`;
                userPrompt += `- Do NOT invent or fabricate any Discord conversations, usernames, or events\n`;
                userPrompt += `- Use these real Discord examples naturally when they fit your narrative\n`;
                userPrompt += `- If the provided context is minimal, focus more on the general topic\n\n`;
            } else {
                userPrompt += `Background Context:\n${context}\n\n`;
                userPrompt += `Use this context as background information. Do not invent additional details.\n\n`;
            }
        } else if (authorKey === 'tommy') {
            userPrompt += `NOTE: No Discord activity data available.\n`;
            userPrompt += `Write about ${topic} from your perspective without referencing Discord.\n`;
            userPrompt += `Do NOT make up Discord conversations or server events.\n\n`;
        }
        
        userPrompt += `Write a complete article (600-900 words) in your distinctive voice. Include a compelling title.`;
        
        // Call Claude API
        console.log('🔄 Calling Claude API...');
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
                    content: `${author.style}\n\n${userPrompt}`
                }]
            })
        });
        
        if (!response.ok) {
            const error = await response.text();
            throw new Error(`API Error: ${response.status} - ${error}`);
        }
        
        const data = await response.json();
        const articleText = data.content[0].text;
        
        // Parse title and content
        const lines = articleText.split('\n').filter(l => l.trim());
        let title = lines[0].replace(/^#\s*/, '').replace(/^Title:\s*/i, '').trim();
        let content = lines.slice(1).join('\n\n').trim();
        
        // If parsing failed, use fallback
        if (content.length < 100) {
            const allText = articleText.trim();
            const firstPeriod = allText.indexOf('.');
            if (firstPeriod > 0 && firstPeriod < 150) {
                title = allText.substring(0, firstPeriod + 1);
                content = allText.substring(firstPeriod + 1).trim();
            } else {
                title = `${author.displayName} on ${topic}`;
                content = allText;
            }
        }
        
        console.log('✅ Article generated!\n');
        console.log('═══════════════════════════════════════');
        console.log(`TITLE: ${title}`);
        console.log(`AUTHOR: ${author.displayName}`);
        console.log(`LENGTH: ${content.split(' ').length} words`);
        console.log('═══════════════════════════════════════\n');
        
        // Save to database
        console.log('💾 Publishing to database...');
        await publishArticle(author.key, title, content, topic, context);
        
        console.log('✅ Article published successfully!');
        console.log('\n🌐 View at: https://your-site.netlify.app (Daily Gooner section)\n');
        
    } catch (error) {
        console.error('❌ Error generating article:', error.message);
        process.exit(1);
    }
}

// ===================================
// DATABASE FUNCTIONS
// ===================================

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
    
    try {
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
        
    } catch (error) {
        throw new Error(`Failed to publish to database: ${error.message}`);
    }
}

async function getDiscordSummary() {
    const today = new Date().toISOString().split('T')[0];
    
    try {
        const response = await fetch(
            `${CONFIG.SUPABASE_URL}/rest/v1/discord_summaries?date=eq.${today}&select=*`,
            {
                headers: {
                    'apikey': CONFIG.SUPABASE_KEY,
                    'Authorization': `Bearer ${CONFIG.SUPABASE_KEY}`
                }
            }
        );
        
        if (!response.ok) {
            console.warn('⚠️  No Discord summary found for today');
            return null;
        }
        
        const data = await response.json();
        if (!data || data.length === 0) {
            console.warn('⚠️  No Discord summary found for today');
            return null;
        }
        
        const summary = data[0];
        let context = `Discord Activity Summary (${summary.total_messages} messages):\n\n`;
        
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
        console.warn('⚠️  Could not load Discord summary:', error.message);
        return null;
    }
}

// ===================================
// RUN
// ===================================

main().catch(error => {
    console.error('❌ Fatal error:', error);
    process.exit(1);
});
