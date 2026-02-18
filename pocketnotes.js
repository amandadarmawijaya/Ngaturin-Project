// pocketnotes.js

// ---- ICON PICKER ----
var POCKET_ICONS = [
    '💰', '🏖️', '🚨', '📱', '🚗', '🏠', '✈️', '🎓', '💊', '🐶',
    '🎮', '🎵', '🍕', '☕', '🛍️', '💪', '🌍', '🎁', '💍', '🏋️',
    '📚', '🎨', '🌸', '🍀', '⚽', '🏄', '🚀', '🌙', '❤️', '🔑',
    '🏦', '💳', '🎯', '🧳', '🌴', '🎪', '🦋', '🍦', '🎸', '🏡'
];

var selectedIcon = '💰';

function renderIconPicker(currentIcon) {
    selectedIcon = currentIcon || '💰';
    var grid = document.getElementById('iconPickerGrid');
    if (!grid) return;
    grid.innerHTML = POCKET_ICONS.map(function (icon) {
        var isSelected = (icon === selectedIcon) ? ' selected' : '';
        return '<span class="icon-option' + isSelected + '" onclick="selectIcon(\'' + icon + '\')">' + icon + '</span>';
    }).join('');
    var hiddenInput = document.getElementById('editPocketIcon');
    if (hiddenInput) hiddenInput.value = selectedIcon;
    updateIconPreview(selectedIcon);
    switchIconTab('emoji');
}

function updateIconPreview(icon) {
    var preview = document.getElementById('iconPreview');
    if (!preview) return;
    if (icon && icon.startsWith('data:')) {
        preview.innerHTML = '<img src="' + icon + '" style="width:100%;height:100%;object-fit:cover;border-radius:10px;">';
    } else {
        preview.innerHTML = icon || '💰';
    }
}

function switchIconTab(tab) {
    var panelEmoji = document.getElementById('panelEmoji');
    var panelUpload = document.getElementById('panelUpload');
    var tabEmoji = document.getElementById('tabEmoji');
    var tabUpload = document.getElementById('tabUpload');
    if (!panelEmoji || !panelUpload) return;
    if (tab === 'emoji') {
        panelEmoji.style.display = 'block';
        panelUpload.style.display = 'none';
        if (tabEmoji) { tabEmoji.style.background = 'var(--color-primary)'; tabEmoji.style.color = 'white'; tabEmoji.style.borderColor = 'var(--color-primary)'; }
        if (tabUpload) { tabUpload.style.background = 'white'; tabUpload.style.color = '#555'; tabUpload.style.borderColor = '#ddd'; }
    } else {
        panelEmoji.style.display = 'none';
        panelUpload.style.display = 'block';
        if (tabUpload) { tabUpload.style.background = 'var(--color-primary)'; tabUpload.style.color = 'white'; tabUpload.style.borderColor = 'var(--color-primary)'; }
        if (tabEmoji) { tabEmoji.style.background = 'white'; tabEmoji.style.color = '#555'; tabEmoji.style.borderColor = '#ddd'; }
    }
}

function handleIconUpload(event) {
    var file = event.target.files[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
        alert('Please select an image file (JPG, PNG, GIF, WebP).');
        return;
    }
    var reader = new FileReader();
    reader.onload = function (e) {
        var dataUrl = e.target.result;
        selectedIcon = dataUrl;
        var hiddenInput = document.getElementById('editPocketIcon');
        if (hiddenInput) hiddenInput.value = dataUrl;
        updateIconPreview(dataUrl);
    };
    reader.readAsDataURL(file);
}

function selectIcon(icon) {
    selectedIcon = icon;
    document.querySelectorAll('.icon-option').forEach(function (el) {
        el.classList.remove('selected');
        if (el.textContent === icon) el.classList.add('selected');
    });
    var hiddenInput = document.getElementById('editPocketIcon');
    if (hiddenInput) hiddenInput.value = icon;
    updateIconPreview(icon);
}

