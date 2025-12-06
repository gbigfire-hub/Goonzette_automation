# 🤖 DISCORD BOT SETUP GUIDE - v3.0

## 📊 VERSION 3.0 FEATURES

**NEW in v3.0:**
- ✅ Discord bot monitors your server 24/7
- ✅ Auto-summarizes daily discussions
- ✅ Feeds summaries to Tommy (and other authors)
- ✅ Scheduled summary generation (11:30 PM)
- ✅ Database integration
- ✅ Bot commands (!goonzette)

---

## 🚀 COMPLETE SETUP (30 MINUTES)

### Part 1: Create Discord Bot (10 minutes)

#### Step 1: Discord Developer Portal
1. Go to https://discord.com/developers/applications
2. Click **"New Application"**
3. Name it: **"Goonzette Bot"**
4. Click **"Create"**

#### Step 2: Bot Settings
1. Click **"Bot"** in left sidebar
2. Click **"Add Bot"** → Confirm
3. Under **"Privileged Gateway Intents"** enable:
   - ✅ MESSAGE CONTENT INTENT
   - ✅ SERVER MEMBERS INTENT
   - ✅ PRESENCE INTENT
4. Click **"Reset Token"** → **"Copy"**
5. **Save this token** (you'll need it later!)

#### Step 3: Bot Permissions
1. Click **"OAuth2"** → **"URL Generator"**
2. Under **SCOPES** select:
   - ✅ bot
3. Under **BOT PERMISSIONS** select:
   - ✅ Read Messages/View Channels
   - ✅ Send Messages
   - ✅ Read Message History
   - ✅ Add Reactions
4. Copy the **Generated URL** at bottom
5. **Open URL in browser** → Select your server → **Authorize**

**Your bot is now in your Discord server!** 🎉

---

### Part 2: Install Bot Locally (10 minutes)

#### Step 1: Install Node.js
**Download:** https://nodejs.org (v18 or higher)

**Verify installation:**
```bash
node --version
npm --version
```

#### Step 2: Extract Bot Files
From your ZIP file, find the `discord-bot/` folder:
```
discord-bot/
├── bot.js
├── package.json
├── .env.example
└── .gitignore
```

#### Step 3: Install Dependencies
**Open terminal in discord-bot folder:**
```bash
cd discord-bot
npm install
```

This installs:
- discord.js (Discord API)
- node-fetch (HTTP requests)
- dotenv (Environment variables)

#### Step 4: Configure Environment
**Create .env file:**
```bash
cp .env.example .env
```

**Edit .env file with your values:**
```env
# Discord Bot Token (from Step 2.4)
DISCORD_TOKEN=your_bot_token_here

# Your Website URL
WEBSITE_URL=https://your-goonzette-site.netlify.app

# Supabase (from your Supabase dashboard)
SUPABASE_URL=https://sticaujrrlejqxdaipob.supabase.co
SUPABASE_KEY=your_supabase_service_key_here

# Anthropic API (already provided)
ANTHROPIC_API_KEY=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
```

**Get Supabase Service Key:**
1. Go to https://supabase.com/dashboard/project/sticaujrrlejqxdaipob
2. Click **"Settings"** → **"API"**
3. Copy **"service_role"** key (NOT anon key!)
4. Paste in .env as SUPABASE_KEY

---

### Part 3: Configure Channels (5 minutes)

**Edit bot.js** - Line 29:
```javascript
MONITORED_CHANNELS: [
    'general',      // ← Your channel names
    'sports',
    'gaming',
    'hot-takes',
    'nfl',
    'vikings',
    'chiefs'
],
```

**Change these to match YOUR Discord channel names!**

**Example:** If your channels are:
- #general-chat → use 'general-chat'
- #nfl-discussion → use 'nfl-discussion'
- #the-goonies → use 'the-goonies'

---

### Part 4: Update Database (5 minutes)

**Run updated SQL:**
1. Go to https://supabase.com/dashboard/project/sticaujrrlejqxdaipob
2. Click **"SQL Editor"**
3. Copy **ALL** from `DATABASE-SETUP.sql`
4. Paste and click **"Run"**

**Verify new table created:**
- Go to **"Table Editor"**
- Should see: `discord_summaries` ✅

---

## 🎮 RUNNING THE BOT

### Option 1: Run Locally (Testing)

**Start the bot:**
```bash
cd discord-bot
npm start
```

**You should see:**
```
🚀 Starting Goonzette Discord Bot v3.0...
✅ Discord Bot Online: Goonzette Bot#1234
📊 Monitoring 7 channels
⏰ Summary at 23:30
📄 PDF generation at 23:59
```

**Keep terminal open!** Bot runs as long as terminal is open.

**To stop:** Press `Ctrl+C`

---

### Option 2: Run 24/7 (Production)

#### Option A: Your Computer (Free)
**Use PM2 (Process Manager):**
```bash
npm install -g pm2
cd discord-bot
pm2 start bot.js --name goonzette-bot
pm2 save
```

**Bot now runs in background!**

**Commands:**
```bash
pm2 status          # Check if running
pm2 logs goonzette-bot  # View logs
pm2 restart goonzette-bot  # Restart
pm2 stop goonzette-bot     # Stop
```

#### Option B: Free Cloud Hosting

**Railway.app (Recommended):**
1. Go to https://railway.app
2. Sign up (free)
3. Click **"New Project"** → **"Deploy from GitHub repo"**
4. Upload your discord-bot folder
5. Add environment variables (.env contents)
6. Deploy!

**Free tier:** 500 hours/month (enough for 24/7!)

**Other options:**
- Heroku (free tier)
- Render.com (free tier)
- Replit (free tier)

---

## 🧪 TESTING THE BOT

### Test 1: Bot is Online
**In Discord, type:**
```
!goonzette help
```

**Bot should respond with commands list!**

### Test 2: Message Tracking
1. Send some messages in monitored channels
2. Wait a few seconds
3. Type: `!goonzette stats`
4. Bot shows message count!

### Test 3: Manual Summary
**Type:**
```
!goonzette summary
```

**Bot will:**
- Generate summary of today's messages
- Save to database
- Confirm with ✅

### Test 4: Check Website
1. Go to your Goonzette site
2. Login
3. Click **"Daily Gooner"**
4. Scroll to Tommy's generator
5. Discord context should auto-fill! 📊

---

## ⏰ AUTOMATED SCHEDULE

**The bot automatically runs:**

### 11:30 PM - Daily Summary
- Collects all messages from monitored channels
- Uses Claude AI to summarize discussions
- Saves summary to database
- Auto-fills Tommy's context field

### 11:59 PM - PDF Generation  
- Triggers PDF generation of day's articles
- (PDF feature requires additional setup - Phase 3)

**All automatic - no manual work needed!**

---

## 🎯 HOW IT WORKS

### Daily Flow:

**Throughout the day:**
```
1. Bot monitors Discord channels
2. Stores every message in memory
3. Saves to local file periodically
```

**At 11:30 PM:**
```
1. Bot processes all messages
2. Sends to Claude API for summarization
3. Generates channel-specific summaries
4. Creates overall summary
5. Saves to Supabase database
```

**When you generate articles:**
```
1. You login to site
2. Click "Daily Gooner"
3. Tommy's context auto-filled with Discord summary
4. Generate article using Discord context
5. Tommy references actual Discord conversations!
```

---

## 💡 BOT COMMANDS

### User Commands

**!goonzette help**
- Shows all available commands

**!goonzette summary**
- Manually trigger summary generation
- Useful if you want summary before 11:30 PM

**!goonzette stats**
- Shows today's message statistics
- Messages per channel

---

## 🎨 CUSTOMIZATION

### Change Summary Time

**Edit bot.js - Line 34:**
```javascript
SUMMARY_TIME: '23:30',  // ← Change to any time (24-hour)
```

Examples:
- Morning: `'08:00'`
- Noon: `'12:00'`  
- Evening: `'20:00'`

### Change Monitored Channels

**Edit bot.js - Line 29:**
```javascript
MONITORED_CHANNELS: [
    'your-channel-1',
    'your-channel-2',
    'your-channel-3'
],
```

### Minimum Messages for Summary

**Edit bot.js - Line 43:**
```javascript
MIN_MESSAGES_FOR_SUMMARY: 10,  // ← Change threshold
```

---

## 📊 WHAT GETS STORED

### In Database (discord_summaries table):

**Each day saves:**
- `date` - Which day
- `overall_summary` - Claude's overall summary
- `channel_summaries` - Per-channel summaries (JSON)
- `total_messages` - Message count
- `raw_messages` - Full message archive (JSON)

### In Memory (bot):
- All messages from today
- Cleared at midnight automatically
- Backup saved to `data/daily_messages.json`

---

## 🔒 PRIVACY & PERMISSIONS

### What the Bot Can See:
- ✅ Messages in monitored channels only
- ✅ Usernames of message authors
- ✅ Message reactions
- ✅ Attachments (but doesn't download them)

### What the Bot CANNOT See:
- ❌ DMs / Private messages
- ❌ Channels not in MONITORED_CHANNELS list
- ❌ Deleted messages (after deletion)
- ❌ Message edit history

### Best Practices:
- Only monitor public channels
- Announce bot to server members
- Optional: Create #goonzette-feed channel specifically for bot
- Let users know their messages may be summarized

---

## 🐛 TROUBLESHOOTING

### Bot Won't Start

**Error: "Invalid token"**
- Check DISCORD_TOKEN in .env
- Make sure you copied full token
- Token should start with "MTE..." or similar

**Error: "Missing Intents"**
- Go to Discord Developer Portal
- Enable MESSAGE CONTENT INTENT
- Restart bot

**Error: "Cannot find module"**
- Run: `npm install`
- Make sure you're in discord-bot folder

### Bot Online But Not Responding

**Check permissions:**
- Bot needs "Read Messages" permission
- Bot needs "Send Messages" permission
- Check channel permissions in Discord

**Check channel names:**
- Names in MONITORED_CHANNELS must match exactly
- Case-sensitive!
- No # symbol needed

### Summary Not Saving

**Check Supabase:**
- Verify discord_summaries table exists
- Check SUPABASE_KEY is service_role key (not anon)
- Check Supabase API URL is correct

**Check logs:**
```bash
# If using PM2:
pm2 logs goonzette-bot

# If running normally:
Check terminal output
```

### Discord Context Not Auto-Filling

**Check:**
- Bot generated summary today
- Database has today's entry
- You're logged into website (not guest)
- Refresh Daily Gooner tab

---

## 💰 COST BREAKDOWN

### Running the Bot:

**Free Options:**
- Railway.app: 500 hours/month free
- Render.com: 750 hours/month free
- Run on your PC: $0

**Claude API for Summaries:**
- ~$0.05 per day for summarization
- ~$1.50/month total
- Already covered by your existing API budget

**Total:** $0-3/month depending on hosting

---

## 📈 NEXT STEPS

### Phase 3.1 (Future):
- Automatic article generation
- Auto-publish at set times
- Email notifications

### Phase 3.2 (Future):
- PDF compilation automation
- Archive integration
- Newsletter distribution

**Want these features? Let me know!**

---

## ✅ SETUP CHECKLIST

- [ ] Created Discord bot application
- [ ] Enabled MESSAGE CONTENT INTENT
- [ ] Invited bot to server
- [ ] Installed Node.js
- [ ] Ran `npm install`
- [ ] Created .env file with all values
- [ ] Updated MONITORED_CHANNELS
- [ ] Ran updated DATABASE-SETUP.sql
- [ ] Started bot (`npm start`)
- [ ] Tested with `!goonzette help`
- [ ] Verified messages being tracked
- [ ] Tested manual summary
- [ ] Checked website auto-fill

---

## 🎉 YOU'RE DONE!

**Your Discord bot is now:**
- ✅ Monitoring your server
- ✅ Collecting messages
- ✅ Generating summaries
- ✅ Feeding Tommy's articles
- ✅ Running automatically

**Just let it run and it does everything!**

---

## 📞 QUICK REFERENCE

**Start bot:**
```bash
npm start
```

**Start bot 24/7:**
```bash
pm2 start bot.js --name goonzette-bot
```

**Check status:**
```bash
pm2 status
```

**View logs:**
```bash
pm2 logs goonzette-bot
```

**Restart bot:**
```bash
pm2 restart goonzette-bot
```

**Test in Discord:**
```
!goonzette help
!goonzette stats
!goonzette summary
```

---

**Everything is ready! Deploy and enjoy automated Discord summaries!** 🚀
