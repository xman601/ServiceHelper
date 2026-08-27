const previewBtn = document.querySelector("#preview-button");
const output = document.querySelector(".output");
const copyBtn = document.querySelector("#copy-button");
const themeSwitch = document.querySelector('#theme-toggle input[type="checkbox"]');
const EDITOR_STORAGE_KEY = "editorContent";
const hasEditor = Boolean(previewBtn && output && copyBtn && document.getElementById("editor-container"));

let editorPersistTimer;
function persistEditorContent() {
  try {
    if (!quill.getText().trim()) {
      localStorage.removeItem(EDITOR_STORAGE_KEY);
    } else {
      localStorage.setItem(EDITOR_STORAGE_KEY, JSON.stringify(quill.getContents()));
    }
  } catch (_) {
    /* storage full or disabled */
  }
}

function schedulePersistEditor() {
  clearTimeout(editorPersistTimer);
  editorPersistTimer = setTimeout(persistEditorContent, 300);
}

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

// Settings button: toggle aria-pressed and small animation (placeholder)
const settingsBtn = document.getElementById('settings-button');
if (settingsBtn) {
  settingsBtn.addEventListener('click', () => {
    const pressed = settingsBtn.getAttribute('aria-pressed') === 'true';
    settingsBtn.setAttribute('aria-pressed', String(!pressed));
    // small animation feedback
    settingsBtn.classList.add('animate');
    setTimeout(() => settingsBtn.classList.remove('animate'), 260);
    console.log('Settings button clicked (placeholder)');
  });
}

if (hasEditor) {

const clearBtn = document.createElement("button");
clearBtn.className = "clear-button btn";
clearBtn.id = "clear-button";
clearBtn.textContent = "Clear";
clearBtn.setAttribute("aria-live", "polite");
clearBtn.setAttribute("aria-atomic", "true");
copyBtn.parentNode.insertBefore(clearBtn, copyBtn.nextSibling);

const toolbarOptions = [
  [{ header: [1, 2, 3, false] }],
  ["bold", "italic", "underline"],
  [{ list: "ordered" }, { list: "bullet" }],
  ["blockquote"],
  ["link"],
  ['code-block'],
  [{ 'script': 'sub'}, { 'script': 'super' }],
  [{ 'color': [] }, { 'background': [] }],
  ['clean']      
];

const quillConfig = {
  theme: "snow",
  modules: {
    toolbar: toolbarOptions,
    clipboard: {
      matchVisual: false
    }
  }
};

// Replace the existing Quill instantiation and add these event handlers
const quill = new Quill("#editor-container", quillConfig);

try {
  const saved = localStorage.getItem(EDITOR_STORAGE_KEY);
  if (saved) {
    quill.setContents(JSON.parse(saved), Quill.sources.API);
    quill.history.clear();
  }
} catch (_) {
  localStorage.removeItem(EDITOR_STORAGE_KEY);
}

quill.on("text-change", schedulePersistEditor);
document.addEventListener("visibilitychange", () => {
  if (document.visibilityState === "hidden") {
    clearTimeout(editorPersistTimer);
    persistEditorContent();
  }
});

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

// ServiceNow's rich text field renders <p> blocks reliably but doesn't need
// (or want) closing </p> tags or empty paragraphs from blank lines - browsers
// auto-close <p> at the next block, so we drop the closing tags and skip any
// paragraph that has no real content.
function convertBreaksToParagraphs(html) {
  const container = document.createElement("div");
  container.innerHTML = html;

  const parts = [];
  container.childNodes.forEach((node) => {
    if (node.nodeType === Node.ELEMENT_NODE && node.tagName === "P") {
      node.innerHTML.split(/<br\s*\/?>/gi).forEach((segment) => {
        if (segment.replace(/&nbsp;/gi, "").trim()) {
          parts.push(`<p>${segment}`);
        }
      });
    } else if (node.nodeType === Node.ELEMENT_NODE) {
      parts.push(node.outerHTML);
    }
  });

  return parts.join("");
}

previewBtn.addEventListener("click", () => {
  const plainText = quill.getText().trim();
  if (!plainText) {
    previewBtn.textContent = "No input!";
    setTimeout(() => {
      previewBtn.textContent = "Generate";
    }, 1200);
    return;
  }

  const content = convertBreaksToParagraphs(quill.root.innerHTML);
  output.classList.add("active");
  output.textContent = `[code]${content}[/code]`;
});

copyBtn.addEventListener("click", () => {
  const textToCopy = output.textContent.trim() !== ""
    ? output.textContent
    : `[code]${convertBreaksToParagraphs(quill.root.innerHTML)}[/code]`;

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

clearBtn.addEventListener("click", () => {
  quill.setContents([], Quill.sources.USER);
  quill.history.clear();
  output.textContent = "";
  localStorage.removeItem(EDITOR_STORAGE_KEY);
  output.classList.remove("active");
  clearBtn.textContent = "Cleared!";
  setTimeout(() => {
    clearBtn.textContent = "Clear";
  }, 1200);
});

}

