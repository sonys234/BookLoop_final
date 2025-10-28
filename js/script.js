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
let isHoveringChat = false;
let chatCloseTimer = null;

// Global variable for uploaded images
let uploadedImages = [];

// Image modal variables
let currentBookImages = [];
let currentImageIndex = 0;

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
// SIMPLE IMAGE UPLOAD SYSTEM
// =========================

// Handle multiple file selection
function handlePhotoUpload(event) {
    console.log("🔄 handlePhotoUpload called");
    const files = event.target.files;
    
    if (!files || files.length === 0) {
        console.log("❌ No files selected");
        return;
    }
    
    console.log(`📁 Files selected: ${files.length}`);
    
    // Check total images won't exceed 5
    const totalAfterUpload = uploadedImages.length + files.length;
    if (totalAfterUpload > 5) {
        alert(`You can upload maximum 5 images. You already have ${uploadedImages.length} images selected.`);
        event.target.value = '';
        return;
    }
    
    // Add all files to uploadedImages
    Array.from(files).forEach((file, index) => {
        console.log(`📸 Processing file ${index + 1}:`, file.name, file.type, file.size);
        
        if (!file.type.startsWith('image/')) {
            alert('Please upload only image files');
            return;
        }
        
        uploadedImages.push(file);
    });
    
    console.log(`✅ Total images after upload: ${uploadedImages.length}`);
    updatePhotoPreview();
    event.target.value = '';
}

// Update photo preview (simple version)
// Update photo preview (simple version - only images with remove button)
function updatePhotoPreview() {
    console.log("🔄 updatePhotoPreview called");
    
    const preview = document.getElementById('photo-preview');
    const container = document.getElementById('image-preview-container');
    const imageCount = document.getElementById('image-count');
    
    console.log("📋 Elements found:", {
        preview: !!preview,
        container: !!container,
        imageCount: !!imageCount
    });
    
    if (!preview || !container) {
        console.error("❌ Missing required elements");
        return;
    }
    
    container.innerHTML = '';
    console.log(`📊 Uploaded images count: ${uploadedImages.length}`);
    
    if (uploadedImages.length === 0) {
        console.log("📭 No images to display, hiding preview");
        preview.classList.add('hidden');
        return;
    }
    
    console.log("👁️ Showing preview section");
    preview.classList.remove('hidden');
    imageCount.textContent = `${uploadedImages.length}/5 images`;
    
    let imagesProcessed = 0;
    
    // Create simple preview items - only image with remove button
    uploadedImages.forEach((file, index) => {
        console.log(`🖼️ Processing image ${index}:`, file.name);
        
        const reader = new FileReader();
        
        reader.onload = function(e) {
            imagesProcessed++;
            console.log(`✅ File ${index} loaded successfully: ${file.name}`);
            
            const item = document.createElement('div');
            item.className = 'image-preview-item';
            
            item.innerHTML = `
                <div class="relative">
                    <img src="${e.target.result}" alt="Preview" class="preview-image">
                    
                    <!-- Remove Button - Top Right Corner -->
                    <button type="button" class="remove-btn" onclick="removeImage(${index})" title="Remove image">
                        ✕
                    </button>
                </div>
            `;
            
            container.appendChild(item);
            console.log(`✅ Added image ${index} to container`);
            
            // Check if all images are processed
            if (imagesProcessed === uploadedImages.length) {
                console.log("🎉 All images processed and added to preview");
            }
        };
        
        reader.onerror = function(error) {
            console.error(`❌ Error reading file ${index}:`, error);
            imagesProcessed++;
        };
        
        reader.readAsDataURL(file);
    });
}

// Remove image
function removeImage(index) {
    console.log(`🗑️ removeImage called: index=${index}`);
    
    if (confirm('Are you sure you want to remove this image?')) {
        uploadedImages.splice(index, 1);
        console.log(`✅ Removed image ${index}, remaining: ${uploadedImages.length}`);
        updatePhotoPreview();
    }
}

