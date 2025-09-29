   console.log("🔥 script.js loaded at " + new Date().toLocaleTimeString());

// =========================
// Global State with Safe Initialization
// =========================
let books = [];
let userListings = [];
let currentUser = null;
let isLoggedIn = false;
let currentChatId = null;
let conversations = [];

// =========================
// MISSING FUNCTIONS - ADD THESE
// =========================

// Photo upload handler
function handlePhotoUpload(event) {
    const file = event.target.files[0];
    if (file) {
        // For now, just show a success message since we don't have backend for file uploads
        alert('📸 Photo selected! In a full implementation, this would upload to the server.');
        
        // You can add actual file upload logic here later
        // Example: uploadPhoto(file);
    }
}

// Success message function
function showSuccessMessage(msg) {
    // Create or use existing success modal
    let successModal = document.getElementById('success-modal');
    let successMessage = document.getElementById('success-message');
    
    if (!successModal) {
        // Create success modal if it doesn't exist
        successModal = document.createElement('div');
        successModal.id = 'success-modal';
        successModal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 hidden';
        successModal.innerHTML = `
            <div class="bg-white rounded-lg p-6 max-w-sm mx-4">
                <div class="text-center">
                    <div class="text-4xl mb-4">✅</div>
                    <h3 id="success-message" class="text-lg font-semibold text-gray-900 mb-4"></h3>
                    <button onclick="closeSuccessModal()" class="bg-indigo-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-indigo-700">
                        OK
                    </button>
                </div>
            </div>
        `;
        document.body.appendChild(successModal);
    }
    
    if (successMessage) {
        successMessage.textContent = msg;
    }
    
    successModal.classList.remove('hidden');
}

// Close success modal
function closeSuccessModal() {
    const successModal = document.getElementById('success-modal');
    if (successModal) {
        successModal.classList.add('hidden');
    }
}

// Optional: File upload function (for future use)
async function uploadPhoto(file) {
    const token = localStorage.getItem('token');
    const formData = new FormData();
    formData.append('photo', file);

    try {
        const res = await fetch('http://localhost:5000/api/upload', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`
            },
            body: formData
        });

        if (res.ok) {
            const data = await res.json();
            return data.filePath; // Return the uploaded file path
        } else {
            throw new Error('Photo upload failed');
        }
    } catch (error) {
        console.error('Photo upload error:', error);
        return null;
    }
}

// =========================
// UPDATE YOUR listBook FUNCTION
// =========================
async function listBook(e) {
    e.preventDefault();
    if (!currentUser) return alert("Please log in to list a book!");

    const token = localStorage.getItem("token");
    if (!token) return alert("Missing auth token, please log in again!");

    const bookData = {
        title: document.getElementById("book-title").value,
        author: document.getElementById("book-author").value,
        genre: document.getElementById("book-genre").value,
        condition: document.getElementById("book-condition").value,
        price: parseFloat(document.getElementById("book-price").value),
        location: document.getElementById("pickup-location").value,
        description: document.getElementById("book-description").value,
        seller: currentUser._id
    };

    // Validate required fields
    if (!bookData.title || !bookData.author || !bookData.price) {
        alert("Please fill in title, author, and price");
        return;
    }

    try {
        const res = await fetch("http://localhost:5000/api/books", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify(bookData),
        });

        if (!res.ok) {
            throw new Error(`Book listing failed with status: ${res.status}`);
        }

        const newBook = await res.json();
        if (newBook) {
            await fetchBooks();
            await fetchUserListings();
            e.target.reset();
            showSuccessMessage("📚 Your book has been listed successfully!");
        }
    } catch (err) {
        console.error("Book listing error:", err);
        alert("Something went wrong while listing book");
    }
}
// =========================
// DELETE LISTING FUNCTION
// =========================
async function deleteListing(bookId) {
    if (!currentUser) {
        alert("Please log in to delete listings!");
        return;
    }

    const book = userListings.find(b => b._id === bookId);
    if (!book) {
        alert("Book not found in your listings!");
        return;
    }

    if (!confirm(`Are you sure you want to delete "${book.title}" from your listings?`)) {
        return;
    }

    const token = localStorage.getItem('token');
    if (!token) {
        alert("Please log in again!");
        return;
    }

    try {
        const res = await fetch(`http://localhost:5000/api/books/${bookId}`, {
            method: "DELETE",
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        if (!res.ok) {
            const errorData = await res.json().catch(() => ({ error: 'Unknown error' }));
            throw new Error(errorData.error || `Failed to delete listing: ${res.status}`);
        }

        const data = await res.json();

        if (data.success || res.ok) {
            // Remove from local state
            books = books.filter(b => b._id !== bookId);
            userListings = userListings.filter(b => b._id !== bookId);
            
            // Update UI
            renderBookFeed();
            renderUserListings();
            
            showSuccessMessage("🗑️ Listing deleted successfully!");
        } else {
            alert(data.error || "Failed to delete listing");
        }
    } catch (err) {
        console.error("Delete error:", err);
        alert("Error deleting listing: " + err.message);
    }
}
// =========================
// Safe DOM Element Helper
// =========================
function getElement(id) {
    const element = document.getElementById(id);
    if (!element) {
        console.warn(`Element with id '${id}' not found`);
    }
    return element;
}

// =========================
// AUTH MODAL TABS - SAFE VERSION
// =========================
function showAuthTab(tabName) {
    console.log('Showing auth tab:', tabName);
    
    // Safely hide all auth forms
    document.querySelectorAll(".auth-form").forEach(f => {
        if (f && f.classList) f.classList.add("hidden");
    });
    
    // Safely show target form
    const targetForm = getElement(tabName + "-form");
    if (targetForm) targetForm.classList.remove("hidden");

    // Update tab buttons safely
    const loginBtn = getElement("login-tab-btn");
    const registerBtn = getElement("register-tab-btn");

    if (tabName === "login") {
        if (loginBtn) {
            loginBtn.classList.add("bg-white", "text-indigo-600", "shadow-sm");
            loginBtn.classList.remove("text-gray-600");
        }
        if (registerBtn) {
            registerBtn.classList.remove("bg-white", "text-indigo-600", "shadow-sm");
            registerBtn.classList.add("text-gray-600");
        }
    } else {
        if (registerBtn) {
            registerBtn.classList.add("bg-white", "text-indigo-600", "shadow-sm");
            registerBtn.classList.remove("text-gray-600");
        }
        if (loginBtn) {
            loginBtn.classList.remove("bg-white", "text-indigo-600", "shadow-sm");
            loginBtn.classList.add("text-gray-600");
        }
    }
}

// =========================
// AUTH FUNCTIONS - SAFE VERSION
// =========================
async function loginUser(identifier, password) {
    try {
        const res = await fetch("http://localhost:5000/api/auth/login", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ identifier, password }),
        });

        // Check if response is OK before parsing JSON
        if (!res.ok) {
            throw new Error(`Login failed with status: ${res.status}`);
        }

        const data = await res.json();
        console.log("Login response:", data);

        if (data.token) {
            const { token, user } = data;
            localStorage.setItem("token", token);
            localStorage.setItem("user", JSON.stringify(user));
            currentUser = user;
            isLoggedIn = true;

            updateUserInterface();
            
            // Safely hide login modal
            const loginModal = getElement("login-modal");
            if (loginModal) loginModal.classList.add("hidden");
            
            await fetchBooks();
            await fetchUserListings();
            alert("🎉 Login successful!");
        } else {
            alert(data.error || "Login failed");
        }
    } catch (err) {
        console.error("Login error:", err);
        alert("Something went wrong while logging in");
    }
}

