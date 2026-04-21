let menuItems = [];
let cart = [];

// DOM Elements
const menuGrid = document.getElementById('menu-grid');
const cartCount = document.getElementById('cart-count');
const cartModal = document.getElementById('cart-modal');
const cartItems = document.getElementById('cart-items');
const cartTotal = document.getElementById('cart-total');
const cartBtn = document.getElementById('cart-btn');
const closeCartBtn = document.getElementById('close-cart');
const checkoutBtn = document.getElementById('checkout-btn');
const categoryTabs = document.querySelectorAll('.tab');

const aiInput = document.getElementById('ai-text-input');
const aiSubmitBtn = document.getElementById('ai-submit-btn');
const voiceBtn = document.getElementById('voice-btn');
const aiStatus = document.getElementById('ai-status');

// Fetch Menu on Load
async function fetchMenu() {
    try {
        const response = await fetch('/api/menu');
        menuItems = await response.json();
        renderMenu('all');
    } catch (err) {
        menuGrid.innerHTML = '<div class="loading">Failed to load menu. Please try again later.</div>';
        console.error(err);
    }
}

// Render Menu Items
function renderMenu(category) {
    menuGrid.innerHTML = '';
    const filtered = category === 'all' 
        ? menuItems 
        : menuItems.filter(item => item.category === category);
        
    if (filtered.length === 0) {
        menuGrid.innerHTML = '<div class="loading">No items available in this category.</div>';
        return;
    }

    filtered.forEach(item => {
        const card = document.createElement('div');
        card.className = 'menu-card';
        card.innerHTML = `
            <h3>${item.name}</h3>
            <p>${item.description}</p>
            <div class="menu-card-footer">
                <span class="price">₹${item.price}</span>
                <button class="add-btn" onclick="addToCart(${item.id})">Add to Cart</button>
            </div>
        `;
        menuGrid.appendChild(card);
    });
}

// Category Filtering
categoryTabs.forEach(tab => {
    tab.addEventListener('click', () => {
        categoryTabs.forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        renderMenu(tab.dataset.category);
    });
});

// Cart Management
function addToCart(itemId, quantity = 1) {
    const item = menuItems.find(i => i.id === itemId);
    if (!item) return;

    const existing = cart.find(i => i.id === itemId);
    if (existing) {
        existing.quantity += quantity;
    } else {
        cart.push({ ...item, quantity });
    }
    updateCartUI();
}

function removeFromCart(itemId) {
    const index = cart.findIndex(i => i.id === itemId);
    if (index > -1) {
        if (cart[index].quantity > 1) {
            cart[index].quantity -= 1;
        } else {
            cart.splice(index, 1);
        }
    }
    updateCartUI();
}

function updateCartUI() {
    // Update count badge
    const count = cart.reduce((sum, item) => sum + item.quantity, 0);
    cartCount.innerText = count;

    // Update modal
    cartItems.innerHTML = '';
    let total = 0;

    if (cart.length === 0) {
        cartItems.innerHTML = '<p class="loading">Your cart is empty.</p>';
    } else {
        cart.forEach(item => {
            const itemTotal = item.price * item.quantity;
            total += itemTotal;
            
            const div = document.createElement('div');
            div.className = 'cart-item';
            div.innerHTML = `
                <div class="cart-item-info">
                    <h4>${item.name}</h4>
                    <p>₹${item.price} x ${item.quantity}</p>
                </div>
                <div class="cart-item-controls">
                    <button class="qty-btn" onclick="removeFromCart(${item.id})">-</button>
                    <span>${item.quantity}</span>
                    <button class="qty-btn" onclick="addToCart(${item.id})">+</button>
                </div>
            `;
            cartItems.appendChild(div);
        });
    }

    cartTotal.innerText = `₹${total}`;
}

// Modal Toggle
cartBtn.addEventListener('click', () => {
    cartModal.classList.add('active');
});

closeCartBtn.addEventListener('click', () => {
    cartModal.classList.remove('active');
});

