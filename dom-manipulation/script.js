
const SERVER_URL = "https://jsonplaceholder.typicode.com/posts";
const SYNC_INTERVAL = 15000;

const defaultQuotes = [
  { text: "The best way to get started is to quit talking and begin doing.", category: "Motivation" },
  { text: "Learning never exhausts the mind.", category: "Education" },
  { text: "Code is like humor. When you have to explain it, it’s bad.", category: "Programming" }
];

let quotes = JSON.parse(localStorage.getItem("quotes")) || defaultQuotes;

const quoteDisplay = document.getElementById("quoteDisplay");
const newQuoteButton = document.getElementById("newQuote");
const categoryFilter = document.getElementById("categoryFilter");



function saveQuotes() {
  localStorage.setItem("quotes", JSON.stringify(quotes));
}

function saveSelectedCategory(category) {
  localStorage.setItem("selectedCategory", category);
}


function populateCategories() {
  const categories = [...new Set(quotes.map(q => q.category))];

  categoryFilter.innerHTML = `<option value="all">All Categories</option>`;

  categories.forEach(cat => {
    const option = document.createElement("option");
    option.value = cat;
    option.textContent = cat;
    categoryFilter.appendChild(option);
  });

  const saved = localStorage.getItem("selectedCategory");
  if (saved) categoryFilter.value = saved;
}



function filterQuotes() {
  const selectedCategory = categoryFilter.value;
  saveSelectedCategory(selectedCategory);

  let filtered = quotes;

  if (selectedCategory !== "all") {
    filtered = quotes.filter(q => q.category === selectedCategory);
  }

  if (filtered.length === 0) {
    quoteDisplay.innerHTML = "<p>No quotes found.</p>";
    return;
  }

  const randomQuote = filtered[Math.floor(Math.random() * filtered.length)];

  quoteDisplay.innerHTML = `
    <p>"${randomQuote.text}"</p>
    <small>Category: ${randomQuote.category}</small>
  `;

  sessionStorage.setItem("lastViewedQuote", JSON.stringify(randomQuote));
}

function showRandomQuote() {
  filterQuotes();
}

newQuoteButton.addEventListener("click", showRandomQuote);

function addQuote() {
  const textInput = document.getElementById("newQuoteText");
  const categoryInput = document.getElementById("newQuoteCategory");

  const text = textInput.value.trim();
  const category = categoryInput.value.trim();

  if (!text || !category) {
    alert("Please fill in all fields");
    return;
  }

  const quote = { text, category };
  quotes.push(quote);
  saveQuotes();
  postQuoteToServer(quote);

  textInput.value = "";
  categoryInput.value = "";

  populateCategories();
  filterQuotes();
}


function createAddQuoteForm() {
  const form = document.createElement("form");

  const textInput = document.createElement("input");
  textInput.id = "newQuoteText";
  textInput.placeholder = "Quote text";

  const categoryInput = document.createElement("input");
  categoryInput.id = "newQuoteCategory";
  categoryInput.placeholder = "Category";

  const btn = document.createElement("button");
  btn.textContent = "Add Quote";
  btn.type = "submit";

  form.append(textInput, categoryInput, btn);
  document.body.appendChild(form);

  form.addEventListener("submit", e => {
    e.preventDefault();
    addQuote();
  });
}



function exportQuotesToJson() {
  const blob = new Blob([JSON.stringify(quotes, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);

  const link = document.createElement("a");
  link.href = url;
  link.download = "quotes.json";
  link.click();

  URL.revokeObjectURL(url);
}

function importFromJsonFile(event) {
  const reader = new FileReader();

  reader.onload = e => {
    try {
      const imported = JSON.parse(e.target.result);
      quotes.push(...imported);
      saveQuotes();
      populateCategories();
      filterQuotes();
      showSyncNotification("Quotes imported successfully");
    } catch {
      alert("Invalid JSON file");
    }
  };

  reader.readAsText(event.target.files[0]);
}




async function fetchServerQuotes() {
  try {
    const response = await fetch(SERVER_URL);
    const data = await response.json();

    const serverQuotes = data.slice(0, 5).map(post => ({
      text: post.title,
      category: "Server"
    }));

    syncQuotes(serverQuotes);
  } catch (error) {
    console.error("Sync failed", error);
  }
}

function syncQuotes(serverQuotes) {
  let updated = false;

  serverQuotes.forEach(sq => {
    const exists = quotes.some(lq => lq.text === sq.text);
    if (!exists) {
      quotes.push(sq);
      updated = true;
    }
  });

  if (updated) {
    saveQuotes();
    populateCategories();
    filterQuotes();
    showSyncNotification("Server data synced (server wins).");
  }
}

async function postQuoteToServer(quote) {
  try {
    await fetch(SERVER_URL, {
      method: "POST",
      body: JSON.stringify(quote),
      headers: { "Content-Type": "application/json" }
    });
  } catch (e) {
    console.error("Post failed");
  }
}

function manualSync() {
  fetchServerQuotes();
  showSyncNotification("Manual sync completed.");
}


  // UI NOTIFICATION


function showSyncNotification(message) {
  const status = document.getElementById("syncStatus");
  status.textContent = message;
  setTimeout(() => status.textContent = "", 4000);
}

/* =========================
   INITIALIZATION
========================= */

createAddQuoteForm();
populateCategories();
filterQuotes();

setInterval(fetchServerQuotes, SYNC_INTERVAL);