async function handleLogin(e) {
    e.preventDefault();
    const identifier = getElement("login-identifier")?.value || "";
    const password = getElement("login-password")?.value || "";
    
    if (!identifier || !password) {
        alert("Please fill in all fields");
        return;
    }
    
    await loginUser(identifier, password);
}

async function handleRegister(e) {
    e.preventDefault();
    const firstName = getElement("register-firstname")?.value || "";
    const lastName = getElement("register-lastname")?.value || "";
    const username = getElement("register-username")?.value || "";
    const email = getElement("register-email")?.value || "";
    const password = getElement("register-password")?.value || "";
    const confirmPassword = getElement("register-confirm-password")?.value || "";
    const location = getElement("register-location")?.value || "";
    const phone = getElement("register-phone")?.value || "";

    if (password !== confirmPassword) {
        alert("Passwords do not match!");
        return;
    }

    if (!firstName || !lastName || !username || !email || !password) {
        alert("Please fill in all required fields");
        return;
    }

    try {
        const res = await fetch("http://localhost:5000/api/auth/register", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ username, firstName, lastName, email, password, location, phone }),
        });

        if (!res.ok) {
            throw new Error(`Registration failed with status: ${res.status}`);
        }

        const data = await res.json();
        console.log("Register response:", data);

        if (res.ok) {
            await loginUser(email, password);
        } else {
            alert(data.error || "Registration failed");
        }
    } catch (err) {
        console.error("Register error:", err);
        alert("Something went wrong during registration");
    }
}

function handleLogout() {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    currentUser = null;
    isLoggedIn = false;

    // Safely show login modal
    const loginModal = getElement("login-modal");
    if (loginModal) loginModal.classList.remove("hidden");
    
    resetUserInterface();
    alert("👋 Signed out successfully!");
}

// =========================
// UI HELPERS - SAFE VERSION
// =========================
function updateUserInterface() {
    if (!currentUser) {
        console.log("No current user to update UI");
        return;
    }

    console.log("Updating UI for user:", currentUser.username);

    // Safely update profile elements
    const profileAvatar = getElement("profile-avatar");
    if (profileAvatar) {
        profileAvatar.textContent = (currentUser.username?.charAt(0) || "?").toUpperCase();
    }

    const profileNameElem = getElement("profile-name");
    if (profileNameElem) {
        profileNameElem.textContent = currentUser.username || "Unknown User";
    }

    const fullNameElem = getElement("profile-fullname");
    if (fullNameElem) {
        fullNameElem.textContent = `${currentUser.firstName || ""} ${currentUser.lastName || ""}`.trim();
    }

    const navbarAvatar = document.querySelector("header .w-8 span");
    if (navbarAvatar) {
        navbarAvatar.textContent = (currentUser.username?.charAt(0) || "?").toUpperCase();
    }

    const profileBio = getElement("profile-bio");
    if (profileBio) {
        profileBio.textContent = currentUser.bio || "📖 No bio yet";
    }

    // Safely show main content
    const mainElement = document.querySelector("main");
    if (mainElement) {
        mainElement.classList.remove("hidden");
    } else {
        console.warn("Main element not found");
    }
}

