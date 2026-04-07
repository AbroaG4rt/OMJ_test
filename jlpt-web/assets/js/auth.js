document.addEventListener('DOMContentLoaded', () => {
    // If already logged in, redirect to dashboard
    if (localStorage.getItem('jlpt_user')) {
        window.location.href = 'dashboard.html';
        return;
    }

    const loginForm = document.getElementById('loginForm');
    const errorMsg = document.getElementById('errorMsg');

    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const username = document.getElementById('username').value.trim();
        const password = document.getElementById('password').value.trim();
        
        if (!username || !password) return;

        try {
            // Attempt to load users database (for validation via data/users.json)
            const response = await fetch('data/users.json');
            if (response.ok) {
                const users = await response.json();
                const matchedUser = users.find(u => u.username === username);
                
                if (matchedUser) {
                    if (matchedUser.password !== password) {
                        showError("Invalid password for existing user.");
                        return;
                    }
                }
            }
        } catch (err) {
            console.warn("Could not fetch users.json, falling back to auto-gen mode", err);
        }

        // Generate session & login
        const sessionToken = btoa(`${username}:${password}:${Date.now()}`);
        const userObj = {
            username: username,
            code: sessionToken,
            loginAt: Date.now()
        };

        localStorage.setItem('jlpt_user', JSON.stringify(userObj));
        window.location.href = 'dashboard.html';
    });

    function showError(msg) {
        errorMsg.textContent = msg;
        errorMsg.style.display = 'block';
    }
});