// ---- POCKET DATA ----
var PRIMARY_TEMPLATES = [
    { id: 'tmp-1', name: 'Transport', icon: '🚗', color: '#45B7D1' },
    { id: 'tmp-2', name: 'Travel and Vacation', icon: '✈️', color: '#6C63FF' },
    { id: 'tmp-3', name: 'Household', icon: '🏠', color: '#FF6B6B' },
    { id: 'tmp-4', name: 'Apparel', icon: '👕', color: '#4ECDC4' },
    { id: 'tmp-5', name: 'Beauty', icon: '💄', color: '#F1948A' },
    { id: 'tmp-6', name: 'Health', icon: '💊', color: '#82E0AA' },
    { id: 'tmp-7', name: 'Education', icon: '🎓', color: '#F7DC6F' },
    { id: 'tmp-8', name: 'Food and Beverage', icon: '🍕', color: '#FF8A65' },
    { id: 'tmp-9', name: 'Electronics', icon: '📱', color: '#9575CD' },
    { id: 'tmp-10', name: 'Gift', icon: '🎁', color: '#F06292' }
];

var pockets = []; // Dashboard starts empty

// ---- TRANSACTION FORM STATE ----
var currentTxType = 'in';
var selectedPocketId = null;

document.addEventListener('DOMContentLoaded', function () {
    renderPockets();
    renderPocketSelector();
    updateStats();
});

// ---- FORMAT CURRENCY ----
function formatIDR(number) {
    return new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
    }).format(number);
}

// ---- TRANSACTION TYPE TOGGLE ----
function setTxType(type) {
    currentTxType = type;
    var btnIn = document.getElementById('btnIn');
    var btnOut = document.getElementById('btnOut');
    var submitBtn = document.getElementById('submitTxBtn');

    if (type === 'in') {
        btnIn.className = 'type-btn active-in';
        btnOut.className = 'type-btn';
        submitBtn.className = 'submit-btn btn-in';
        submitBtn.textContent = '➕ Add Funds';
    } else {
        btnOut.className = 'type-btn active-out';
        btnIn.className = 'type-btn';
        submitBtn.className = 'submit-btn btn-out';
        submitBtn.textContent = '➖ Record Expense';
    }
}

// ---- RENDER POCKET SELECTOR (chips in transaction form) ----
function renderPocketSelector() {
    var container = document.getElementById('pocketSelector');
    if (!container) return;

    var selectorItems = [];

    // 1. Add instantiated pockets first
    pockets.forEach(function (p) {
        selectorItems.push({ id: p.id, name: p.name, icon: p.icon, color: p.color, isTemplate: false });
    });

    // 2. Add templates IF they haven't been instantiated yet
    PRIMARY_TEMPLATES.forEach(function (t) {
        var alreadyExists = pockets.some(function (p) { return p.name === t.name; });
        if (!alreadyExists) {
            selectorItems.push({ id: t.id, name: t.name, icon: t.icon, color: t.color, isTemplate: true });
        }
    });

    container.innerHTML = selectorItems.map(function (item) {
        var isSelected = item.id === selectedPocketId ? ' selected' : '';
        var iconHtml;
        if (item.icon && item.icon.startsWith('data:')) {
            iconHtml = '<div class="pocket-chip-icon"><img src="' + item.icon + '"></div>';
        } else {
            iconHtml = '<div class="pocket-chip-icon" style="background:' + item.color + '22;">' + item.icon + '</div>';
        }

        var label = item.isTemplate ? '<span style="font-size:0.6rem;opacity:0.6;display:block;line-height:1;">Template</span>' : '';

        return '<div class="pocket-chip' + isSelected + '" onclick="selectPocketChip(\'' + item.id + '\')">' +
            iconHtml +
            '<div style="overflow:hidden;line-height:1.2;">' +
            '<span style="display:block;text-overflow:ellipsis;white-space:nowrap;font-size:0.8rem;">' + item.name + '</span>' +
            label +
            '</div>' +
            '</div>';
    }).join('');
}

function selectPocketChip(id) {
    selectedPocketId = id;
    // Update chip highlight
    document.querySelectorAll('.pocket-chip').forEach(function (el) {
        el.classList.remove('selected');
    });

    // Re-render selector to apply selected class (simplest way to handle mixed string/number IDs)
    renderPocketSelector();

    // Highlight the corresponding card if it exists
    document.querySelectorAll('.pocket-card').forEach(function (el) {
        el.classList.remove('highlighted');
    });

    if (typeof id === 'number' || !id.startsWith('tmp-')) {
        var card = document.getElementById('card-' + id);
        if (card) card.classList.add('highlighted');
    }
}