function resetUserInterface() {
    books = [];
    userListings = [];
    renderBookFeed();
    renderUserListings();
    
    const mainElement = document.querySelector("main");
    if (mainElement) {
        mainElement.classList.add("hidden");
    }
}

// =========================
// TABS - SAFE VERSION
// =========================
function showTab(tabName) {
    console.log('Showing tab:', tabName);
    
    if (!isLoggedIn && tabName !== "home") {
        showSuccessMessage("Please log in to access this feature!");
        return;
    }
    
    // Safely hide all tab contents
    document.querySelectorAll(".tab-content").forEach(tab => {
        if (tab && tab.classList) tab.classList.add("hidden");
    });
    
    // Safely show target tab
    const target = getElement(`${tabName}-tab`);
    if (target) {
        target.classList.remove("hidden");
    } else {
        console.warn(`Tab with id '${tabName}-tab' not found`);
    }
}

// =========================
// BOOK LISTINGS - SAFE VERSION
// =========================
async function listBook(e) {
    e.preventDefault();
    
    if (!currentUser) {
        alert("Please log in to list a book!");
        return;
    }

    const token = localStorage.getItem("token");
    if (!token) {
        alert("Missing auth token, please log in again!");
        return;
    }

    // Safely get form values
    const bookData = {
        title: getElement("book-title")?.value || "",
        author: getElement("book-author")?.value || "",
        genre: getElement("book-genre")?.value || "",
        condition: getElement("book-condition")?.value || "",
        price: parseFloat(getElement("book-price")?.value) || 0,
        location: getElement("pickup-location")?.value || "",
        description: getElement("book-description")?.value || "",
        seller: currentUser._id
    };

    // Validate required fields
    if (!bookData.title || !bookData.author || !bookData.price) {
        alert("Please fill in title, author, and price");
        return;
    }

    try {
        const res = await fetch("http://localhost:5000/api/books", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify(bookData),
        });

        if (!res.ok) {
            throw new Error(`Book listing failed with status: ${res.status}`);
        }

        const newBook = await res.json();
        if (newBook) {
            await fetchBooks();
            await fetchUserListings();
            e.target.reset();
            showSuccessMessage("📚 Your book has been listed!");
        }
    } catch (err) {
        console.error("Book listing error:", err);
        alert("Something went wrong while listing book");
    }
}

// =========================
// SIMPLIFIED BOOK CARD CREATION
// =========================
function createBookCard(book) {
    if (!book) return '';
    
    const conditionColors = {
        "new": "bg-blue-100 text-blue-800",
        "slightly-used": "bg-green-100 text-green-800",
        "well-read": "bg-yellow-100 text-yellow-800",
    };
    
    const genreEmojis = {
        "fiction": "📖",
        "non-fiction": "📚",
        "science": "🔬",
        "history": "📜",
        "romance": "💕",
        "mystery": "🔍",
    };

    const safeBook = {
        _id: book._id || 'unknown',
        title: book.title || 'Unknown Title',
        author: book.author || 'Unknown Author',
        genre: book.genre || 'fiction',
        condition: book.condition || 'new',
        price: book.price || 0,
        location: book.location || 'Unknown Location'
    };

    return `
    <div class="book-card bg-white rounded-lg shadow-md overflow-hidden">
        <div class="h-48 bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center">
            <span class="text-white text-4xl">${genreEmojis[safeBook.genre] || "📖"}</span>
        </div>
        <div class="p-4">
            <h3 class="font-semibold text-gray-900 mb-1">${safeBook.title}</h3>
            <p class="text-sm text-gray-600 mb-2">${safeBook.author} • ${safeBook.genre}</p>
            <p class="text-xs text-gray-500 mb-2">Seller:${safeBook.seller?.username || 'Unknown'} (ID: ${safeBook.seller?._id || 'N/A'})</p>

            <div class="flex items-center justify-between mb-3">
                <span class="text-lg font-bold text-indigo-600">₹${safeBook.price}</span>
                <span class="text-sm ${conditionColors[safeBook.condition] || 'bg-gray-100 text-gray-800'} px-2 py-1 rounded">
                    ${safeBook.condition?.replace("-", " ") || 'Unknown'}
                </span>
            </div>
            <div class="flex items-center justify-between mt-2">
                <p class="text-xs text-gray-500">📍 ${safeBook.location}</p>
            </div>
            <button 
                onclick="showInterest('${safeBook._id}')" 
                class="w-full mt-3 bg-indigo-600 text-white py-2 rounded-lg text-sm font-medium hover:bg-indigo-700">
                Interested
            </button>
        </div>
    </div>
    `;
}

function renderBookFeed() {
    const feed = getElement("book-grid");
    if (!feed) {
        console.warn("Book grid element not found");
        return;
    }

    feed.innerHTML = "";

    if (!books || books.length === 0) {
        const empty = document.createElement("div");
        empty.className = "col-span-full empty-state text-center py-10";
        empty.innerHTML = `
            <div class="text-6xl mb-4">📚</div>
            <h3 class="text-xl font-semibold text-gray-900 mb-2">No books listed yet</h3>
            <p class="text-gray-600 mb-4">Be the first to list a book!</p>
            <button onclick="showTab('sell')" class="bg-indigo-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-indigo-700">
                List Your First Book
            </button>
        `;
        feed.appendChild(empty);
        return;
    }

    books.forEach(book => {
        const card = document.createElement("div");
        card.innerHTML = createBookCard(book);
        if (card.firstElementChild) {
            feed.appendChild(card.firstElementChild);
        }
    });
}

