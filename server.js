const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const axios = require('axios');
const path = require('path');

const app = express();
const server = http.createServer(app);

// 🎯 [মেগা সকেট প্রোটোকল লক]: রেন্ডার হোস্টিং সার্ভারের জন্য CORS এবং সকেট পথ ১০০% এরর-প্রুফ লক
const io = socketIo(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
});

app.use(express.json());
app.use(express.static(path.join(__dirname, './')));

// 🔓 [আইফ্রেম রিফিউজড জ্যাম আনলকার]: মূল সাইটের ভেতর চিকেন রোড লাইভ প্রবেশ করার গ্লোবাল প্রোটোকল লক ভাই
app.use((req, res, next) => {
    res.setHeader("X-Frame-Options", "ALLOWALL");
    res.setHeader("Content-Security-Policy", "frame-ancestors *");
    next();
});

// 🎰 [এভিয়েটর ২.০ স্ক্রিনশট থেকে হুবহু ১০০% সিঙ্ক লিঙ্ক]: আপনার ওরিজিনাল মেইন সাইটের ডাটাবেজ ব্যাকএন্ড লিঙ্ক
const MAIN_SITE_URL = "https://onrender.com"; 

// 📥 একটিভ বাজি ট্র্যাকিং লোকাল মেমোরি বক্স (ম্যানুয়াল ক্যাশআউটের হিসেব একুরেট ভেরিফাই করার জন্য মাস্টার অবজেক্ট)
let activeChickenBets = {};

// 💰 লাইভ অ্যাকাউন্ট ব্যালেন্স নিয়ে আসার ডেডিকেটেড এপিআই গেটওয়ে (পিএইচপি গেট ব্যালেন্স সিঙ্ক)
app.get('/api/chicken-balance', async (req, res) => {
    const { userId, wallet } = req.query;
    try {
        const response = await axios.get(`${MAIN_SITE_URL}/api_callback.php?action=get_balance&username=${userId}&wallet=${wallet}`, { timeout: 10000 });
        if (response.data && response.data.status === "ok") {
            return res.json({ success: true, balance: response.data.balance });
        }
        return res.json({ success: false, balance: 0 });
    } catch (e) {
        return res.json({ success: false, balance: 0 });
    }
});

// 🛫 ১. ব্যালেন্স কাটার মেগা এপিআই রাউট (হুবহু এভিয়েটরের ওরিজিনাল অবজেক্ট স্ট্রাকচার সিঙ্ক ভাই)
app.post('/api/chicken-bet', async (req, res) => {
    const { userId, amount, wallet } = req.body;
    try {
        // 🎯 সরাসরি আপনার পিএইচপি গেটওয়েতে হিট করে ওয়ালেট থেকে টাকা কাটা হচ্ছে ভাই
        const response = await axios.post(MAIN_SITE_URL + '/api_callback.php', { 
            action: "bet", 
            username: userId, 
            amount: parseFloat(amount), 
            wallet: wallet
        }, { timeout: 15000 });

        // কড়া ডাটাবেজ রেসপন্স চেক লক
        if (response.data && response.data.status === "ok") {
            // ম্যানুয়াল ক্যাশআউটের ভেরিফিকেশনের জন্য বাজিটি লোকাল মেমরিতে লক করা হলো ভাই
            activeChickenBets[userId] = { amount: parseFloat(amount), wallet: wallet };
            
            io.emit("balanceUpdate", { username: userId, balance: response.data.balance });
            return res.json({ success: true, balance: response.data.balance });
        } else { 
            return res.json({ success: false, message: response.data.message || "❌ Balance deduction failed!" }); 
        }
    } catch (e) { 
        console.error("Chicken Bet Core Database Error:", e.message);
        return res.json({ success: false, message: "⚠️ Connection Timeout! Try again." }); 
    }
});

// 🛫 ২. ম্যানুয়াল ক্যাশআউট উইনিং ব্যালেন্স এপিআই রাউট (হুবহু এভিয়েটরের স্ক্রিনশটের মেগা উইন ও লগ প্যারামিটার সিঙ্ক ভাই)
app.post('/api/chicken-win', async (req, res) => {
    const { userId, amount, bet_amount, wallet, multiplier } = req.body;
    
    // প্লেয়ারের বাজি ধরা মেইন বেট ভ্যালু ট্র্যাকিং লক
    let targetBet = parseFloat(bet_amount) || (activeChickenBets[userId] ? parseFloat(activeChickenBets[userId].amount) : 0);
    let targetWallet = wallet || (activeChickenBets[userId] ? activeChickenBets[userId].wallet : "main");

    try {
        // 🎯 আপনার ওরিজিনাল পিএইচপি callback ইঞ্জিনের হুবহু ১৬৫-১৮০ নম্বর লাইনের মেগা উইন অবজেক্ট হিট লক ভাই
        const response = await axios.post(MAIN_SITE_URL + '/api_callback.php', { 
            action: "win",
            username: userId,
            amount: parseFloat(amount), // ওরিজিনাল লাভসহ উইন এমাউন্ট
            bet_amount: parseFloat(targetBet),
            multiplier: parseFloat(multiplier).toFixed(2),
            
            // 🎯 নিচে দেওয়া এই এভিয়েটর প্রোটোকলগুলো লগের তালিকা 'LOSS' থেকে চিরতরে 'WIN' এ রূপান্তর করবে ভাই
            status: "win",
            type: "win",
            is_win: 1,
            win_status: "win",
            log_status: "win",
            wallet: targetWallet
        }, { timeout: 15000 });

        if (response.data && response.data.status === "ok") {
            // ক্যাশআউট সফল হলে মেমোরি থেকে ডাটা ফ্রেশ সাফ করে দেওয়া হলো ভাই
            if (activeChickenBets[userId]) delete activeChickenBets[userId];
            
            io.emit("balanceUpdate", { username: userId, balance: response.data.balance });
            return res.json({ success: true, balance: response.data.balance });
        } else { 
            return res.json({ success: false, message: "Declined by Database!" }); 
        }
    } catch (e) { 
        console.error("Chicken Win Core Database Error:", e.message);
        return res.json({ success: false, message: "Timeout!" }); 
    }
});

io.on('connection', (socket) => {
    console.log("Player connected to Manual Chicken Road Engine!");
});

// 🌐 রেন্ডার ক্লাউডের জন্য গ্লোবাল ডাইনামিক পোর্ট ইঞ্জিন লক (এরর প্রোটেকশন ২.০)
const PORT = process.env.PORT || 10000;
server.listen(PORT, () => {
    console.log(`🐔 Chicken Road Pure Manual Engine Running on port ${PORT}`);
});
