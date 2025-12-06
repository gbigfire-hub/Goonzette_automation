#!/usr/bin/env node

/**
 * EMERGENCY PDF COMPILER
 * Compile articles from ANY date into PDF
 * Can be triggered manually via GitHub Actions or run locally
 */

require('dotenv').config();
const fetch = require('node-fetch');
const { promises: fs } = require('fs');
const path = require('path');

const CONFIG = {
    SUPABASE_URL: process.env.SUPABASE_URL || 'https://sticaujrrlejqxdaipob.supabase.co',
    SUPABASE_KEY: process.env.SUPABASE_SERVICE_KEY,
    OUTPUT_DIR: path.join(__dirname, '..', 'pdfs'),
    TARGET_DATE: process.env.TARGET_DATE,
    DAYS_BACK: parseInt(process.env.DAYS_BACK || '1')
};

const AUTHORS = {
    claudia_pochita: "Claudia Pochita",
    dave_standing_there: "Dave Standing There (Hoocąk Haci Nįįc)",
    naomi_kayano: "Naomi Kayano (萱野ナオミ)",
    tommy_wharangi: "Tāmati 'Tommy' Whārangi"
};

// ===================================
// MAIN FUNCTION
// ===================================

async function main() {
    console.log('🚨 EMERGENCY PDF COMPILER');
    console.log('Time:', new Date().toLocaleString());
    console.log('');

    if (!CONFIG.SUPABASE_KEY) {
        console.error('❌ Error: SUPABASE_SERVICE_KEY not set');
        process.exit(1);
    }

    // Determine target date
    let targetDate;
    if (CONFIG.TARGET_DATE) {
        // Use specific date provided
        targetDate = new Date(CONFIG.TARGET_DATE);
        console.log(`📅 Using specified date: ${CONFIG.TARGET_DATE}`);
    } else {
        // Use days back
        targetDate = new Date();
        targetDate.setDate(targetDate.getDate() - CONFIG.DAYS_BACK);
        console.log(`📅 Compiling from ${CONFIG.DAYS_BACK} day(s) back`);
    }
    
    const dateString = targetDate.toISOString().split('T')[0];
    console.log(`📅 Target date: ${dateString}`);
    console.log('');
    
    // Fetch articles from database
    console.log('🔍 Fetching articles...');
    const articles = await fetchArticles(dateString);
    
    if (!articles || articles.length === 0) {
        console.log('⚠️  No articles found for this date');
        console.log('💡 Try a different date or check if articles were published that day');
        process.exit(0);
    }
    
    console.log(`✅ Found ${articles.length} article(s)`);
    articles.forEach(a => {
        const authorName = AUTHORS[a.author] || a.author;
        console.log(`   - ${authorName}: ${a.title}`);
    });
    console.log('');
    
    // Generate PDF
    console.log('📄 Generating PDF...');
    const pdfPath = await generatePDF(articles, dateString);
    
    console.log('✅ PDF compiled successfully!');
    console.log(`📄 Saved to: ${pdfPath}`);
    console.log('');
    console.log('🎉 Emergency compilation complete!');
}

// ===================================
// FETCH ARTICLES
// ===================================

async function fetchArticles(date) {
    try {
        const response = await fetch(
            `${CONFIG.SUPABASE_URL}/rest/v1/articles?article_date=eq.${date}&published=eq.true&order=created_at.asc`,
            {
                headers: {
                    'apikey': CONFIG.SUPABASE_KEY,
                    'Authorization': `Bearer ${CONFIG.SUPABASE_KEY}`
                }
            }
        );
        
        if (!response.ok) {
            throw new Error(`Database error: ${response.status}`);
        }
        
        return await response.json();
    } catch (error) {
        console.error('Error fetching articles:', error);
        return null;
    }
}

// ===================================
// PDF GENERATION
// ===================================

async function generatePDF(articles, date) {
    // Create HTML for PDF
    const html = createHTML(articles, date);
    
    // Convert to PDF using Puppeteer
    const puppeteer = require('puppeteer');
    
    const browser = await puppeteer.launch({
        headless: 'new',
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: 'networkidle0' });
    
    // Ensure output directory exists
    await fs.mkdir(CONFIG.OUTPUT_DIR, { recursive: true });
    
    // Generate filename
    const filename = `goonzette-daily-${date}.pdf`;
    const filepath = path.join(CONFIG.OUTPUT_DIR, filename);
    
    // Generate PDF
    await page.pdf({
        path: filepath,
        format: 'Letter',
        margin: {
            top: '0.75in',
            right: '0.75in',
            bottom: '0.75in',
            left: '0.75in'
        },
        printBackground: true
    });
    
    await browser.close();
    
    return filepath;
}