// Get images for form submission
function getImagesForSubmission() {
    console.log("📦 Images for submission:", uploadedImages.length);
    return uploadedImages;
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
            
            // Update pending requests visibility after login
            updatePendingRequestsVisibility();
            
            showSuccessMessage("🎉 Login successful!");
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
    showSuccessMessage("👋 Signed out successfully!");
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

    const navbarAvatar = getElement("navbar-avatar");
    if (navbarAvatar) {
        navbarAvatar.textContent = (currentUser.username?.charAt(0) || "?").toUpperCase();
    }

    const profileNameElem = getElement("profile-name");
    if (profileNameElem) {
        profileNameElem.textContent = currentUser.username || "Unknown User";
    }

    const fullNameElem = getElement("profile-fullname");
    if (fullNameElem) {
        fullNameElem.textContent = `${currentUser.firstName || ""} ${currentUser.lastName || ""}`.trim();
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

    console.log("📤 Starting book listing process...");
    const token = localStorage.getItem("token");
    const user = JSON.parse(localStorage.getItem("user"));
    if (!user || !token) {
        alert("Please log in first!");
        return;
    }

    const title = document.getElementById("book-title").value.trim();
    const author = document.getElementById("book-author").value.trim();
    const genre = document.getElementById("book-genre").value.trim();
    const condition = document.getElementById("book-condition").value.trim();
    const price = document.getElementById("book-price").value.trim();
    const description = document.getElementById("book-description").value.trim();

    const area = document.getElementById("book-area").value.trim();
    const city = document.getElementById("book-city").value.trim();
    const state = document.getElementById("book-state").value.trim();
    const country = document.getElementById("book-country").value.trim();

    // Validation
    if (!title || !author || !genre || !condition || !price || !area || !city || !country) {
        alert("Please fill in all required fields!");
        return;
    }

    const location = { area, city, state, country };

    // ✅ Build form data (must be multipart/form-data)
    const formData = new FormData();
    formData.append("title", title);
    formData.append("author", author);
    formData.append("genre", genre);
    formData.append("condition", condition);
    formData.append("price", price);
    formData.append("description", description);
    formData.append("seller", user.id || user._id);
    formData.append("location", JSON.stringify(location));

    // Get images
    const images = getImagesForSubmission();
    console.log("📸 Images to upload:", images.length);
    
    // Check if we have images
    if (images.length === 0) {
        alert("Please upload at least one image for your book!");
        return;
    }
    
    // Process images
    images.forEach((file, index) => {
        console.log(`  - Image ${index + 1}: ${file.name}`);
        formData.append("images", file);
    });

    try {
        // Show loading state
        const submitBtn = e.target.querySelector('button[type="submit"]');
        const originalText = submitBtn.textContent;
        submitBtn.textContent = "Listing Book...";
        submitBtn.disabled = true;

        const res = await fetch("http://localhost:5000/api/books", {
            method: "POST",
            headers: {
                Authorization: `Bearer ${token}`,
            },
            body: formData,
        });

        const data = await res.json();
        console.log("📥 Response received:", res.status, data);

        if (!res.ok) throw new Error(data.error || "Book listing failed");

        console.log("✅ Book listed successfully:", data);

        // ✅ FIX: Properly reset the form and image state
        resetSellForm();

        // SUCCESS: Refresh data and show home tab
        showSuccessMessage("✅ Book listed successfully!");
        
        // Refresh books list immediately
        await fetchBooks();
        
        // Refresh user listings
        await fetchUserListings();
        
        // Show home tab to see the new book
        showTab('home');
        
        // Force re-render of book feed
        renderBookFeed();

    } catch (err) {
        console.error("❌ Failed to list book:", err);
        alert("Error: " + err.message);
        
        // Reset button on error too
        const submitBtn = e.target.querySelector('button[type="submit"]');
        submitBtn.textContent = "List Book";
        submitBtn.disabled = false;
    }
}

// ✅ NEW FUNCTION: Reset sell form completely
function resetSellForm() {
    console.log("🔄 Resetting sell form...");
    
    // Reset form fields
    const form = document.querySelector('#sell-tab form');
    if (form) {
        form.reset();
    }
    
    // Reset uploaded images array
    uploadedImages = [];
    
    // Reset file input
    const fileInput = document.getElementById('photo-input');
    if (fileInput) {
        fileInput.value = '';
    }
    
    // Hide and clear photo preview
    const photoPreview = document.getElementById('photo-preview');
    if (photoPreview) {
        photoPreview.innerHTML = '';
        photoPreview.classList.add('hidden');
    }
    
    console.log("✅ Sell form reset complete");
}

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
    "fantasy": "🐉",
    "biography": "👤",
    "academic": "🎓",
    "children": "🧒",
    "self-help": "💪"
};

    const safeBook = {
        _id: book._id || 'unknown',
        title: book.title || 'Unknown Title',
        author: book.author || 'Unknown Author',
        genre: book.genre || 'fiction',
        condition: book.condition || 'new',
        price: book.price || 0,
        location: book.location || {},
        images: book.images || [],
        description: book.description || '',
        seller: book.seller || {},
        dateAdded: book.dateAdded || book.createdAt || new Date()
    };

    // Get seller name (handle both populated seller object and direct seller string)
    let sellerName = 'Unknown Seller';
    if (safeBook.seller) {
        if (typeof safeBook.seller === 'object') {
            sellerName = safeBook.seller.username || 
                        (safeBook.seller.firstName && safeBook.seller.lastName 
                            ? `${safeBook.seller.firstName} ${safeBook.seller.lastName}` 
                            : 'Unknown Seller');
        } else {
            sellerName = safeBook.seller;
        }
    }

    // Format listing date
    const listingDate = new Date(safeBook.dateAdded);
    const timeAgo = getTimeAgo(listingDate);
    const formattedDate = listingDate.toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'short', 
        day: 'numeric' 
    });

    // Get location display text
    const locationText = safeBook.location.area && safeBook.location.city 
        ? `${safeBook.location.area}, ${safeBook.location.city}`
        : 'Unknown Location';

    // Create a safe string for the book data
    const bookDataString = JSON.stringify(safeBook).replace(/'/g, "&#39;").replace(/"/g, "&quot;");

    // Determine what to show in the image area
    let imageContent = '';
    if (safeBook.images && safeBook.images.length > 0) {
        // Show the first image with proper aspect ratio and click handler for gallery
        imageContent = `
            <div class="h-64 bg-gray-100 flex items-center justify-center cursor-pointer overflow-hidden relative" 
                 onclick="openImageModal('${bookDataString}', 0)">
                <img src="${safeBook.images[0].url}" 
                     alt="${safeBook.title}" 
                     class="w-full h-full object-contain p-2 hover:scale-105 transition-transform duration-300">
                ${safeBook.images.length > 1 ? `
                    <div class="absolute bottom-3 right-3 bg-black bg-opacity-70 text-white text-xs px-2 py-1 rounded-full">
                        +${safeBook.images.length - 1}
                    </div>
                ` : ''}
                <div class="absolute inset-0 bg-black bg-opacity-0 hover:bg-opacity-10 transition-all duration-300 flex items-center justify-center">
                    <span class="text-white text-lg font-semibold opacity-0 hover:opacity-100 transition-opacity duration-300">
                        👁️ View Images
                    </span>
                </div>
            </div>
        `;
    } else {
        // Show genre emoji as fallback
        imageContent = `
            <div class="h-64 bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center cursor-pointer relative"
                 onclick="openImageModal('${bookDataString}', 0)">
                <span class="text-white text-5xl">${genreEmojis[safeBook.genre] || "📖"}</span>
                <div class="absolute inset-0 bg-black bg-opacity-0 hover:bg-opacity-20 transition-all duration-300 flex items-center justify-center">
                    <span class="text-white text-lg font-semibold opacity-0 hover:opacity-100 transition-opacity duration-300">
                        No Images Available
                    </span>
                </div>
            </div>
        `;
    }

    return `
    <div class="book-card bg-white rounded-lg shadow-md overflow-hidden hover:shadow-xl transition-all duration-300 border border-gray-100">
        ${imageContent}
        <div class="p-4">
            <h3 class="font-semibold text-gray-900 mb-1 truncate" title="${safeBook.title}">${safeBook.title}</h3>
            <p class="text-sm text-gray-600 mb-2 truncate">${safeBook.author} • ${safeBook.genre}</p>
            
            <!-- NEW: Seller and Date Information -->
            <div class="flex items-center justify-between mb-2">
                <div class="flex items-center space-x-2 text-xs text-gray-500">
                    <span class="flex items-center">
                        <svg class="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path>
                        </svg>
                        ${sellerName}
                    </span>
                    <span>•</span>
                    <span class="flex items-center" title="${formattedDate}">
                        <svg class="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
                        </svg>
                        ${timeAgo}
                    </span>
                </div>
            </div>

            <div class="flex items-center justify-between mb-3">
                <span class="text-lg font-bold text-indigo-600">₹${safeBook.price}</span>
                <span class="text-sm ${conditionColors[safeBook.condition] || 'bg-gray-100 text-gray-800'} px-2 py-1 rounded capitalize">
                    ${safeBook.condition?.replace("-", " ") || 'Unknown'}
                </span>
            </div>
            <div class="flex items-center justify-between mt-2">
                <p class="text-xs text-gray-500 truncate flex-1 mr-2" title="${locationText}">📍 ${locationText}</p>
                ${safeBook.description ? `
                    <button onclick="openDescriptionModal('${safeBook.title}', '${safeBook.description.replace(/'/g, "&#39;")}', '${sellerName}')" 
                            class="text-xs text-indigo-600 hover:text-indigo-800 whitespace-nowrap bg-indigo-50 px-2 py-1 rounded transition-colors">
                        📝 Details
                    </button>
                ` : ''}
            </div>
            <button 
                onclick="showInterest('${safeBook._id}')" 
                class="w-full mt-3 bg-indigo-600 text-white py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors duration-200 shadow-sm hover:shadow-md">
                Interested
            </button>
        </div>
    </div>
    `;
}

