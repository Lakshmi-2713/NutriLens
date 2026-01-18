// NutriLens Home & Global Utilities (home.js)
// Theme Management
class ThemeManager {
    constructor() {
        this.theme = localStorage.getItem('theme') || 'light';
        this.init();
    }

    init() {
        this.applyTheme();
        this.setupToggle();
    }

    applyTheme() {
        if (this.theme === 'dark') {
            document.documentElement.classList.add('dark');
        } else {
            document.documentElement.classList.remove('dark');
        }
    }

    toggleTheme() {
        this.theme = this.theme === 'light' ? 'dark' : 'light';
        localStorage.setItem('theme', this.theme);
        this.applyTheme();
    }

    setupToggle() {
        const toggleButtons = document.querySelectorAll('#theme-toggle');
        toggleButtons.forEach(button => {
            button.addEventListener('click', () => this.toggleTheme());
        });
    }
}

// Toast Notification System
class Toast {
    static show(message, type = 'success') {
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;

        const icon = type === 'success'
            ? '<span class="material-symbols-outlined text-green-500">check_circle</span>'
            : '<span class="material-symbols-outlined text-red-500">error</span>';

        toast.innerHTML = `
            ${icon}
            <span class="text-sm font-medium">${message}</span>
        `;

        document.body.appendChild(toast);

        setTimeout(() => {
            toast.style.animation = 'slideIn 0.3s ease-out reverse';
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    }
}

// Smooth Scroll for anchor links
function initSmoothScroll() {
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            const href = this.getAttribute('href');
            if (href === '#') return;

            e.preventDefault();
            const target = document.querySelector(href);
            if (target) {
                target.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });
}

// Form Validation Helper
class FormValidator {
    static validateEmail(email) {
        const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return re.test(email);
    }

    static validatePassword(password) {
        return password.length >= 8;
    }

    static validateName(name) {
        return name.trim().length >= 2;
    }
}

// Loading State Manager
class LoadingManager {
    static setLoading(element, isLoading) {
        if (isLoading) {
            element.classList.add('loading');
            element.disabled = true;
        } else {
            element.classList.remove('loading');
            element.disabled = false;
        }
    }
}

// Password Toggle Functionality
function initPasswordToggles() {
    const toggleButtons = document.querySelectorAll('#togglePassword');
    toggleButtons.forEach(button => {
        button.addEventListener('click', function () {
            const input = this.parentElement.querySelector('input');
            const icon = this.querySelector('.material-symbols-outlined');

            if (input.type === 'password') {
                input.type = 'text';
                icon.textContent = 'visibility_off';
            } else {
                input.type = 'password';
                icon.textContent = 'visibility';
            }
        });
    });
}

// Intersection Observer for Animations
function initScrollAnimations() {
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.opacity = '1';
                entry.target.style.transform = 'translateY(0)';
            }
        });
    }, {
        threshold: 0.1
    });

    document.querySelectorAll('.animate-on-scroll').forEach(el => {
        el.style.opacity = '0';
        el.style.transform = 'translateY(20px)';
        el.style.transition = 'all 0.6s ease-out';
        observer.observe(el);
    });
}

// Mobile Menu (if needed in future)
function initMobileMenu() {
    const menuButton = document.querySelector('#mobile-menu-button');
    const menu = document.querySelector('#mobile-menu');

    if (menuButton && menu) {
        menuButton.addEventListener('click', () => {
            menu.classList.toggle('hidden');
        });
    }
}

// Initialize everything when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    // Initialize theme manager
    new ThemeManager();

    // Initialize smooth scrolling
    initSmoothScroll();

    // Initialize password toggles
    initPasswordToggles();

    // Initialize scroll animations
    initScrollAnimations();

    // Initialize mobile menu
    initMobileMenu();

    // Add subtle entrance animation to main content
    const main = document.querySelector('main');
    if (main) {
        main.classList.add('animate-fade-in');
    }
});

// Export utilities for use in other scripts
window.NutriLens = {
    Toast,
    FormValidator,
    LoadingManager,
    ThemeManager
};