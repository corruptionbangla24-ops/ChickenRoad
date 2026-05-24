const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const axios = require('axios');
const path = require('path');

const app = express();
const server = http.createServer(app);

// 🎯 [চিকেন রোড মেগা সকেট লক]: সেশন ২ এবং পোর্ট ৫০০৩ এর জন্য CORS লক
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

// 🎰 আপনার ওরিজিনাল মেইন সাইটের ডাটাবেজ ব্যাকএন্ড লিঙ্ক
const MAIN_SITE_URL = "https://betlover247.onrender.com"; 

// 💰 লাইভ অ্যাকাউন্ট ব্যালেন্স নিয়ে আসার ডেডিকেটেড এপিআই গেটওয়ে
app.get('/api/chicken-balance', async (req, res) => {
    const { userId, wallet } = req.query;
    try {
        const response = await axios.get(`${MAIN_SITE_URL}/api_callback.php?action=get_balance&username=${userId}&wallet=${wallet}`);
        if (response.data && response.data.status === "ok") {
            return res.json({ success: true, balance: response.data.balance });
        }
        return res.json({ success: false });
    } catch (e) {
        return res.json({ success: false });
    }
});

// 🛫 ১. ব্যালেন্স কাটার এপিআই (এভিয়েটরের ওরিজিনাল অবজেক্ট স্ট্রাকচার সিঙ্ক)
app.post('/api/chicken-bet', async (req, res) => {
    const { userId, amount, wallet } = req.body;
    try {
        const response = await axios.post(MAIN_SITE_URL + '/api_callback.php', { 
            action: "bet", 
            username: userId, 
            amount: parseFloat(amount), 
            wallet: wallet,
            game: "chicken_road"
        }, { timeout: 15000 });

        if (response.data && response.data.status === "ok") {
            // সকেটের মাধ্যমে লাইভ ব্যালেন্স রিফ্রেশ পাঠানো হচ্ছে ভাই
            io.emit("balanceUpdate", { username: userId, balance: response.data.balance });
            return res.json({ success: true, balance: response.data.balance });
        } else { 
            return res.json({ success: false, message: response.data.message || "❌ Low Balance!" }); 
        }
    } catch (e) { 
        console.error("Chicken Bet API Error:", e.message);
        return res.json({ success: false, message: "⚠️ Connection Timeout!" }); 
    }
});

// 🛫 ২. বাজি জিতলে লাভসহ টাকা প্লাস করার এপিআই (এভিয়েটরের ওরিজিনাল অবজেক্ট স্ট্রাকচার সিঙ্ক)
app.post('/api/chicken-win', async (req, res) => {
    const { userId, amount, bet_amount, wallet } = req.body;
    try {
        const response = await axios.post(MAIN_SITE_URL + '/api_callback.php', { 
            action: "win", 
            username: userId, 
            amount: parseFloat(amount),
            bet_amount: parseFloat(bet_amount),
            wallet: wallet,
            game: "chicken_road"
        }, { timeout: 15000 });

        if (response.data && response.data.status === "ok") {
            // সকেটের মাধ্যমে লাইভ ব্যালেন্স রিফ্রেশ পাঠানো হচ্ছে ভাই
            io.emit("balanceUpdate", { username: userId, balance: response.data.balance });
            return res.json({ success: true, balance: response.data.balance });
        } else { 
            return res.json({ success: false, message: "Declined!" }); 
        }
    } catch (e) { 
        console.error("Chicken Win API Error:", e.message);
        return res.json({ success: false, message: "Timeout!" }); 
    }
});

io.on('connection', (socket) => {
    console.log("Player connected to Chicken Road Socket Engine!");
});

// 🌐 সেশন ২ এর জন্য ৫০০৩ ডেডিকেটেড পোর্ট বুট লক
const PORT = process.env.PORT || 5003;
server.listen(PORT, () => {
    console.log(`🐔 Chicken Road Mega Engine Running on port ${PORT}`);
});
