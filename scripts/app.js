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

// Convert Quill's <p> line breaks to <br> for ServiceNow output
function paragraphsToBreaks(html) {
  return html
    .replace(/<p>\s*<br\s*\/?>\s*<\/p>/gi, "<br>")   // empty paragraphs
    .replace(/<\/p>\s*<p>/gi, "<br>")    // adjacent paragraphs
    .replace(/<p>/gi, "")
    .replace(/<\/p>/gi, "");
}

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
  content = paragraphsToBreaks(content);
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
    content = paragraphsToBreaks(quill.root.innerHTML);
    content = content.replace(/\[url=(.+?)\](.+?)\[\/url\]/gi, '<a href="$1">$2</a>');
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

clearBtn.addEventListener("click", () => {
  quill.root.innerHTML = ""; 
  output.textContent = "";
  localStorage.removeItem("editorContent"); 
  output.classList.remove("active");
  clearBtn.textContent = "Cleared!";
  setTimeout(() => {
    clearBtn.textContent = "Clear";
  }, 1200);
});

