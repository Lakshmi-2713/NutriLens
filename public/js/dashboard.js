// NutriLens Dashboard - Integrated Application

class DashboardApp {
  constructor() {
    this.apiUrl = '/api';
    this.data = null;
    this.currentPage = 'dashboard';
    this.userProfile = {
      age: 24,
      weight: 68.5,
      weightUnit: 'kg',
      height: 175,
      heightUnit: 'cm',
      dietType: 'veg',
      goal: 'maintain'
    };
    this.init();
  }

  async init() {
    try {
      await this.loadDashboardData();
      await this.loadUserProfile();
      this.render();
      this.attachEventListeners();
      this.initializeProfilePage();
    } catch (error) {
      console.error('Failed to initialize dashboard:', error);
      this.showError('Failed to load dashboard data');
    }
  }

  async loadDashboardData() {
    try {
      const response = await fetch(`${this.apiUrl}/dashboard`);
      if (!response.ok) throw new Error('Failed to fetch dashboard data');
      this.data = await response.json();
    } catch (error) {
      console.error('Error loading dashboard data:', error);
      throw error;
    }
  }

  async loadUserProfile() {
    try {
      const response = await fetch(`${this.apiUrl}/profile`);
      if (response.ok) {
        const profile = await response.json();
        this.userProfile = { ...this.userProfile, ...profile };
      }
    } catch (error) {
      console.error('Error loading user profile:', error);
    }
  }

  render() {
    this.renderUserInfo();
    this.renderWeeklyCalendar();
    this.renderNutrition();
    this.renderHabits();
  }

  renderUserInfo() {
    const { user } = this.data;
    const userNameEl = document.getElementById('userName');
    const userStatusEl = document.getElementById('userStatus');
    const userAvatarEl = document.getElementById('userAvatar');
    const welcomeEl = document.getElementById('welcomeMessage');

    if (userNameEl) userNameEl.textContent = user.name;
    if (userStatusEl) userStatusEl.textContent = user.status;
    if (userAvatarEl) userAvatarEl.style.backgroundImage = `url('${user.avatar}')`;
    if (welcomeEl) welcomeEl.textContent = `Welcome back, ${user.name.split(' ')[0]}!`;
  }

  renderWeeklyCalendar() {
    const container = document.getElementById('weeklyCalendar');
    if (!container) return;

    container.innerHTML = '';
    const { weeklyProgress } = this.data;

    weeklyProgress.forEach(day => {
      const dayEl = document.createElement('div');
      dayEl.className = 'calendar-day';

      if (day.isToday) {
        dayEl.className += ' today flex flex-col items-center gap-3 p-3 rounded-xl bg-primary text-white ring-4 ring-primary/20';
        dayEl.innerHTML = `
          <span class="text-xs font-bold opacity-80">${day.day}</span>
          <div class="size-12 rounded-full border-4 border-white/40 flex items-center justify-center">
            <span class="text-sm font-black">${day.percentage}%</span>
          </div>
          <span class="text-[10px] font-extrabold uppercase">Today</span>
        `;
      } else if (day.percentage === 100) {
        dayEl.className += ' flex flex-col items-center gap-3 p-3 rounded-xl bg-background-light dark:bg-[#2d3a31]/30';
        dayEl.innerHTML = `
          <span class="text-xs font-bold text-[#6b8072]">${day.day}</span>
          <div class="size-12 rounded-full border-4 border-primary flex items-center justify-center text-primary bg-primary/10">
            <span class="material-symbols-outlined font-bold">check</span>
          </div>
          <span class="text-[10px] font-extrabold text-primary uppercase">${day.percentage}%</span>
        `;
      } else if (day.percentage > 0) {
        dayEl.className += ' flex flex-col items-center gap-3 p-3 rounded-xl bg-background-light dark:bg-[#2d3a31]/30';
        dayEl.innerHTML = `
          <span class="text-xs font-bold text-[#6b8072]">${day.day}</span>
          <div class="size-12 rounded-full border-4 border-primary/40 flex items-center justify-center text-primary/40">
            <span class="material-symbols-outlined font-bold">check</span>
          </div>
          <span class="text-[10px] font-extrabold text-[#6b8072] uppercase">${day.percentage}%</span>
        `;
      } else {
        dayEl.className += ' flex flex-col items-center gap-3 p-3 rounded-xl';
        dayEl.innerHTML = `
          <span class="text-xs font-bold text-[#6b8072]">${day.day}</span>
          <div class="size-12 rounded-full border-4 border-[#dee3df] dark:border-[#2d3a31]"></div>
          <span class="text-[10px] font-extrabold text-[#6b8072] uppercase">-</span>
        `;
      }

      dayEl.classList.add('fade-in');
      container.appendChild(dayEl);
    });
  }

