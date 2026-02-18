// ========================================
// Goal Saver - Functionality
// ========================================

let userGoals = [];
// Mock Premium Status (Change to true to test unlocked state)
let isPremium = false;

// Calculate savings breakdown
function calculateSavings() {
    const targetAmount = parseFloat(document.getElementById('targetAmount').value);
    const deadline = document.getElementById('deadline').value;

    if (!targetAmount || !deadline) {
        document.getElementById('calculationDisplay').classList.remove('active');
        return;
    }

    const today = new Date();
    const deadlineDate = new Date(deadline);
    const daysRemaining = Math.ceil((deadlineDate - today) / (1000 * 60 * 60 * 24));

    if (daysRemaining <= 0) {
        showToast('Deadline must be in the future!', 'error');
        return;
    }

    const dailySavings = targetAmount / daysRemaining;
    const monthlySavings = (targetAmount / daysRemaining) * 30;

    document.getElementById('dailySavings').textContent =
        `Save Rp ${formatNumber(dailySavings)} per day`;
    document.getElementById('monthlySavings').textContent =
        `Or Rp ${formatNumber(monthlySavings)} per month`;

    document.getElementById('calculationDisplay').classList.add('active');
}

// Format number with thousand separators
function formatNumber(num) {
    return Math.round(num).toLocaleString('id-ID');
}

// Handle goal creation
document.getElementById('createGoalForm').addEventListener('submit', async function (e) {
    e.preventDefault();

    const goalName = document.getElementById('goalName').value;
    const targetAmount = parseFloat(document.getElementById('targetAmount').value);
    const deadline = document.getElementById('deadline').value;

    const today = new Date();
    const deadlineDate = new Date(deadline);
    const daysRemaining = Math.ceil((deadlineDate - today) / (1000 * 60 * 60 * 24));

    if (daysRemaining <= 0) {
        showToast('Deadline must be in the future!', 'error');
        return;
    }

    const dailySavings = targetAmount / daysRemaining;
    const monthlySavings = (targetAmount / daysRemaining) * 30;

    const user = getUserSession();
    const goalData = {
        user_id: user?.id,
        goal_name: goalName,
        target_amount: targetAmount,
        deadline: deadline,
        current_amount: 0,
        daily_target: dailySavings,
        monthly_target: monthlySavings
    };

    try {
        // Try backend first
        const response = await apiRequest('/api/goals', 'POST', goalData);
        userGoals.push(response.goal);
        showToast('Goal created successfully!', 'success');
    } catch (error) {
        console.warn('Backend unavailable, saving locally:', error);

        // Fallback to local storage
        goalData.id = Date.now(); // Generate temp ID
        goalData.created_at = new Date().toISOString();

        // Get existing local goals
        const localGoals = JSON.parse(localStorage.getItem('ngaturin_local_goals') || '[]');
        localGoals.push(goalData);
        localStorage.setItem('ngaturin_local_goals', JSON.stringify(localGoals));

        userGoals.push(goalData);
        showToast('Goal created locally (Offline Mode)!', 'success');
    }

    // Reset form and refresh
    document.getElementById('createGoalForm').reset();
    document.getElementById('calculationDisplay').classList.remove('active');
    renderGoals();
    updatePremiumStats(); // Update stats
    feedPet(); // Feed the pet!
});

// Load goals
async function loadGoals() {
    const user = getUserSession();
    if (!user) return;

    let goals = [];

    // 1. Try to load from backend
    try {
        const response = await apiRequest(`/api/goals?user_id=${user.id}`, 'GET');
        goals = response.goals || [];
    } catch (error) {
        console.warn('Backend unavailable, checking local storage');
    }

    // 2. Load from local storage (merge or use if backend failed)
    const localGoals = JSON.parse(localStorage.getItem('ngaturin_local_goals') || '[]');

    // Combine goals (in a real app we'd sync, here we just show both)
    userGoals = [...goals, ...localGoals];

    renderGoals();
    checkPremiumFeatures(); // Check content locking
}

