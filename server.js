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

// 🎰 [এভিয়েটর ২.০ থেকে হুবহু ১০০% সিঙ্ক লিঙ্ক]: আপনার ওরিজিনাল মেইন সাইটের ডাটাবেজ ব্যাকএন্ড লিঙ্ক ভাই
const MAIN_SITE_URL = "https://betlover247.onrender.com"; 

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

// 🛫 ১. ব্যালেন্স কাটার মেগা এপিআই রাউট (হুবহু এভিয়েটরের সফল ওরিজিনাল অবজেক্ট স্ট্রাকচার সিঙ্ক ভাই)
app.post('/api/chicken-bet', async (req, res) => {
    const { userId, amount, wallet } = req.body;
    try {
        const response = await axios.post(MAIN_SITE_URL + '/api_callback.php', { 
            action: "bet", 
            username: userId, 
            amount: parseFloat(amount), 
            wallet: wallet
        }, { timeout: 15000 });

        if (response.data && response.data.status === "ok") {
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

// 🛫 ২. বাজি জিতলে লাভসহ টাকা প্লাস করার এপিআই রাউট (হুবহু এভিয়েটরের স্ক্রিনশটের মেগা উইন প্যারামিটার সিঙ্ক ভাই)
app.post('/api/chicken-win', async (req, res) => {
    const { userId, amount, bet_amount, wallet, multiplier } = req.body;
    try {
        // 🎯 আপনার ওরিজিনাল পিএইচপি callback ইঞ্জিনের হুবহু ১৬৫-১৮০ নম্বর লাইনের মেগা অবজেক্ট হিট লক ভাই
        const response = await axios.post(MAIN_SITE_URL + '/api_callback.php', { 
            action: "win",
            username: userId,
            amount: parseFloat(amount),
            bet_amount: parseFloat(bet_amount),
            multiplier: parseFloat(multiplier).toFixed(2),
            status: "win",
            type: "win",
            is_win: 1,
            win_status: "win",
            log_status: "win",
            wallet: wallet
        }, { timeout: 15000 });

        if (response.data && response.data.status === "ok") {
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
    console.log("Player connected to Chicken Road Socket Engine!");
});

// 🌐 রেন্ডার ক্লাউডের জন্য ডাইনামিক পোর্ট ইঞ্জিন লক (এরর প্রোটেকশন ২.০)
const PORT = process.env.PORT || 10000;
server.listen(PORT, () => {
    console.log(`🐔 Chicken Road Mega Engine Running on port ${PORT}`);
});
