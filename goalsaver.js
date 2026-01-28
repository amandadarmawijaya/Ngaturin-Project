// ========================================
// Goal Saver - Functionality
// ========================================

let userGoals = [];

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