// ---- SUBMIT UNIFIED TRANSACTION ----
function submitTransaction() {
    if (!selectedPocketId) {
        showToast('Please select a pocket first!', 'error');
        return;
    }

    var amount = Number(document.getElementById('txAmount').value);
    var note = document.getElementById('txNote').value.trim() || (currentTxType === 'in' ? 'Deposit' : 'Expense');

    if (!amount || amount <= 0) {
        showToast('Please enter a valid amount.', 'error');
        return;
    }

    var pocket = null;

    // A. Handle Template Creation
    if (typeof selectedPocketId === 'string' && selectedPocketId.startsWith('tmp-')) {
        var template = PRIMARY_TEMPLATES.find(function (t) { return t.id === selectedPocketId; });
        if (template) {
            // Check again if it was created in the meantime (safety)
            pocket = pockets.find(function (p) { return p.name === template.name; });
            if (!pocket) {
                pocket = {
                    id: Date.now(),
                    name: template.name,
                    icon: template.icon,
                    current: 0,
                    target: 1000000,
                    color: template.color,
                    transactions: []
                };
                pockets.push(pocket);
                selectedPocketId = pocket.id; // Switch selection to real pocket ID
            }
        }
    } else {
        // B. Handle Existing Pocket
        pocket = pockets.find(function (p) { return p.id == selectedPocketId; });
    }

    if (!pocket) return;

    var finalAmount = currentTxType === 'in' ? amount : -amount;

    if (currentTxType === 'out' && pocket.current < amount) {
        showToast('Insufficient funds in ' + pocket.name + '!', 'error');
        return;
    }

    pocket.current += finalAmount;
    if (!pocket.transactions) pocket.transactions = [];
    pocket.transactions.push({
        date: new Date().toISOString().split('T')[0],
        note: note,
        amount: finalAmount,
        type: currentTxType
    });

    // Clear form
    document.getElementById('txAmount').value = '';
    document.getElementById('txNote').value = '';

    renderPockets();
    renderPocketSelector();
    updateStats();

    var msg = currentTxType === 'in'
        ? '✅ Added ' + formatIDR(amount) + ' to ' + pocket.name
        : '✅ Recorded ' + formatIDR(amount) + ' expense from ' + pocket.name;
    showToast(msg, 'success');

    // Re-select the same pocket after re-render
    selectPocketChip(selectedPocketId);
}

// ---- RENDER POCKET CARDS ----
function renderPockets() {
    var grid = document.getElementById('pocketsGrid');
    if (!grid) return;

    grid.innerHTML = pockets.map(function (pocket) {
        var percentage = Math.min(100, Math.round((pocket.current / pocket.target) * 100));

        // Icon
        var iconHtml;
        if (pocket.icon && pocket.icon.startsWith('data:')) {
            iconHtml = '<div class="pocket-icon" style="padding:0;overflow:hidden;"><img src="' + pocket.icon + '" style="width:100%;height:100%;object-fit:cover;border-radius:50%;"></div>';
        } else {
            iconHtml = '<div class="pocket-icon" style="background:' + pocket.color + '22;">' + (pocket.icon || '💰') + '</div>';
        }

        // Recent transactions (last 3)
        var txns = (pocket.transactions || []).slice(-3).reverse();
        var txHtml = '';
        if (txns.length > 0) {
            txHtml = '<div class="card-txn-list">' +
                txns.map(function (tx) {
                    var cls = tx.amount > 0 ? 'in' : 'out';
                    var sign = tx.amount > 0 ? '+' : '';
                    return '<div class="card-txn-item">' +
                        '<div style="flex:1;overflow:hidden;">' +
                        '<div style="overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">' + tx.note + '</div>' +
                        '<div style="font-size:0.7rem;color:#bbb;margin-top:1px;">' + tx.date + '</div>' +
                        '</div>' +
                        '<span class="txn-amount ' + cls + '">' + sign + formatIDR(tx.amount) + '</span>' +
                        '</div>';
                }).join('') +
                '</div>';
        } else {
            txHtml = '<div style="font-size:0.75rem;color:#ccc;margin-top:8px;">No transactions yet</div>';
        }

        return '<div class="pocket-card" id="card-' + pocket.id + '">' +
            // Menu dots
            '<div style="position:absolute;top:12px;right:12px;cursor:pointer;color:#aaa;font-size:1.3rem;font-weight:bold;padding:4px;z-index:5;" onclick="toggleMenu(' + pocket.id + ')">⋮</div>' +
            '<div id="menu-' + pocket.id + '" class="pocket-menu" style="display:none;position:absolute;top:44px;right:12px;background:white;box-shadow:0 4px 12px rgba(0,0,0,0.15);border-radius:10px;overflow:hidden;z-index:10;font-size:0.88rem;border:1px solid #eee;min-width:130px;">' +
            '<div onclick="openEditModal(' + pocket.id + ')" style="padding:10px 16px;cursor:pointer;border-bottom:1px solid #eee;white-space:nowrap;">✏️ Edit Pocket</div>' +
            '<div onclick="deletePocket(' + pocket.id + ')" style="padding:10px 16px;cursor:pointer;color:#e74c3c;white-space:nowrap;">🗑️ Delete</div>' +
            '</div>' +
            iconHtml +
            '<h3 style="margin-bottom:2px;font-size:1rem;">' + pocket.name + '</h3>' +
            // Progress ring
            '<div class="pocket-progress">' +
            '<svg viewBox="0 0 36 36" style="width:100%;height:100%;">' +
            '<path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" stroke="#eee" stroke-width="3" fill="none"/>' +
            '<path stroke-dasharray="' + percentage + ',100" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" stroke="' + pocket.color + '" stroke-width="3" fill="none" stroke-linecap="round"/>' +
            '<text x="18" y="20.35" style="fill:#333;font-size:8px;font-weight:bold;text-anchor:middle;">' + percentage + '%</text>' +
            '</svg>' +
            '</div>' +
            txHtml +
            '</div>';
    }).join('');
}

