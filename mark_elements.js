// mark_elements.js
function injectBoundingBoxes() {
    let idCounter = 1;
    // Target all likely interactive elements
    const elements = document.querySelectorAll('button, a, input, select, textarea, [role="button"], [tabindex]');
    
    elements.forEach(el => {
        const rect = el.getBoundingClientRect();
        // Only mark visible elements
        if (rect.width > 0 && rect.height > 0 && window.getComputedStyle(el).visibility !== 'hidden') {
            const overlay = document.createElement('div');
            overlay.className = 'agent-overlay';
            overlay.style.position = 'absolute';
            overlay.style.top = (rect.top + window.scrollY) + 'px';
            overlay.style.left = (rect.left + window.scrollX) + 'px';
            overlay.style.width = rect.width + 'px';
            overlay.style.height = rect.height + 'px';
            overlay.style.border = '3px solid red'; // Thick red border for Gemini to easily see
            overlay.style.zIndex = '999999';
            overlay.style.pointerEvents = 'none'; // Ensure overlays don't block actual clicks

            const label = document.createElement('span');
            label.innerText = idCounter;
            label.style.position = 'absolute';
            label.style.top = '-15px';
            label.style.left = '-3px';
            label.style.backgroundColor = 'red';
            label.style.color = 'white';
            label.style.fontSize = '14px';
            label.style.fontWeight = 'bold';
            label.style.padding = '2px 4px';

            overlay.appendChild(label);
            document.body.appendChild(overlay);

            // Tag the actual DOM element so Playwright can find it later
            el.setAttribute('data-agent-id', idCounter);
            idCounter++;
        }
    });
    return idCounter - 1; // Return total number of marked elements
}
injectBoundingBoxes();