// Render goals list
function renderGoals() {
    const goalsList = document.getElementById('goalsList');

    if (userGoals.length === 0) {
        goalsList.innerHTML = `
            <p style="color: var(--color-text-light); text-align: center; padding: var(--spacing-xl);">
                No goals yet. Create your first goal above!
            </p>
        `;
        const chartCard = document.getElementById('analyticsCard');
        if (chartCard) chartCard.style.display = 'none';
        return;
    }

    goalsList.innerHTML = userGoals.map(goal => {
        const progress = (goal.current_amount / goal.target_amount) * 100;
        const daysLeft = calculateDaysLeft(goal.deadline);

        return `
            <div class="goal-item">
                <div class="goal-info">
                    <h4 style="color: var(--color-dark);">${goal.goal_name}</h4>
                    <div class="goal-meta">
                        <span>🎯 Rp ${formatNumber(goal.target_amount)}</span>
                        <span>📅 ${daysLeft} days left</span>
                    </div>
                    <div class="progress-bar">
                        <div class="progress-fill" style="width: ${progress}%;">
                            ${Math.round(progress)}%
                        </div>
                    </div>
                    <p style="font-size: var(--font-size-sm); color: var(--color-text-light); margin-top: var(--spacing-xs);">
                        Rp ${formatNumber(goal.current_amount)} / Rp ${formatNumber(goal.target_amount)}
                    </p>
                </div>
                <div style="display: flex; flex-direction: column; gap: var(--spacing-sm);">
                    <button class="btn btn-primary" onclick="updateGoalProgress(${goal.id})">
                        Add Progress
                    </button>
                    <button class="btn btn-secondary" onclick="deleteGoal(${goal.id})" style="font-size: var(--font-size-sm);">
                        Delete
                    </button>
                </div>
            </div>
        `;
    }).join('');

    renderComparisonChart();
    updatePremiumStats(); // Recalculate stats when goals render
}

// Render Comparison Histogram
function renderComparisonChart() {
    const container = document.getElementById('comparisonChartRows');
    const analyticsCard = document.getElementById('analyticsCard');
    if (!container || !analyticsCard) return;

    // Show analytics card only if multiple goals exist
    if (userGoals.length < 2) {
        container.innerHTML = `<p style="font-size: var(--font-size-xs); color: var(--color-text-light); text-align: center; margin-top: var(--spacing-md);">Create more goals to compare progress!</p>`;
        return;
    }

    analyticsCard.style.display = 'block';

    // Find max target to scale the chart
    const maxTarget = Math.max(...userGoals.map(g => g.target_amount));

    container.innerHTML = userGoals.map(goal => {
        const targetWidth = (goal.target_amount / maxTarget) * 100;
        const progressInTarget = (goal.current_amount / goal.target_amount) * 100;

        // Final pixel math for the progress bar relative to the max width
        const progressWidth = (goal.current_amount / maxTarget) * 100;

        return `
            <div class="histogram-row">
                <div class="histogram-label">
                    <span>${goal.goal_name}</span>
                    <span>Rp ${formatNumber(goal.current_amount)} / ${formatNumber(goal.target_amount)}</span>
                </div>
                <div class="histogram-bar-outer">
                    <!-- Target Capacity (Yellow) -->
                    <div class="histogram-target-bar" style="width: ${targetWidth}%"></div>
                    <!-- Current Progress (Green) -->
                    <div class="histogram-progress-bar" style="width: ${progressWidth}%"></div>
                    
                    <!-- Markers for clarity -->
                    <div class="histogram-marker" style="left: 25%"></div>
                    <div class="histogram-marker" style="left: 50%"></div>
                    <div class="histogram-marker" style="left: 75%"></div>
                </div>
            </div>
        `;
    }).join('');
}

// Calculate days left
function calculateDaysLeft(deadline) {
    const today = new Date();
    const deadlineDate = new Date(deadline);
    const daysLeft = Math.ceil((deadlineDate - today) / (1000 * 60 * 60 * 24));
    return Math.max(0, daysLeft);
}