// =========================
// SIMPLIFIED FETCH FUNCTIONS
// =========================
async function fetchBooks() {
    try {
        const res = await fetch("http://localhost:5000/api/books");
        if (!res.ok) {
            throw new Error(`Failed to fetch books: ${res.status}`);
        }
        const data = await res.json();
        books = data || [];
        renderBookFeed();
    } catch (err) {
        console.error("Error fetching books:", err);
        books = [];
        renderBookFeed();
    }
}

async function fetchUserListings() {
    if (!currentUser) return;
    
    try {
        const res = await fetch("http://localhost:5000/api/books");
        if (!res.ok) {
            throw new Error(`Failed to fetch user listings: ${res.status}`);
        }
        const data = await res.json();
        userListings = (data || []).filter(b => b.seller && (b.seller._id === currentUser._id));
        renderUserListings();
    } catch (err) {
        console.error("Error fetching user listings:", err);
        userListings = [];
        renderUserListings();
    }
}

function renderUserListings() {
    const container = document.getElementById("user-listings");
    if (!container) return;

    container.innerHTML = "";

    if (!userListings || userListings.length === 0) {
        const empty = document.createElement("div");
        empty.className = "empty-state text-center py-10";
        empty.innerHTML = `
            <div class="text-4xl mb-4">📖</div>
            <h4 class="text-lg font-semibold text-gray-900 mb-2">No listings yet</h4>
            <p class="text-gray-600 mb-4">Start selling by listing your first book!</p>
            <button onclick="showTab('sell')" class="bg-indigo-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-indigo-700">List a Book</button>
        `;
        container.appendChild(empty);
        return;
    }

    userListings.forEach(b => {
        const card = document.createElement("div");
        card.className = "flex items-center justify-between p-4 border border-gray-200 rounded-lg mb-3 bg-white";
        card.innerHTML = `
            <div class="flex items-center space-x-4 flex-1">
                <div class="w-16 h-16 bg-gradient-to-br from-indigo-400 to-purple-500 rounded-lg flex items-center justify-center flex-shrink-0">
                    <span class="text-white text-xl">📖</span>
                </div>
                <div class="flex-1">
                    <h4 class="font-semibold text-gray-900">${b.title || 'Unknown Title'}</h4>
                    <p class="text-sm text-gray-600">${b.author || 'Unknown Author'}</p>
                    <p class="text-sm text-gray-500">Listed ${b.dateAdded ? new Date(b.dateAdded).toLocaleDateString() : 'Unknown date'} • ₹${b.price || 0}</p>
                </div>
            </div>
            <div class="flex items-center space-x-2">
                <button onclick="deleteListing('${b._id}')" 
                        class="bg-red-600 text-white p-2 rounded-lg hover:bg-red-700 transition-colors flex items-center space-x-1"
                        title="Delete listing">
                    <span>🗑️</span>
                    <span class="text-sm hidden sm:inline">Delete</span>
                </button>
            </div>
        `;
        container.appendChild(card);
    });
}

// =========================
// SIMPLIFIED CHAT FUNCTIONS (For now)
// =========================
// =========================
// COMPLETE CHAT SYSTEM IMPLEMENTATION
// =========================

// Toggle chat widget
function toggleChat() {
    if (!isLoggedIn) {
        alert("Please log in to access messages!");
        return;
    }
    
    const widget = document.getElementById('messages-widget');
    if (!widget) {
        console.error('Messages widget not found');
        return;
    }
    
    widget.classList.toggle('hidden');
    
    if (!widget.classList.contains('hidden')) {
        // Load data when opening chat
        initializeChat();
    }
}

// Initialize chat data
async function initializeChat() {
    try {
        await fetchConversations();
        await fetchPendingRequests();
    } catch (error) {
        console.error('Error initializing chat:', error);
    }
}

// Buyer shows interest in a book
async function showInterest(bookId) {
    if (!currentUser) {
        alert("Please log in to show interest!");
        return;
    }

    const token = localStorage.getItem('token');
    if (!token) {
        alert("Please log in again!");
        return;
    }

    try {
        const res = await fetch('http://localhost:5000/api/conversations', {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ 
                bookId: bookId
            })
        });

        if (!res.ok) {
            const errorData = await res.json().catch(() => ({ error: 'Unknown error' }));
            throw new Error(errorData.error || `HTTP error! status: ${res.status}`);
        }

        const data = await res.json();
        
        if (data.success) {
            alert("✅ " + data.message);
        } else {
            alert("❌ " + (data.error || "Failed to show interest"));
        }
    } catch(err) {
        console.error('Error showing interest:', err);
        alert("❌ " + (err.message || "Error showing interest. Please try again."));
    }
}

