console.log("🔥 script.js loaded at " + new Date().toLocaleTimeString());

// =========================
// Global State
// =========================
let books = [];
let userListings = [];
let currentUser = null;
let isLoggedIn = false;

// =========================
// AUTH MODAL TABS
// =========================
function showAuthTab(tabName) {
  document.querySelectorAll(".auth-form").forEach(f => f.classList.add("hidden"));
  document.getElementById(tabName + "-form").classList.remove("hidden");

  const loginBtn = document.getElementById("login-tab-btn");
  const registerBtn = document.getElementById("register-tab-btn");

  if (tabName === "login") {
    loginBtn.classList.add("bg-white", "text-indigo-600", "shadow-sm");
    loginBtn.classList.remove("text-gray-600");
    registerBtn.classList.remove("bg-white", "text-indigo-600", "shadow-sm");
    registerBtn.classList.add("text-gray-600");
  } else {
    registerBtn.classList.add("bg-white", "text-indigo-600", "shadow-sm");
    registerBtn.classList.remove("text-gray-600");
    loginBtn.classList.remove("bg-white", "text-indigo-600", "shadow-sm");
    loginBtn.classList.add("text-gray-600");
  }
}

// =========================
// AUTH FUNCTIONS
// =========================
async function loginUser(identifier, password) {
  try {
    const res = await fetch("http://localhost:5000/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ identifier, password }),
    });

    const data = await res.json();
    console.log("Login response:", data);

    if (res.ok && data.token) {
      const { token, user } = data;
      localStorage.setItem("token", token);
      localStorage.setItem("user", JSON.stringify(user));
      currentUser = user;
      isLoggedIn = true;

      updateUserInterface();
      document.getElementById("login-modal").classList.add("hidden");
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
  const identifier = document.getElementById("login-identifier").value;
  const password = document.getElementById("login-password").value;
  await loginUser(identifier, password);
}

async function handleRegister(e) {
  e.preventDefault();
  const firstName = document.getElementById("register-firstname").value;
  const lastName = document.getElementById("register-lastname").value;
  const username = document.getElementById("register-username").value;
  const email = document.getElementById("register-email").value;
  const password = document.getElementById("register-password").value;
  const confirmPassword = document.getElementById("register-confirm-password").value;
  const location = document.getElementById("register-location").value;
  const phone = document.getElementById("register-phone").value;

  if (password !== confirmPassword) {
    alert("Passwords do not match!");
    return;
  }

  try {
    const res = await fetch("http://localhost:5000/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, firstName, lastName, email, password, location, phone }),
    });

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

  document.getElementById("login-modal").classList.remove("hidden");
  resetUserInterface();
  alert("👋 Signed out successfully!");
}

// =========================
// UI HELPERS
// =========================
function updateUserInterface() {
  if (!currentUser) return;

  const profileAvatar = document.getElementById("profile-avatar");
  if (profileAvatar) profileAvatar.textContent = (currentUser.username?.charAt(0) || "?").toUpperCase();

  const profileNameElem = document.getElementById("profile-name");
  if (profileNameElem) profileNameElem.textContent = currentUser.username || "Unknown User";

  const fullNameElem = document.getElementById("profile-fullname");
  if (fullNameElem) fullNameElem.textContent = `${currentUser.firstName || ""} ${currentUser.lastName || ""}`.trim();

  const navbarAvatar = document.querySelector("header .w-8 span");
  if (navbarAvatar) navbarAvatar.textContent = (currentUser.username?.charAt(0) || "?").toUpperCase();

  document.getElementById("profile-bio").textContent =
  currentUser.bio || "📖 No bio yet";


  document.querySelector("main").classList.remove("hidden");
}

function resetUserInterface() {
  books = [];
  userListings = [];
  renderBookFeed();
  renderUserListings();
  document.querySelector("main").classList.add("hidden");
}

// =========================
// TABS
// =========================
function showTab(tabName) {
  if (!isLoggedIn && tabName !== "home") {
    showSuccessMessage("Please log in to access this feature!");
    return;
  }
  document.querySelectorAll(".tab-content").forEach(tab => tab.classList.add("hidden"));
  const target = document.getElementById(`${tabName}-tab`);
  if (target) target.classList.remove("hidden");
}

// =========================
// BOOK LISTINGS
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
    seller: currentUser._id   // ✅ tie to logged-in user
  };

  try {
    const res = await fetch("http://localhost:5000/api/books", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(bookData),
    });

    const newBook = await res.json();
    if (res.ok) {
  await fetchBooks();         // refresh global feed
  await fetchUserListings();  // refresh my listings
  e.target.reset();
  showSuccessMessage("📚 Your book has been listed!");
}
  } catch (err) {
    console.error("Book listing error:", err);
    alert("Something went wrong while listing book");
  }
}
//     if (!res.ok) throw new Error(newBook.error || "Failed to list book");

