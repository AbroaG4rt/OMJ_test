document.addEventListener('DOMContentLoaded', () => {
    const userStr = localStorage.getItem('jlpt_user');
    if (!userStr) {
        window.location.href = 'login.html';
        return;
    }
    
    const user = JSON.parse(userStr);
    document.getElementById('welcomeText').textContent = `Welcome, ${user.username}`;
    
    // UI Events
    const menuToggle = document.getElementById('menuToggle');
    const navMenu = document.getElementById('navMenu');
    menuToggle.addEventListener('click', () => {
        navMenu.classList.toggle('active');
    });

    document.getElementById('logoutBtn').addEventListener('click', (e) => {
        e.preventDefault();
        localStorage.removeItem('jlpt_user');
        window.location.href = 'index.html';
    });

    document.getElementById('howToRegBtn').addEventListener('click', (e) => {
        e.preventDefault();
        alert('You do not need to register. Simply use any username in the login page. If it exists in the local database it will try to authorize, otherwise you will get an auto-generated guest session!');
    });

    // Level Selection
    document.querySelectorAll('.level-card').forEach(card => {
        card.addEventListener('click', () => {
            const level = card.dataset.level;
            const confirmTest = confirm(`Start ${level} test? The timer will begin immediately.`);
            if (confirmTest) {
                // Clear any existing test state
                localStorage.removeItem('jlpt_test_state');
                localStorage.removeItem('jlpt_test_answers');
                
                // Initialize Test State
                localStorage.setItem('jlpt_target_level', level);
                window.location.href = 'test.html';
            }
        });
    });

    // History Logic
    renderHistory();
});

function renderHistory() {
    const historyList = document.getElementById('historyList');
    const historyStr = localStorage.getItem('jlpt_history');
    
    if (!historyStr) return;
    
    let historyArr = JSON.parse(historyStr);
    const now = Date.now();
    const ONE_DAY = 24 * 60 * 60 * 1000;
    
    // Prune items older than 24h
    historyArr = historyArr.filter(item => (now - item.timestamp) < ONE_DAY);
    localStorage.setItem('jlpt_history', JSON.stringify(historyArr));
    
    if (historyArr.length === 0) {
        historyList.innerHTML = '<li>No recent history.</li>';
        return;
    }

    historyList.innerHTML = '';
    historyArr.forEach(item => {
        const li = document.createElement('li');
        li.className = 'history-item';
        const date = new Date(item.timestamp).toLocaleString();
        li.innerHTML = `
            <span><strong>${item.level}</strong> - Score: ${item.score}%</span>
            <span style="color: #888; font-size: 0.9em">${date}</span>
        `;
        historyList.appendChild(li);
    });
}
