const previewBtn = document.querySelector("#preview-button");
const output = document.querySelector(".output");
const copyBtn = document.querySelector("#copy-button");
const themeSwitch = document.querySelector('#theme-toggle input[type="checkbox"]');

// Check for a saved theme in localStorage and apply it on page load
if (localStorage.getItem("theme") === "dark") {
  document.body.classList.add("dark");
  if (themeSwitch) themeSwitch.checked = true;
}

// Add the event listener to handle clicks on the theme toggle
if (themeSwitch) {
  themeSwitch.addEventListener("change", () => {
    // Toggle the .dark class on the body
    document.body.classList.toggle("dark");
    // Save the new theme preference to localStorage
    if (document.body.classList.contains("dark")) {
      localStorage.setItem("theme", "dark");
    } else {
      localStorage.setItem("theme", "light");
    }
  });
}

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

// Replace the existing quillConfig with this updated version
const quillConfig = {
  theme: "snow",
  modules: {
    toolbar: toolbarOptions,
    clipboard: {
      matchVisual: false
    },
    keyboard: {
      bindings: {
        enter: {
          key: 13,
          handler: function(range, context) {
            // Prevent default enter behavior on links
            if (context.format.link) {
              return true;
            }
            return true;
          }
        }
      }
    }
  }
};

// Replace the existing Quill instantiation and add these event handlers
const quill = new Quill("#editor-container", quillConfig);

// Prevent link clicks in editor
quill.root.addEventListener('click', function(event) {
  if (event.target && event.target.tagName === 'A') {
    event.preventDefault();
    event.stopPropagation();
    return false;
  }
});

// Prevent link clicks in toolbar
document.querySelector('.ql-toolbar').addEventListener('click', function(event) {
  if (event.target && event.target.tagName === 'A') {
    event.preventDefault();
    event.stopPropagation();
    return false;
  }
}, true);

// Add mutation observer to handle dynamically added links
const observer = new MutationObserver((mutations) => {
  mutations.forEach((mutation) => {
    if (mutation.addedNodes.length) {
      mutation.addedNodes.forEach((node) => {
        if (node.querySelectorAll) {
          const links = node.querySelectorAll('a');
          links.forEach(link => {
            link.addEventListener('click', (e) => {
              e.preventDefault();
              e.stopPropagation();
              return false;
            });
          });
        }
      });
    }
  });
});

// Start observing the editor
observer.observe(quill.root, {
  childList: true,
  subtree: true
});

// Add CSS to show links are not clickable
const style = document.createElement('style');
style.textContent = `
  .ql-editor a {
    pointer-events: none;
    cursor: text;
  }
`;
document.head.appendChild(style);

// Update the preview button event listener to handle links better
previewBtn.addEventListener("click", () => {
  const plainText = quill.getText().trim();
  if (!plainText) {
    previewBtn.textContent = "No input!";
    setTimeout(() => {
      previewBtn.textContent = "Generate";
    }, 1200);
    return;
  }

  let content = quill.root.innerHTML;
  // Convert BBCode [url=...]...[/url] to HTML <a href="$1">$2</a>
  content = content.replace(/\[url=(.+?)\](.+?)\[\/url\]/gi, '<a href="$1">$2</a>');
  output.classList.add("active");
  output.textContent = `[code]${content}[/code]`;
});