  renderNutrition() {
    const { nutrition } = this.data;

    const caloriesEl = document.getElementById('caloriesLeft');
    if (caloriesEl) {
      caloriesEl.textContent = nutrition.caloriesLeft.toLocaleString();
    }

    this.updateProgressRing('proteinCircle', nutrition.protein.current, nutrition.protein.goal, 282.7);
    this.updateProgressRing('carbsCircle', nutrition.carbs.current, nutrition.carbs.goal, 219.9);
    this.updateProgressRing('fatsCircle', nutrition.fats.current, nutrition.fats.goal, 157);

    const macroStatsEl = document.getElementById('macroStats');
    if (macroStatsEl) {
      macroStatsEl.innerHTML = `
        <div class="macro-card p-3 rounded-xl bg-background-light dark:bg-[#2d3a31]/30 border border-transparent hover:border-primary/20 transition-all">
          <p class="text-[10px] font-bold text-primary uppercase">Protein</p>
          <p class="text-sm font-black">${nutrition.protein.current}/${nutrition.protein.goal}g</p>
        </div>
        <div class="macro-card p-3 rounded-xl bg-background-light dark:bg-[#2d3a31]/30 border border-transparent hover:border-[#80C8E5]/20 transition-all">
          <p class="text-[10px] font-bold text-[#80C8E5] uppercase">Carbs</p>
          <p class="text-sm font-black">${nutrition.carbs.current}/${nutrition.carbs.goal}g</p>
        </div>
        <div class="macro-card p-3 rounded-xl bg-background-light dark:bg-[#2d3a31]/30 border border-transparent hover:border-yellow-400/20 transition-all">
          <p class="text-[10px] font-bold text-yellow-500 uppercase">Fats</p>
          <p class="text-sm font-black">${nutrition.fats.current}/${nutrition.fats.goal}g</p>
        </div>
      `;
    }
  }

  updateProgressRing(elementId, current, goal, circumference) {
    const circle = document.getElementById(elementId);
    if (!circle) return;

    const percentage = (current / goal) * 100;
    const offset = circumference - (circumference * percentage) / 100;
    circle.style.strokeDashoffset = offset;
  }

  renderHabits() {
    const container = document.getElementById('habitsList');
    if (!container) return;

    container.innerHTML = '';
    const { habits } = this.data;

    habits.forEach((habit, index) => {
      const habitEl = document.createElement('div');
      habitEl.className = 'habit-item flex items-center gap-4 p-4 rounded-xl border border-[#dee3df] dark:border-[#2d3a31] group hover:border-primary transition-all';
      if (habit.completed) habitEl.classList.add('habit-completed');

      const checkboxClass = habit.completed
        ? 'habit-checkbox size-6 rounded-md border-2 border-primary bg-primary text-white flex items-center justify-center'
        : 'habit-checkbox size-6 rounded-md border-2 border-[#dee3df] dark:border-[#2d3a31] hover:border-primary';

      const titleClass = habit.completed
        ? 'habit-title text-sm font-bold line-through text-[#6b8072]'
        : 'habit-title text-sm font-bold';

      habitEl.innerHTML = `
        <div class="${checkboxClass}" data-habit-id="${habit.id}">
          ${habit.completed ? '<span class="material-symbols-outlined text-[18px]">check</span>' : ''}
        </div>
        <div class="flex-1">
          <h4 class="${titleClass}">${habit.title}</h4>
          <p class="text-[11px] text-[#6b8072] font-medium">${habit.subtitle}</p>
        </div>
        <span class="material-symbols-outlined text-[#6b8072] opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">more_vert</span>
      `;

      habitEl.style.animationDelay = `${index * 0.05}s`;
      habitEl.classList.add('slide-in');
      container.appendChild(habitEl);
    });
  }


