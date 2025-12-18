
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

  const savedCategory = localStorage.getItem("selectedCategory");
  if (savedCategory) {
    categoryFilter.value = savedCategory;
  }
}


function showRandomQuote() {
  const selectedCategory = categoryFilter.value || "all";
  saveSelectedCategory(selectedCategory);

  let filteredQuotes = quotes;

  if (selectedCategory !== "all") {
    filteredQuotes = quotes.filter(
      quote => quote.category === selectedCategory
    );
  }

  if (filteredQuotes.length === 0) {
    quoteDisplay.innerHTML = "<p>No quotes found.</p>";
    return;
  }

  const randomIndex = Math.floor(Math.random() * filteredQuotes.length);
  const quote = filteredQuotes[randomIndex];

  quoteDisplay.innerHTML = `
    <p>"${quote.text}"</p>
    <small>Category: ${quote.category}</small>
  `;

  sessionStorage.setItem("lastViewedQuote", JSON.stringify(quote));
}



newQuoteButton.addEventListener("click", showRandomQuote);
categoryFilter.addEventListener("change", showRandomQuote);



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
  showRandomQuote();
}

function createAddQuoteForm() {
  const form = document.createElement("form");

  const textInput = document.createElement("input");
  textInput.id = "newQuoteText";
  textInput.placeholder = "Quote text";

  const categoryInput = document.createElement("input");
  categoryInput.id = "newQuoteCategory";
  categoryInput.placeholder = "Category";

  const button = document.createElement("button");
  button.textContent = "Add Quote";
  button.type = "submit";

  form.append(textInput, categoryInput, button);
  document.body.appendChild(form);

  form.addEventListener("submit", function (e) {
    e.preventDefault();
    addQuote();
  });
}



function exportQuotesToJson() {
  const blob = new Blob([JSON.stringify(quotes, null, 2)], {
    type: "application/json"
  });

  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = url;
  link.download = "quotes.json";
  link.click();

  URL.revokeObjectURL(url);
}

function importFromJsonFile(event) {
  const reader = new FileReader();

  reader.onload = function (e) {
    try {
      const importedQuotes = JSON.parse(e.target.result);
      quotes.push(...importedQuotes);
      saveQuotes();
      populateCategories();
      showRandomQuote();
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

  serverQuotes.forEach(serverQuote => {
    const exists = quotes.some(local => local.text === serverQuote.text);
    if (!exists) {
      quotes.push(serverQuote);
      updated = true;
    }
  });

  if (updated) {
    saveQuotes();
    populateCategories();
    showRandomQuote();
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
  } catch {
    console.error("Failed to post to server");
  }
}


   //UI NOTIFICATIONS


function showSyncNotification(message) {
  const status = document.getElementById("syncStatus");
  if (!status) return;

  status.textContent = message;
  setTimeout(() => {
    status.textContent = "";
  }, 4000);
}


   //INITIALIZATION


createAddQuoteForm();
populateCategories();
showRandomQuote();

setInterval(fetchServerQuotes, SYNC_INTERVAL);