// Helper functions
function getTimeAgo(date) {
    const now = new Date();
    const diffMs = now - new Date(date);
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays}d ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)}w ago`;
    return new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function getConditionText(condition) {
    const conditions = {
        "new": "New",
        "slightly-used": "Like New", 
        "well-read": "Well Read",
    };
    return conditions[condition] || 'Used';
}

// Helper function to format time ago
function getTimeAgo(date) {
    const now = new Date();
    const diffMs = now - new Date(date);
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays}d ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)}w ago`;
    return new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}



// Helper function to format time ago
function getTimeAgo(date) {
    const now = new Date();
    const diffMs = now - new Date(date);
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays}d ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)}w ago`;
    return new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
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
// FETCH FUNCTIONS
// =========================
async function fetchBooks() {
    try {
        console.log("🔄 Fetching books from server...");
        const res = await fetch("http://localhost:5000/api/books");
        if (!res.ok) {
            throw new Error(`Failed to fetch books: ${res.status}`);
        }
        const data = await res.json();
        books = data || [];
        console.log(`📚 Loaded ${books.length} books`);
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
    } else {
        userListings.forEach(b => {
            const card = document.createElement("div");
            card.className = "flex items-center justify-between p-4 border border-gray-200 rounded-lg mb-3 bg-white hover:bg-gray-50 transition-colors";
            card.innerHTML = `
                <div class="flex items-center space-x-4 flex-1">
                    <div class="w-16 h-16 bg-gradient-to-br from-indigo-400 to-purple-500 rounded-lg flex items-center justify-center flex-shrink-0">
                        ${b.images && b.images.length > 0 ? 
                            `<img src="${b.images[0].url}" alt="${b.title}" class="w-full h-full object-cover rounded-lg">` : 
                            `<span class="text-white text-xl">📖</span>`
                        }
                    </div>
                    <div class="flex-1">
                        <h4 class="font-semibold text-gray-900">${b.title || 'Unknown Title'}</h4>
                        <p class="text-sm text-gray-600">${b.author || 'Unknown Author'}</p>
                        <p class="text-sm text-gray-500">Listed ${b.dateAdded ? new Date(b.dateAdded).toLocaleDateString() : 'Unknown date'} • ₹${b.price || 0}</p>
                    </div>
                </div>
                <div class="flex items-center space-x-2">
                    <button onclick="openEditListing('${b._id}')" 
                            class="bg-indigo-600 text-white p-2 rounded-lg hover:bg-indigo-700 transition-colors flex items-center space-x-1"
                            title="Edit listing">
                        <span>✏️</span>
                        <span class="text-sm hidden sm:inline">Edit</span>
                    </button>
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
        const res = await fetch(`http://localhost:5000/api/books/${bookId}?userId=${currentUser._id}`, {
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

        // Remove from local state
        books = books.filter(b => b._id !== bookId);
        userListings = userListings.filter(b => b._id !== bookId);
        
        // Update UI
        renderBookFeed();
        renderUserListings();
        
        showSuccessMessage("🗑️ Listing deleted successfully!");
    } catch (err) {
        console.error("Delete error:", err);
        alert("Error deleting listing: " + err.message);
    }
}

