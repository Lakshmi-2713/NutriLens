// NutriLens Dashboard - Integrated Application

class DashboardApp {
  constructor() {
    this.apiUrl = '/api';
    this.data = null;
    this.currentPage = 'dashboard';
    this.nutritionData = {
      loggedItems: [],
      targets: {
        calories: 2200,
        protein: 150,
        carbs: 250,
        fats: 65
      }
    };
    this.foodDatabase = [];
    this.dailyTotals = { calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0 };
    this.dailyTargets = { calories: 2000, protein: 150, carbs: 250, fat: 65, fiber: 30 };
    this.selectedFood = null;
    this.userProfile = {
      gender: 'male',
      age: 24,
      weight: 68.5,
      height: 175,
      activityLevel: 'light',
      goal: 'maintain'
    };
    this.recommendedPlan = null;
    this.charts = {
      macro: null,
      weekly: null,
      protein: null
    };
    this.hydration = {
      today: 0,
      target: 2.5
    };
    this.init();
  }

  async init() {
    try {
      await this.loadDashboardData();
      await this.loadUserProfile();
      await this.loadFoodDatabase();

      // Initial state sync
      this.recalculateDailyTotals();
      this.initCharts();
      this.render();
      this.attachEventListeners();
      this.attachNutritionEventListeners();
      this.attachSettingsEventListeners();
      this.initializeProfilePage();
      this.initHydration();

      window.dashboard = this;
    } catch (error) {
      console.error('Failed to initialize dashboard:', error);
    }
  }

