# 📝 ARTICLE GENERATOR SETUP GUIDE - v3.1

## 🎯 NEW IN v3.1

**MAJOR CHANGE:**
- Articles are NO LONGER generated on the website
- Articles are generated using a separate CLI tool
- Website ONLY displays published articles

**Why this change?**
- Better security (API keys not in browser)
- More control over when articles publish
- Can generate offline
- Easier to automate
- Professional workflow

---

## 🚀 QUICK START (5 MINUTES)

### Step 1: Setup Tool
```bash
cd article-generator
npm install
cp .env.example .env
```

### Step 2: Configure .env
```env
ANTHROPIC_API_KEY=sk-ant-api03-KMhXfR-Rt... (already provided)
SUPABASE_URL=https://sticaujrrlejqxdaipob.supabase.co
SUPABASE_SERVICE_KEY=your_service_role_key_here
```

**Get Supabase Service Key:**
```
Supabase Dashboard → Settings → API → service_role key
```

### Step 3: Generate Article
```bash
node generate-article.js --interactive
```

**That's it!** Article published to website instantly.

---

## 💡 USAGE EXAMPLES

### Interactive Mode (Easiest)
```bash
node generate-article.js --interactive
```

**Prompts you for:**
1. Select author (1-4)
2. Enter topic
3. Add context (optional)

**Example:**
```
Select author: 4 (Tommy)
Topic: Vikings vs Chiefs preview
Auto-load Discord? y
✅ Article generated and published!
```

### Command Line Mode
```bash
# Claudia on digital culture
node generate-article.js --author claudia --topic "TikTok brain rot"

# Tommy with Discord context
node generate-article.js --author tommy --topic "Vikings playoff chances" --use-discord

# Dave on legal topic
node generate-article.js --author dave --topic "Tribal gaming rights decision"

# Naomi on economics
node generate-article.js --author naomi --topic "Tech sector layoffs"
```

### With Manual Context
```bash
node generate-article.js --author tommy --topic "NFL Draft" --context "Discord users debating QB prospects"
```

---

## 👥 THE 4 AUTHORS

### Available Authors:
- `claudia` - Claudia Pochita (Cultural Critic)
- `dave` - Dave Standing There (Legal/Sovereignty)
- `naomi` - Naomi Kayano (Economics/Sociology)
- `tommy` - Tommy Whārangi (Discord/Sports)

### Author Styles:

**Claudia:**
- Topics: Digital culture, social media, youth culture
- Style: Long sentences, French melancholy, postcolonial lens
- Example: "TikTok brain rot", "Instagram aesthetics", "Discord dynamics"

**Dave:**
- Topics: Sovereignty, legal analysis, indigenous rights
- Style: Sharp legal insight, strategic thinking, Ho-Chunk perspective
- Example: "Tribal gaming ruling", "Treaty rights case", "Federal policy"

**Naomi:**
- Topics: Economics, labor, transpacific analysis
- Style: Academic rigor, data-driven, East-West comparison
- Example: "Tech layoffs", "Labor market trends", "Pacific Rim trade"

**Tommy:**
- Topics: NFL, sports, Discord recaps, gaming
- Style: Māori + NFL + internet slang, Discord chronicler
- Example: "Vikings preview", "Discord hot takes", "Fantasy football"

---

## 📊 DISCORD INTEGRATION

### Auto-Load Discord Summary

**Tommy only:**
```bash
node generate-article.js --author tommy --topic "Yesterday's chaos" --use-discord
```

**What happens:**
1. Tool checks database for today's Discord summary
2. If found, auto-loads as context
3. Tommy references actual Discord conversations
4. No manual copying needed!

**Requires:**
- Discord bot running (see discord-bot/SETUP-GUIDE.md)
- Summary generated for today

---

## 🔄 TYPICAL WORKFLOW

### Daily Routine (5 minutes):

**Morning:**
```bash
# 1. Generate Claudia's cultural take
node generate-article.js --author claudia --topic "Latest internet drama"

# 2. Generate Tommy's Discord dispatch (auto-loads summary)
node generate-article.js --author tommy --topic "Discord highlights" --use-discord

# 3. Generate Dave or Naomi based on news
node generate-article.js --author naomi --topic "Economic news from today"
```

**Result:**
- 3 articles published
- Visible on website immediately
- Total time: 5 minutes

---

## 📝 OUTPUT EXAMPLE