// =========================
// CHAT SYSTEM IMPLEMENTATION
// =========================

// Toggle chat widget
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
        removeChatEventListeners();
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

// Show/hide pending requests based on whether user has any listings
function updatePendingRequests(requests) {
    const pendingSection = document.getElementById('seller-pending-section');
    const pendingList = document.getElementById('seller-pending-requests-list-widget');

    if (!requests || requests.length === 0) {
        pendingSection.classList.add('hidden');
    } else {
        pendingSection.classList.remove('hidden');
        pendingList.innerHTML = ''; // clear old entries
        requests.forEach(req => {
            const div = document.createElement('div');
            div.className = 'p-2 border-b text-sm';
            div.textContent = req; // customize as needed
            pendingList.appendChild(div);
        });
    }
}

async function updatePendingRequestsVisibility() {
    const pendingSection = document.getElementById('seller-pending-section');
    const container = document.getElementById('seller-pending-requests-list-widget');
    if (!pendingSection || !container) return;

    console.log('Checking pending requests for user:', currentUser?._id);

    try {
        const token = localStorage.getItem('token');
        const res = await fetch(`http://localhost:5000/api/conversations/pending/${currentUser._id}`, {
            headers: { 
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });
        if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
        const data = await res.json();

        if (data.pending && data.pending.length > 0) {
            // Show section with actual requests
            pendingSection.classList.remove('hidden');
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
        } else {
            // Hide section completely if no pending requests
            pendingSection.classList.add('hidden');
            container.innerHTML = '';
        }
    } catch(err) {
        console.error('Error updating pending requests:', err);
        pendingSection.classList.add('hidden');
        container.innerHTML = '';
    }
}

// Initialize chat data
async function initializeChat() {
    try {
        await fetchConversations();
        // Update pending requests visibility based on user listings
        updatePendingRequestsVisibility();
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
            showSuccessMessage("✅ " + data.message);
        } else {
            alert("❌ " + (data.error || "Failed to show interest"));
        }
    } catch(err) {
        console.error('Error showing interest:', err);
        alert("❌ " + (err.message || "Error showing interest. Please try again."));
    }
}