// Update goal progress
async function updateGoalProgress(goalId) {
    const amount = prompt('Enter amount to add to your savings (Rp):');

    if (!amount || isNaN(amount) || parseFloat(amount) <= 0) {
        showToast('Please enter a valid amount', 'error');
        return;
    }

    const addAmount = parseFloat(amount);

    try {
        const response = await apiRequest(`/api/goals/${goalId}`, 'PUT', {
            add_amount: addAmount
        });

        // Update local data from response
        const goalIndex = userGoals.findIndex(g => g.id === goalId);
        if (goalIndex !== -1) {
            userGoals[goalIndex] = response.goal;
        }
        showToast('Progress updated!', 'success');
        feedPet(); // Feed the pet!

    } catch (error) {
        console.warn('Backend unavailable, updating locally');

        // Update locally
        const goalIndex = userGoals.findIndex(g => g.id === goalId);
        if (goalIndex !== -1) {
            const goal = userGoals[goalIndex];
            goal.current_amount += addAmount;
            if (goal.current_amount > goal.target_amount) {
                goal.current_amount = goal.target_amount;
            }

            // Save to local storage if it's a local goal OR just update local cache
            updateLocalGoalInStorage(goal);

            showToast('Progress updated locally!', 'success');
            feedPet(); // Feed the pet!
        }
    }
    renderGoals();
}

// Delete goal
async function deleteGoal(goalId) {
    if (!confirm('Are you sure you want to delete this goal?')) {
        return;
    }

    try {
        await apiRequest(`/api/goals/${goalId}`, 'DELETE');
        showToast('Goal deleted', 'success');
    } catch (error) {
        console.warn('Backend unavailable, deleting locally');

        // Delete from local storage
        let localGoals = JSON.parse(localStorage.getItem('ngaturin_local_goals') || '[]');
        localGoals = localGoals.filter(g => g.id !== goalId);
        localStorage.setItem('ngaturin_local_goals', JSON.stringify(localGoals));

        showToast('Goal deleted locally', 'success');
    }

    // Remove from UI array
    userGoals = userGoals.filter(g => g.id !== goalId);
    renderGoals();
}

function updateLocalGoalInStorage(updatedGoal) {
    let localGoals = JSON.parse(localStorage.getItem('ngaturin_local_goals') || '[]');
    const index = localGoals.findIndex(g => g.id === updatedGoal.id);

    if (index !== -1) {
        localGoals[index] = updatedGoal;
        localStorage.setItem('ngaturin_local_goals', JSON.stringify(localGoals));
    }
}

// ========== Premium Features Logic ========== 

function checkPremiumFeatures() {
    const blurredContent = document.querySelectorAll('.premium-content');
    const lockOverlays = document.querySelectorAll('.premium-lock-overlay');
    const analyticsCard = document.getElementById('analyticsCard');

    if (isPremium) {
        // Unlock
        blurredContent.forEach(el => el.classList.remove('blurred'));
        lockOverlays.forEach(el => el.style.display = 'none');
        if (analyticsCard) analyticsCard.style.display = 'block';
    } else {
        // Lock
        blurredContent.forEach(el => el.classList.add('blurred'));
        lockOverlays.forEach(el => el.style.display = 'flex');
        // We still want to see the "Upgrade" locked card if goals exist
        if (analyticsCard) analyticsCard.style.display = userGoals.length > 0 ? 'block' : 'none';
    }
}

function showPremiumModal() {
    // Simulating a payment/upgrade flow
    const confirmUpgrade = confirm("Upgrade to Premium to unlock Success Rates and Saving Streaks?\n\n(This is a demo: Click OK to simulate 'Paid' status)");

    if (confirmUpgrade) {
        isPremium = true;
        checkPremiumFeatures();
        showToast('Welcome to Premium! Features Unlocked 🔓', 'success');
        updatePremiumStats();
    }
}