// Update the copy button event listener to preserve the BBCode links
copyBtn.addEventListener("click", () => {
  let textToCopy;
  let content;
  if (output.textContent.trim() !== "") {
    content = output.textContent.replace(/\[url=(.+?)\](.+?)\[\/url\]/gi, '<a href="$1">$2</a>');
    textToCopy = content;
  } else {
    content = quill.root.innerHTML.replace(/\[url=(.+?)\](.+?)\[\/url\]/gi, '<a href="$1">$2</a>');
    textToCopy = `[code]${content}[/code]`;
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

// Add these constants near the top of the file after other constants
const DEFAULT_HISTORY_DAYS = 7;
const historySettings = JSON.parse(localStorage.getItem("historySettings")) || {
  retentionDays: DEFAULT_HISTORY_DAYS
};

// Add the settings button and panel after historyBtn creation
const settingsBtn = document.createElement("button");
settingsBtn.className = "settings-icon-btn";
settingsBtn.id = "settings-button";
settingsBtn.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24px" height="24px">
    <path d="M 9.6679688 2 L 9.1757812 4.5234375 C 8.3550224 4.8338012 7.5961042 5.2674041 6.9296875 5.8144531 L 4.5058594 4.9785156 L 2.1738281 9.0214844 L 4.1132812 10.707031 C 4.0445153 11.128986 4 11.558619 4 12 C 4 12.441381 4.0445153 12.871014 4.1132812 13.292969 L 2.1738281 14.978516 L 4.5058594 19.021484 L 6.9296875 18.185547 C 7.5961042 18.732596 8.3550224 19.166199 9.1757812 19.476562 L 9.6679688 22 L 14.332031 22 L 14.824219 19.476562 C 15.644978 19.166199 16.403896 18.732596 17.070312 18.185547 L 19.494141 19.021484 L 21.826172 14.978516 L 19.886719 13.292969 C 19.955485 12.871014 20 12.441381 20 12 C 20 11.558619 19.955485 11.128986 19.886719 10.707031 L 21.826172 9.0214844 L 19.494141 4.9785156 L 17.070312 5.8144531 C 16.403896 5.2674041 15.644978 4.8338012 14.824219 4.5234375 L 14.332031 2 L 9.6679688 2 z M 12 8 C 14.209 8 16 9.791 16 12 C 16 14.209 14.209 16 12 16 C 9.791 16 8 14.209 8 12 C 8 9.791 9.791 8 12 8 z"/>
</svg>`;

// Find the theme toggle switch
const themeToggle = document.querySelector('.toggle-switch');
// Insert the settings button after the theme toggle
themeToggle.parentNode.insertBefore(settingsBtn, themeToggle.nextSibling);

const settingsPanel = document.createElement("div");
settingsPanel.className = "settings-panel";
settingsPanel.style.display = "none";
document.body.appendChild(settingsPanel);

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
    cleanupOldHistory(); // Add this line to clean up old entries
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

// Add settings button functionality
settingsBtn.addEventListener("click", () => {
  if (settingsPanel.style.display === "none") {
    settingsPanel.style.display = "block";
    updateSettingsPanel();
  } else {
    settingsPanel.style.display = "none";
  }
});

function updateSettingsPanel() {
  settingsPanel.innerHTML = `
    <div class="settings-header">
      <h3>Settings</h3>
      <button class="close-settings">×</button>
    </div>
    <div class="settings-content">
      <div class="setting-item">
        <label for="retention-days">Keep history for (days):</label>
        <input type="number" id="retention-days" min="1" max="365" 
          value="${historySettings.retentionDays}">
      </div>
      <button class="save-settings-btn">Save Settings</button>
    </div>
  `;

  // Add event listeners for settings
  settingsPanel.querySelector('.close-settings').addEventListener('click', () => {
    settingsPanel.style.display = "none";
  });

  settingsPanel.querySelector('.save-settings-btn').addEventListener('click', () => {
    const days = parseInt(settingsPanel.querySelector('#retention-days').value);
    if (days >= 1 && days <= 365) {
      historySettings.retentionDays = days;
      localStorage.setItem("historySettings", JSON.stringify(historySettings));
      cleanupOldHistory();
      settingsPanel.style.display = "none";
      updateHistoryPanel();
    } else {
      alert("Please enter a number between 1 and 365 days");
    }
  });
}

// Add this function to clean up old history items
function cleanupOldHistory() {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - historySettings.retentionDays);
  
  editorHistory = editorHistory.filter(item => {
    const itemDate = new Date(item.timestamp);
    return itemDate > cutoffDate;
  });
  
  localStorage.setItem("editorHistory", JSON.stringify(editorHistory));
}