// Fetch pending requests for seller
async function fetchPendingRequests() {
    if (!currentUser || !currentUser._id) {
        console.log('No user logged in for pending requests');
        return;
    }

    const token = localStorage.getItem('token');
    const container = document.getElementById('seller-pending-requests-list-widget');
    
    if (!container) {
        console.error('Pending requests container not found - looking for: seller-pending-requests-list-widget');
        return;
    }

    console.log('Fetching pending requests for user:', currentUser._id);

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
        console.log('Pending requests data:', data);
        
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
            showSuccessMessage(`✅ Request ${action} successfully!`);
            
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
    
    // Reset hover state when navigating within chat
    isHoveringChat = true;
    if (chatCloseTimer) {
        clearTimeout(chatCloseTimer);
        chatCloseTimer = null;
    }
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

// =========================
// IMAGE MODAL FUNCTIONS
// =========================
function openImageModal(bookDataString, index = 0) {
    try {
        // Parse the book data string back to object
        const book = JSON.parse(bookDataString.replace(/&#39;/g, "'").replace(/&quot;/g, '"'));
        
        if (!book.images || book.images.length === 0) {
            showSuccessMessage("No images available for this book");
            return;
        }
        
        currentBookImages = book.images;
        currentImageIndex = index;
        
        updateImageModal();
        const modal = document.getElementById('image-modal');
        if (modal) {
            modal.classList.remove('hidden');
            document.body.style.overflow = 'hidden';
        }
        
    } catch (error) {
        console.error('Error opening image modal:', error);
        showSuccessMessage("Error loading images");
    }
}

function closeImageModal() {
    document.getElementById('image-modal').classList.add('hidden');
    document.body.style.overflow = ''; // Restore scrolling
    currentBookImages = [];
    currentImageIndex = 0;
}

function navigateImage(direction) {
    if (currentBookImages.length <= 1) return;
    
    currentImageIndex += direction;
    
    if (currentImageIndex < 0) {
        currentImageIndex = currentBookImages.length - 1;
    } else if (currentImageIndex >= currentBookImages.length) {
        currentImageIndex = 0;
    }
    
    updateImageModal();
}

function updateImageModal() {
    const image = document.getElementById('modal-image');
    const counter = document.getElementById('image-counter');
    const thumbnailStrip = document.getElementById('thumbnail-strip');
    
    if (currentBookImages[currentImageIndex]) {
        image.src = currentBookImages[currentImageIndex].url;
        image.alt = `Book image ${currentImageIndex + 1}`;
    }
    
    counter.textContent = `${currentImageIndex + 1} / ${currentBookImages.length}`;
    
    // Update thumbnails
    thumbnailStrip.innerHTML = '';
    currentBookImages.forEach((img, index) => {
        const thumb = document.createElement('img');
        thumb.src = img.url;
        thumb.alt = `Thumbnail ${index + 1}`;
        thumb.className = `w-16 h-16 object-cover rounded cursor-pointer border-2 transition-all duration-200 ${
            index === currentImageIndex ? 'border-indigo-500 scale-105' : 'border-transparent opacity-70 hover:opacity-100'
        }`;
        thumb.onclick = () => {
            currentImageIndex = index;
            updateImageModal();
        };
        thumbnailStrip.appendChild(thumb);
    });
}

// Description modal function
function openDescriptionModal(title, description, sellerName) {
    const modal = document.getElementById('description-modal');
    const titleElem = document.getElementById('description-title');
    const contentElem = document.getElementById('description-content');
    const sellerElem = document.getElementById('modal-seller-name');
    const noDescElem = document.getElementById('no-description');
    
    if (titleElem) titleElem.textContent = title;
    if (sellerElem) sellerElem.textContent = sellerName;
    
    if (description && description.trim() !== '') {
        if (contentElem) {
            contentElem.textContent = description;
            contentElem.parentElement.classList.remove('hidden');
        }
        if (noDescElem) noDescElem.classList.add('hidden');
    } else {
        if (contentElem) contentElem.parentElement.classList.add('hidden');
        if (noDescElem) noDescElem.classList.remove('hidden');
    }
    
    if (modal) modal.classList.remove('hidden');
}

function closeDescriptionModal() {
    const modal = document.getElementById('description-modal');
    if (modal) modal.classList.add('hidden');
}

// =========================
// UTILITY FUNCTIONS
// =========================
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

// Edit Profile Functions
async function updateProfile(e) {
    e.preventDefault(); // Prevent form submission and page refresh
    
    const username = document.getElementById('edit-username').value;
    const email = document.getElementById('edit-email').value;
    const phone = document.getElementById('edit-phone').value;
    const location = document.getElementById('edit-location').value;
    const bio = document.getElementById('edit-bio').value;

    if (!username || !email) {
        alert("Username and email are required!");
        return;
    }

    const token = localStorage.getItem('token');
    if (!token) {
        alert("Please log in again!");
        return;
    }

    try {
        const res = await fetch(`http://localhost:5000/api/auth/profile/${currentUser._id}`, {
            method: "PUT",
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
                username,
                email,
                phone,
                location,
                bio
            })
        });

        const data = await res.json();

        if (res.ok) {
            // Update local user data
            currentUser = { ...currentUser, username, email, phone, location, bio };
            localStorage.setItem('user', JSON.stringify(currentUser));
            
            // Update UI
            updateUserInterface();
            
            // Close modal and show success
            closeEditProfile();
            showSuccessMessage("✅ Profile updated successfully!");
        } else {
            alert("Error: " + (data.error || "Failed to update profile"));
        }
    } catch (err) {
        console.error("Update profile error:", err);
        alert("Error updating profile. Please try again.");
    }
}

function openEditProfile() {
    const modal = document.getElementById('edit-profile-modal');
    if (!modal) return;
    
    // Fill form with current user data
    document.getElementById('edit-username').value = currentUser.username || '';
    document.getElementById('edit-email').value = currentUser.email || '';
    document.getElementById('edit-phone').value = currentUser.phone || '';
    document.getElementById('edit-location').value = currentUser.location || '';
    document.getElementById('edit-bio').value = currentUser.bio || '';
    
    modal.classList.remove('hidden');
}

function closeEditProfile() {
    const modal = document.getElementById('edit-profile-modal');
    if (modal) {
        modal.classList.add('hidden');
    }
}

// Sort and Search Functions
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

function clearFilters() {
    document.getElementById('search-input').value = '';
    document.getElementById('genre-filter').value = '';
    document.getElementById('condition-filter').value = '';
    document.getElementById('min-price').value = '';
    document.getElementById('max-price').value = '';
    document.getElementById('area-filter').value = '';
    document.getElementById('city-filter').value = '';
    document.getElementById('state-filter').value = '';
    document.getElementById('country-filter').value = '';
    
    // Reset search results to show all books
    const container = getElement("search-results");
    if (container) {
        container.innerHTML = "";
        books.forEach(book => {
            const card = document.createElement("div");
            card.innerHTML = createBookCard(book);
            if (card.firstElementChild) {
                container.appendChild(card.firstElementChild);
            }
        });
    }
}

// =========================
// SAFE INITIALIZATION
// =========================
document.addEventListener("DOMContentLoaded", async function() {
    console.log("DOM fully loaded, initializing app...");
    
    // Add Enter key support for chat input
    const chatInput = document.getElementById('chat-input-field');
    if (chatInput) {
        chatInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                sendChatMessage();
            }
        });
    }
    
    // Add keyboard navigation for image modal
    document.addEventListener('keydown', function(e) {
        const imageModal = document.getElementById('image-modal');
        if (imageModal && !imageModal.classList.contains('hidden')) {
            if (e.key === 'ArrowLeft') {
                navigateImage(-1);
            } else if (e.key === 'ArrowRight') {
                navigateImage(1);
            } else if (e.key === 'Escape') {
                closeImageModal();
            }
        }
    });
    
    // Rest of your existing initialization code...
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

