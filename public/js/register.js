// Register Form Handler
document.addEventListener('DOMContentLoaded', () => {
    const registerForm = document.getElementById('registerForm');

    if (registerForm) {
        registerForm.addEventListener('submit', handleRegister);

        // Add real-time validation
        setupRealtimeValidation();
    }
});

function setupRealtimeValidation() {
    const emailInput = document.getElementById('email');
    const passwordInput = document.getElementById('password');
    const nameInput = document.getElementById('fullName');

    if (emailInput) {
        emailInput.addEventListener('blur', () => {
            if (emailInput.value && !window.NutriLens.FormValidator.validateEmail(emailInput.value)) {
                emailInput.classList.add('border-red-500');
            } else {
                emailInput.classList.remove('border-red-500');
            }
        });
    }

    if (passwordInput) {
        passwordInput.addEventListener('input', () => {
            const strength = getPasswordStrength(passwordInput.value);
            updatePasswordStrength(strength);
        });
    }
}

function getPasswordStrength(password) {
    let strength = 0;
    if (password.length >= 8) strength++;
    if (password.match(/[a-z]+/)) strength++;
    if (password.match(/[A-Z]+/)) strength++;
    if (password.match(/[0-9]+/)) strength++;
    if (password.match(/[$@#&!]+/)) strength++;

    return strength;
}

function updatePasswordStrength(strength) {
    // You can add a visual indicator here if desired
    const strengthTexts = ['Very Weak', 'Weak', 'Fair', 'Good', 'Strong'];
    const strengthColors = ['text-red-500', 'text-orange-500', 'text-yellow-500', 'text-blue-500', 'text-green-500'];

    // This is optional - you could add a strength indicator element
    console.log(`Password strength: ${strengthTexts[strength - 1] || 'None'}`);
}

async function handleRegister(e) {
    e.preventDefault();

    const fullName = document.getElementById('fullName').value;
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const terms = document.getElementById('terms').checked;
    const submitButton = e.target.querySelector('button[type="submit"]');

    // Validate inputs
    if (!window.NutriLens.FormValidator.validateName(fullName)) {
        window.NutriLens.Toast.show('Please enter your full name', 'error');
        return;
    }

    if (!window.NutriLens.FormValidator.validateEmail(email)) {
        window.NutriLens.Toast.show('Please enter a valid email address', 'error');
        return;
    }

    if (!window.NutriLens.FormValidator.validatePassword(password)) {
        window.NutriLens.Toast.show('Password must be at least 8 characters', 'error');
        return;
    }

    if (!terms) {
        window.NutriLens.Toast.show('Please accept the terms and conditions', 'error');
        return;
    }

    // Show loading state
    window.NutriLens.LoadingManager.setLoading(submitButton, true);

    try {
        // Call the Express API
        const response = await fetch('/api/auth/register', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ fullName, email, password })
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message || 'Registration failed');
        }

        // Store user session
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));

        window.NutriLens.Toast.show('Registration successful! Welcome to NutriLens!', 'success');

        // Redirect to login page instead of dashboard
        setTimeout(() => {
            window.location.href = '/login';
        }, 1500);

    } catch (error) {
        window.NutriLens.Toast.show(error.message || 'Registration failed. Please try again.', 'error');
        window.NutriLens.LoadingManager.setLoading(submitButton, false);
    }
}

// Simulate API registration (DEPRECATED - keeping for backward compatibility)
function simulateRegistration(name, email, password) {
    return new Promise((resolve, reject) => {
        setTimeout(() => {
            if (name && email && password.length >= 8) {
                resolve({ success: true, userId: 'user_' + Date.now() });
            } else {
                reject(new Error('Registration failed'));
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
            localStorage.removeItem('user');
        }
    }
}

// Run session check on page load
checkExistingSession();