// Fetch pending requests for seller
// Fetch pending requests for seller
async function fetchPendingRequests() {
    if (!currentUser || !currentUser._id) {
        console.log('No user logged in for pending requests');
        return;
    }

    const token = localStorage.getItem('token');
    const container = document.getElementById('seller-pending-requests-list-widget');
    
    if (!container) {
        console.error('Pending requests container not found');
        return;
    }

    try {
        const res = await fetch(`http://localhost:5000/api/conversations/pending/${currentUser._id}`, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });
        
        if (!res.ok) {
            throw new Error(`HTTP error! status: ${res.status}`);
        }
        
        const data = await res.json();
        
        if (!data.pending || data.pending.length === 0) {
            container.innerHTML = `
                <div class="p-4 text-center">
                    <p class="text-gray-500 text-sm">No pending requests</p>
                    <p class="text-xs text-gray-400 mt-1">When buyers show interest, they'll appear here</p>
                </div>
            `;
            return;
        }

        container.innerHTML = data.pending.map(conv => `
            <div class="p-3 border-b border-gray-100 bg-white hover:bg-gray-50 transition-colors">
                <div class="flex items-start space-x-2 mb-2">
                    <div class="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                        <span class="text-green-600 font-semibold text-xs">
                            ${conv.buyerId?.username?.charAt(0)?.toUpperCase() || 'U'}
                        </span>
                    </div>
                    <div class="flex-1 min-w-0">
                        <p class="font-medium text-gray-900 text-sm truncate">${conv.buyerId?.username || 'Unknown User'}</p>
                        <p class="text-xs text-gray-600 truncate">Interested in: ${conv.bookId?.title || 'Unknown Book'}</p>
                    </div>
                </div>
                <div class="flex gap-1">
                    <button onclick="handleRequest('${conv._id}', 'accepted')" 
                            class="flex-1 px-2 py-1 bg-green-600 text-white rounded text-xs font-medium hover:bg-green-700 transition-colors">
                        ✅ Accept
                    </button>
                    <button onclick="handleRequest('${conv._id}', 'rejected')" 
                            class="flex-1 px-2 py-1 bg-red-600 text-white rounded text-xs font-medium hover:bg-red-700 transition-colors">
                        ❌ Reject
                    </button>
                </div>
            </div>
        `).join('');
    } catch(err) { 
        console.error('Error fetching pending requests:', err);
        container.innerHTML = `
            <div class="p-4 text-center">
                <p class="text-red-500 text-sm">Error loading requests</p>
                <p class="text-xs text-gray-400 mt-1">Please try again later</p>
            </div>
        `;
    }
}
// Global variable to track hover state
let isHoveringChat = false;
let chatCloseTimer = null;

// Modified toggleChat function
function toggleChat(forceClose = false) {
    if (!isLoggedIn) {
        alert("Please log in to access messages!");
        return;
    }
    
    const widget = document.getElementById('messages-widget');
    if (!widget) {
        console.error('Messages widget not found');
        return;
    }
    
    if (forceClose) {
        // Force close the chat
        widget.classList.add('hidden');
        widget.classList.add('chat-hidden');
        isHoveringChat = false;
        if (chatCloseTimer) {
            clearTimeout(chatCloseTimer);
            chatCloseTimer = null;
        }
        return;
    }
    
    const isHidden = widget.classList.contains('hidden');
    
    if (isHidden) {
        // Opening chat
        widget.classList.remove('hidden');
        widget.classList.remove('chat-hidden');
        initializeChat();
        
        // Add event listeners when opening
        addChatEventListeners();
    } else {
        // Closing chat
        widget.classList.add('hidden');
        widget.classList.add('chat-hidden');
        removeChatEventListeners();
    }
}

// Add event listeners for hover and click outside
function addChatEventListeners() {
    const widget = document.getElementById('messages-widget');
    if (!widget) return;
    
    // Mouse enter event
    widget.addEventListener('mouseenter', handleChatMouseEnter);
    
    // Mouse leave event
    widget.addEventListener('mouseleave', handleChatMouseLeave);
    
    // Click outside event (added to document)
    document.addEventListener('click', handleClickOutside);
    
    // Also add to the chat button if you have one
    const chatButton = document.querySelector('[onclick*="toggleChat"]');
    if (chatButton) {
        chatButton.addEventListener('click', handleChatButtonClick);
    }
}

// Remove event listeners when chat closes
function removeChatEventListeners() {
    const widget = document.getElementById('messages-widget');
    if (!widget) return;
    
    widget.removeEventListener('mouseenter', handleChatMouseEnter);
    widget.removeEventListener('mouseleave', handleChatMouseLeave);
    document.removeEventListener('click', handleClickOutside);
    
    const chatButton = document.querySelector('[onclick*="toggleChat"]');
    if (chatButton) {
        chatButton.removeEventListener('click', handleChatButtonClick);
    }
}

// Handle mouse enter on chat
function handleChatMouseEnter() {
    isHoveringChat = true;
    if (chatCloseTimer) {
        clearTimeout(chatCloseTimer);
        chatCloseTimer = null;
    }
}

// Handle mouse leave on chat
function handleChatMouseLeave() {
    isHoveringChat = false;
    
    // Close after 1 second of not hovering
    chatCloseTimer = setTimeout(() => {
        if (!isHoveringChat) {
            toggleChat(true);
        }
    }, 1000);
}

// Handle clicks outside the chat
function handleClickOutside(event) {
    const widget = document.getElementById('messages-widget');
    const chatButton = document.querySelector('[onclick*="toggleChat"]');
    
    if (!widget || widget.classList.contains('hidden')) return;
    
    // Check if click is outside both chat widget and chat button
    const isClickInsideChat = widget.contains(event.target);
    const isClickOnChatButton = chatButton && chatButton.contains(event.target);
    
    if (!isClickInsideChat && !isClickOnChatButton) {
        toggleChat(true);
    }
}