// =========================
// EDIT LISTING FUNCTIONS - FIXED VERSION
// =========================

// Global variable for edit listing images
let editListingImages = [];
let currentEditBookId = null;
let imagesToDelete = []; // Track images to delete

// Open edit listing modal
function openEditListing(bookId) {
    console.log("📝 Opening edit listing for book:", bookId);
    
    const book = userListings.find(b => b._id === bookId);
    if (!book) {
        alert("Book not found!");
        return;
    }

    currentEditBookId = bookId;
    editListingImages = [...book.images]; // Copy current images
    imagesToDelete = []; // Reset delete tracking

    // Fill form with current book data
    document.getElementById('edit-book-id').value = book._id;
    document.getElementById('edit-book-title').value = book.title || '';
    document.getElementById('edit-book-author').value = book.author || '';
    document.getElementById('edit-book-genre').value = book.genre || '';
    document.getElementById('edit-book-condition').value = book.condition || '';
    document.getElementById('edit-book-price').value = book.price || '';
    document.getElementById('edit-book-description').value = book.description || '';
    
    // Fill location fields
    document.getElementById('edit-book-area').value = book.location?.area || '';
    document.getElementById('edit-book-city').value = book.location?.city || '';
    document.getElementById('edit-book-state').value = book.location?.state || '';
    document.getElementById('edit-book-country').value = book.location?.country || '';

    // Display current images
    displayCurrentImages();
    
    // Reset new images preview
    const editPhotoPreview = document.getElementById('edit-photo-preview');
    if (editPhotoPreview) {
        editPhotoPreview.innerHTML = '';
        editPhotoPreview.classList.add('hidden');
    }

    // Reset the update button text
    const updateBtn = document.querySelector('#edit-listing-modal button[onclick="updateListing()"]');
    if (updateBtn) {
        updateBtn.textContent = "Update Listing";
        updateBtn.disabled = false;
    }

    // Show modal
    const modal = document.getElementById('edit-listing-modal');
    if (modal) {
        modal.classList.remove('hidden');
        document.body.style.overflow = 'hidden';
    }
}

