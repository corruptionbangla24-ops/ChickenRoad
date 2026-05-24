// 👤 মেইন সাইটের ওরিজিনাল প্যারামিটার ট্র্যাকার (userId এবং wallet লক)
const urlParams = new URLSearchParams(window.location.search);
const urlUserId = urlParams.get('userId') || urlParams.get('id') || urlParams.get('username') || "guest_user";
const urlWallet = urlParams.get('wallet') || "main";
const MAIN_SITE_URL = "https://onrender.com";

let balance = 0; 
let currentBet = 10;
const MIN_BET = 1;
const MAX_BET = 20000;

let currentStep = 0;
let currentMultiplier = 1.00;
let difficulty = 'medium';
let isGameActive = false;
let isGameOver = false;
let isWaiting = false;
let crashInterval = null;

// 🎵 সাউন্ড গেটওয়ে সেটআপ
const sounds = {
    click: new Audio('click.mp3'),
    jump: new Audio('jump.mp3'),
    safe: new Audio('safe.mp3'),
    crash: new Audio('crash.mp3'),
    win: new Audio('win.mp3')
};

const world = document.getElementById("game-world");
const chickenGroup = document.getElementById("chicken-group");
const badge = document.getElementById("float-badge");
const barrier = document.getElementById("barrier");
const btnGo = document.getElementById("btn-go");
const btnCash = document.getElementById("btn-cashout");
const cashVal = document.getElementById("cash-val");
const balanceDisplay = document.getElementById("balance");
const betValDisplay = document.getElementById("bet-val");

// 💰 [মাস্টার ওয়ালেট লোডার]: সরাসরি আপনার পিএইচপি ডাটাবেজ থেকে রিয়াল টাকা রিড করা হচ্ছে
async function loadLiveBalance() {
    try {
        const response = await fetch(`${MAIN_SITE_URL}/api_callback.php?action=get_balance&username=${urlUserId}&wallet=${urlWallet}`);
        const data = await response.json();
        if (data && data.status === "ok") {
            balance = parseFloat(data.balance);
            balanceDisplay.innerText = "৳" + balance.toLocaleString('en-IN', {minimumFractionDigits: 2});
        }
    } catch (e) {
        console.error("Chicken Road Balance Load Error:", e);
        balanceDisplay.innerText = "৳0.00";
    }
}

window.onload = () => {
    loadLiveBalance();
};

// ⏳ অ্যাম্বিয়েন্ট ট্রাফিক লুপ
setInterval(() => {
    if (isGameOver) return;
    let startRange = Math.max(1, currentStep + 2);
    let endRange = currentStep + 6;
    let randomCol = Math.floor(Math.random() * (endRange - startRange + 1)) + startRange;
    if (randomCol !== currentStep && randomCol !== currentStep + 1) {
        spawnAmbientCar(randomCol);
    }
}, 800);

function spawnAmbientCar(colIndex) {
    const cols = document.querySelectorAll('.column');
    if (!cols[colIndex]) return;
    const car = document.createElement("img");
    const carId = Math.floor(Math.random() * 3) + 1;
    car.src = `car${carId}.png`;
    car.className = "ambient-car";
    cols[colIndex].appendChild(car);
    let topPos = -120;
    let speed = 12 + Math.random() * 5;
    let interval = setInterval(() => {
        topPos += speed;
        car.style.top = topPos + "px";
        if (topPos > 600) {
            car.remove();
            clearInterval(interval);
        }
    }, 20);
}

function setDifficulty(mode) {
    if (isGameActive) return;
    sounds.click.cloneNode(true).play();
    difficulty = mode;
    document.getElementById('btn-medium').className = mode === 'medium' ? 'diff-btn active' : 'diff-btn';
    document.getElementById('btn-hard').className = mode === 'hard' ? 'diff-btn active' : 'diff-btn';
    initWorld();
}