// Handle chat button click specifically
function handleChatButtonClick(event) {
    event.stopPropagation();
    // This prevents the click outside handler from immediately closing the chat
    if (chatCloseTimer) {
        clearTimeout(chatCloseTimer);
        chatCloseTimer = null;
    }
}

// Also update your existing goBack function to prevent unwanted closes
function goBack() {
    const chatRoomView = document.getElementById('chat-room-view');
    const conversationsList = document.getElementById('conversations-list');
    
    if (chatRoomView) chatRoomView.classList.add('hidden');
    if (conversationsList) conversationsList.classList.remove('hidden');
    currentChatId = null;
    
    // Reset hover state when navigating within chat
    isHoveringChat = true;
    if (chatCloseTimer) {
        clearTimeout(chatCloseTimer);
        chatCloseTimer = null;
    }
}
// Seller approves/rejects request
async function handleRequest(convId, status) {
    const token = localStorage.getItem('token');
    
    if (!token) {
        alert("Please log in again!");
        return;
    }

    try {
        const res = await fetch(`http://localhost:5000/api/conversations/${convId}/approve`, {
            method: 'PUT',
            headers: { 
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ status })
        });
        
        if (!res.ok) {
            throw new Error(`HTTP error! status: ${res.status}`);
        }
        
        const data = await res.json();
        
        if (data.success) {
            const action = status === 'accepted' ? 'accepted' : 'rejected';
            alert(`✅ Request ${action} successfully!`);
            
            // Refresh the data
            await fetchPendingRequests();
            if (status === 'accepted') {
                await fetchConversations();
            }
        } else {
            alert("❌ " + (data.error || "Failed to process request"));
        }
    } catch(err) { 
        console.error('Error handling request:', err);
        alert("❌ Error processing request. Please try again.");
    }
}

// Fetch user's conversations
async function fetchConversations() {
    if (!currentUser || !currentUser._id) {
        console.log('No user logged in for conversations');
        return;
    }

    const token = localStorage.getItem('token');
    
    try {
        const res = await fetch(`http://localhost:5000/api/conversations/${currentUser._id}`, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });
        
        if (!res.ok) {
            throw new Error(`HTTP error! status: ${res.status}`);
        }
        
        const data = await res.json();
        
        if (data.success) {
            conversations = data.conversations || [];
            updateConversationsList();
        } else {
            console.error('API error:', data.error);
        }
    } catch(err) { 
        console.error('Error fetching conversations:', err);
        // Show demo data if API fails
        showDemoConversations();
    }
}

// Update conversations list in UI
function updateConversationsList() {
    const list = document.getElementById('conversations-list');
    if (!list) {
        console.error('Conversations list element not found');
        return;
    }

    if (!conversations.length) {
        list.innerHTML = `
            <div class="p-6 text-center">
                <div class="text-4xl mb-3">💬</div>
                <p class="text-gray-500 text-sm">No conversations yet</p>
                <p class="text-xs text-gray-400 mt-1">When sellers accept your requests, they'll appear here</p>
            </div>
        `;
        return;
    }
    
    list.innerHTML = conversations.map(conv => {
        const otherUser = currentUser._id === conv.buyerId?._id ? conv.sellerId : conv.buyerId;
        const lastMsgTime = conv.lastMessageAt ? formatMessageTime(new Date(conv.lastMessageAt)) : '';
        const lastMessage = conv.lastMessage || 'No messages yet';
        
        return `
        <div onclick="openChatRoom('${conv._id}')" 
             class="p-4 border-b border-gray-200 hover:bg-gray-50 cursor-pointer transition-colors">
            <div class="flex items-center space-x-3">
                <div class="w-12 h-12 bg-indigo-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <span class="text-indigo-600 font-semibold text-sm">
                        ${otherUser?.username?.charAt(0)?.toUpperCase() || 'U'}
                    </span>
                </div>
                <div class="flex-1 min-w-0">
                    <div class="flex justify-between items-start mb-1">
                        <h4 class="font-semibold text-gray-900 text-sm truncate">
                            ${otherUser?.username || 'Unknown User'}
                        </h4>
                        <span class="text-xs text-gray-500 whitespace-nowrap">${lastMsgTime}</span>
                    </div>
                    <p class="text-xs text-gray-600 truncate mb-1">${lastMessage}</p>
                    <p class="text-xs text-gray-400">Book: ${conv.bookId?.title || 'Unknown'}</p>
                </div>
            </div>
        </div>`;
    }).join('');
}

// Format message time
function formatMessageTime(date) {
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMins < 1) return 'now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
}

// Open chat room
async function openChatRoom(convId) {
    currentChatId = convId;
    const conv = conversations.find(c => c._id === convId);
    
    if (!conv) {
        alert("Conversation not found!");
        return;
    }

    const otherUser = currentUser._id === conv.buyerId._id ? conv.sellerId : conv.buyerId;

    // Update UI to show chat room
    const conversationsList = document.getElementById('conversations-list');
    const chatRoomView = document.getElementById('chat-room-view');
    const chatHeaderName = document.getElementById('chat-header-name');
    const chatHeaderBook = document.getElementById('chat-header-book');

    if (conversationsList) conversationsList.classList.add('hidden');
    if (chatRoomView) chatRoomView.classList.remove('hidden');
    if (chatHeaderName) chatHeaderName.textContent = otherUser.username || 'Unknown User';
    if (chatHeaderBook) chatHeaderBook.textContent = `Re: ${conv.bookId?.title || 'Unknown Book'}`;

    await renderChatMessages(convId);
}