  initializeProfilePage() {
    const ageInput = document.getElementById('age');
    const weightSlider = document.getElementById('weightSlider');
    const weightValue = document.getElementById('weightValue');
    const heightValue = document.getElementById('heightValue');

    if (ageInput) ageInput.value = this.userProfile.age;
    if (weightSlider) {
      weightSlider.value = this.userProfile.weight;
      this.updateSliderBackground(weightSlider);
    }
    if (weightValue) weightValue.textContent = this.userProfile.weight;
    if (heightValue) heightValue.value = this.userProfile.height;

    this.updateActiveButtons();
  }

  updateSliderBackground(slider) {
    const min = parseFloat(slider.min);
    const max = parseFloat(slider.max);
    const val = parseFloat(slider.value);
    const percentage = ((val - min) / (max - min)) * 100;
    slider.style.setProperty('--value', `${percentage}%`);
  }

  updateActiveButtons() {
    const vegBtn = document.getElementById('dietVeg');
    const nonVegBtn = document.getElementById('dietNonVeg');
    const goalLose = document.getElementById('goalLose');
    const goalMaintain = document.getElementById('goalMaintain');
    const goalGain = document.getElementById('goalGain');

    if (this.userProfile.dietType === 'veg') {
      vegBtn?.classList.add('active');
      nonVegBtn?.classList.remove('active');
    } else {
      vegBtn?.classList.remove('active');
      nonVegBtn?.classList.add('active');
    }

    [goalLose, goalMaintain, goalGain].forEach(btn => btn?.classList.remove('active'));
    if (this.userProfile.goal === 'lose') goalLose?.classList.add('active');
    if (this.userProfile.goal === 'maintain') goalMaintain?.classList.add('active');
    if (this.userProfile.goal === 'gain') goalGain?.classList.add('active');
  }

  switchPage(page) {
    document.querySelectorAll('.page-content').forEach(p => p.classList.add('hidden'));
    const targetPage = document.getElementById(`${page}Page`);
    if (targetPage) {
      targetPage.classList.remove('hidden');
      this.currentPage = page;
    }

    document.querySelectorAll('.nav-link').forEach(link => link.classList.remove('active'));
    document.querySelector(`[data-page="${page}"]`)?.classList.add('active');

    const titles = {
      dashboard: 'Dashboard Overview',
      profile: 'Profile Setup',
      habits: 'Habit Library',
      settings: 'Settings'
    };
    const pageTitleEl = document.getElementById('pageTitle');
    if (pageTitleEl) pageTitleEl.textContent = titles[page] || 'Dashboard';
  }