```bash
$ node generate-article.js --author tommy --topic "Vikings vs Chiefs" --use-discord

🤖 THE GOONZETTE ARTICLE GENERATOR v3.1

📊 Loading Discord summary...
✅ Discord summary loaded

🤖 Generating article by Tāmati 'Tommy' Whārangi...
📝 Topic: Vikings vs Chiefs

🔄 Calling Claude API...
✅ Article generated!

═══════════════════════════════════════
TITLE: Discord Dispatch: The Mahomes Debate
AUTHOR: Tāmati 'Tommy' Whārangi
LENGTH: 723 words
═══════════════════════════════════════

💾 Publishing to database...
✅ Article published successfully!

🌐 View at: https://your-site.netlify.app (Daily Gooner section)
```

---

## 🌐 WEBSITE DISPLAY

**After generating:**

1. Website automatically shows new articles (refreshes every 5 mins)
2. No login required to VIEW articles
3. Anyone can read published articles
4. Articles appear instantly after generation

**Website shows:**
- Article title
- Author name + avatar
- Publication date/time
- Full article content
- Topic tag

---

## 🤖 AUTOMATION OPTIONS

### Option 1: Cron Job (Mac/Linux)
```bash
# Edit crontab
crontab -e

# Generate daily at 9 AM
0 9 * * * cd /path/to/article-generator && node generate-article.js --author tommy --topic "Daily recap" --use-discord
```

### Option 2: npm Scripts
```bash
# Add to package.json
"scripts": {
  "daily-claudia": "node generate-article.js --author claudia --topic 'Daily cultural take'",
  "daily-tommy": "node generate-article.js --author tommy --topic 'Discord dispatch' --use-discord"
}

# Run
npm run daily-tommy
```

### Option 3: Shell Script
```bash
#!/bin/bash
# daily-articles.sh

echo "Generating daily articles..."

# Claudia
node generate-article.js --author claudia --topic "Internet culture update"

# Tommy with Discord
node generate-article.js --author tommy --topic "Discord highlights" --use-discord

# Naomi
node generate-article.js --author naomi --topic "Economic news"

echo "✅ All articles published!"
```

```bash
chmod +x daily-articles.sh
./daily-articles.sh
```

---

## 🐛 TROUBLESHOOTING

### Error: "SUPABASE_SERVICE_KEY not set"
- Check .env file exists
- Verify SUPABASE_SERVICE_KEY is set
- Must be **service_role** key (not anon key)

### Error: "API Error: 401"
- Check ANTHROPIC_API_KEY is correct
- Verify key hasn't expired

### Error: "Database error: 403"
- Using anon key instead of service key
- Get service_role key from Supabase Settings → API

### "No Discord summary found"
- Discord bot hasn't run today
- Or no summary generated yet
- Use manual context instead: `--context "your text"`

### Article doesn't appear on website
- Check article published successfully
- Wait 5 minutes (auto-refresh)
- Or manually refresh website
- Check `article_date` is today
- Check `published` is true

---

## 💰 COST

**Per Article:**
- Claude API: ~$0.10
- Database: $0 (included)

**Monthly (3 articles/day):**
- ~$9/month for AI generation
- $0 for storage/hosting

---

## 📦 FILES

```
article-generator/
├── generate-article.js ......... Main CLI tool
├── package.json ................ Dependencies
├── .env.example ................ Config template
└── .env ........................ Your config (create this)
```

---

## ✅ QUICK REFERENCE

### Interactive Mode:
```bash
node generate-article.js --interactive
```

### CLI Mode:
```bash
node generate-article.js --author <author> --topic <topic> [options]
```

### Options:
- `--author` - claudia, dave, naomi, tommy
- `--topic` - Article topic (required)
- `--context` - Manual context text
- `--use-discord` - Auto-load Discord summary (Tommy)
- `--interactive` - Interactive mode

### Examples:
```bash
# Interactive
node generate-article.js

# Quick article
node generate-article.js --author claudia --topic "Social media trends"

# With Discord
node generate-article.js --author tommy --use-discord --topic "NFL week recap"

# With context
node generate-article.js --author dave --topic "Court ruling" --context "Recent Supreme Court decision"
```

---

## 🎯 BEST PRACTICES

**Daily Routine:**
1. Generate 2-3 articles per day
2. Mix authors for variety
3. Use Tommy with Discord for community engagement
4. Time publications for peak traffic

**Quality:**
- Specific topics generate better articles
- Add context when relevant
- Let Discord summaries guide Tommy's topics
- Review before publishing (edit database if needed)

**Workflow:**
- Morning: Check Discord summary
- Generate Tommy's dispatch
- Add 1-2 other author articles
- Total time: 5 minutes

---

## 🚀 YOU'RE READY!

**To generate your first article:**

```bash
cd article-generator
npm install
cp .env.example .env
# Edit .env with your keys
node generate-article.js --interactive
```

**That's it!** Article will appear on website instantly.

---

**For website deployment, see: DEPLOY-NOW.md**
**For Discord bot, see: discord-bot/SETUP-GUIDE.md**