// Display current images in edit modal
function displayCurrentImages() {
    const container = document.getElementById('current-images');
    if (!container) return;

    container.innerHTML = '';

    if (!editListingImages || editListingImages.length === 0) {
        container.innerHTML = `
            <div class="col-span-full text-center py-4 text-gray-500">
                <div class="text-2xl mb-2">📷</div>
                <p class="text-sm">No images uploaded</p>
            </div>
        `;
        return;
    }

    editListingImages.forEach((image, index) => {
        // Skip images that are marked for deletion
        if (image.markedForDeletion) return;

        const imageDiv = document.createElement('div');
        imageDiv.className = 'relative group';
        imageDiv.innerHTML = `
            <div class="aspect-square bg-gray-100 rounded-lg overflow-hidden">
                <img src="${image.url}" alt="Book image ${index + 1}" 
                     class="w-full h-full object-cover">
            </div>
            <button type="button" 
                    onclick="removeCurrentImage(${index})"
                    class="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-opacity duration-200 hover:bg-red-600"
                    title="Remove image">
                ✕
            </button>
            <div class="absolute bottom-2 left-2 bg-black bg-opacity-50 text-white text-xs px-2 py-1 rounded">
                ${index + 1}
            </div>
        `;
        container.appendChild(imageDiv);
    });
}

// Remove current image from edit listing
function removeCurrentImage(index) {
    if (confirm('Are you sure you want to remove this image?')) {
        // Mark image for deletion instead of removing immediately
        if (editListingImages[index]._id) {
            // This is an existing image from database
            imagesToDelete.push(editListingImages[index]._id);
        }
        editListingImages[index].markedForDeletion = true;
        displayCurrentImages();
    }
}

// Handle new photo upload for edit listing
function handleEditPhotoUpload(event) {
    const files = event.target.files;
    
    if (!files || files.length === 0) return;
    
    // Count active images (not marked for deletion)
    const activeImages = editListingImages.filter(img => !img.markedForDeletion);
    
    // Check total images won't exceed 5
    const totalAfterUpload = activeImages.length + files.length;
    if (totalAfterUpload > 5) {
        alert(`You can have maximum 5 images. You already have ${activeImages.length} images.`);
        event.target.value = '';
        return;
    }
    
    // Add new files to editListingImages
    Array.from(files).forEach(file => {
        if (!file.type.startsWith('image/')) {
            alert('Please upload only image files');
            return;
        }
        
        // Create a preview object for new images
        const reader = new FileReader();
        reader.onload = function(e) {
            editListingImages.push({
                file: file,
                url: e.target.result,
                isNew: true // Mark as new image
            });
            updateEditPhotoPreview();
        };
        reader.readAsDataURL(file);
    });
    
    event.target.value = '';
}

// Update edit photo preview for new images
function updateEditPhotoPreview() {
    const preview = document.getElementById('edit-photo-preview');
    if (!preview) return;

    // Filter only new images
    const newImages = editListingImages.filter(img => img.isNew && !img.markedForDeletion);
    
    if (newImages.length === 0) {
        preview.classList.add('hidden');
        return;
    }

    preview.classList.remove('hidden');
    preview.innerHTML = '';

    newImages.forEach((imageData, index) => {
        // Find the actual index in editListingImages
        const actualIndex = editListingImages.findIndex(img => img === imageData);
        
        const item = document.createElement('div');
        item.className = 'relative group';
        item.innerHTML = `
            <div class="aspect-square bg-gray-100 rounded-lg overflow-hidden">
                <img src="${imageData.url}" alt="New image" class="w-full h-full object-cover">
            </div>
            <button type="button" 
                    onclick="removeNewImage(${actualIndex})"
                    class="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-opacity duration-200 hover:bg-red-600"
                    title="Remove new image">
                ✕
            </button>
            <div class="absolute bottom-2 left-2 bg-blue-500 text-white text-xs px-2 py-1 rounded">
                New
            </div>
        `;
        preview.appendChild(item);
    });
}