function initWorld() {
    const existingCols = document.querySelectorAll('.column');
    existingCols.forEach(col => col.remove());

    const firstCol = document.createElement("div");
    firstCol.className = "column first-col";
    world.insertBefore(firstCol, chickenGroup);

    let rate = difficulty === 'hard' ? 0.18 : 0.12;
    for (let i = 1; i <= 100; i++) {
        const col = document.createElement("div");
        col.className = "column";
        let val = (1 + (i * rate)).toFixed(2);
        col.innerHTML = `<div class="manhole">${val}X</div>`;
        world.appendChild(col);
    }

    world.style.transform = 'translateX(0px)';
    chickenGroup.style.left = "0px";
    chickenGroup.style.top = "50%";
    chickenGroup.style.transform = 'translateY(-50%)';

    badge.innerText = "1.00X";
    badge.style.background = "#27ae60";
    barrier.style.display = "none";
}

initWorld();

function updateBet(action) {
    if (isGameActive) return;
    sounds.click.cloneNode(true).play();

    if (action === 'minus') currentBet -= 10;
    else if (action === 'plus') currentBet += 10;
    else if (action === 'min') currentBet = MIN_BET;
    else if (action === 'half') currentBet = Math.floor(currentBet / 2);
    else if (action === 'double') currentBet *= 2;
    else if (action === 'max') currentBet = MAX_BET;

    if (currentBet < MIN_BET) currentBet = MIN_BET;
    if (currentBet > MAX_BET) currentBet = MAX_BET;
    betValDisplay.innerText = currentBet;
}

// 🚀 [বাজি ধরার মেইন ফাংশন]: এটি সরাসরি মেইন সাইট থেকে টাকা কাটবে ভাই
async function handleGo() {
    if (isGameOver) { resetGame(); return; }

    if (isWaiting) {
        const activeCols = document.querySelectorAll('.column');
        if (activeCols[currentStep]) {
            const mainCar = activeCols[currentStep].querySelector('.car:not(.ambient-car)');
            if (mainCar) mainCar.remove();
        }
        barrier.style.display = "none";
        isWaiting = false;
        return;
    }

    if (!isGameActive) {
        if (balance < currentBet) {
            alert("⚠️ পর্যাপ্ত ব্যালেন্স নেই!");
            return;
        }

        try {
            // 🎲 পিএইচপি গেটওয়েতে 'bet' অ্যাকশন ফায়ার (হুবহু এভিয়েটরের ওরিজিনাল কোড থিম সিঙ্ক)
            const response = await fetch(`${MAIN_SITE_URL}/api_callback.php`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: "bet",
                    username: urlUserId,
                    amount: parseFloat(currentBet),
                    wallet: urlWallet,
                    game: "chicken_road"
                })
            });
            
            const data = await response.json();
            if (data && data.status === "ok") {
                balance = parseFloat(data.balance);
                balanceDisplay.innerText = "৳" + balance.toLocaleString('en-IN', {minimumFractionDigits: 2});
                sounds.click.play();
                
                isGameActive = true;
                btnCash.classList.remove("btn-disabled");
                btnCash.disabled = false;
                btnGo.disabled = true;
                btnGo.classList.add("btn-disabled");
            } else {
                alert(data.message || "❌ Bet Declined!");
                return;
            }
        } catch (err) {
            console.error("Chicken Road Bet API Error:", err);
            alert("⚠️ কানেকশন এরর! আবার চেষ্টা করুন।");
            return;
        }
    }

    moveChicken();
}

function moveChicken() {
    currentStep++;
    sounds.jump.play();

    let offset = (currentStep * 70);
    world.style.transform = `translateX(-${offset}px)`;
    chickenGroup.style.left = offset + "px";

    let crashChance = difficulty === 'hard' ? 0.25 : 0.10;
    let isSafe = Math.random() > crashChance;

    setTimeout(() => {
        spawnCar(currentStep, isSafe);
    }, 300);
}

function spawnCar(step, isSafe) {
    const cols = document.querySelectorAll('.column');
    const targetCol = cols[step];
    if (!targetCol) return;

    const car = document.createElement("img");
    const carId = Math.floor(Math.random() * 3) + 1;
    car.src = `car${carId}.png`;
    car.className = "car";
    targetCol.appendChild(car);

    let topPos = -120;
    let speed = difficulty === 'hard' ? 18 : 15;
    let stopPoint = 30;

    let interval = setInterval(() => {
        if (isGameOver && !isSafe) { }
        else if (isGameOver) { clearInterval(interval); return; }

        if (isSafe && topPos >= stopPoint) {
            clearInterval(interval);
            isWaiting = true;
            btnGo.disabled = false;
            btnGo.classList.remove("btn-disabled");
            updateWin();
            return;
        }

        topPos += speed;
        car.style.top = topPos + "px";

        if (!isSafe && topPos > 140) {
            triggerCrash(car);
            clearInterval(interval);
        }
    }, 20);
}