// Render messages in chat
async function renderChatMessages(convId) {
    const token = localStorage.getItem('token');
    const container = document.getElementById('chat-messages-container');
    
    if (!container) {
        console.error('Chat messages container not found');
        return;
    }

    // Show loading
    container.innerHTML = `
        <div class="flex justify-center items-center py-8">
            <div class="animate-spin rounded-full h-6 w-6 border-b-2 border-indigo-600"></div>
        </div>
    `;

    try {
        const res = await fetch(`http://localhost:5000/api/messages/${convId}`, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });
        
        if (!res.ok) {
            throw new Error(`HTTP error! status: ${res.status}`);
        }
        
        const data = await res.json();
        
        container.innerHTML = '';
        
        if (data.messages && data.messages.length > 0) {
            data.messages.forEach(m => {
                const isCurrentUser = m.senderId._id === currentUser._id;
                const messageDiv = document.createElement('div');
                
                messageDiv.className = `flex ${isCurrentUser ? 'justify-end' : 'justify-start'} mb-4`;
                messageDiv.innerHTML = `
                    <div class="max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                        isCurrentUser 
                            ? 'bg-indigo-600 text-white' 
                            : 'bg-gray-200 text-gray-800'
                    } shadow-sm">
                        <p class="text-sm">${m.message}</p>
                        <p class="text-xs mt-1 opacity-70 ${
                            isCurrentUser ? 'text-indigo-200' : 'text-gray-600'
                        }">
                            ${formatMessageTime(new Date(m.createdAt))}
                        </p>
                    </div>
                `;
                container.appendChild(messageDiv);
            });
        } else {
            container.innerHTML = `
                <div class="text-center py-8">
                    <div class="text-4xl mb-3">💬</div>
                    <p class="text-gray-500">No messages yet</p>
                    <p class="text-sm text-gray-400 mt-1">Start the conversation!</p>
                </div>
            `;
        }
        
        // Scroll to bottom
        container.scrollTop = container.scrollHeight;
    } catch(err) {
        console.error('Error loading messages:', err);
        container.innerHTML = `
            <div class="text-center py-8">
                <p class="text-red-500">Error loading messages</p>
                <p class="text-sm text-gray-400 mt-1">Please try again later</p>
            </div>
        `;
    }
}

// Send message
async function sendChatMessage() {
    if (!currentChatId) {
        alert("Please select a conversation first!");
        return;
    }
    
    const input = document.getElementById('chat-input-field');
    if (!input) {
        console.error('Chat input field not found');
        return;
    }
    
    const msg = input.value.trim();
    
    if (!msg) {
        alert("Please enter a message");
        return;
    }

    const token = localStorage.getItem('token');
    if (!token) {
        alert("Please log in again!");
        return;
    }

    try {
        const res = await fetch(`http://localhost:5000/api/messages/${currentChatId}`, {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ 
                message: msg
            })
        });
        
        if (!res.ok) {
            throw new Error(`HTTP error! status: ${res.status}`);
        }
        
        const data = await res.json();
        
        if (data.success) {
            input.value = '';
            await renderChatMessages(currentChatId); // Refresh messages
            await fetchConversations(); // Update conversations list
        } else {
            alert("❌ " + (data.error || "Failed to send message"));
        }
    } catch(err) { 
        console.error('Error sending message:', err);
        alert("❌ Error sending message. Please try again.");
    }
}

// Quick replies
function sendQuickReply(msg) {
    if (!currentChatId) {
        alert("Please select a conversation first!");
        return;
    }
    
    const input = document.getElementById('chat-input-field');
    if (input) {
        input.value = msg;
        sendChatMessage();
    }
}

// Go back to conversations list
function goBack() {
    const chatRoomView = document.getElementById('chat-room-view');
    const conversationsList = document.getElementById('conversations-list');
    
    if (chatRoomView) chatRoomView.classList.add('hidden');
    if (conversationsList) conversationsList.classList.remove('hidden');
    currentChatId = null;
}

// Demo data for testing (if backend is not ready)
function showDemoConversations() {
    const list = document.getElementById('conversations-list');
    if (!list) return;

    list.innerHTML = `
        <div class="p-6 text-center">
            <div class="text-4xl mb-3">🚧</div>
            <p class="text-gray-500 text-sm">Chat backend not connected</p>
            <p class="text-xs text-gray-400 mt-1">Make sure your server is running on localhost:5000</p>
            <button onclick="showDemoChat()" class="mt-3 px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm hover:bg-indigo-700">
                View Demo Chat
            </button>
        </div>
    `;
}

function showDemoChat() {
    const container = document.getElementById('chat-messages-container');
    if (!container) return;

    container.innerHTML = `
        <div class="flex justify-start mb-4">
            <div class="max-w-xs lg:max-w-md px-4 py-2 rounded-lg bg-gray-200 text-gray-800 shadow-sm">
                <p class="text-sm">Hi! I'm interested in your book. Is it still available?</p>
                <p class="text-xs mt-1 opacity-70 text-gray-600">2 hours ago</p>
            </div>
        </div>
        <div class="flex justify-end mb-4">
            <div class="max-w-xs lg:max-w-md px-4 py-2 rounded-lg bg-indigo-600 text-white shadow-sm">
                <p class="text-sm">Yes, it's available! When would you like to pick it up?</p>
                <p class="text-xs mt-1 opacity-70 text-indigo-200">1 hour ago</p>
            </div>
        </div>
        <div class="flex justify-start mb-4">
            <div class="max-w-xs lg:max-w-md px-4 py-2 rounded-lg bg-gray-200 text-gray-800 shadow-sm">
                <p class="text-sm">Can I come by tomorrow afternoon around 3 PM?</p>
                <p class="text-xs mt-1 opacity-70 text-gray-600">30 minutes ago</p>
            </div>
        </div>
    `;
}