//     await fetchBooks();        // refresh global feed
//     await fetchUserListings(); // refresh profile listings

//     books.unshift(newBook);
//     // await fetchUserListings();
//     renderBookFeed();
//     showSuccessMessage("📚 Your book has been listed!");
//     e.target.reset();
//   } catch (err) {
//     console.error("Book listing error:", err);
//     alert(err.message);
//   }
// }

function createBookCard(book) {
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

  return `
    <div class="book-card bg-white rounded-lg shadow-md overflow-hidden">
      <div class="h-48 bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center">
        <span class="text-white text-4xl">${genreEmojis[book.genre] || "📖"}</span>
      </div>
      <div class="p-4">
        <h3 class="font-semibold text-gray-900 mb-1">${book.title}</h3>
        <p class="text-sm text-gray-600 mb-2">${book.author} • ${book.genre}</p>
        <div class="flex items-center justify-between mb-3">
          <span class="text-lg font-bold text-indigo-600">₹${book.price}</span>
          <span class="text-sm ${conditionColors[book.condition]} px-2 py-1 rounded">${book.condition?.replace("-", " ")}</span>
        </div>
        <div class="flex items-center justify-between mt-2">
  <p class="text-xs text-gray-500">📍 ${book.location}</p>
</div>
<button 
  onclick="showInterest('${book.title}')" 
  class="w-full mt-3 bg-indigo-600 text-white py-2 rounded-lg text-sm font-medium hover:bg-indigo-700">
  Interested
</button>
 </div>
      </div>
    </div>
  `;
}

function sortBooks(criteria) {
  if (!books || books.length === 0) return;

  if (criteria === "newest") {
    books.sort((a, b) => new Date(b.dateAdded) - new Date(a.dateAdded));
  } else if (criteria === "price") {
    books.sort((a, b) => a.price - b.price); // Low to High
  } else if (criteria === "nearby") {
    // Implement nearby sorting later if needed
    console.log("Nearby sorting not implemented yet");
  }

  renderBookFeed();
}

function searchBooks() {
  const query = document.getElementById("search-input").value.toLowerCase();
  const genre = document.getElementById("genre-filter").value;
  const condition = document.getElementById("condition-filter").value;
  const minPrice = parseFloat(document.getElementById("min-price").value) || 0;
  const maxPrice = parseFloat(document.getElementById("max-price").value) || Infinity;

  const results = books.filter(book => {
    const matchesQuery = book.title.toLowerCase().includes(query) || book.author.toLowerCase().includes(query);
    const matchesGenre = genre ? book.genre === genre : true;
    const matchesCondition = condition ? book.condition === condition : true;
    const matchesPrice = book.price >= minPrice && book.price <= maxPrice;

    return matchesQuery && matchesGenre && matchesCondition && matchesPrice;
  });

  renderSearchResults(results);
}
function renderSearchResults(results) {
  const container = document.getElementById("search-results");
  container.innerHTML = "";

  if (results.length === 0) {
    container.innerHTML = `
      <div class="col-span-full empty-state">
        <div class="text-6xl mb-4">🔍</div>
        <h3 class="text-xl font-semibold text-gray-900 mb-2">No books found</h3>
        <p class="text-gray-600">Try changing your search or filters.</p>
      </div>
    `;
    return;
  }

  results.forEach(book => {
    const card = document.createElement("div");
    card.innerHTML = createBookCard(book);
    container.appendChild(card.firstElementChild);
  });
}