// ===================================
// HTML TEMPLATE
// ===================================

function createHTML(articles, date) {
    const formattedDate = formatDate(date);
    
    const articlesHTML = articles.map(article => {
        const authorName = AUTHORS[article.author] || article.author;
        const articleDate = new Date(article.created_at).toLocaleDateString('en-US', {
            month: 'long',
            day: 'numeric',
            year: 'numeric'
        });
        
        // Convert content to paragraphs
        const paragraphs = article.content
            .split('\n\n')
            .filter(p => p.trim())
            .map(p => `<p>${escapeHtml(p.trim())}</p>`)
            .join('\n');
        
        return `
            <article class="article">
                <div class="article-meta">
                    <span class="author">${escapeHtml(authorName)}</span>
                    <span class="date">${articleDate}</span>
                </div>
                <h2 class="article-title">${escapeHtml(article.title)}</h2>
                <div class="article-content">
                    ${paragraphs}
                </div>
            </article>
        `;
    }).join('\n');
    
    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>The Goonzette Daily - ${formattedDate}</title>
    <style>
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;700;900&family=Crimson+Text:ital,wght@0,400;0,600;1,400&display=swap');
        
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: 'Crimson Text', serif;
            font-size: 12pt;
            line-height: 1.6;
            color: #2d1b4e;
            background: #faf8f3;
        }
        
        .header {
            text-align: center;
            margin-bottom: 2rem;
            padding-bottom: 1.5rem;
            border-bottom: 3px solid #663399;
        }
        
        .masthead {
            font-family: 'Playfair Display', serif;
            font-size: 48pt;
            font-weight: 900;
            color: #2d1b4e;
            letter-spacing: 2px;
            margin-bottom: 0.5rem;
        }
        
        .tagline {
            font-size: 14pt;
            font-style: italic;
            color: #663399;
            margin-bottom: 0.5rem;
        }
        
        .issue-date {
            font-size: 11pt;
            color: #666;
        }
        
        .article {
            margin-bottom: 3rem;
            page-break-inside: avoid;
        }
        
        .article-meta {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 0.75rem;
            padding-bottom: 0.5rem;
            border-bottom: 1px solid #ddd;
        }
        
        .author {
            font-weight: 600;
            color: #663399;
            font-size: 11pt;
        }
        
        .date {
            font-size: 10pt;
            color: #888;
            font-style: italic;
        }
        
        .article-title {
            font-family: 'Playfair Display', serif;
            font-size: 24pt;
            font-weight: 700;
            color: #2d1b4e;
            margin-bottom: 1rem;
            line-height: 1.3;
        }
        
        .article-content {
            font-size: 12pt;
            line-height: 1.7;
        }
        
        .article-content p {
            margin-bottom: 1rem;
            text-align: justify;
        }
        
        .article-content p:first-letter {
            font-size: 18pt;
            font-weight: 600;
            color: #663399;
        }
        
        .footer {
            margin-top: 3rem;
            padding-top: 1.5rem;
            border-top: 2px solid #663399;
            text-align: center;
            font-size: 10pt;
            color: #888;
        }
    </style>
</head>
<body>
    <div class="header">
        <h1 class="masthead">THE GOONZETTE</h1>
        <p class="tagline">Digital Culture • Commentary • Analysis</p>
        <p class="issue-date">Daily Edition - ${formattedDate}</p>
    </div>
    
    ${articlesHTML}
    
    <div class="footer">
        <p>The Goonzette Daily • Emergency Compilation • ${formattedDate}</p>
    </div>
</body>
</html>
    `.trim();
}

// ===================================
// HELPERS
// ===================================

function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
        weekday: 'long',
        month: 'long',
        day: 'numeric',
        year: 'numeric'
    });
}

function escapeHtml(text) {
    const map = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#039;'
    };
    return text.replace(/[&<>"']/g, m => map[m]);
}

// Run
main().catch(error => {
    console.error('❌ Fatal error:', error);
    process.exit(1);
});