function updateWin() {
    let rate = difficulty === 'hard' ? 0.18 : 0.12;
    currentMultiplier = (1 + (currentStep * rate)).toFixed(2);
    badge.innerText = currentMultiplier + "X";
    let winAmount = Math.floor(currentBet * currentMultiplier);
    cashVal.innerText = "৳ " + winAmount;
}

function triggerCrash(car) {
    isGameOver = true;
    isGameActive = false;
    sounds.crash.play();
    badge.style.background = "#e74c3c";
    badge.innerText = "CRASH";

    btnGo.innerText = "TRY AGAIN";
    btnGo.style.background = "#e74c3c";
    btnGo.disabled = false;
    btnGo.classList.remove("btn-disabled");

    btnCash.classList.add("btn-disabled");
    btnCash.disabled = true;
    barrier.style.display = "none";

    let crashFall = 0;
    if (crashInterval) clearInterval(crashInterval);
    crashInterval = setInterval(() => {
        crashFall += 12;
        car.style.top = (140 + crashFall) + "px";
        chickenGroup.style.top = (50 + (crashFall / 3.5)) + "%";
        if (crashFall > 600) {
            car.remove();
            clearInterval(crashInterval);
        }
    }, 20);
}

// 💰 [অটো-ক্যাশআউট পেমেন্ট ইঞ্জিন]: বাজি জিতলে লাভসহ টাকা ওরিজিনাল মেইন ওয়ালেটে প্লাস হবে ভাই!
async function cashOut() {
    if (!isGameActive || isGameOver) return;
    sounds.win.play();
    let rate = difficulty === 'hard' ? 0.18 : 0.12;
    currentMultiplier = (1 + (currentStep * rate)).toFixed(2);
    const totalWinAmount = parseFloat((currentBet * currentMultiplier).toFixed(2));

    try {
        const response = await fetch(`${MAIN_SITE_URL}/api_callback.php`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                action: "win",
                username: urlUserId,
                amount: totalWinAmount,
                bet_amount: parseFloat(currentBet),
                wallet: urlWallet,
                game: "chicken_road"
            })
        });

        const data = await response.json();
        if (data && data.status === "ok") {
            alert(`🎯 Cashout Success! You Won ৳${totalWinAmount}`);
            balance = parseFloat(data.balance);
            balanceDisplay.innerText = "৳" + balance.toLocaleString('en-IN', {minimumFractionDigits: 2});
            isGameActive = false;
            resetGame();
        }
    } catch (err) {
        console.error("Chicken Road Cashout Error:", err);
        alert("⚠️ ক্যাশআউট সিঙ্ক এরর! ব্যালেন্স চেক করুন।");
    }
}

if (btnCash) {
    btnCash.onclick = cashOut;
}

function resetGame() {
    if (crashInterval) clearInterval(crashInterval);
    sounds.click.play();
    
    isGameOver = false;
    isGameActive = false;
    isWaiting = false;
    currentStep = 0;
    currentMultiplier = 1.00;
    
    btnGo.innerText = "GO";
    btnGo.style.background = "#2ecc71";
    btnGo.disabled = false;
    btnGo.classList.remove("btn-disabled");
    
    btnCash.classList.add("btn-disabled");
    btnCash.disabled = true;
    cashVal.innerText = "৳ 0";
    
    badge.innerText = "1.00X";
    badge.style.background = "#27ae60";
    
    chickenGroup.style.transition = 'none';
    chickenGroup.style.top = "50%";
    chickenGroup.style.left = "0px";
    chickenGroup.style.transform = "translateY(-50%)";
    
    document.querySelectorAll('.car').forEach(c => c.remove());
    document.querySelectorAll('.ambient-car').forEach(c => c.remove());
    
    initWorld();
    loadLiveBalance();
    
    setTimeout(() => {
        chickenGroup.style.transition = 'left 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94)';
    }, 50);
}
