const previewBtn = document.querySelector("#preview-button");
const output = document.querySelector(".output");
const copyBtn = document.querySelector("#copy-button");
const themeToggle = document.getElementById("theme-toggle");

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

// Load saved content from localStorage
const savedContent = localStorage.getItem("editorContent");
if (savedContent) {
  quill.root.innerHTML = savedContent;
}

// Save content to localStorage on text change
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
  const content = quill.root.innerHTML;
  output.classList.add("active");
  setTimeout(() => {
    output.textContent = `[code]${content}[/code]`;
  }, 10);
});

copyBtn.addEventListener("click", () => {
  // Copy the text content of the output div to clipboard
  const textToCopy = output.textContent;
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