cartModal.addEventListener('click', (e) => {
    if (e.target === cartModal) {
        cartModal.classList.remove('active');
    }
});

// Checkout Process
checkoutBtn.addEventListener('click', async () => {
    if (cart.length === 0) {
        alert("Your cart is empty!");
        return;
    }

    const studentName = document.getElementById('student-name').value.trim();
    if (!studentName) {
        alert("Please enter your name.");
        return;
    }

    const pickupTime = document.getElementById('pickup-time').value;
    const paymentMethod = document.getElementById('payment-method').value;
    const totalAmount = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    
    const items = cart.map(item => ({
        menu_item_id: item.id,
        quantity: item.quantity
    }));

    checkoutBtn.disabled = true;
    checkoutBtn.innerText = "Processing...";

    try {
        const res = await fetch('/api/orders', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                student_name: studentName,
                pickup_time: pickupTime,
                payment_method: paymentMethod,
                total_amount: totalAmount,
                items: items
            })
        });

        const data = await res.json();
        if (data.success) {
            alert(`Order placed successfully! Your Order ID is #${data.orderId}`);
            cart = [];
            updateCartUI();
            cartModal.classList.remove('active');
            document.getElementById('student-name').value = '';
        } else {
            alert("Failed to place order: " + data.error);
        }
    } catch (err) {
        console.error(err);
        alert("An error occurred while placing the order.");
    } finally {
        checkoutBtn.disabled = false;
        checkoutBtn.innerText = "Place Order";
    }
});

// AI Chatbot & Voice Ordering Logic
function processAIQuery(text) {
    if (!text) return;
    const lowerText = text.toLowerCase();
    let itemsAdded = 0;
    
    // Very basic Mock AI matching algorithm (In production, replace with DeepSeek/OpenAI API call)
    menuItems.forEach(item => {
        const itemName = item.name.toLowerCase();
        if (lowerText.includes(itemName)) {
            // Find if there is a number before the item (e.g. "order 2 samosa")
            const regex = new RegExp(`(\\d+)\\s+${itemName}`, 'i');
            const match = lowerText.match(regex);
            let quantity = 1;
            if (match && match[1]) {
                quantity = parseInt(match[1]);
            }
            addToCart(item.id, quantity);
            itemsAdded += quantity;
        }
    });

    if (itemsAdded > 0) {
        aiStatus.innerText = `Added ${itemsAdded} item(s) to your cart.`;
        aiStatus.style.color = 'var(--success)';
        // Open cart to show user
        setTimeout(() => { cartModal.classList.add('active'); }, 1000);
    } else {
        aiStatus.innerText = `I couldn't find those items in the menu. Please try again.`;
        aiStatus.style.color = '#ef4444';
    }
    
    aiInput.value = '';
}

aiSubmitBtn.addEventListener('click', () => {
    processAIQuery(aiInput.value);
});

aiInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        processAIQuery(aiInput.value);
    }
});

// Web Speech API for Voice Ordering
const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
if (SpeechRecognition) {
    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = 'en-IN'; // English India

    recognition.onstart = function() {
        voiceBtn.classList.add('recording');
        aiInput.placeholder = "Listening...";
        aiStatus.innerText = "";
    };

    recognition.onresult = function(event) {
        const transcript = event.results[0][0].transcript;
        aiInput.value = transcript;
        processAIQuery(transcript);
    };

    recognition.onerror = function(event) {
        console.error("Speech recognition error", event.error);
        aiStatus.innerText = "Error listening to voice. Try again.";
    };

    recognition.onend = function() {
        voiceBtn.classList.remove('recording');
        aiInput.placeholder = "e.g. 'Order 1 samosa and 1 chai'";
    };

    voiceBtn.addEventListener('click', () => {
        recognition.start();
    });
} else {
    voiceBtn.style.display = 'none'; // Hide if not supported
    console.warn("Speech Recognition API not supported in this browser.");
}

// Init
fetchMenu();
