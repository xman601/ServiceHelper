// This file contains the JavaScript code for the formatted comments application.
// It handles user interactions, formatting options, and generates HTML output.

document.addEventListener('DOMContentLoaded', function() {
    // Select elements
    const inputText = document.getElementById('inputText');
    const outputText = document.getElementById('outputText');
    const boldButton = document.getElementById('boldButton');
    const italicButton = document.getElementById('italicButton');
    const linkButton = document.getElementById('linkButton');
    const generateButton = document.getElementById('generateButton');

    // Add bold formatting
    boldButton.addEventListener('click', () => {
        const selectedText = getSelectedText();
        if (selectedText) {
            replaceSelectedText(`[code]<b>${selectedText}</b>[/code]`);
        }
    });

    // Add italic formatting
    italicButton.addEventListener('click', () => {
        const selectedText = getSelectedText();
        if (selectedText) {
            replaceSelectedText(`[code]<i>${selectedText}</i>[/code]`);
        }
    });

    // Add hyperlink formatting
    linkButton.addEventListener('click', () => {
        const selectedText = getSelectedText();
        const url = prompt('Enter the URL for the hyperlink:');
        if (selectedText && url) {
            replaceSelectedText(`[code]<a href="${url}" target="_blank">${selectedText}</a>[/code]`);
        }
    });

    // Generate HTML output
    generateButton.addEventListener('click', () => {
        outputText.innerHTML = inputText.value;
    });

    // Helper function to get selected text in the textarea
    function getSelectedText() {
        const start = inputText.selectionStart;
        const end = inputText.selectionEnd;
        return inputText.value.substring(start, end);
    }

    // Helper function to replace selected text in the textarea
    function replaceSelectedText(replacement) {
        const start = inputText.selectionStart;
        const end = inputText.selectionEnd;
        const before = inputText.value.substring(0, start);
        const after = inputText.value.substring(end);
        inputText.value = before + replacement + after;
        inputText.setSelectionRange(start, start + replacement.length);
    }
});