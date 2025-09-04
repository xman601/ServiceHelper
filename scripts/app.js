const previewBtn = document.querySelector("#preview-button");
const output = document.querySelector(".output");
const copyBtn = document.querySelector("#copy-button");
const themeToggle = document.getElementById("theme-toggle");

const clearBtn = document.createElement("button");
clearBtn.className = "clear-button btn";
clearBtn.id = "clear-button";
clearBtn.textContent = "Clear";
copyBtn.parentNode.insertBefore(clearBtn, copyBtn.nextSibling);

const toolbarOptions = [
  [{ header: [1, 2, 3, false] }],
  ["bold", "italic", "underline"],
  [{ list: "ordered" }, { list: "bullet" }],
  ["link"],
  ['code-block'],
  [{ 'script': 'sub'}, { 'script': 'super' }],
  [{ 'color': [] }, { 'background': [] }],
  ['clean']      
];

const quill = new Quill("#editor-container", {
  theme: "snow",
  modules: {
    toolbar: toolbarOptions,
  },
});

const savedContent = localStorage.getItem("editorContent");
if (savedContent) {
  quill.root.innerHTML = savedContent;
}

quill.on("text-change", () => {
  const content = quill.root.innerHTML;
  localStorage.setItem("editorContent", content);
});

const themeSwitch = document.querySelector('#theme-toggle input[type="checkbox"]');

if (localStorage.getItem("theme") === "dark") {
  document.body.classList.add("dark");
  if (themeSwitch) themeSwitch.checked = true;
}

if (themeSwitch) {
  themeSwitch.addEventListener("change", () => {
    document.body.classList.toggle("dark");
    if (document.body.classList.contains("dark")) {
      localStorage.setItem("theme", "dark");
    } else {
      localStorage.setItem("theme", "light");
    }
  });
}

previewBtn.addEventListener("click", () => {
  // Prevent preview if editor is empty (no user input)
  const plainText = quill.getText().trim();
  if (!plainText) {
    previewBtn.textContent = "No input!";
    setTimeout(() => {
      previewBtn.textContent = "Generate";
    }, 1200);
    return;
  }
  const content = quill.root.innerHTML;
  output.classList.add("active");
  setTimeout(() => {
    output.textContent = `[code]${content}[/code]`;
  }, 10);
});

copyBtn.addEventListener("click", () => {
  let textToCopy;
  if (output.textContent.trim() !== "") {
    textToCopy = output.textContent;
  } else {
    textToCopy = `[code]${quill.root.innerHTML}[/code]`;
  }

  navigator.clipboard.writeText(textToCopy)
    .then(() => {
      copyBtn.textContent = "Copied!";
      setTimeout(() => {
        copyBtn.textContent = "Copy";
      }, 1200);
    })
    .catch(() => {
      copyBtn.textContent = "Failed!";
      setTimeout(() => {
        copyBtn.textContent = "Copy";
      }, 1200);
    });
});

// Find and change the MAX_HISTORY_ITEMS constant
const MAX_HISTORY_ITEMS = 20; // Changed from 10 to 20

// Add after the existing localStorage initialization
let editorHistory = JSON.parse(localStorage.getItem("editorHistory") || "[]");

// Add after the clearBtn creation
const historyPanel = document.createElement("div");
historyPanel.className = "history-panel";
historyPanel.style.display = "none";
document.body.appendChild(historyPanel);

const historyBtn = document.createElement("button");
historyBtn.className = "history-button btn";
historyBtn.id = "history-button";
historyBtn.textContent = "History";
clearBtn.parentNode.insertBefore(historyBtn, clearBtn.nextSibling);

// Modify the clear button event listener
clearBtn.addEventListener("click", () => {
  if (quill.getText().trim()) {
    // Save current content to history before clearing
    const currentContent = {
      content: quill.root.innerHTML,
      timestamp: new Date().toLocaleString()
    };
    
    editorHistory.unshift(currentContent);
    // Keep only the last MAX_HISTORY_ITEMS items
    if (editorHistory.length > MAX_HISTORY_ITEMS) {
      editorHistory.pop();
    }
    localStorage.setItem("editorHistory", JSON.stringify(editorHistory));
  }
  
  quill.root.innerHTML = ""; 
  output.textContent = "";
  localStorage.removeItem("editorContent"); 
  output.classList.remove("active");
  clearBtn.textContent = "Cleared!";
  setTimeout(() => {
    clearBtn.textContent = "Clear";
  }, 1200);
});

// Add history button functionality
historyBtn.addEventListener("click", () => {
  if (historyPanel.style.display === "none") {
    historyPanel.style.display = "block";
    updateHistoryPanel();
  } else {
    historyPanel.style.display = "none";
  }
});

function updateHistoryPanel() {
  historyPanel.innerHTML = `
    <div class="history-header">
      <h3>History</h3>
      <button class="close-history">×</button>
    </div>
    <div class="history-items">
      ${editorHistory.length === 0 ? 
        '<div class="no-history">No history items</div>' :
        editorHistory.map((item, index) => `
          <div class="history-item">
            <div class="history-content">
              <div class="history-timestamp">${item.timestamp}</div>
              <div class="history-preview">${item.content.substring(0, 100)}...</div>
            </div>
            <div class="history-buttons">
              <button class="restore-btn" data-index="${index}">Restore</button>
              <button class="delete-btn" data-index="${index}">Delete</button>
            </div>
          </div>
        `).join('')}
    </div>
    ${editorHistory.length > 0 ? 
      '<button class="clear-all-btn">Clear All History</button>' : 
      ''}
  `;

  // Add event listeners for restore buttons
  historyPanel.querySelectorAll('.restore-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const index = e.target.dataset.index;
      quill.root.innerHTML = editorHistory[index].content;
      localStorage.setItem("editorContent", editorHistory[index].content);
      historyPanel.style.display = "none";
    });
  });

  // Add event listeners for delete buttons
  historyPanel.querySelectorAll('.delete-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const index = e.target.dataset.index;
      editorHistory.splice(index, 1);
      localStorage.setItem("editorHistory", JSON.stringify(editorHistory));
      updateHistoryPanel();
    });
  });

  // Add event listener for clear all button
  const clearAllBtn = historyPanel.querySelector('.clear-all-btn');
  if (clearAllBtn) {
    clearAllBtn.addEventListener('click', () => {
      if (confirm('Are you sure you want to clear all history?')) {
        editorHistory = [];
        localStorage.setItem("editorHistory", JSON.stringify(editorHistory));
        updateHistoryPanel();
      }
    });
  }

  // Add event listener for close button
  historyPanel.querySelector('.close-history').addEventListener('click', () => {
    historyPanel.style.display = "none";
  });
}