// Add Enter key support for chat input
document.addEventListener('DOMContentLoaded', function() {
    const chatInput = document.getElementById('chat-input-field');
    if (chatInput) {
        chatInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                sendChatMessage();
            }
        });
    }
});

// =========================
// SAFE INITIALIZATION
// =========================
document.addEventListener("DOMContentLoaded", async function() {
    console.log("DOM fully loaded, initializing app...");
    
    try {
        // Check for existing user session
        const savedUser = localStorage.getItem("user");
        const token = localStorage.getItem("token");
        
        if (savedUser && token) {
            try {
                currentUser = JSON.parse(savedUser);
                isLoggedIn = true;
                console.log("User found in storage:", currentUser.username);
                updateUserInterface();
            } catch (parseError) {
                console.error("Error parsing saved user:", parseError);
                localStorage.removeItem("user");
                localStorage.removeItem("token");
            }
        } else {
            // Show login modal if no user session
            const loginModal = getElement("login-modal");
            if (loginModal) {
                loginModal.classList.remove("hidden");
            }
            console.log("No user session found, showing login modal");
        }

        // Load books
        await fetchBooks();
        
        // Load user listings if logged in
        if (isLoggedIn) {
            await fetchUserListings();
        }
        
        // Show home tab by default
        showTab("home");
        
        console.log("App initialized successfully!");
        
    } catch (error) {
        console.error("Error during initialization:", error);
        alert("Error loading the application. Please refresh the page.");
    }
});

async function deleteListing(bookId) {
  const book = userListings.find(b => b._id === bookId);
  if (!book) return;

  if (!confirm(`Are you sure you want to delete "${book.title}" from your listings?`)) return;

  try {
    const res = await fetch(`http://localhost:5000/api/books/${bookId}?userId=${currentUser._id}`, {
      method: "DELETE",
    });

    const data = await res.json();

    if (res.ok) {
      // remove from state
      books = books.filter(b => b._id !== bookId);
      userListings = userListings.filter(b => b._id !== bookId);
      renderBookFeed();
      renderUserListings();
      alert(data.message || "Listing deleted successfully! 🗑️");
    } else {
      alert(data.error || "Failed to delete listing");
    }
  } catch (err) {
    console.error("Delete error:", err);
    alert("Something went wrong while deleting listing");
  }
}

function sortBooks(criteria) {
    console.log("Sorting by:", criteria);
    // Basic implementation
    if (criteria === "price") {
        books.sort((a, b) => (a.price || 0) - (b.price || 0));
    } else if (criteria === "newest") {
        books.sort((a, b) => new Date(b.dateAdded || 0) - new Date(a.dateAdded || 0));
    }
    renderBookFeed();
}

function searchBooks() {
    const query = getElement("search-input")?.value.toLowerCase() || "";
    console.log("Searching for:", query);
    // Basic search implementation
    const results = books.filter(book => 
        book.title?.toLowerCase().includes(query) || 
        book.author?.toLowerCase().includes(query)
    );
    
    const container = getElement("search-results");
    if (container) {
        container.innerHTML = "";
        results.forEach(book => {
            const card = document.createElement("div");
            card.innerHTML = createBookCard(book);
            if (card.firstElementChild) {
                container.appendChild(card.firstElementChild);
            }
        });
    }
}
// =========================
// PROFILE EDIT FORM HANDLER
// =========================
function openEditProfile() {
  if (!currentUser) return alert("Please log in first!");

  document.getElementById("edit-username").value = currentUser.username ||"";
  document.getElementById("edit-email").value = currentUser.email || "";
  document.getElementById("edit-phone").value = currentUser.phone || "";
  document.getElementById("edit-location").value = currentUser.location || "";
  document.getElementById("edit-bio").value = currentUser.bio || "";

  document.getElementById("edit-profile-modal").classList.remove("hidden");
}

function closeEditProfile() {
  document.getElementById("edit-profile-modal").classList.add("hidden");
}

async function handleEditProfile() {
  if (!currentUser) return alert("Not logged in!");

  const updates = {
    username: document.getElementById("edit-username").value,
    email:     document.getElementById("edit-email").value,
    phone:     document.getElementById("edit-phone").value,
    location:  document.getElementById("edit-location").value,
    bio:       document.getElementById("edit-bio").value,
  };

  try {
    const res = await fetch(`http://localhost:5000/api/auth/profile/${currentUser._id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updates),
    });

    const updatedUser = await res.json();

    if (res.ok) {
      currentUser = updatedUser.user;
      localStorage.setItem("user", JSON.stringify(updatedUser));
      updateUserInterface();
      closeEditProfile();
      showSuccessMessage("✅ Profile updated successfully!");
    } else {
      alert(updatedUser.error || "Failed to update profile");
    }
  } catch (err) {
    console.error("Profile update error:", err);
    alert("Something went wrong while updating profile");
  }
}
document.getElementById("edit-profile-form").addEventListener("submit", function (e) {
  e.preventDefault();
  handleEditProfile();
})