// ---- STATS ----
function updateStats() {
    var totalIncome = 0;
    var totalExpense = 0;
    pockets.forEach(function (p) {
        (p.transactions || []).forEach(function (tx) {
            if (tx.amount > 0) totalIncome += tx.amount;
            else totalExpense += Math.abs(tx.amount);
        });
    });

    // Total Funds = what the user actually has right now (income - expense)
    var totalFunds = totalIncome - totalExpense;

    var totalEl = document.getElementById('totalSaved');
    var incomeEl = document.getElementById('totalIncome');
    var expenseEl = document.getElementById('totalExpense');
    var countEl = document.getElementById('totalPockets');
    if (totalEl) totalEl.textContent = formatIDR(totalFunds);
    if (incomeEl) incomeEl.textContent = formatIDR(totalIncome);
    if (expenseEl) expenseEl.textContent = formatIDR(totalExpense);
    if (countEl) countEl.textContent = pockets.length;
}

// ---- MENU TOGGLE ----
function toggleMenu(id) {
    document.querySelectorAll('.pocket-menu').forEach(function (el) { el.style.display = 'none'; });
    var menu = document.getElementById('menu-' + id);
    if (menu) {
        menu.style.display = 'block';
        setTimeout(function () {
            document.addEventListener('click', function closeMenu(e) {
                if (!e.target.closest('.pocket-menu')) {
                    menu.style.display = 'none';
                    document.removeEventListener('click', closeMenu);
                }
            });
        }, 10);
    }
}

// ---- DELETE ----
function deletePocket(id) {
    if (confirm('Are you sure you want to delete this pocket?')) {
        pockets = pockets.filter(function (p) { return p.id !== id; });
        if (selectedPocketId === id) selectedPocketId = null;
        renderPockets();
        renderPocketSelector();
        updateStats();
        showToast('Pocket deleted.', 'success');
    }
}

// ---- ADD POCKET MODAL ----
function showAddPocketModal() {
    editingId = null;
    document.getElementById('editPocketName').value = '';

    var title = document.getElementById('modalTitle');
    if (title) title.innerText = 'Add New Pocket';

    var delBtn = document.getElementById('deleteBtn');
    if (delBtn) delBtn.style.display = 'none';

    var fileInput = document.getElementById('iconFileInput');
    if (fileInput) fileInput.value = '';

    renderIconPicker('💰');
    document.getElementById('editModal').style.display = 'flex';
}

// ---- EDIT POCKET MODAL ----
var editingId = null;

function openEditModal(id) {
    var pocket = null;
    for (var i = 0; i < pockets.length; i++) {
        if (pockets[i].id === id) { pocket = pockets[i]; break; }
    }
    if (!pocket) return;

    editingId = id;
    document.getElementById('editPocketName').value = pocket.name;

    var title = document.getElementById('modalTitle');
    if (title) title.innerText = 'Edit Pocket';

    var delBtn = document.getElementById('deleteBtn');
    if (delBtn) delBtn.style.display = 'block';

    var fileInput = document.getElementById('iconFileInput');
    if (fileInput) fileInput.value = '';

    renderIconPicker(pocket.icon || '💰');
    document.getElementById('editModal').style.display = 'flex';
}

