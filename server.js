const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const axios = require('axios');
const path = require('path');

const app = express();
const server = http.createServer(app);

// 🎯 [মেগা সকেট প্রোটোকল লক]: রেন্ডার ও টারমাক্স সেশনের জন্য CORS এবং সকেট পথ ১০০% এরর-প্রুф লক
const io = socketIo(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
});

app.use(express.json());
app.use(express.static(path.join(__dirname, './')));

// 🔓 [আইফ্রেম সিকিউরিটি পলিসি বাইপাস ২.০ ভাই]: এটি আইফ্রেমের ভেতর থেকে postMessage সিগন্যাল সরাসরি মেইন সাইটের হেডারে পাঠাতে সাহায্য করবে
app.use((req, res, next) => {
    res.setHeader("X-Frame-Options", "ALLOWALL");
    res.setHeader("Content-Security-Policy", "frame-ancestors *; default-src * 'unsafe-inline' 'unsafe-eval'; script-src * 'unsafe-inline' 'unsafe-eval'; connect-src * 'unsafe-inline'; img-src * data: blob:; style-src * 'unsafe-inline'; font-src * data:;");
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
    next();
});

// 🎰 [এভিয়েটর ২.০ স্ক্রিনশট থেকে হুবহু ১০০% সিঙ্ক লিঙ্ক]: আপনার ওরিজিনাল মেইন সাইটের ডাটাবেজ ব্যাকএন্ড লিঙ্ক
const MAIN_SITE_URL = "https://betlover247.onrender.com"; 

// 📥 একটিভ বাজি ট্র্যাকিং লোকাল মেমোরিボックス
let activeChickenBets = {};

// 💰 ১. লাইভ অ্যাকাউন্ট ব্যালেন্স নিয়ে আসার ডেডিকেটেড এপিআই গেটওয়ে (GET Route)
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

// 🛫 ২. ব্যালেন্স কাটার মেগা এপিআই রাউট (POST Route - হুবহু এভিয়েটর ও কালার ট্রেডের ওরিজিনাল অবজেক্ট এবং ভেরিয়েবল সিঙ্ক ভাই)
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
            activeChickenBets[userId] = { amount: parseFloat(amount), wallet: wallet };
            
            // 🎯 সকেটের মেইন পাইপলাইনেও ব্যালেন্স ব্রডকাস্ট ফায়ার করা হলো ভাই
            io.emit("balanceUpdate", { username: userId, balance: response.data.balance });
            
            return res.json({ 
                success: true, 
                balance: response.data.balance, 
                betAmt: parseFloat(amount) 
            });
        } else { 
            return res.json({ success: false, message: response.data.message || "❌ Balance deduction failed!" }); 
        }
    } catch (e) { 
        console.error("Chicken Bet Core Database Error:", e.message);
        return res.json({ success: false, message: "⚠️ Connection Timeout! Try again." }); 
    }
});

// 🛫 ৩. বাজি জিতলে লাভসহ টাকা প্লাস করার এপিআই রাউট (POST Route - হুবহু এভিয়েটরের ওরিজিনাল মেগা অবজেক্ট হিট লক ভাই)
app.post('/api/chicken-win', async (req, res) => {
    const { userId, amount, bet_amount, wallet, multiplier } = req.body;
    
    let targetBet = parseFloat(bet_amount) || (activeChickenBets[userId] ? parseFloat(activeChickenBets[userId].amount) : 0);
    let targetWallet = wallet || (activeChickenBets[userId] ? activeChickenBets[userId].wallet : "main");

    try {
        // 🎯 আপনার ওরিজিনাল পিএইচপি callback ইঞ্জিনের মেগা উইন অবজেক্ট হিট লক ভাই
        const response = await axios.post(MAIN_SITE_URL + '/api_callback.php', { 
            action: "win",
            username: userId,
            amount: parseFloat(amount), 
            bet_amount: parseFloat(targetBet),
            multiplier: parseFloat(multiplier).toFixed(2),
            status: "win",
            type: "win",
            is_win: 1,
            win_status: "win",
            log_status: "win",
            wallet: targetWallet
        }, { timeout: 15000 });

        if (response.data && response.data.status === "ok") {
            if (activeChickenBets[userId]) delete activeChickenBets[userId];
            
            // 🎯 সকেটের মেইন পাইপলাইনেও তাজা ব্যালেন্স ব্রডকাস্ট ভাই
            io.emit("balanceUpdate", { username: userId, balance: response.data.balance });
            
            return res.json({ 
                success: true, 
                balance: response.data.balance,
                winAmount: parseFloat(amount).toFixed(2)
            });
        } else { 
            return res.json({ success: false, message: "Declined by Database!" }); 
        }
    } catch (e) { 
        console.error("Chicken Win Core Database Error:", e.message);
        return res.json({ success: false, message: "Timeout!" }); 
    }
});

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

io.on('connection', (socket) => {
    console.log("Player connected to Manual Chicken Road Engine!");
});

// 🌐 রেন্ডার এবং টারমাক্স সেশন-৩ এর জন্য কাস্টম গ্লোবাল পোর্ট ১০০০০ মাস্টার লক ভাই
const PORT = process.env.PORT || 10000;
server.listen(PORT, () => {
    console.log(`🐔 Chicken Road Pure Manual Engine Running on port ${PORT}`);
});