// Remove new image from edit listing
function removeNewImage(index) {
    if (confirm('Are you sure you want to remove this new image?')) {
        editListingImages.splice(index, 1);
        updateEditPhotoPreview();
        displayCurrentImages(); // Refresh both displays
    }
}

// Update listing - FIXED VERSION
async function updateListing() {
    console.log("🔄 Starting update process...");
    
    if (!currentEditBookId) {
        alert("No book selected for editing!");
        return;
    }

    const token = localStorage.getItem("token");
    const user = JSON.parse(localStorage.getItem("user"));
    if (!user || !token) {
        alert("Please log in first!");
        return;
    }

    // Get form values
    const title = document.getElementById('edit-book-title').value.trim();
    const author = document.getElementById('edit-book-author').value.trim();
    const genre = document.getElementById('edit-book-genre').value.trim();
    const condition = document.getElementById('edit-book-condition').value.trim();
    const price = document.getElementById('edit-book-price').value.trim();
    const description = document.getElementById('edit-book-description').value.trim();

    const area = document.getElementById('edit-book-area').value.trim();
    const city = document.getElementById('edit-book-city').value.trim();
    const state = document.getElementById('edit-book-state').value.trim();
    const country = document.getElementById('edit-book-country').value.trim();

    // Validation
    if (!title || !author || !genre || !condition || !price || !area || !city || !country) {
        alert("Please fill in all required fields!");
        return;
    }

    const location = { area, city, state, country };

    try {
        // Show loading state
        const updateBtn = document.querySelector('#edit-listing-modal button[onclick="updateListing()"]');
        const originalText = updateBtn.textContent;
        updateBtn.textContent = "Updating...";
        updateBtn.disabled = true;

        // Build form data
        const formData = new FormData();
        formData.append("title", title);
        formData.append("author", author);
        formData.append("genre", genre);
        formData.append("condition", condition);
        formData.append("price", price);
        formData.append("description", description);
        formData.append("location", JSON.stringify(location));

        // Add images to delete
        if (imagesToDelete.length > 0) {
            imagesToDelete.forEach(imageId => {
                formData.append("deleteImages", imageId);
            });
        }

        // Add new images (files)
        const newImages = editListingImages.filter(img => img.isNew && img.file && !img.markedForDeletion);
        console.log("📸 New images to upload:", newImages.length);
        newImages.forEach(imageData => {
            formData.append("images", imageData.file);
        });

        console.log("🔄 Sending update request...");
        console.log("📝 Data:", {
            title, author, genre, condition, price, description, location,
            imagesToDelete: imagesToDelete.length,
            newImages: newImages.length
        });

        const res = await fetch(`http://localhost:5000/api/books/${currentEditBookId}`, {
            method: "PUT",
            headers: {
                Authorization: `Bearer ${token}`,
                // Don't set Content-Type for FormData - let browser set it with boundary
            },
            body: formData,
        });

        console.log("📥 Response status:", res.status);

        if (!res.ok) {
            const errorText = await res.text();
            console.error("❌ Server error response:", errorText);
            throw new Error(`Failed to update book: ${res.status}`);
        }

        const data = await res.json();
        console.log("✅ Book updated successfully:", data);

        // Close modal
        closeEditListingModal();

        // Refresh data
        await fetchBooks();
        await fetchUserListings();
        
        showSuccessMessage("✅ Book listing updated successfully!");

    } catch (err) {
        console.error("❌ Failed to update book:", err);
        alert("Error updating book: " + err.message);
        
        // Reset button on error - IMPORTANT FIX
        resetUpdateButton();
    }
}

// Reset update button to normal state
function resetUpdateButton() {
    const updateBtn = document.querySelector('#edit-listing-modal button[onclick="updateListing()"]');
    if (updateBtn) {
        updateBtn.textContent = "Update Listing";
        updateBtn.disabled = false;
    }
}

// Close edit listing modal
function closeEditListingModal() {
    const modal = document.getElementById('edit-listing-modal');
    if (modal) {
        modal.classList.add('hidden');
        document.body.style.overflow = '';
    }
    
    // Reset edit state
    currentEditBookId = null;
    editListingImages = [];
    imagesToDelete = [];
    
    // Reset file input
    const fileInput = document.getElementById('edit-photo-input');
    if (fileInput) {
        fileInput.value = '';
    }
    
    // Reset the update button
    resetUpdateButton();
}