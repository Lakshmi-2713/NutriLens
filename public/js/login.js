// Login Form Handler
document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('loginForm');
    
    if (loginForm) {
        loginForm.addEventListener('submit', handleLogin);
    }
});

async function handleLogin(e) {
    e.preventDefault();
    
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const submitButton = e.target.querySelector('button[type="submit"]');
    
    // Validate inputs
    if (!window.NutriLens.FormValidator.validateEmail(email)) {
        window.NutriLens.Toast.show('Please enter a valid email address', 'error');
        return;
    }
    
    if (!window.NutriLens.FormValidator.validatePassword(password)) {
        window.NutriLens.Toast.show('Password must be at least 8 characters', 'error');
        return;
    }
    
    // Show loading state
    window.NutriLens.LoadingManager.setLoading(submitButton, true);
    
    try {
        // Call the Express API
        const response = await fetch('/api/auth/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ email, password })
        });

        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.message || 'Login failed');
        }
        
        // Store user session
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));
        
        window.NutriLens.Toast.show('Login successful! Redirecting...', 'success');
        
        // Redirect to dashboard
        setTimeout(() => {
            window.location.href = '/';
        }, 1500);
        
    } catch (error) {
        window.NutriLens.Toast.show(error.message || 'Login failed. Please try again.', 'error');
        window.NutriLens.LoadingManager.setLoading(submitButton, false);
    }
}

// Simulate API login (DEPRECATED - keeping for backward compatibility)
function simulateLogin(email, password) {
    return new Promise((resolve, reject) => {
        setTimeout(() => {
            if (email && password.length >= 8) {
                resolve({ success: true });
            } else {
                reject(new Error('Invalid credentials'));
            }
        }, 1500);
    });
}

// Check if user is already logged in
function checkExistingSession() {
    const user = localStorage.getItem('user');
    if (user) {
        try {
            const userData = JSON.parse(user);
            if (userData.loggedIn) {
                // Optionally redirect to dashboard if already logged in
                // window.location.href = 'dashboard.html';
            }
        } catch (e) {
            // Invalid session data, clear it
            localStorage.removeItem('user');
        }
    }
}

// Run session check on page load
checkExistingSession();