  attachEventListeners() {
    document.addEventListener('click', async (e) => {
      const checkbox = e.target.closest('.habit-checkbox');
      if (checkbox) {
        const habitId = parseInt(checkbox.dataset.habitId);
        await this.toggleHabit(habitId);
      }
    });

    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
      let searchTimeout;
      searchInput.addEventListener('input', (e) => {
        clearTimeout(searchTimeout);
        searchTimeout = setTimeout(() => {
          this.handleSearch(e.target.value);
        }, 300);
      });
    }

    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
      logoutBtn.addEventListener('click', () => {
        // Clear session data from localStorage
        localStorage.removeItem('token');
        localStorage.removeItem('user');

        // Show a farewell toast (optional, matches existing pattern)
        if (typeof this.showToast === 'function') {
          this.showToast('Logging out...', 'success');
        }

        // Add a small delay for the toast to be seen before redirect
        setTimeout(() => {
          window.location.href = 'index.html';
        }, 800);
      });
    }

    const newHabitBtn = document.getElementById('newHabitBtn');
    if (newHabitBtn) {
      newHabitBtn.addEventListener('click', () => {
        this.showToast('New Habit feature coming soon!');
      });
    }

    document.querySelectorAll('.nav-link').forEach(link => {
      link.addEventListener('click', (e) => {
        e.preventDefault();
        const page = link.dataset.page;
        this.switchPage(page);
      });
    });

    this.attachProfileEventListeners();
  }

  attachProfileEventListeners() {
    const ageInput = document.getElementById('age');
    if (ageInput) {
      ageInput.addEventListener('change', (e) => {
        this.userProfile.age = parseInt(e.target.value);
      });
    }

    const weightSlider = document.getElementById('weightSlider');
    const weightValue = document.getElementById('weightValue');
    if (weightSlider && weightValue) {
      weightSlider.addEventListener('input', (e) => {
        const value = parseFloat(e.target.value);
        this.userProfile.weight = value;
        weightValue.textContent = value;
        this.updateSliderBackground(weightSlider);
      });
    }

    const heightValue = document.getElementById('heightValue');
    if (heightValue) {
      heightValue.addEventListener('change', (e) => {
        this.userProfile.height = parseInt(e.target.value);
      });
    }

    const weightKg = document.getElementById('weightKg');
    const weightLbs = document.getElementById('weightLbs');
    if (weightKg && weightLbs) {
      weightKg.addEventListener('click', () => {
        this.userProfile.weightUnit = 'kg';
        weightKg.classList.add('bg-white', 'dark:bg-[#1a261f]', 'shadow-sm');
        weightKg.classList.remove('text-[#6b8072]');
        weightLbs.classList.remove('bg-white', 'dark:bg-[#1a261f]', 'shadow-sm');
        weightLbs.classList.add('text-[#6b8072]');
      });
      weightLbs.addEventListener('click', () => {
        this.userProfile.weightUnit = 'lbs';
        weightLbs.classList.add('bg-white', 'dark:bg-[#1a261f]', 'shadow-sm');
        weightLbs.classList.remove('text-[#6b8072]');
        weightKg.classList.remove('bg-white', 'dark:bg-[#1a261f]', 'shadow-sm');
        weightKg.classList.add('text-[#6b8072]');
      });
    }

    const heightCm = document.getElementById('heightCm');
    const heightFt = document.getElementById('heightFt');
    if (heightCm && heightFt) {
      heightCm.addEventListener('click', () => {
        this.userProfile.heightUnit = 'cm';
        heightCm.classList.add('bg-white', 'dark:bg-[#1a261f]', 'shadow-sm');
        heightCm.classList.remove('text-[#6b8072]');
        heightFt.classList.remove('bg-white', 'dark:bg-[#1a261f]', 'shadow-sm');
        heightFt.classList.add('text-[#6b8072]');
      });
      heightFt.addEventListener('click', () => {
        this.userProfile.heightUnit = 'ft';
        heightFt.classList.add('bg-white', 'dark:bg-[#1a261f]', 'shadow-sm');
        heightFt.classList.remove('text-[#6b8072]');
        heightCm.classList.remove('bg-white', 'dark:bg-[#1a261f]', 'shadow-sm');
        heightCm.classList.add('text-[#6b8072]');
      });
    }

    const vegBtn = document.getElementById('dietVeg');
    const nonVegBtn = document.getElementById('dietNonVeg');
    if (vegBtn && nonVegBtn) {
      vegBtn.addEventListener('click', () => {
        this.userProfile.dietType = 'veg';
        vegBtn.classList.add('active');
        nonVegBtn.classList.remove('active');
      });
      nonVegBtn.addEventListener('click', () => {
        this.userProfile.dietType = 'nonveg';
        vegBtn.classList.remove('active');
        nonVegBtn.classList.add('active');
      });
    }

    const goalLose = document.getElementById('goalLose');
    const goalMaintain = document.getElementById('goalMaintain');
    const goalGain = document.getElementById('goalGain');
    const goalButtons = [goalLose, goalMaintain, goalGain];

    goalLose?.addEventListener('click', () => {
      this.userProfile.goal = 'lose';
      goalButtons.forEach(btn => btn?.classList.remove('active'));
      goalLose.classList.add('active');
    });
    goalMaintain?.addEventListener('click', () => {
      this.userProfile.goal = 'maintain';
      goalButtons.forEach(btn => btn?.classList.remove('active'));
      goalMaintain.classList.add('active');
    });
    goalGain?.addEventListener('click', () => {
      this.userProfile.goal = 'gain';
      goalButtons.forEach(btn => btn?.classList.remove('active'));
      goalGain.classList.add('active');
    });

    const generatePlanBtn = document.getElementById('generatePlanBtn');
    if (generatePlanBtn) {
      generatePlanBtn.addEventListener('click', async () => {
        await this.saveProfile();
      });
    }
  }

  async toggleHabit(habitId) {
    try {
      const response = await fetch(`${this.apiUrl}/habits/${habitId}/toggle`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) throw new Error('Failed to toggle habit');

      const result = await response.json();

      const habit = this.data.habits.find(h => h.id === habitId);
      if (habit) {
        habit.completed = result.habit.completed;
        this.renderHabits();
        this.updateCompletionPercentage();
      }
    } catch (error) {
      console.error('Error toggling habit:', error);
      this.showToast('Failed to update habit', 'error');
    }
  }

  async handleSearch(query) {
    if (!query.trim()) {
      await this.loadDashboardData();
      this.render();
      return;
    }

    try {
      const response = await fetch(`${this.apiUrl}/search?q=${encodeURIComponent(query)}`);
      if (!response.ok) throw new Error('Search failed');

      const results = await response.json();

      if (results.habits) this.data.habits = results.habits;
      if (results.meals) this.data.meals = results.meals;

      this.renderHabits();
      this.renderMeals();
    } catch (error) {
      console.error('Error searching:', error);
      this.showToast('Search failed', 'error');
    }
  }

  async saveProfile() {
    try {
      const response = await fetch(`${this.apiUrl}/profile`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(this.userProfile)
      });

      if (!response.ok) throw new Error('Failed to save profile');

      const result = await response.json();
      this.showToast('Profile saved successfully! Generating your personalized plan...');

      setTimeout(() => {
        this.switchPage('dashboard');
        this.loadDashboardData().then(() => this.render());
      }, 2000);
    } catch (error) {
      console.error('Error saving profile:', error);
      this.showToast('Failed to save profile', 'error');
    }
  }

  updateCompletionPercentage() {
    const completed = this.data.habits.filter(h => h.completed).length;
    const total = this.data.habits.length;
    const percentage = Math.round((completed / total) * 100);

    const completionEl = document.getElementById('completionMessage');
    if (completionEl) {
      completionEl.textContent = `You've completed ${percentage}% of your health goals today. Keep it up!`;
    }
  }

  showToast(message, type = 'success') {
    const existingToast = document.querySelector('.toast');
    if (existingToast) existingToast.remove();

    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.textContent = message;
    document.body.appendChild(toast);

    setTimeout(() => {
      toast.classList.add('hide');
      setTimeout(() => toast.remove(), 300);
    }, 3000);
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    new DashboardApp();
  });
} else {
  new DashboardApp();
}