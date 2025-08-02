const previewBtn = document.querySelector("#preview-button");
const output = document.querySelector(".output");
const copyBtn = document.querySelector("#copy-button");
const themeToggle = document.getElementById("theme-toggle");

const toolbarOptions = [
  //   header options
  [{ header: [1, 2, 3] }],

  // text utilities
  ["bold", "italic", "underline"],

  // lists
  [{ list: "ordered" }, { list: "bullet" }],

  // media
  ["link"],
];

const quill = new Quill("#editor-container", {
  theme: "snow",
  modules: {
    toolbar: toolbarOptions,
  },
});

const themeSwitch = document.querySelector('#theme-toggle input[type="checkbox"]');

// Load theme from localStorage
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
  let content = quill.root.innerHTML;

  // Wrap headings, bold, italic, underline, and links in [code]...[/code]
  content = content
    .replace(/<(h[1-3])[^>]*>(.*?)<\/\1>/gi, '[code]$2[/code]')
    .replace(/<(b|strong)>(.*?)<\/\1>/gi, '[code]$2[/code]')
    .replace(/<(i|em)>(.*?)<\/\1>/gi, '[code]$2[/code]')
    .replace(/<u>(.*?)<\/u>/gi, '[code]$1[/code]')
    .replace(/<a [^>]+>(.*?)<\/a>/gi, '[code]$1[/code]');

  // Replace [code]...[/code] with <span class="code-block">...</span> for styling, and keep the rest as HTML
  content = content.replace(/\[code\](.*?)\[\/code\]/g, '<span class="code-block">[code]$1[/code]</span>');

  output.classList.add("active");
  setTimeout(() => {
    output.innerHTML = content;
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