function updatePremiumStats() {
    if (!isPremium) return; // Don't calculate if locked (or do it in background)

    // 1. Calculate Success Rate (Avg of all goals)
    // Formula: (Total Current / Total Target) * 100 for now, or weighted.
    // Let's use a simpler heuristic: Max(0, 100 - (Late Days * Payload)) ? 
    // Let's make it: Sum(Progress) / Count(Goals)

    let successRate = 0;
    if (userGoals.length > 0) {
        const totalProgress = userGoals.reduce((sum, goal) => {
            return sum + ((goal.current_amount / goal.target_amount) * 100);
        }, 0);
        successRate = Math.min(100, Math.round(totalProgress / userGoals.length));
    }

    // Update Circle Diagram
    const circle = document.querySelector('.circular-chart .circle');
    const percentageText = document.querySelector('.circular-chart .percentage');

    if (circle && percentageText) {
        // svg dash array: coverage, 100
        circle.setAttribute('stroke-dasharray', `${successRate}, 100`);
        percentageText.textContent = `${successRate}%`;
    }


    // 2. Update Streaks (Mock Logic)
    // In a real app, check transaction dates. Here, just random logic for demo or use stored streak.
    const streakDays = userGoals.length > 0 ? 7 : 0; // Fake streak if user has goals
    const streakText = document.querySelector('.streak-badge div div:first-child');
    if (streakText) {
        streakText.textContent = `${streakDays} Days`;
    }
}

// ========== Streak Pet Logic ==========
const petStates = {
    EGG: '🥚',
    BABY: '🐣',
    CHILD: '🐥',
    ADULT: '🐓', // Example evolution
    SICK: '🤢'
};

let petData = {
    exp: 0,
    health: 100,
    lastLogin: new Date().toISOString(),
    stage: 'EGG'
};

function initPet() {
    // Load pet data (Mocking default for now as we don't have persistent storage for this detail yet)
    // In real app: JSON.parse(localStorage.getItem('streak_pet')) || default

    // Check health based on time since last login (mock logic)
    // If > 24 hours, decrease health

    updatePetUI();
}

function updatePetUI() {
    const avatarEl = document.getElementById('petAvatar');
    const healthBar = document.getElementById('petHealthBar');
    const healthText = document.getElementById('petHealthText');
    const msgEl = document.getElementById('petMessage');
    const bubbleEl = document.getElementById('petStatusBubble');

    if (!avatarEl) return;

    // Determine Stage based on EXP (Streak length/Savings count)
    // Simple mock logic:
    if (userGoals.length === 0) petData.stage = 'EGG';
    else if (userGoals.length < 3) petData.stage = 'BABY';
    else if (userGoals.length < 5) petData.stage = 'CHILD';
    else petData.stage = 'ADULT';

    // Override if sick
    if (petData.health < 30) {
        avatarEl.textContent = petStates.SICK;
        avatarEl.className = 'pet-sick';
        msgEl.textContent = "I don't feel so good... Save to heal me!";
        msgEl.style.color = '#D32F2F';
    } else {
        avatarEl.textContent = petStates[petData.stage];
        avatarEl.className = 'pet-alive'; // bubbles breathing animation

        // Random idle messages
        const msgs = [
            "Keep saving!",
            "You're doing great!",
            "I love coins! 🪙",
            "To the moon! 🚀"
        ];
        msgEl.textContent = msgs[Math.floor(Math.random() * msgs.length)];
        msgEl.style.color = '#795548';
    }

    // Update Health UI
    healthBar.style.width = `${petData.health}%`;
    healthBar.style.backgroundColor = petData.health > 50 ? '#4CAF50' : (petData.health > 20 ? '#FFC107' : '#F44336');
    healthText.textContent = `${petData.health}%`;
}

function feedPet() {
    // Called when user adds progress or creates a goal
    petData.health = Math.min(100, petData.health + 10);
    petData.exp += 10;

    const avatarEl = document.getElementById('petAvatar');
    const bubbleEl = document.getElementById('petStatusBubble');

    // Animation
    avatarEl.classList.add('pet-happy');
    bubbleEl.textContent = "Yummy! Thanks! 😋";
    bubbleEl.classList.remove('hidden');

    setTimeout(() => {
        avatarEl.classList.remove('pet-happy');
        bubbleEl.classList.add('hidden');
    }, 2000);

    updatePetUI();
}

// Initialize Pet on Load
document.addEventListener('DOMContentLoaded', initPet);

// Hook into existing functions
// We need to call feedPet() when goals are created or updated.
// I'll add calls to feedPet() inside existing event listeners/functions.
// (Note/Todo: Ideally I would refactor those functions to emit events, but direct call is fine for this scope)