  async loadDashboardData() {
    try {
      const dashboardResponse = await fetch(`${this.apiUrl}/dashboard`);
      const habitsResponse = await fetch(`${this.apiUrl}/habits/daily`);

      if (!dashboardResponse.ok) throw new Error('Failed to fetch dashboard data');

      this.data = await dashboardResponse.json();

      if (habitsResponse.ok) {
        this.data.habits = await habitsResponse.json();
      } else {
        console.warn('Could not fetch real habits, using defaults');
        this.data.habits = this.data.habits || [];
      }
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
        // If profile exists, generate plan automatically
        if (profile.goal) {
          this.generatePlan();
        }
      }
    } catch (error) {
      console.error('Error loading user profile:', error);
    }
  }

  async loadFoodDatabase() {
    try {
      const response = await fetch('/js/food_data.json');
      if (response.ok) {
        this.foodDatabase = await response.json();
        console.log(`Loaded ${this.foodDatabase.length} food items`);
      }
    } catch (error) {
      console.error('Error loading food database:', error);
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
    const remainingContainer = document.getElementById('remainingHabits');
    const completedContainer = document.getElementById('completedHabits');
    const activeHabitsCountEl = document.getElementById('activeHabitsCount');

    if (!remainingContainer || !completedContainer) {
      const dashboardContainer = document.getElementById('habitsList');
      if (dashboardContainer) {
        dashboardContainer.innerHTML = '';
        this.data.habits.forEach((habit, index) => {
          const habitEl = this.createHabitItem(habit, index);
          dashboardContainer.appendChild(habitEl);
        });
      }
      return;
    }

    // Capture current heights to prevent layout jump if necessary
    // But for simplicity in this integration, we'll just clear and re-render with animation
    remainingContainer.innerHTML = '';
    completedContainer.innerHTML = '';

    const sortedHabits = [...this.data.habits].sort((a, b) => a.id - b.id);
    const remaining = sortedHabits.filter(h => !h.completed);
    const completed = sortedHabits.filter(h => h.completed);

    if (activeHabitsCountEl) {
      activeHabitsCountEl.textContent = `${this.data.habits.length} ACTIVE TODAY`;
    }

    // Render remaining habits with staggered delay
    remaining.forEach((habit, index) => {
      const habitEl = this.createHabitCard(habit, index);
      remainingContainer.appendChild(habitEl);
    });

    // Render completed habits with staggered delay starting after remaining
    completed.forEach((habit, index) => {
      const habitEl = this.createHabitCard(habit, index + remaining.length);
      completedContainer.appendChild(habitEl);
    });

    this.updateCompletionPercentage();
  }

  createHabitCard(habit, index) {
    const card = document.createElement('div');
    card.className = `habit-card ${habit.completed ? 'completed' : ''} slide-in`;
    card.style.animationDelay = `${index * 0.05}s`;

    // Mock streaks for UI demonstration as they are in the design
    const streaks = { 1: '12D', 2: '5D', 3: '8D', 4: '31D' };
    const streakValue = streaks[habit.id] || '3D';

    card.innerHTML = `
      <div class="habit-check-circle" data-habit-id="${habit.id}">
        ${habit.completed ? '<span class="material-symbols-outlined text-[20px]">check</span>' : ''}
      </div>
      <div class="flex-1">
        <h4 class="text-lg font-bold ${habit.completed ? 'text-[#6b8072] opacity-60' : ''}">${habit.title}</h4>
        <p class="text-sm text-[#6b8072] font-medium">${habit.subtitle}</p>
      </div>
      <div class="streak-badge">
        <span class="material-symbols-outlined text-[16px]">local_fire_department</span>
        ${streakValue} STREAK
      </div>
    `;

    card.querySelector('.habit-check-circle').addEventListener('click', async (e) => {
      e.stopPropagation();
      await this.toggleHabit(habit.id);
    });

    return card;
  }

  createHabitItem(habit, index) {
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
    return habitEl;
  }

  initializeProfilePage() {
    const ageInput = document.getElementById('age');
    const weightSlider = document.getElementById('weightSlider');
    const weightValue = document.getElementById('weightValue');
    const heightValue = document.getElementById('heightValue');
    const activitySelect = document.getElementById('activityLevel');

    if (ageInput) ageInput.value = this.userProfile.age || 24;
    if (weightSlider) {
      weightSlider.value = this.userProfile.weight || 68.5;
      this.updateSliderBackground(weightSlider);
    }
    if (weightValue) weightValue.textContent = this.userProfile.weight || 68.5;
    if (heightValue) heightValue.value = this.userProfile.height || 171;
    if (activitySelect) activitySelect.value = this.userProfile.activityLevel || 'light';

    this.updateActiveButtons();
    this.attachProfileEventListeners();
  }



  updateActiveButtons() {
    const maleBtn = document.getElementById('genderMale');
    const femaleBtn = document.getElementById('genderFemale');
    const goalLose = document.getElementById('goalLose');
    const goalMaintain = document.getElementById('goalMaintain');
    const goalGain = document.getElementById('goalGain');

    // Gender
    if (this.userProfile.gender === 'male') {
      maleBtn?.classList.add('active-metric');
      maleBtn?.classList.remove('text-slate-400');
      femaleBtn?.classList.remove('active-metric');
      femaleBtn?.classList.add('text-slate-400');
    } else {
      femaleBtn?.classList.add('active-metric');
      femaleBtn?.classList.remove('text-slate-400');
      maleBtn?.classList.remove('active-metric');
      maleBtn?.classList.add('text-slate-400');
    }

    // Goal
    [goalLose, goalMaintain, goalGain].forEach(btn => btn?.classList.remove('active'));
    if (this.userProfile.goal === 'lose') goalLose?.classList.add('active');
    if (this.userProfile.goal === 'maintain') goalMaintain?.classList.add('active');
    if (this.userProfile.goal === 'gain') goalGain?.classList.add('active');
  }

  updateSliderBackground(slider) {
    if (!slider) return;
    const min = parseFloat(slider.min);
    const max = parseFloat(slider.max);
    const val = parseFloat(slider.value);
    const percentage = ((val - min) / (max - min)) * 100;
    slider.style.setProperty('--value', `${percentage}%`);
  }

  switchPage(page) {
    document.querySelectorAll('.page-content').forEach(p => p.classList.add('hidden'));
    const targetPage = document.getElementById(`${page}Page`);
    if (targetPage) {
      targetPage.classList.remove('hidden');
      this.currentPage = page;

      // Update sidebar active state
      document.querySelectorAll('.nav-link').forEach(link => {
        if (link.dataset.page === page) {
          link.classList.add('bg-primary/10', 'text-primary', 'font-bold');
          link.classList.remove('text-[#6b8072]');
        } else {
          link.classList.remove('bg-primary/10', 'text-primary', 'font-bold');
          link.classList.add('text-[#6b8072]');
        }
      });

      const titles = {
        dashboard: 'Dashboard Overview',
        profile: 'Profile Setup',
        settings: 'Settings',
        nutrition: 'Nutrition Intake'
      };
      const pageTitleEl = document.getElementById('pageTitle');
      if (pageTitleEl) pageTitleEl.textContent = titles[page] || 'Dashboard';

      if (page === 'dashboard') {
        this.renderRecommendedPlan();
      }
      if (page === 'nutrition') {
        this.recalculateDailyTotals();
      }
    }
  }

  renderNutritionPage() {
    this.recalculateDailyTotals();
  }


  calculateProgress(consumed, target) {
    if (!target || target <= 0) return 0;
    return Math.min((consumed / target) * 100, 100);
  }

  recalculateDailyTotals() {
    // 1. Initialize with server-side totals as the baseline
    if (this.data && this.data.nutrition) {
      const nut = this.data.nutrition;
      // Calculate server-side consumed calories using server's own goals to avoid desync
      const serverTotalGoal = (nut.protein.goal * 4) + (nut.carbs.goal * 4) + (nut.fats.goal * 9);
      const serverConsumedCalories = Math.max(0, serverTotalGoal - nut.caloriesLeft);

      this.dailyTotals = {
        calories: serverConsumedCalories || 0,
        protein: nut.protein.current || 0,
        carbs: nut.carbs.current || 0,
        fat: nut.fats.current || 0,
        fiber: 0
      };

      // If totals are negative or weird due to desync, bound to 0
      Object.keys(this.dailyTotals).forEach(key => {
        if (this.dailyTotals[key] < 0) this.dailyTotals[key] = 0;
      });
    } else {
      this.dailyTotals = { calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0 };
    }

    // 2. Add session-logged items
    this.nutritionData.loggedItems.forEach(item => {
      const q = (item.quantity || 0) / 100;
      this.dailyTotals.calories += ((item.calories_per_100g || 0) * q);
      this.dailyTotals.protein += ((item.protein || 0) * q);
      this.dailyTotals.carbs += ((item.carbs || 0) * q);
      this.dailyTotals.fat += ((item.fat || 0) * q);
      this.dailyTotals.fiber += ((item.fiber || 0) * q);
    });

    // Round for state consistency
    Object.keys(this.dailyTotals).forEach(key => {
      this.dailyTotals[key] = Math.round(this.dailyTotals[key] * 100) / 100;
    });

    this.updateMacroUI();
    this.updateCharts();
    this.renderNutritionLog();
    this.analyzeGoalAlignment(); // Trigger analysis on every update
  }

  updateMacroUI() {
    const keys = ["calories", "protein", "carbs", "fat", "fiber"];

    keys.forEach(key => {
      const consumed = this.dailyTotals[key] || 0;
      const target = this.dailyTargets[key] || 0;
      const progress = this.calculateProgress(consumed, target);
      const isCalories = (key === "calories");

      // Update text value (e.g., "120.50g / 150g" or "1500 / 2000")
      const valueEl = document.getElementById(`${key}-value`);
      if (valueEl) {
        const consumedStr = isCalories ? Math.round(consumed) : consumed.toFixed(2);
        const targetStr = isCalories ? Math.round(target) : Math.round(target);
        const unit = isCalories ? "" : "g";
        valueEl.innerText = `${consumedStr}${unit} / ${targetStr}${unit}`;
      }

      // Update progress bar width
      const progressEl = document.getElementById(`${key}-progress`);
      if (progressEl) {
        progressEl.style.width = `${progress}%`;
      }
    });

    // Sync large calories display if it exists (e.g. on dashboard home)
    const logTotalEl = document.getElementById('logTotalCalories');
    if (logTotalEl) logTotalEl.textContent = `${Math.round(this.dailyTotals.calories)} kcal`;
  }

  renderNutritionLog() {
    const container = document.getElementById('nutritionLogContainer');
    if (!container) return;

    if (this.nutritionData.loggedItems.length === 0) {
      container.innerHTML = `
        <div class="flex flex-col items-center justify-center h-full text-center space-y-4 opacity-40 py-20">
            <span class="material-symbols-outlined text-6xl">no_meals</span>
            <div>
                <p class="font-bold text-lg">No food logged today</p>
                <p class="text-sm">Start by adding your first meal of the day.</p>
            </div>
        </div>`;
      return;
    }

    const meals = ['Breakfast', 'Lunch', 'Dinner', 'Snacks'];
    container.innerHTML = '';

    meals.forEach(mealType => {
      const items = this.nutritionData.loggedItems.filter(item => item.mealType === mealType);
      if (items.length > 0) {
        const mealTotal = items.reduce((sum, item) => {
          const currentItemCalories = (item.calories_per_100g * item.quantity) / 100;
          return sum + currentItemCalories;
        }, 0);
        const roundedMealTotal = Math.round(mealTotal * 100) / 100;

        const section = document.createElement('div');
        section.className = 'meal-section';
        section.innerHTML = `
          <div class="flex items-center gap-2 mb-4">
              <span class="material-symbols-outlined text-primary text-lg">${this.getMealIcon(mealType)}</span>
              <h4 class="font-bold text-[#0d1b11] dark:text-white uppercase tracking-widest text-xs">${mealType}</h4>
              <div class="flex-1 border-b border-[#cfe7d5] dark:border-white/5 ml-2"></div>
              <span class="text-xs font-bold text-primary">${roundedMealTotal} kcal</span>
          </div>
          <div class="space-y-3">
              ${items.map(item => `
                <div class="group flex items-center justify-between p-4 rounded-xl border border-gray-50 dark:border-white/5 hover:bg-gray-50 dark:hover:bg-white/5 transition-all">
                    <div class="flex items-center gap-4">
                        <div class="size-12 rounded-full bg-primary/10 flex items-center justify-center text-primary border border-primary/20">
                            <span class="material-symbols-outlined">${item.icon || 'restaurant'}</span>
                        </div>
                        <div>
                            <p class="font-bold text-[#0d1b11] dark:text-white">${item.name}</p>
                            <p class="text-sm text-[#6b8072] font-medium">${item.quantity} units</p>
                        </div>
                    </div>
                    <div class="flex items-center gap-6">
                        <div class="text-right">
                             <p class="font-black text-[#0d1b11] dark:text-white">${(Math.round((item.calories_per_100g * item.quantity / 100) * 100) / 100)} kcal</p>
                            <div class="flex gap-2 text-[10px] uppercase font-bold text-[#6b8072] opacity-70">
                                <span>P: ${(Math.round((item.protein * item.quantity / 100) * 100) / 100)}g</span>
                                <span>C: ${(Math.round((item.carbs * item.quantity / 100) * 100) / 100)}g</span>
                                <span>F: ${(Math.round((item.fat * item.quantity / 100) * 100) / 100)}g</span>
                                <span>Fb: ${(Math.round(((item.fiber || 0) * item.quantity / 100) * 100) / 100)}g</span>
                            </div>
                        </div>
                        <button onclick="window.dashboard.deleteFoodItem(${item.id})" class="opacity-0 group-hover:opacity-100 p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg transition-all">
                            <span class="material-symbols-outlined text-sm">delete</span>
                        </button>
                    </div>
                </div>
              `).join('')}
          </div>
        `;
        container.appendChild(section);
      }
    });
  }

  getMealIcon(mealType) {
    const icons = {
      'Breakfast': 'wb_sunny',
      'Lunch': 'lunch_dining',
      'Dinner': 'dark_mode',
      'Snacks': 'bakery_dining'
    };
    return icons[mealType] || 'restaurant';
  }

  deleteFoodItem(itemId) {
    this.nutritionData.loggedItems = this.nutritionData.loggedItems.filter(item => item.id !== itemId);
    this.recalculateDailyTotals();
    this.showToast('Item removed from log');
  }

  attachNutritionEventListeners() {
    const foodInput = document.getElementById('foodInput');
    const foodDropdown = document.getElementById('foodDropdown');
    const foodCategoryFilter = document.getElementById('foodCategoryFilter');
    const addFoodBtn = document.getElementById('addFoodBtn');

    if (foodInput && foodDropdown) {
      if (foodCategoryFilter) {
        foodCategoryFilter.addEventListener('change', () => {
          foodInput.value = '';
          foodDropdown.classList.add('hidden');
          this.selectedFood = null;
        });
      }

      foodInput.addEventListener('input', (e) => {
        const query = e.target.value.toLowerCase();
        if (query.length < 2) {
          foodDropdown.classList.add('hidden');
          return;
        }

        const selectedCategory = foodCategoryFilter ? foodCategoryFilter.value : 'all';

        const results = this.foodDatabase
          .filter(f => {
            const matchesQuery = f.name.toLowerCase().includes(query);
            const matchesCategory = selectedCategory === 'all' || f.category === selectedCategory;
            return matchesQuery && matchesCategory;
          })
          .slice(0, 20);
        if (results.length > 0) {
          foodDropdown.innerHTML = `
            <div class="p-2 bg-white dark:bg-[#1A1A1A] rounded-xl shadow-2xl border border-gray-100 dark:border-purple-500/20">
              ${results.map(f => `
                <div class="food-result-item flex items-center gap-4 p-3 hover:bg-gray-50 dark:hover:bg-primary/10 rounded-lg cursor-pointer transition-colors border-b border-gray-50 dark:border-white/5 last:border-0" 
                     data-name="${f.name}">
                    <div class="size-10 rounded-lg bg-gray-100 dark:bg-primary/20 flex items-center justify-center">
                        <span class="material-symbols-outlined text-primary">${f.icon || 'restaurant'}</span>
                    </div>
                    <div class="flex-1">
                        <p class="font-bold text-[#0d1b11] dark:text-white">${f.name}</p>
                        <p class="text-xs text-[#6b8072] font-medium">${f.calories_per_100g} kcal/100g • P:${f.protein} C:${f.carbs} F:${f.fat} Fb:${f.fiber || 0}</p>
                    </div>
                </div>
              `).join('')}
            </div>`;
          foodDropdown.classList.remove('hidden');

          foodDropdown.querySelectorAll('.food-result-item').forEach(item => {
            item.addEventListener('click', () => {
              const name = item.dataset.name;
              this.selectedFood = this.foodDatabase.find(f => f.name === name);
              foodInput.value = name;
              foodDropdown.classList.add('hidden');
            });
          });
        } else {
          foodDropdown.classList.add('hidden');
        }
      });

      document.addEventListener('click', (e) => {
        if (!foodInput.contains(e.target) && !foodDropdown.contains(e.target)) {
          foodDropdown.classList.add('hidden');
        }
      });
    }

    if (addFoodBtn) {
      addFoodBtn.addEventListener('click', () => {
        if (!this.selectedFood && foodInput.value) {
          // Allow custom entry or pick first match
          this.selectedFood = this.foodDatabase.find(f => f.name.toLowerCase() === foodInput.value.toLowerCase());
        }

        if (!this.selectedFood) {
          this.showToast('Please select a food item from the list', 'error');
          return;
        }

        const quantity = parseFloat(document.getElementById('foodQuantity').value);
        if (isNaN(quantity) || quantity <= 0) {
          this.showToast('Please enter a valid quantity in grams', 'error');
          return;
        }

        const mealType = document.getElementById('mealTypeSelect').value;

        const newItem = {
          ...this.selectedFood,
          id: Date.now(),
          quantity,
          mealType,
          calories: (this.selectedFood.calories_per_100g * quantity) / 100
        };

        this.nutritionData.loggedItems.push(newItem);
        this.recalculateDailyTotals();

        this.showToast(`Logged ${newItem.name}`);

        // Reset form
        foodInput.value = '';
        this.selectedFood = null;
        document.getElementById('foodQuantity').value = 1;
      });
    }
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
    // Gender
    const maleBtn = document.getElementById('genderMale');
    const femaleBtn = document.getElementById('genderFemale');
    if (maleBtn && femaleBtn) {
      maleBtn.addEventListener('click', () => {
        this.userProfile.gender = 'male';
        maleBtn.classList.add('active-metric');
        maleBtn.classList.remove('text-slate-400');
        femaleBtn.classList.remove('active-metric');
        femaleBtn.classList.add('text-slate-400');
      });
      femaleBtn.addEventListener('click', () => {
        this.userProfile.gender = 'female';
        femaleBtn.classList.add('active-metric');
        femaleBtn.classList.remove('text-slate-400');
        maleBtn.classList.remove('active-metric');
        maleBtn.classList.add('text-slate-400');
      });
    }

    // Age
    const ageInput = document.getElementById('age');
    if (ageInput) {
      ageInput.addEventListener('change', (e) => {
        this.userProfile.age = parseInt(e.target.value);
      });
    }

    // Weight
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

    // Height
    const heightValue = document.getElementById('heightValue');
    if (heightValue) {
      heightValue.addEventListener('change', (e) => {
        this.userProfile.height = parseInt(e.target.value);
      });
    }

    // Activity Level
    const activitySelect = document.getElementById('activityLevel');
    if (activitySelect) {
      activitySelect.addEventListener('change', (e) => {
        this.userProfile.activityLevel = e.target.value;
      });
    }

    // Goals
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

    // Generate Plan Button
    const generatePlanBtn = document.getElementById('generatePlanBtn');
    if (generatePlanBtn) {
      generatePlanBtn.addEventListener('click', async () => {
        await this.handlePlanGeneration();
      });
    }

    // Compare Button (on dashboard)
    const compareBtn = document.getElementById('compareBtn');
    if (compareBtn) {
      compareBtn.addEventListener('click', () => {
        this.analyzeGoalAlignment();
      });
    }
  }

  async handlePlanGeneration() {
    try {
      this.generatePlan();
      await this.saveProfile();
      await this.loadDashboardData(); // Refresh habits and server-side nutrition targets
      this.switchPage('dashboard');
      this.showToast('Plan generated successfully!');
    } catch (error) {
      console.error('Plan generation failed:', error);
      this.showToast('Failed to generate plan', 'error');
    }
  }

  generatePlan() {
    if (window.GoalEngine) {
      const plan = window.GoalEngine.generatePlan(this.userProfile);
      this.recommendedPlan = plan;
      this.dailyTargets = plan.dailyTargets;

      // Update server targets if possible (UI sync)
      if (this.data && this.data.nutrition) {
        this.data.nutrition.protein.goal = plan.dailyTargets.protein;
        this.data.nutrition.carbs.goal = plan.dailyTargets.carbs;
        this.data.nutrition.fats.goal = plan.dailyTargets.fat;
      }

      this.render();
      this.renderRecommendedPlan();
      this.analyzeGoalAlignment(); // Ensure analysis refreshes with new targets
    }
  }

  renderRecommendedPlan() {
    if (!this.recommendedPlan) return;

    // 1. Update Macro Targets
    const targets = this.recommendedPlan.dailyTargets;
    const ids = {
      calories: 'plan-target-calories',
      protein: 'plan-target-protein',
      carbs: 'plan-target-carbs',
      fat: 'plan-target-fat'
    };

    Object.entries(ids).forEach(([key, id]) => {
      const el = document.getElementById(id);
      if (el) {
        el.textContent = `${Math.round(targets[key])}${key === 'calories' ? '' : 'g'}`;
      }
    });

    // 2. Update Recommended Habits in the Plan section
    const habitsContainer = document.getElementById('planHabitsList');
    if (habitsContainer && this.recommendedPlan.recommendedHabits) {
      habitsContainer.innerHTML = this.recommendedPlan.recommendedHabits.map(habit => `
        <div class="flex items-center gap-3 p-3 rounded-xl bg-background-light dark:bg-[#1A1A1A] border border-white/5 transition-all hover:border-primary/20 group">
          <div class="size-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
            <span class="material-symbols-outlined text-sm">${this.getHabitIcon(habit.icon)}</span>
          </div>
          <div>
            <p class="text-xs font-bold leading-tight">${habit.title}</p>
            <p class="text-[10px] text-[#6b8072] font-medium">${habit.subtitle}</p>
          </div>
        </div>
      `).join('');
    }
  }

  getHabitIcon(iconType) {
    const icons = {
      steps: 'directions_walk',
      fitness_center: 'fitness_center',
      no_food: 'block',
      bedtime: 'bedtime',
      restaurant: 'restaurant',
      egg: 'egg',
      history: 'history',
      water: 'water_drop',
      meditation: 'self_improvement'
    };
    return icons[iconType] || 'check_circle';
  }

  analyzeGoalAlignment() {
    if (!window.ComparisonEngine || !this.dailyTargets) return;

    const analysis = window.ComparisonEngine.compare(this.dailyTotals, this.dailyTargets);
    const container = document.getElementById('analysisResults');
    if (!container) return;

    container.innerHTML = analysis.map(item => {
      const iconMap = { warning: 'warning', suggestion: 'tips_and_updates', info: 'info', success: 'check_circle' };
      const colorMap = { warning: 'text-orange-500', suggestion: 'text-primary', info: 'text-blue-500', success: 'text-primary' };
      const bgMap = { warning: 'bg-orange-500/5', suggestion: 'bg-primary/5', info: 'bg-blue-500/5', success: 'bg-primary/5' };

      return `
        <div class="flex items-start gap-4 p-4 ${bgMap[item.type]} rounded-xl border border-white/5 animate-in fade-in slide-in-from-right-4">
          <span class="material-symbols-outlined ${colorMap[item.type]} mt-0.5">${iconMap[item.type]}</span>
          <p class="text-sm font-medium leading-relaxed">${item.text}</p>
        </div>
      `;
    }).join('');
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
      if (results.meals) this.data.meals = results.meals;
      this.render();
    } catch (error) {
      console.error('Error searching:', error);
      this.showToast('Search failed', 'error');
    }
  }

  async saveProfile() {
    try {
      const response = await fetch(`${this.apiUrl}/profile`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(this.userProfile)
      });
      if (!response.ok) throw new Error('Failed to save profile');
      this.showToast('Profile saved successfully!');
    } catch (error) {
      console.error('Error saving profile:', error);
      this.showToast('Failed to save profile', 'error');
    }
  }


  // --- New Analytics & Settings Methods ---

  initCharts() {
    const isDark = document.documentElement.classList.contains('dark');
    const textColor = isDark ? '#EAEAEA' : '#0d1b11';
    const gridColor = isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)';

    // 1. Macro Pie Chart
    const macroCtx = document.getElementById('macroPieChart')?.getContext('2d');
    if (macroCtx) {
      if (this.charts.macro) this.charts.macro.destroy();
      this.charts.macro = new Chart(macroCtx, {
        type: 'doughnut',
        data: {
          labels: ['Protein', 'Carbs', 'Fat'],
          datasets: [{
            data: [0, 0, 0],
            backgroundColor: ['#8b5cf6', '#a78bfa', '#c4b5fd'],
            borderWidth: 0,
            hoverOffset: 10
          }]
        },
        options: {
          cutout: '70%',
          plugins: {
            legend: { display: false }
          },
          animation: { animateScale: true }
        }
      });
    }

    // 2. Weekly Calorie Trend
    const weeklyCtx = document.getElementById('weeklyCalorieChart')?.getContext('2d');
    if (weeklyCtx) {
      if (this.charts.weekly) this.charts.weekly.destroy();
      this.charts.weekly = new Chart(weeklyCtx, {
        type: 'line',
        data: {
          labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
          datasets: [{
            label: 'Calories',
            data: [1800, 2100, 1950, 2200, 2050, 2300, 1900], // Mock data for trend
            borderColor: '#6bc78a',
            backgroundColor: 'rgba(107, 199, 138, 0.1)',
            fill: true,
            tension: 0.4,
            pointRadius: 4,
            pointBackgroundColor: '#6bc78a'
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: { legend: { display: false } },
          scales: {
            x: { grid: { display: false }, ticks: { color: textColor, font: { size: 10 } } },
            y: { grid: { color: gridColor }, ticks: { color: textColor, font: { size: 10 } } }
          }
        }
      });
    }

    // 3. Protein Consistency Bar Graph
    const proteinCtx = document.getElementById('proteinConsistencyChart')?.getContext('2d');
    if (proteinCtx) {
      if (this.charts.protein) this.charts.protein.destroy();
      this.charts.protein = new Chart(proteinCtx, {
        type: 'bar',
        data: {
          labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
          datasets: [{
            label: 'Protein (g)',
            data: [140, 160, 130, 170, 155, 145, 120], // Mock data
            backgroundColor: (context) => {
              const val = context.raw;
              return val < 130 ? 'rgba(139, 92, 246, 0.4)' : '#8b5cf6';
            },
            borderRadius: 8
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: { legend: { display: false } },
          scales: {
            x: { grid: { display: false }, ticks: { color: textColor, font: { size: 10 } } },
            y: { grid: { color: gridColor }, ticks: { color: textColor, font: { size: 10 } } }
          }
        }
      });
    }
  }

  updateCharts() {
    if (this.charts.macro) {
      const { protein, carbs, fat } = this.dailyTotals;
      const total = (protein * 4) + (carbs * 4) + (fat * 9);

      if (total > 0) {
        this.charts.macro.data.datasets[0].data = [
          Math.round((protein * 4 / total) * 100),
          Math.round((carbs * 4 / total) * 100),
          Math.round((fat * 9 / total) * 100)
        ];
      } else {
        this.charts.macro.data.datasets[0].data = [0, 0, 0];
      }
      this.charts.macro.update();
    }
  }

  initHydration() {
    const addWaterBtn = document.getElementById('addWaterBtn');
    if (addWaterBtn) {
      addWaterBtn.onclick = () => {
        this.hydration.today = Math.min(this.hydration.today + 0.25, 5);
        this.updateHydrationUI();
        this.showToast('Logged 250ml water', 'info');
      };
    }
    this.updateHydrationUI();
  }

  updateHydrationUI() {
    const valueEl = document.getElementById('waterIntakeValue');
    const ring = document.getElementById('waterProgressRing');
    if (valueEl) valueEl.textContent = `${this.hydration.today.toFixed(2)}L`;
    if (ring) {
      const circumference = 282.7;
      const offset = circumference - (Math.min(this.hydration.today / this.hydration.target, 1) * circumference);
      ring.style.strokeDashoffset = offset;
    }
  }

  attachSettingsEventListeners() {
    // PFP Upload
    const pfpUpload = document.getElementById('pfpUpload');
    if (pfpUpload) {
      pfpUpload.onchange = (e) => {
        const file = e.target.files[0];
        if (file) {
          const reader = new FileReader();
          reader.onload = (event) => {
            const preview = document.getElementById('settingsAvatarPreview');
            const sidebarAvatar = document.getElementById('userAvatar');
            if (preview) preview.style.backgroundImage = `url(${event.target.result})`;
            if (sidebarAvatar) sidebarAvatar.style.backgroundImage = `url(${event.target.result})`;
            this.showToast('Profile picture updated!');
          };
          reader.readAsDataURL(file);
        }
      };
    }

    // Username Edit
    const saveSettingsBtn = document.getElementById('saveSettingsBtn');
    if (saveSettingsBtn) {
      saveSettingsBtn.onclick = () => {
        const newUsername = document.getElementById('editUsername').value;
        if (newUsername.trim()) {
          this.userProfile.name = newUsername;
          document.getElementById('userName').textContent = newUsername;
          document.getElementById('settingsUserName').textContent = newUsername;
          const welcomeMsg = document.getElementById('welcomeMessage');
          if (welcomeMsg) welcomeMsg.textContent = `Welcome back, ${newUsername.split(' ')[0]}!`;
          this.showToast('Settings saved successfully');
        }
      };
    }

    // Daily Reminder Toggle in Settings
    const settingsDailyReminderToggle = document.getElementById('settingsDailyReminderToggle');
    if (settingsDailyReminderToggle) {
      settingsDailyReminderToggle.onchange = (e) => {
        this.showToast(`Daily reminders ${e.target.checked ? 'enabled' : 'disabled'}`, 'info');
      };
    }

    // Delete Account
    const deleteBtn = document.getElementById('deleteAccountBtn');
    if (deleteBtn) {
      deleteBtn.onclick = () => {
        if (confirm('Are you absolutely sure you want to delete your account? This action cannot be undone.')) {
          this.showToast('Account deletion initiated...', 'error');
          setTimeout(() => {
            alert('Account deleted. Redirecting to landing page.');
            window.location.href = '/';
          }, 2000);
        }
      };
    }
  }

  showToast(message, type = 'success') {
    const existingToast = document.querySelector('.nutri-toast');
    if (existingToast) existingToast.remove();

    const toast = document.createElement('div');
    const bgColor = type === 'error' ? 'bg-red-500' : type === 'info' ? 'bg-blue-500' : 'bg-primary';
    toast.className = `nutri-toast fixed bottom-8 right-8 ${bgColor} text-white px-6 py-3 rounded-xl shadow-2xl z-[100] font-bold slide-in-bottom`;
    toast.textContent = message;

    // Add slide-in animation style if not exists
    if (!document.getElementById('toast-animation-style')) {
      const style = document.createElement('style');
      style.id = 'toast-animation-style';
      style.textContent = `
            .slide-in-bottom { animation: slideInBottom 0.3s ease-out forwards; }
            @keyframes slideInBottom { from { transform: translateY(100%); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
            .nutri-toast.hide { animation: slideOutBottom 0.3s ease-in forwards; }
            @keyframes slideOutBottom { from { transform: translateY(0); opacity: 1; } to { transform: translateY(100%); opacity: 0; } }
        `;
      document.head.appendChild(style);
    }

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