// ---- SAVE POCKET ----
function savePocket() {
    var name = document.getElementById('editPocketName').value.trim();
    var icon = document.getElementById('editPocketIcon') ? document.getElementById('editPocketIcon').value : selectedIcon;

    if (!name) {
        alert('Please enter a pocket name.');
        return;
    }

    if (editingId) {
        for (var i = 0; i < pockets.length; i++) {
            if (pockets[i].id === editingId) {
                pockets[i].name = name;
                pockets[i].icon = icon;
                break;
            }
        }
    } else {
        var colors = ['#6C63FF', '#FF6B6B', '#4ECDC4', '#45B7D1', '#F7DC6F', '#82E0AA', '#F1948A'];
        var randomColor = colors[Math.floor(Math.random() * colors.length)];
        pockets.push({
            id: Date.now(),
            name: name,
            icon: icon,
            current: 0,
            target: 1000000, // Default target
            color: randomColor,
            transactions: []
        });
    }

    renderPockets();
    renderPocketSelector();
    updateStats();
    document.getElementById('editModal').style.display = 'none';
    showToast('Pocket saved! 🎉', 'success');
}

function deleteFromModal() {
    if (editingId) {
        deletePocket(editingId);
        document.getElementById('editModal').style.display = 'none';
        editingId = null;
    }
}

// ---- TOAST ----
function showToast(message, type) {
    var toast = document.getElementById('toast');
    if (!toast) return;
    toast.textContent = message;
    toast.className = 'toast ' + (type || '');
    toast.classList.add('show');
    setTimeout(function () { toast.classList.remove('show'); }, 3000);
}

// ---- MONEY WRAPPED RECAP ----
var slideInterval;

function showRecapModal() {
    var totalSaved = pockets.reduce(function (sum, p) { return sum + p.current; }, 0);
    var topPocket = { name: 'None', current: 0, color: '#333' };
    pockets.forEach(function (p) { if (p.current > topPocket.current) topPocket = p; });

    var persona = 'The Novice Saver'; var personaIcon = '🌱';
    if (totalSaved > 100000000) { persona = 'The Wealth Wizard'; personaIcon = '🧙‍♂️'; }
    else if (totalSaved > 50000000) { persona = 'The Strategic Saver'; personaIcon = '🧠'; }
    else if (totalSaved > 10000000) { persona = 'The Steady Builder'; personaIcon = '🧱'; }

    var content =
        '<div class="carousel-slide" style="display:block;">' +
        '<div style="font-size:3rem;margin-bottom:10px;">🎉</div>' +
        '<h2 style="color:var(--color-primary);">Your Monthly Wrapped</h2>' +
        '<p style="color:#aaa;">Let\'s see how you did!</p>' +
        '</div>' +
        '<div class="carousel-slide" style="display:none;">' +
        '<div style="font-size:3rem;margin-bottom:10px;">💰</div>' +
        '<h3>Total Wealth</h3>' +
        '<div style="font-size:2.5rem;font-weight:800;">' + formatIDR(totalSaved) + '</div>' +
        '<p style="color:#aaa;">You\'re building an empire!</p>' +
        '</div>' +
        '<div class="carousel-slide" style="display:none;">' +
        '<div style="font-size:3rem;margin-bottom:10px;">🏆</div>' +
        '<h3>Top Pocket</h3>' +
        '<div style="font-size:2rem;font-weight:700;color:' + (topPocket.color || '#fff') + ';">' + topPocket.name + '</div>' +
        '</div>' +
        '<div class="carousel-slide" style="display:none;">' +
        '<div style="font-size:4rem;margin-bottom:10px;">' + personaIcon + '</div>' +
        '<h3>Your Persona</h3>' +
        '<div style="font-size:1.8rem;font-weight:800;color:var(--color-primary);">' + persona + '</div>' +
        '</div>';

    document.getElementById('wrappedContent').innerHTML = content;
    document.getElementById('recapModal').style.display = 'flex';
    startSlideshow();
}

function startSlideshow() {
    var slides = document.querySelectorAll('.carousel-slide');
    var current = 0;
    if (slideInterval) clearInterval(slideInterval);
    slideInterval = setInterval(function () {
        slides[current].style.display = 'none';
        current = (current + 1) % slides.length;
        slides[current].style.display = 'block';
    }, 3000);
}

function closeRecapModal() {
    document.getElementById('recapModal').style.display = 'none';
    if (slideInterval) clearInterval(slideInterval);
}

function downloadPDF() {
    showToast('Generating Money Wrapped Card... 📸', 'success');
    closeRecapModal();
}