function renderBookFeed() {
  const feed = document.getElementById("book-grid");
  if (!feed) return;

  feed.innerHTML = "";

  if (books.length === 0) {
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
    feed.appendChild(card.firstElementChild);
  });
}

function renderUserListings() {
  const container = document.getElementById("user-listings");
  if (!container) return;

  container.innerHTML = "";

  if (userListings.length === 0) {
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
    card.className = "flex items-center space-x-4 p-4 border border-gray-200 rounded-lg";
    card.innerHTML = `
      <div class="w-16 h-16 bg-gradient-to-br from-indigo-400 to-purple-500 rounded-lg flex items-center justify-center">
        <span class="text-white text-xl">📖</span>
      </div>
      <div class="flex-1">
        <h4 class="font-semibold text-gray-900">${b.title}</h4>
        <p class="text-sm text-gray-600">Listed ${new Date(b.dateAdded).toLocaleDateString()} • ₹${b.price}</p>
      </div>
      <div class="flex items-center space-x-2">
      <span class="text-green-600 text-sm font-medium">Delete</span>
      <button onclick="deleteListing('${b._id}')" 
              class="text-red-600 hover:text-red-800 p-1 rounded hover:bg-red-50 transition-colors" 
              title="Delete listing">🗑️</button>
    </div>
    `;
    container.appendChild(card);
  });
}

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



// =========================
// UTILS
// =========================
function showSuccessMessage(msg) {
  const el = document.getElementById("success-message");
  if (el) el.textContent = msg;
  document.getElementById("success-modal").classList.remove("hidden");
}

function closeSuccessModal() {
  document.getElementById("success-modal").classList.add("hidden");
}

// =========================
// PLACEHOLDER CHAT FUNCTIONS
// =========================
function toggleChat() { alert("Chat feature not yet implemented 😎"); }
function sendMessage() { alert("Send message not yet implemented 😎"); }
function showInterest(title) { alert(`You are interested in "${title}"!`); }

// =========================
// FETCH HELPERS
// =========================
async function fetchBooks() {
  try {
    const res = await fetch("http://localhost:5000/api/books");
    const data = await res.json();
    books = data;
    renderBookFeed();
  } catch (err) {
    console.error("Error fetching books:", err);
  }
}

async function fetchUserListings() {
  if (!currentUser) return;
  try {
    const res = await fetch("http://localhost:5000/api/books");
    const data = await res.json();
    userListings = data.filter(b => b.seller && (b.seller._id === currentUser._id));
    renderUserListings();
  } catch (err) {
    console.error("Error fetching user listings:", err);
  }
}


// =========================
// INIT
// =========================
document.addEventListener("DOMContentLoaded", async () => {
  const savedUser = localStorage.getItem("user");
  if (savedUser) {
    currentUser = JSON.parse(savedUser);
    isLoggedIn = true;
    updateUserInterface();
  } else {
    document.getElementById("login-modal").classList.remove("hidden");
  }

  await fetchBooks();
  await fetchUserListings();
  showTab("home");
});
async function loadUserListings() {
  if (!currentUser) return;
  try {
    const res = await fetch(`http://localhost:5000/api/books/my?userId=${currentUser._id}`);
    const data = await res.json();
    userListings = data;
    renderUserListings();
  } catch (err) {
    console.error("❌ Error loading user listings:", err);
  }
}

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


// =========================
// PROFILE EDIT FORM HANDLER
// =========================
document.getElementById("edit-profile-form").addEventListener("submit", function (e) {
  e.preventDefault();
  handleEditProfile();
});
