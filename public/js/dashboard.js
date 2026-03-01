// NutriLens Dashboard - Integrated Application

class DashboardApp {
  constructor() {
    this.apiUrl = '/api';
    this.data = null;
    this.currentPage = 'dashboard';
    this.nutritionData = {
      loggedItems: [],
      targets: { calories: 0, protein: 0, carbs: 0, fats: 0 }
    };
    this.foodDatabase = [];
    this.dailyTotals = { calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0 };
    this.dailyTargets = { calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0 };
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
      nutritionDelta: null
    };
    this.hydration = {
      today: 0,
      target: 2.5
    };
    this.foodSearch = {
      query: '',
      results: [],
      selectedFood: null,
      quantity: 100,
      mealType: 'Breakfast'
    };
    this.init();
  }

  async init() {
    try {
      await this.loadDashboardData();
      await this.loadUserProfile();
      await this.loadFoodDatabase();

      // Initial state sync
      this.fetchTodayLogs();
      this.initCharts();
      this.render();
      this.attachEventListeners();
      this.attachNutritionEventListeners();
      this.attachSettingsEventListeners();
      this.initializeProfilePage();
      this.initHydration();
      this.initNewCharts();

      window.dashboard = this;
    } catch (error) {
      console.error('Failed to initialize dashboard:', error);
    }
  }

  // Legacy stub to prevent crashes during migration
  recalculateDailyTotals() {
    console.warn('recalculateDailyTotals called (deprecated). Redirecting to fetchTodayLogs.');
    this.fetchTodayLogs();
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
      const token = localStorage.getItem('token');
      const response = await fetch(`${this.apiUrl}/profile`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
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
    this.renderNutrition();
    this.analyzeGoalAlignment();
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
    const { caloriesLeft, protein, carbs, fats } = this.data?.nutrition || {
      caloriesLeft: 0,
      protein: { current: 0, goal: 150 },
      carbs: { current: 0, goal: 250 },
      fats: { current: 0, goal: 65 }
    };

    // Update UI elements from Today's Logs if available
    const totals = this.dailyTotals || { calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0 };
    const targets = this.dailyTargets || { calories: 0, protein: 150, carbs: 250, fat: 65, fiber: 30 };

    // Dashboard main display
    const calValue = document.getElementById('caloriesLeftDisplay'); // If we have one
    if (calValue) calValue.textContent = `${Math.round(targets.calories - totals.calories)} kcal`;

    // Analytics section (Today's highlights)
    this.updateProgressRing('caloriesProgress', totals.calories, targets.calories, 282.7);
    this.updateProgressRing('proteinProgress', totals.protein, targets.protein, 125.6);
    this.updateProgressRing('carbsProgress', totals.carbs, targets.carbs, 125.6);
    this.updateProgressRing('fatProgress', totals.fat, targets.fat, 125.6);
  }

  updateProgressRing(elementId, current, goal, circumference) {
    const ring = document.getElementById(elementId);
    if (!ring) return;
    const progress = Math.min(current / goal, 1);
    const offset = circumference - (progress * circumference);
    ring.style.strokeDashoffset = offset;
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

      // Scroll isolation: reset on page switch
      const _pc = document.getElementById('pageContent');
      if (_pc) _pc.scrollTop = 0;

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
        // Fetch live data from server on every navigation to this page
        this.fetchTodayLogs();
      }
    }
  }

  renderNutritionPage() {
    // Always fetch from DB so totals reset automatically each new day
    this.fetchTodayLogs();
  }


  calculateProgress(consumed, target) {
    if (!target || target <= 0) return 0;
    return Math.min((consumed / target) * 100, 100);
  }

  // Deprecated: recalculateDailyTotals is replaced by fetchTodayLogs and updateMacroUI
  // recalculateDailyTotals() {
  //   // 1. Initialize with server-side totals as the baseline
  //   if (this.data && this.data.nutrition) {
  //     const nut = this.data.nutrition;
  //     // Calculate server-side consumed calories using server's own goals to avoid desync
  //     const serverTotalGoal = (nut.protein.goal * 4) + (nut.carbs.goal * 4) + (nut.fats.goal * 9);
  //     const serverConsumedCalories = Math.max(0, serverTotalGoal - nut.caloriesLeft);

  //     this.dailyTotals = {
  //       calories: serverConsumedCalories || 0,
  //       protein: nut.protein.current || 0,
  //       carbs: nut.carbs.current || 0,
  //       fat: nut.fats.current || 0,
  //       fiber: 0
  //     };

  //     // If totals are negative or weird due to desync, bound to 0
  //     Object.keys(this.dailyTotals).forEach(key => {
  //       if (this.dailyTotals[key] < 0) this.dailyTotals[key] = 0;
  //     });
  //   } else {
  //     this.dailyTotals = { calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0 };
  //   }

  //   // 2. Add session-logged items
  //   this.nutritionData.loggedItems.forEach(item => {
  //     const q = (item.quantity || 0) / 100;
  //     this.dailyTotals.calories += ((item.calories_per_100g || 0) * q);
  //     this.dailyTotals.protein += ((item.protein || 0) * q);
  //     this.dailyTotals.carbs += ((item.carbs || 0) * q);
  //     this.dailyTotals.fat += ((item.fat || 0) * q);
  //     this.dailyTotals.fiber += ((item.fiber || 0) * q);
  //   });

  //   // Round for state consistency
  //   Object.keys(this.dailyTotals).forEach(key => {
  //     this.dailyTotals[key] = Math.round(this.dailyTotals[key] * 100) / 100;
  //   });

  //   this.updateMacroUI();
  //   this.updateCharts();
  //   this.renderNutritionLog();
  //   this.analyzeGoalAlignment(); // Trigger analysis on every update
  // }

  updateMacroUI() {
    const totals = this.dailyTotals;
    const targets = this.dailyTargets;

    // ── Radial Ring SVG (Nutrition Analysis card) ──────────────────────────
    const rings = [
      { id: 'proteinCircle', key: 'protein', circumference: 282.7 },
      { id: 'carbsCircle', key: 'carbs', circumference: 219.9 },
      { id: 'fatsCircle', key: 'fat', circumference: 157.0 },
    ];

    rings.forEach(({ id, key, circumference }) => {
      const el = document.getElementById(id);
      if (!el) return;
      const consumed = totals[key] || 0;
      const target = targets[key] || 1;
      const pct = Math.min(consumed / target, 1);
      el.style.strokeDashoffset = circumference - pct * circumference;
    });

    // ── Centre label: calories left ─────────────────────────────────────────
    const calLeftEl = document.getElementById('caloriesLeft');
    if (calLeftEl) {
      const remaining = Math.max(0, (targets.calories || 0) - (totals.calories || 0));
      calLeftEl.textContent = remaining.toLocaleString();
    }

    // ── logTotalCalories (Today's Food Intake header) ───────────────────────
    const logTotalEl = document.getElementById('logTotalCalories');
    if (logTotalEl) logTotalEl.textContent = `${Math.round(totals.calories || 0)} kcal`;

    // ── macroStats pills grid ───────────────────────────────────────────────
    const macroStatsEl = document.getElementById('macroStats');
    if (macroStatsEl) {
      const macros = [
        { label: 'Protein', key: 'protein', unit: 'g', color: 'text-violet-500', bg: 'bg-violet-500/10' },
        { label: 'Carbs', key: 'carbs', unit: 'g', color: 'text-purple-400', bg: 'bg-purple-400/10' },
        { label: 'Fat', key: 'fat', unit: 'g', color: 'text-fuchsia-400', bg: 'bg-fuchsia-400/10' },
      ];
      macroStatsEl.innerHTML = macros.map(m => {
        const val = totals[m.key] || 0;
        const goal = targets[m.key] || 1;
        const pct = Math.min(Math.round((val / goal) * 100), 100);
        return `
          <div class="flex flex-col items-center ${m.bg} rounded-xl p-3 text-center">
            <span class="text-[9px] font-black uppercase tracking-widest ${m.color} mb-1">${m.label}</span>
            <span class="text-lg font-black ${m.color}">${val.toFixed(1)}<span class="text-[10px]">g</span></span>
            <span class="text-[9px] text-[#6b8072] mb-1.5">/ ${goal}g</span>
            <div class="w-full bg-white/30 dark:bg-white/10 rounded-full h-1.5 overflow-hidden">
              <div class="${m.color.replace('text-', 'bg-')} h-1.5 rounded-full transition-all duration-700" style="width:${pct}%"></div>
            </div>
            <span class="text-[9px] font-bold text-[#6b8072] mt-1">${pct}%</span>
          </div>`;
      }).join('');
    }

    // ── Nutrition Intake page progress bars (key-value + key-progress IDs) ──
    ['calories', 'protein', 'carbs', 'fat', 'fiber'].forEach(key => {
      const consumed = totals[key] || 0;
      const target = targets[key] || 0;
      const progress = this.calculateProgress(consumed, target);
      const isCalories = (key === 'calories');

      const valueEl = document.getElementById(`${key}-value`);
      if (valueEl) {
        const consumedStr = isCalories ? Math.round(consumed) : consumed.toFixed(1);
        const unit = isCalories ? ' kcal' : 'g';
        valueEl.innerText = `${consumedStr}${unit} / ${Math.round(target)}${unit}`;
      }
      const progressEl = document.getElementById(`${key}-progress`);
      if (progressEl) progressEl.style.width = `${progress}%`;
    });

    // ── Keep new stat panels in sync ────────────────────────────────────────
    this.renderNutrientStatPills();
    this.renderDashboardStatsRow();
    if (this.charts && this.charts.nutrientComparison) {
      this.renderNutrientComparisonChart();
    }
  }

  // Deprecated: renderNutritionLog is replaced by renderTodayFoodIntake
  // renderNutritionLog() {
  //   const container = document.getElementById('nutritionLogContainer');
  //   if (!container) return;

  //   if (this.nutritionData.loggedItems.length === 0) {
  //     container.innerHTML = `
  //       <div class="flex flex-col items-center justify-center h-full text-center space-y-4 opacity-40 py-20">
  //           <span class="material-symbols-outlined text-6xl">no_meals</span>
  //           <div>
  //               <p class="font-bold text-lg">No food logged today</p>
  //               <p class="text-sm">Start by adding your first meal of the day.</p>
  //           </div>
  //       </div>`;
  //     return;
  //   }

  //   const meals = ['Breakfast', 'Lunch', 'Dinner', 'Snacks'];
  //   container.innerHTML = '';

  //   meals.forEach(mealType => {
  //     const items = this.nutritionData.loggedItems.filter(item => item.mealType === mealType);
  //     if (items.length > 0) {
  //       const mealTotal = items.reduce((sum, item) => {
  //         const currentItemCalories = (item.calories_per_100g * item.quantity) / 100;
  //         return sum + currentItemCalories;
  //       }, 0);
  //       const roundedMealTotal = Math.round(mealTotal * 100) / 100;

  //       const section = document.createElement('div');
  //       section.className = 'meal-section';
  //       section.innerHTML = `
  //         <div class="flex items-center gap-2 mb-4">
  //             <span class="material-symbols-outlined text-primary text-lg">${this.getMealIcon(mealType)}</span>
  //             <h4 class="font-bold text-[#0d1b11] dark:text-white uppercase tracking-widest text-xs">${mealType}</h4>
  //             <div class="flex-1 border-b border-[#cfe7d5] dark:border-white/5 ml-2"></div>
  //             <span class="text-xs font-bold text-primary">${roundedMealTotal} kcal</span>
  //         </div>
  //         <div class="space-y-3">
  //             ${items.map(item => `
  //               <div class="group flex items-center justify-between p-4 rounded-xl border border-gray-50 dark:border-white/5 hover:bg-gray-50 dark:hover:bg-white/5 transition-all">
  //                   <div class="flex items-center gap-4">
  //                       <div class="size-12 rounded-full bg-primary/10 flex items-center justify-center text-primary border border-primary/20">
  //                           <span class="material-symbols-outlined">${item.icon || 'restaurant'}</span>
  //                       </div>
  //                       <div>
  //                           <p class="font-bold text-[#0d1b11] dark:text-white">${item.name}</p>
  //                           <p class="text-sm text-[#6b8072] font-medium">${item.quantity} units</p>
  //                       </div>
  //                   </div>
  //                   <div class="flex items-center gap-6">
  //                       <div class="text-right">
  //                            <p class="font-black text-[#0d1b11] dark:text-white">${(Math.round((item.calories_per_100g * item.quantity / 100) * 100) / 100)} kcal</p>
  //                           <div class="flex gap-2 text-[10px] uppercase font-bold text-[#6b8072] opacity-70">
  //                               <span>P: ${(Math.round((item.protein * item.quantity / 100) * 100) / 100)}g</span>
  //                               <span>C: ${(Math.round((item.carbs * item.quantity / 100) * 100) / 100)}g</span>
  //                               <span>F: ${(Math.round((item.fat * item.quantity / 100) * 100) / 100)}g</span>
  //                               <span>Fb: ${(Math.round(((item.fiber || 0) * item.quantity / 100) * 100) / 100)}g</span>
  //                           </div>
  //                       </div>
  //                       <button onclick="window.dashboard.deleteFoodItem(${item.id})" class="opacity-0 group-hover:opacity-100 p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg transition-all">
  //                           <span class="material-symbols-outlined text-sm">delete</span>
  //                       </button>
  //                   </div>
  //               </div>
  //             `).join('')}
  //         </div>
  //       `;
  //       container.appendChild(section);
  //     }
  //   });
  // }

  getMealIcon(mealType) {
    const icons = {
      'Breakfast': 'wb_sunny',
      'Lunch': 'lunch_dining',
      'Dinner': 'dark_mode',
      'Snacks': 'bakery_dining'
    };
    return icons[mealType] || 'restaurant';
  }

  // Deprecated: deleteFoodItem is replaced by deleteFoodItemFromServer
  // deleteFoodItem(itemId) {
  //   this.nutritionData.loggedItems = this.nutritionData.loggedItems.filter(item => item.id !== itemId);
  //   this.recalculateDailyTotals();
  //   this.showToast('Item removed from log');
  // }

  // ===== SERVER-SIDE NUTRITION LOGS =====

  getAuthToken() {
    return localStorage.getItem('token') || '';
  }

  async fetchTodayLogs() {
    const token = this.getAuthToken();
    const loadingEl = document.getElementById('todayLogLoading');
    if (loadingEl) loadingEl.classList.remove('hidden');

    if (!token) {
      // Not logged in — show zero state (do NOT use stale in-memory data)
      if (loadingEl) loadingEl.classList.add('hidden');
      this.dailyTotals = { calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0 };
      this.nutritionData.loggedItems = [];
      this.updateMacroUI();
      this.renderTodayFoodIntake({ items: [], totals: this.dailyTotals });
      this.renderRecommendedToTake(this.dailyTotals, this.dailyTargets);
      return;
    }

    try {
      const [logsRes, goalsRes] = await Promise.all([
        fetch('/api/nutrition-logs/today', { headers: { 'Authorization': `Bearer ${token}` } }),
        fetch('/api/nutrition/goals', { headers: { 'Authorization': `Bearer ${token}` } })
      ]);

      // Parse both bodies before touching UI
      const logsData = logsRes.ok ? await logsRes.json() : null;
      const goalsData = goalsRes.ok ? await goalsRes.json() : null;
      console.log('logsData:', logsData);

      // Step 1 – Apply goals so updateMacroUI gets correct target denominators
      if (goalsData && goalsData.success) {
        this.dailyTargets = {
          calories: Number(goalsData.goals.calories) || 0,
          protein: Number(goalsData.goals.protein) || 150,
          carbs: Number(goalsData.goals.carbs) || 250,
          fat: Number(goalsData.goals.fat) || 65,
          fiber: Number(goalsData.goals.fiber) || 30
        };
      }

      // Step 2 – Apply today's totals (aggregated by MongoDB, values are Numbers)
      if (logsData && logsData.success) {
        const t = logsData.totals;
        this.dailyTotals = {
          calories: Number(t.calories) || 0,
          protein: Number(t.protein) || 0,
          carbs: Number(t.carbs) || 0,
          fat: Number(t.fat) || 0,
          fiber: Number(t.fiber) || 0
        };
        this.nutritionData.loggedItems = logsData.items.map(item => ({
          id: item._id,
          name: item.foodName,
          mealType: item.mealType,
          quantity: item.quantity,
          calories_per_100g: item.quantity > 0 ? (item.calories / (item.quantity / 100)) : 0,
          protein: item.quantity > 0 ? (item.protein / (item.quantity / 100)) : 0,
          carbs: item.quantity > 0 ? (item.carbs / (item.quantity / 100)) : 0,
          fat: item.quantity > 0 ? (item.fat / (item.quantity / 100)) : 0,
          fiber: item.quantity > 0 ? (item.fiber / (item.quantity / 100)) : 0,
          icon: item.icon
        }));
      } else {
        // No logs for today OR endpoint failed — show zero / "No food logged today"
        this.dailyTotals = { calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0 };
        this.nutritionData.loggedItems = [];
      }

      // Step 3 – Single UI update with fully settled state
      this.updateMacroUI();
      this.renderTodayFoodIntake(logsData || { items: [], totals: this.dailyTotals });
      this.renderRecommendedToTake(this.dailyTotals, this.dailyTargets);
      this.updateCharts(); // Update charts with new data

    } catch (err) {
      console.error('Error fetching today logs:', err);
      // Show zero state on network/parse error — do not toast (auto-triggered)
      this.dailyTotals = { calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0 };
      this.nutritionData.loggedItems = [];
      this.updateMacroUI();
      this.renderTodayFoodIntake({ items: [], totals: this.dailyTotals });
    } finally {
      if (loadingEl) loadingEl.classList.add('hidden');
    }
  }

  renderTodayFoodIntake(data) {
    const container = document.getElementById('nutritionLogContainer');
    const totalsRow = document.getElementById('todayTotalsRow');
    const logTotalEl = document.getElementById('logTotalCalories');

    // Update compact totals row
    if (totalsRow) {
      const t = data.totals;
      if (data.items.length > 0) {
        totalsRow.classList.remove('hidden');
        document.getElementById('totals-cal').textContent = Math.round(t.calories);
        document.getElementById('totals-protein').textContent = t.protein.toFixed(1) + 'g';
        document.getElementById('totals-carbs').textContent = t.carbs.toFixed(1) + 'g';
        document.getElementById('totals-fat').textContent = t.fat.toFixed(1) + 'g';
        document.getElementById('totals-fiber').textContent = t.fiber.toFixed(1) + 'g';
      } else {
        totalsRow.classList.add('hidden');
      }
    }
    if (logTotalEl) logTotalEl.textContent = `${Math.round(data.totals.calories)} kcal`;

    if (!container) return;
    if (data.items.length === 0) {
      container.innerHTML = `
        <div class="flex flex-col items-center justify-center text-center space-y-4 opacity-40 py-12">
          <span class="material-symbols-outlined text-5xl">no_meals</span>
          <div>
            <p class="font-bold text-base">No food logged today</p>
            <p class="text-sm">Start by adding your first meal of the day.</p>
          </div>
        </div>`;
      return;
    }

    const meals = ['Breakfast', 'Lunch', 'Dinner', 'Snacks'];
    container.innerHTML = '';
    meals.forEach(mealType => {
      const items = data.items.filter(i => i.mealType === mealType);
      if (items.length === 0) return;

      const mealCal = items.reduce((s, i) => s + Number(i.calories), 0);
      const section = document.createElement('div');
      section.className = 'meal-section';
      section.innerHTML = `
        <div class="flex items-center gap-2 mb-3">
          <span class="material-symbols-outlined text-primary text-lg">${this.getMealIcon(mealType)}</span>
          <h4 class="font-bold text-[#0d1b11] dark:text-white uppercase tracking-widest text-xs">${mealType}</h4>
          <div class="flex-1 border-b border-[#cfe7d5] dark:border-white/5 ml-2"></div>
          <span class="text-xs font-bold text-primary">${Math.round(mealCal)} kcal</span>
        </div>
        <div class="space-y-2">
          ${items.map(item => `
            <div class="group flex items-center justify-between p-3 rounded-xl border border-gray-50 dark:border-white/5 hover:bg-gray-50 dark:hover:bg-white/5 transition-all">
              <div class="flex items-center gap-3">
                <div class="size-10 rounded-full bg-primary/10 flex items-center justify-center text-primary border border-primary/20">
                  <span class="material-symbols-outlined text-sm">${item.icon || 'restaurant'}</span>
                </div>
                <div>
                  <p class="font-bold text-[#0d1b11] dark:text-white text-sm">${item.foodName}</p>
                  <p class="text-xs text-[#6b8072] font-medium">${Number(item.quantity)}g</p>
                </div>
              </div>
              <div class="flex items-center gap-4">
                <div class="text-right">
                  <p class="font-black text-[#0d1b11] dark:text-white text-sm">${Math.round(Number(item.calories))} kcal</p>
                  <div class="flex gap-1.5 text-[9px] uppercase font-bold text-[#6b8072] opacity-70">
                    <span>P:${Number(item.protein).toFixed(1)}g</span>
                    <span>C:${Number(item.carbs).toFixed(1)}g</span>
                    <span>F:${Number(item.fat).toFixed(1)}g</span>
                    <span>Fb:${Number(item.fiber).toFixed(1)}g</span>
                  </div>
                </div>
                <button onclick="window.dashboard.deleteFoodItemFromServer('${item._id}')" class="opacity-0 group-hover:opacity-100 p-1.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg transition-all">
                  <span class="material-symbols-outlined text-sm">delete</span>
                </button>
              </div>
            </div>
          `).join('')}
        </div>`;
      container.appendChild(section);
    });
  }

  renderRecommendedToTake(totals, goals) {
    const nutrientsRow = document.getElementById('remainingNutrientsRow');
    const recommendsList = document.getElementById('smartRecommendationsList');
    const loadingEl = document.getElementById('recommendedLoading');
    if (loadingEl) loadingEl.classList.add('hidden');
    if (!nutrientsRow) return;

    const nutrients = [
      { key: 'calories', label: 'Cal', unit: '', color: 'text-primary', bg: 'bg-primary/10' },
      { key: 'protein', label: 'Protein', unit: 'g', color: 'text-blue-500', bg: 'bg-blue-500/10' },
      { key: 'carbs', label: 'Carbs', unit: 'g', color: 'text-yellow-500', bg: 'bg-yellow-500/10' },
      { key: 'fat', label: 'Fat', unit: 'g', color: 'text-orange-500', bg: 'bg-orange-500/10' },
      { key: 'fiber', label: 'Fiber', unit: 'g', color: 'text-emerald-500', bg: 'bg-emerald-500/10' }
    ];

    nutrientsRow.innerHTML = nutrients.map(n => {
      const consumed = Number(totals[n.key]) || 0;
      const goal = Number(goals[n.key]) || 0;
      const remaining = goal - consumed;
      const exceeded = remaining < 0;

      return `
        <div class="${n.bg} rounded-xl p-3 text-center border border-white/10">
          <p class="text-[9px] font-black uppercase ${n.color} tracking-widest mb-1">${n.label}</p>
          ${exceeded
          ? `<p class="text-[10px] font-black text-red-500">Exceeded</p>
               <p class="text-[9px] text-red-400">${Math.abs(remaining).toFixed(0)}${n.unit} over</p>`
          : `<p class="text-sm font-black ${n.color}">${Math.round(remaining)}${n.unit}</p>
               <p class="text-[9px] text-[#6b8072]">${Math.round(consumed)}/${Math.round(goal)}${n.unit}</p>`
        }
        </div>`;
    }).join('');

    // Smart recommendations
    if (recommendsList) {
      const recs = this.getSmartRecommendations(totals, goals);
      if (recs.length === 0) {
        recommendsList.innerHTML = `
          <div class="flex items-center gap-3 text-[#6b8072] opacity-50 text-sm py-4 justify-center">
            <span class="material-symbols-outlined">lightbulb</span>
            <span class="font-medium">Log some food to see personalized recommendations</span>
          </div>`;
      } else {
        recommendsList.innerHTML = recs.map(food => `
          <div class="flex items-center justify-between p-3 rounded-xl bg-background-light dark:bg-white/5 border border-transparent hover:border-primary/20 transition-all">
            <div class="flex items-center gap-3">
              <div class="size-9 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                <span class="material-symbols-outlined text-sm">${food.icon || 'restaurant'}</span>
              </div>
              <div>
                <p class="font-bold text-sm text-[#0d1b11] dark:text-white">${food.name}</p>
                <p class="text-[10px] text-[#6b8072] font-medium">${food.calories_per_100g} kcal/100g • P:${food.protein}g C:${food.carbs}g F:${food.fat}g</p>
              </div>
            </div>
            <span class="text-[10px] font-black px-2 py-1 rounded-full bg-primary/10 text-primary">${food._reason}</span>
          </div>`).join('');
      }
    }
  }

  getSmartRecommendations(totals, goals) {
    if (!this.foodDatabase || this.foodDatabase.length === 0) return [];
    const goal = this.userProfile.goal || 'maintain';

    // Calculate deficit ratios for each nutrient
    const deficits = {
      calories: (goals.calories - totals.calories) / (goals.calories || 1),
      protein: (goals.protein - totals.protein) / (goals.protein || 1),
      carbs: (goals.carbs - totals.carbs) / (goals.carbs || 1),
      fat: (goals.fat - totals.fat) / (goals.fat || 1),
      fiber: (goals.fiber - totals.fiber) / (goals.fiber || 1)
    };

    // Find the biggest remaining nutrient need
    const biggestDeficit = Object.entries(deficits)
      .filter(([, v]) => v > 0)
      .sort((a, b) => b[1] - a[1])[0];

    if (!biggestDeficit) return []; // all goals met or exceeded

    const [defKey] = biggestDeficit;
    const nutrientMap = {
      calories: 'calories_per_100g',
      protein: 'protein',
      carbs: 'carbs',
      fat: 'fat',
      fiber: 'fiber'
    };
    const sortField = nutrientMap[defKey];
    const reasonLabels = {
      calories: goal === 'gain' ? 'Energy Boost' : 'More Cals',
      protein: 'High Protein',
      carbs: 'More Carbs',
      fat: 'Healthy Fats',
      fiber: 'Fiber Rich'
    };

    let filtered = this.foodDatabase;
    // Goal-aware filtering
    if (goal === 'lose') {
      // Prefer lower-calorie options (< 200 kcal/100g)
      const lowCal = filtered.filter(f => Number(f.calories_per_100g) < 200);
      if (lowCal.length >= 4) filtered = lowCal;
    } else if (goal === 'gain') {
      // Prefer calorie-dense options (> 150 kcal/100g)
      const highCal = filtered.filter(f => Number(f.calories_per_100g) > 150);
      if (highCal.length >= 4) filtered = highCal;
    }

    return filtered
      .filter(f => Number(f[sortField]) > 0)
      .sort((a, b) => Number(b[sortField]) - Number(a[sortField]))
      .slice(0, 4)
      .map(f => ({ ...f, _reason: reasonLabels[defKey] }));
  }

  async logFoodToServer(foodData) {
    const token = this.getAuthToken();
    if (!token) {
      // Fallback: store in memory only
      // this.nutritionData.loggedItems.push(foodData); // Deprecated
      // this.recalculateDailyTotals(); // Deprecated
      this.showToast('Please log in to save food items', 'error');
      return;
    }
    try {
      const res = await fetch('/api/nutrition-logs', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          foodName: foodData.name,
          mealType: foodData.mealType,
          quantity: foodData.quantity,
          // Nutrient values are already scaled to foodData.quantity grams
          calories: Number(foodData.calories) || 0,
          protein: Number(foodData.protein) || 0,
          carbs: Number(foodData.carbs) || 0,
          fat: Number(foodData.fat) || 0,
          fiber: Number(foodData.fiber) || 0,
          icon: foodData.icon || 'restaurant'
        })
      });
      if (res.ok) {
        await this.fetchTodayLogs(); // Refresh from server
      } else {
        throw new Error('Log save failed');
      }
    } catch (err) {
      console.error('Error logging food to server:', err);
      this.showToast('Could not save log, please try again', 'error');
      // Fallback (removed deprecated local storage)
      // this.nutritionData.loggedItems.push(foodData);
      // this.recalculateDailyTotals();
    }
  }

  async deleteFoodItemFromServer(dbId) {
    const token = this.getAuthToken();
    if (!token || !dbId) {
      // this.deleteFoodItem(dbId); // Deprecated
      this.showToast('Please log in to delete food items', 'error');
      return;
    }
    try {
      const res = await fetch(`/api/nutrition-logs/${dbId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        await this.fetchTodayLogs();
        this.showToast('Item removed');
      } else {
        this.showToast('Could not delete item', 'error');
      }
    } catch (err) {
      console.error('Error deleting log:', err);
      this.showToast('Delete failed', 'error');
    }
  }

  async clearTodayLogs() {
    const token = this.getAuthToken();
    if (!token) {
      this.showToast('Please log in to clear food items', 'error');
      return;
    }

    // Optimistic UI clear
    const clearBtn = document.getElementById('clearTodayLogsBtn');
    if (clearBtn) {
      clearBtn.disabled = true;
      clearBtn.innerHTML = '<span class="material-symbols-outlined text-sm animate-spin">refresh</span> Clearing...';
    }

    try {
      const res = await fetch('/api/nutrition-logs/today/all', {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (res.ok) {
        await this.fetchTodayLogs();
        this.showToast('All logs for today have been cleared');
      } else {
        this.showToast('Could not clear logs', 'error');
      }
    } catch (err) {
      console.error('Error clearing logs:', err);
      this.showToast('Clear failed', 'error');
    } finally {
      if (clearBtn) {
        clearBtn.disabled = false;
        clearBtn.innerHTML = '<span class="material-symbols-outlined text-sm">delete_sweep</span> Clear All';
      }
    }
  }

  async openHistoryModal() {
    const modal = document.getElementById('historyModal');
    const body = document.getElementById('historyModalBody');
    if (!modal || !body) return;

    modal.style.display = 'flex';

    const token = this.getAuthToken();
    if (!token) {
      body.innerHTML = `<div class="text-center text-[#6b8072] py-12">
        <span class="material-symbols-outlined text-4xl block mb-3">lock</span>
        <p class="font-semibold">Please log in to view your history</p></div>`;
      return;
    }

    body.innerHTML = `<div class="flex justify-center items-center gap-3 text-[#6b8072] py-12">
      <span class="material-symbols-outlined animate-spin text-primary">refresh</span>
      <span class="text-sm font-semibold">Loading history...</span></div>`;

    try {
      const res = await fetch('/api/nutrition-logs/history', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!res.ok) throw new Error('History fetch failed');
      const data = await res.json();

      if (!data.history || data.history.length === 0) {
        body.innerHTML = `<div class="text-center text-[#6b8072] py-12 opacity-50">
          <span class="material-symbols-outlined text-4xl block mb-3">history</span>
          <p class="font-semibold">No past logs found</p>
          <p class="text-sm mt-1">Start logging meals – history appears after midnight</p></div>`;
        return;
      }

      body.innerHTML = data.history.map(entry => {
        const d = new Date(entry.date);
        const dateStr = d.toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'short', day: 'numeric' });
        const t = entry.totals;
        return `
          <div class="bg-background-light dark:bg-white/5 rounded-xl border border-[#dee3df] dark:border-white/5 overflow-hidden">
            <details class="group">
              <summary class="flex items-center justify-between px-5 py-4 cursor-pointer list-none hover:bg-primary/5 transition-all">
                <div>
                  <p class="font-black text-sm">${dateStr}</p>
                  <div class="flex gap-3 mt-1 text-[10px] font-bold text-[#6b8072] uppercase">
                    <span>${Math.round(t.calories)} kcal</span>
                    <span>P:${t.protein}g</span>
                    <span>C:${t.carbs}g</span>
                    <span>F:${t.fat}g</span>
                    <span>Fb:${t.fiber}g</span>
                  </div>
                </div>
                <span class="material-symbols-outlined text-[#6b8072] group-open:rotate-180 transition-transform">expand_more</span>
              </summary>
              <div class="px-5 pb-4 space-y-2 border-t border-[#dee3df] dark:border-white/5 pt-3">
                ${entry.items.map(item => `
                  <div class="flex items-center justify-between text-sm">
                    <div class="flex items-center gap-2">
                      <span class="material-symbols-outlined text-primary text-base">${item.icon || 'restaurant'}</span>
                      <span class="font-semibold">${item.foodName}</span>
                      <span class="text-[#6b8072] text-xs">(${item.mealType}, ${item.quantity}g)</span>
                    </div>
                    <span class="font-bold text-primary text-xs">${Math.round(Number(item.calories))} kcal</span>
                  </div>`).join('')}
              </div>
            </details>
          </div>`;
      }).join('');
    } catch (err) {
      console.error('History load error:', err);
      body.innerHTML = `<div class="text-center text-red-500 py-12">
        <span class="material-symbols-outlined text-4xl block mb-3">error</span>
        <p class="font-semibold">Could not load history</p></div>`;
    }
  }

  updateFoodPreview() {
    const container = document.getElementById('foodPreviewContainer');
    if (!container) return;

    const quantityInput = document.getElementById('foodQuantity');
    const quantity = parseFloat(quantityInput ? quantityInput.value : 0);

    if (!this.selectedFood || isNaN(quantity) || quantity <= 0) {
      container.classList.add('hidden');
      return;
    }

    const q = quantity / 100; // Convert quantity to factor for 100g values
    const calories = Math.round(this.selectedFood.calories_per_100g * q);
    const protein = (this.selectedFood.protein * q).toFixed(1);
    const carbs = (this.selectedFood.carbs * q).toFixed(1);
    const fat = (this.selectedFood.fat * q).toFixed(1);
    const fiber = ((this.selectedFood.fiber || 0) * q).toFixed(1);

    document.getElementById('preview-cal').textContent = `${calories} kcal`;
    document.getElementById('preview-protein').textContent = `${protein}g`;
    document.getElementById('preview-carbs').textContent = `${carbs}g`;
    document.getElementById('preview-fat').textContent = `${fat}g`;
    document.getElementById('preview-fiber').textContent = `${fiber}g`;

    container.classList.remove('hidden');
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
          this.foodSearch.selectedFood = null;
          this.updateFoodPreview();
        });
      }

      const performSearch = (query) => {
        const selectedCategory = foodCategoryFilter ? foodCategoryFilter.value : 'all';
        const lowercaseQuery = query.toLowerCase();

        const results = this.foodDatabase
          .filter(f => {
            const matchesQuery = lowercaseQuery === '' || f.name.toLowerCase().includes(lowercaseQuery);
            const matchesCategory = selectedCategory === 'all' || f.category === selectedCategory;
            return matchesQuery && matchesCategory;
          })
          .sort((a, b) => a.name.localeCompare(b.name))
          .slice(0, 30); // Show top 30 alphabetically

        this.foodSearch.results = results;

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
              this.foodSearch.selectedFood = this.foodDatabase.find(f => f.name === name);
              foodInput.value = name;
              foodDropdown.classList.add('hidden');
              this.updateFoodPreview();
            });
          });
        } else {
          foodDropdown.classList.add('hidden');
        }
      };

      foodInput.addEventListener('focus', () => performSearch(foodInput.value));
      foodInput.addEventListener('click', () => performSearch(foodInput.value));
      foodInput.addEventListener('input', (e) => {
        const query = e.target.value;
        this.foodSearch.query = query;
        performSearch(query);

        // Immediate preview on exact manual type
        const lowercaseQuery = query.toLowerCase();
        const exactMatch = this.foodDatabase.find(f => f.name.toLowerCase() === lowercaseQuery);
        if (exactMatch) {
          this.foodSearch.selectedFood = exactMatch;
          this.updateFoodPreview();
        } else if (!document.querySelector('.food-result-item:hover') && foodDropdown.classList.contains('hidden')) {
          this.foodSearch.selectedFood = null;
          this.updateFoodPreview();
        }
      });

      document.addEventListener('click', (e) => {
        if (!foodInput.contains(e.target) && !foodDropdown.contains(e.target)) {
          foodDropdown.classList.add('hidden');
        }
      });

      const qtyInput = document.getElementById('foodQuantity');
      if (qtyInput) {
        qtyInput.addEventListener('input', (e) => {
          this.foodSearch.quantity = parseFloat(e.target.value);
          this.updateFoodPreview();
        });
      }

      const mealTypeSelect = document.getElementById('mealTypeSelect');
      if (mealTypeSelect) {
        mealTypeSelect.addEventListener('change', (e) => {
          this.foodSearch.mealType = e.target.value;
        });
      }
    }

    if (addFoodBtn) {
      addFoodBtn.addEventListener('click', async () => {
        if (!this.foodSearch.selectedFood && foodInput.value) {
          this.foodSearch.selectedFood = this.foodDatabase.find(f => f.name.toLowerCase() === foodInput.value.toLowerCase());
        }

        if (!this.foodSearch.selectedFood) {
          this.showToast('Please select a food item from the list', 'error');
          return;
        }

        const quantity = parseFloat(document.getElementById('foodQuantity').value);
        if (isNaN(quantity) || quantity <= 0) {
          this.showToast('Please enter a valid quantity in grams', 'error');
          return;
        }

        const mealType = document.getElementById('mealTypeSelect').value;

        // Nutrients stored scaled by the entered quantity directly
        const q = quantity / 100; // Factor for 100g values
        const newItem = {
          ...this.foodSearch.selectedFood,
          id: Date.now(), // Client-side ID, server will assign _id
          quantity,
          mealType,
          // calories: per-100g × actual grams
          calories: this.foodSearch.selectedFood.calories_per_100g * q,
          // Macros: scale from per-100g to actual quantity (store as grams consumed)
          protein: this.foodSearch.selectedFood.protein * q,
          carbs: this.foodSearch.selectedFood.carbs * q,
          fat: this.foodSearch.selectedFood.fat * q,
          fiber: (this.foodSearch.selectedFood.fiber || 0) * q
        };

        // Show optimistic loading
        addFoodBtn.disabled = true;
        addFoodBtn.textContent = 'Saving...';

        await this.logFoodToServer(newItem);

        addFoodBtn.disabled = false;
        addFoodBtn.innerHTML = '<span class="material-symbols-outlined">add</span> Log Meal';
        this.showToast(`Logged ${newItem.name}`);

        // Reset form
        foodInput.value = '';
        this.foodSearch.selectedFood = null;
        document.getElementById('foodQuantity').value = 1;
        this.updateFoodPreview();
      });
    }

    // View History button
    const viewHistoryBtn = document.getElementById('viewHistoryBtn');
    if (viewHistoryBtn) {
      viewHistoryBtn.addEventListener('click', () => this.openHistoryModal());
    }

    // History modal close
    const closeHistoryBtn = document.getElementById('closeHistoryModal');
    if (closeHistoryBtn) {
      closeHistoryBtn.addEventListener('click', () => {
        const modal = document.getElementById('historyModal');
        if (modal) modal.style.display = 'none';
      });
    }

    // Close modal on backdrop click
    const historyModal = document.getElementById('historyModal');
    if (historyModal) {
      historyModal.addEventListener('click', (e) => {
        if (e.target === historyModal) historyModal.style.display = 'none';
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

    const clearLogsBtn = document.getElementById('clearTodayLogsBtn');
    if (clearLogsBtn) {
      clearLogsBtn.addEventListener('click', () => {
        if (confirm('Are you sure you want to clear all food logged today?')) {
          this.clearTodayLogs();
        }
      });
    }

    const generateBtn = document.getElementById('generateDashboardBtn');
    if (generateBtn) {
      generateBtn.addEventListener('click', () => {
        generateBtn.disabled = true;
        generateBtn.innerHTML = '<span class="material-symbols-outlined text-base">refresh</span> Generating...';
        this.fetchTodayLogs().then(() => {
          this.renderNutrientComparisonChart();
          this.renderNutrientStatPills();
          this.renderDashboardStatsRow();
          this.updateCharts();
          generateBtn.disabled = false;
          generateBtn.innerHTML = '<span class="material-symbols-outlined text-base">auto_awesome</span> Generate Dashboard';
          this.showToast('Dashboard refreshed!', 'success');
        });
      });
    }

    const resetBtn = document.getElementById('resetDashboardBtn');
    if (resetBtn) {
      resetBtn.addEventListener('click', () => {
        this.dailyTotals = { calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0 };
        this.nutritionData.loggedItems = [];
        this.updateMacroUI();
        this.renderNutrientComparisonChart();
        this.renderNutrientStatPills();
        this.renderDashboardStatsRow();
        this.updateCharts();
        this.showToast('Dashboard has been reset.', 'info');
      });
    }

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
        el.textContent = `${Math.round(targets[key])}`;
      }
    });

    // 1b. Update Additional Outputs
    const bmrEl = document.getElementById('plan-bmr');
    if (bmrEl) bmrEl.textContent = this.recommendedPlan.bmr;

    const tdeeEl = document.getElementById('plan-tdee');
    if (tdeeEl) tdeeEl.textContent = this.recommendedPlan.tdee;

    const fiberEl = document.getElementById('plan-fiber');
    if (fiberEl) fiberEl.textContent = targets.fiber;

    const waterEl = document.getElementById('plan-water');
    if (waterEl) waterEl.textContent = targets.water;

    const messageEl = document.getElementById('planToneMessage');
    if (messageEl) messageEl.textContent = this.recommendedPlan.message;

    // Remove hidden class from parent section if it exists
    const recSection = document.getElementById('recommendedPlanSection');
    if (recSection) recSection.classList.remove('hidden');

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
      const token = localStorage.getItem('token');
      const response = await fetch(`${this.apiUrl}/profile`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(this.userProfile)
      });
      if (!response.ok) throw new Error('Failed to save profile');
      this.showToast('Profile saved successfully!');
    } catch (error) {
      console.error('Error saving profile:', error);
      this.showToast('Failed to save profile', 'error');
      throw error;
    }
  }


  // --- New Analytics & Settings Methods ---

  initCharts() {
    const isDark = document.documentElement.classList.contains('dark');
    const textColor = isDark ? '#EAEAEA' : '#0d1b11';
    const gridColor = isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)';

    // 1. Weight Loss Analysis (Actual vs Target)
    const deltaCtx = document.getElementById('nutritionDeltaChart')?.getContext('2d');
    if (deltaCtx) {
      if (this.charts.nutritionDelta) this.charts.nutritionDelta.destroy();

      this.charts.nutritionDelta = new Chart(deltaCtx, {
        type: 'line',
        data: {
          labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
          datasets: [
            {
              label: 'Actual Intake',
              data: [1850, 2100, 1750, 1900, 2050, 2200, 1950], // History data placeholder
              borderColor: '#8b5cf6',
              backgroundColor: 'rgba(139, 92, 246, 0.1)',
              fill: true,
              tension: 0.4,
              borderWidth: 3,
              pointRadius: 6,
              pointHoverRadius: 8,
              pointBackgroundColor: '#8b5cf6',
              pointBorderColor: '#fff',
              pointBorderWidth: 2
            },
            {
              label: 'Goal Target',
              data: [2000, 2000, 2000, 2000, 2000, 2000, 2000], // Goal constant
              borderColor: '#6b8072',
              borderDash: [5, 5],
              fill: false,
              tension: 0,
              pointRadius: 0
            }
          ]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          interaction: { intersect: false, mode: 'index' },
          plugins: {
            legend: { display: false },
            tooltip: {
              backgroundColor: isDark ? '#1A1A1A' : '#fff',
              titleColor: textColor,
              bodyColor: textColor,
              borderColor: '#6b8072',
              borderWidth: 1,
              padding: 12
            }
          },
          scales: {
            x: { grid: { display: false }, ticks: { color: textColor, font: { size: 11, weight: 'bold' } } },
            y: { grid: { color: gridColor, borderDash: [2, 2] }, ticks: { color: textColor, font: { size: 10 } } }
          }
        }
      });
    }
  }

  updateCharts() {
    if (this.charts.nutritionDelta) {
      const actualData = [1850, 2100, 1750, 1900, 2050, 2200, Math.round(this.dailyTotals.calories)];
      const targetData = Array(7).fill(this.dailyTargets.calories);

      this.charts.nutritionDelta.data.datasets[0].data = actualData;
      this.charts.nutritionDelta.data.datasets[1].data = targetData;

      // Update Weekly Delta Value
      const weeklyDeltaValue = document.getElementById('weeklyDeltaValue');
      if (weeklyDeltaValue) {
        const totalActual = actualData.reduce((a, b) => a + b, 0);
        const totalTarget = targetData.reduce((a, b) => a + b, 0);
        const delta = totalActual - totalTarget;
        weeklyDeltaValue.textContent = `${delta > 0 ? '+' : ''}${Math.round(delta).toLocaleString()} kcal`;
        weeklyDeltaValue.className = `text-lg font-black ${delta <= 0 ? 'text-primary' : 'text-orange-500'}`;
      }

      this.charts.nutritionDelta.update();
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
    const today = this.hydration ? this.hydration.today || 0 : 0;
    const target = this.hydration ? this.hydration.target || 2.5 : 2.5;

    if (valueEl) valueEl.textContent = `${today.toFixed(2)}L`;
    if (ring) {
      const circumference = 282.7;
      const offset = circumference - (Math.min(today / target, 1) * circumference);
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

  // ===== NUTRIENT COMPARISON CHART =====
  renderNutrientComparisonChart() {
    const ctx = document.getElementById('nutrientComparisonChart');
    if (!ctx) return;

    const totals = this.dailyTotals;
    const targets = this.dailyTargets;

    const labels = ['Calories (÷10)', 'Protein (g)', 'Carbs (g)', 'Fat (g)', 'Fiber (g)'];
    const consumed = [
      Math.round(totals.calories / 10),
      Math.round(totals.protein),
      Math.round(totals.carbs),
      Math.round(totals.fat),
      Math.round(totals.fiber)
    ];
    const target = [
      Math.round(targets.calories / 10),
      Math.round(targets.protein),
      Math.round(targets.carbs),
      Math.round(targets.fat),
      Math.round(targets.fiber)
    ];

    if (this.charts.nutrientComparison) {
      this.charts.nutrientComparison.data.datasets[0].data = consumed;
      this.charts.nutrientComparison.data.datasets[1].data = target;
      this.charts.nutrientComparison.update();
      return;
    }

    const isDark = document.documentElement.classList.contains('dark');
    const gridColor = isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)';
    const textColor = isDark ? '#9ca3af' : '#6b8072';

    this.charts.nutrientComparison = new Chart(ctx, {
      type: 'bar',
      data: {
        labels,
        datasets: [
          {
            label: 'Consumed',
            data: consumed,
            backgroundColor: 'rgba(16, 185, 129, 0.8)',
            borderRadius: 8,
            borderSkipped: false,
          },
          {
            label: 'Target',
            data: target,
            backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.07)',
            borderRadius: 8,
            borderSkipped: false,
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: {
            callbacks: {
              label: (ctx) => {
                const val = ctx.raw;
                const labelName = ctx.dataset.label;
                const isCalories = ctx.dataIndex === 0;
                return `${labelName}: ${isCalories ? val * 10 + ' kcal' : val + 'g'}`;
              }
            }
          }
        },
        scales: {
          x: {
            grid: { color: gridColor },
            ticks: { color: textColor, font: { weight: 'bold', size: 11 } }
          },
          y: {
            grid: { color: gridColor },
            ticks: { color: textColor },
            beginAtZero: true
          }
        }
      }
    });
  }

  renderNutrientStatPills() {
    const container = document.getElementById('nutrientStatPills');
    if (!container) return;

    const totals = this.dailyTotals;
    const targets = this.dailyTargets;
    const nutrients = [
      { key: 'calories', label: 'Calories', unit: 'kcal', color: 'text-purple-500', bg: 'bg-purple-500/10' },
      { key: 'protein', label: 'Protein', unit: 'g', color: 'text-blue-500', bg: 'bg-blue-500/10' },
      { key: 'carbs', label: 'Carbs', unit: 'g', color: 'text-yellow-500', bg: 'bg-yellow-500/10' },
      { key: 'fat', label: 'Fat', unit: 'g', color: 'text-orange-500', bg: 'bg-orange-500/10' },
      { key: 'fiber', label: 'Fiber', unit: 'g', color: 'text-emerald-500', bg: 'bg-emerald-500/10' }
    ];

    container.innerHTML = nutrients.map(n => {
      const consumed = Math.round(totals[n.key] || 0);
      const goal = Math.round(targets[n.key] || 1);
      const pct = Math.min(Math.round((consumed / goal) * 100), 100);
      const over = consumed > goal;
      return `
        <div class="${n.bg} rounded-2xl p-4 text-center border border-white/10 dark:border-white/5">
          <p class="text-[9px] font-black uppercase ${n.color} tracking-widest mb-1">${n.label}</p>
          <p class="text-xl font-black ${over ? 'text-red-500' : n.color}">${consumed}</p>
          <p class="text-[9px] text-[#6b8072] mb-2">/ ${goal} ${n.unit}</p>
          <div class="w-full bg-white/20 dark:bg-white/10 rounded-full h-1.5 overflow-hidden">
            <div class="${over ? 'bg-red-500' : 'bg-current ' + n.color} h-1.5 rounded-full transition-all duration-700" style="width:${pct}%"></div>
          </div>
          <p class="text-[9px] font-bold mt-1 ${over ? 'text-red-400' : 'text-[#6b8072]'}">${over ? 'Over by ' + (consumed - goal) + n.unit : pct + '%'}</p>
        </div>`;
    }).join('');
  }

  renderDashboardStatsRow() {
    const container = document.getElementById('dashboardStatsRow');
    if (!container) return;

    const totals = this.dailyTotals;
    const targets = this.dailyTargets;
    const remaining = Math.max(0, (targets.calories || 0) - (totals.calories || 0));
    const pctCal = Math.min(Math.round(((totals.calories || 0) / (targets.calories || 1)) * 100), 100);

    const items = [
      {
        icon: 'local_fire_department',
        label: 'Calories Consumed',
        value: Math.round(totals.calories || 0) + ' kcal',
        sub: `${pctCal}% of daily goal`,
        color: 'text-orange-500',
        bg: 'bg-orange-500/10'
      },
      {
        icon: 'fitness_center',
        label: 'Protein Intake',
        value: (totals.protein || 0).toFixed(1) + 'g',
        sub: `Target: ${targets.protein || 150}g`,
        color: 'text-blue-500',
        bg: 'bg-blue-500/10'
      },
      {
        icon: 'bolt',
        label: 'Calories Remaining',
        value: Math.round(remaining) + ' kcal',
        sub: remaining <= 0 ? 'Daily limit reached' : 'Left for today',
        color: remaining <= 0 ? 'text-red-500' : 'text-emerald-500',
        bg: remaining <= 0 ? 'bg-red-500/10' : 'bg-emerald-500/10'
      },
      {
        icon: 'water_drop',
        label: 'Hydration',
        value: (this.hydration?.today || 0).toFixed(2) + 'L',
        sub: `Goal: ${this.hydration?.target || 2.5}L`,
        color: 'text-cyan-500',
        bg: 'bg-cyan-500/10'
      }
    ];

    container.innerHTML = items.map(item => `
      <div class="bg-white dark:bg-[#1A1A1A] rounded-2xl border border-[#dee3df] dark:border-white/5 p-5 flex items-center gap-4 shadow-sm">
        <div class="${item.bg} p-3 rounded-xl">
          <span class="material-symbols-outlined ${item.color}">${item.icon}</span>
        </div>
        <div>
          <p class="text-[10px] font-black uppercase tracking-widest text-[#6b8072]">${item.label}</p>
          <p class="text-xl font-black ${item.color}">${item.value}</p>
          <p class="text-[10px] text-[#6b8072] font-medium">${item.sub}</p>
        </div>
      </div>`).join('');
  }

  initNewCharts() {
    this.renderNutrientComparisonChart();
    this.renderNutrientStatPills();
    this.renderDashboardStatsRow();
  }

}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    new DashboardApp();
  });
} else {
  new DashboardApp();
}