function getExtensionURL(path) {
  try {
    return chrome.runtime?.getURL(path);
  } catch (e) {
    console.warn("Unable to get extension URL, using fallback:", e);
    return "https://via.placeholder.com/20?text=icon"; // fallback image
  }
}


// Remove any existing tooltip popup on hover leave
function removeTooltip() {
  const tooltip = document.querySelector(".phishing-tooltip");
  if (tooltip) tooltip.remove();
}

// Show a custom tooltip on hover
function showTooltip(icon, status) {
  removeTooltip();

  const tooltip = document.createElement("div");
  tooltip.className = "phishing-tooltip";
  tooltip.style.position = "absolute";
  tooltip.style.padding = "6px 12px";
  tooltip.style.borderRadius = "6px";
  tooltip.style.fontWeight = "bold";
  tooltip.style.fontSize = "14px";
  tooltip.style.color = "#fff";
  tooltip.style.zIndex = 10001;
  tooltip.style.pointerEvents = "none"; // so it doesn't block mouse

  if (status === "phishing") {
    tooltip.style.backgroundColor = "#d9534f"; // bootstrap danger red
    tooltip.textContent = "Click for details - This email is likely phishing!";
  } else if (status === "legit") {
    tooltip.style.backgroundColor = "#5cb85c"; // bootstrap success green
    tooltip.textContent = "Click for details - This email appears legitimate!";
  } else {
    tooltip.style.backgroundColor = "#6c757d"; // gray
    tooltip.textContent = "Click for details";
  }

  document.body.appendChild(tooltip);

  // Position the tooltip above the icon, centered horizontally
  const rect = icon.getBoundingClientRect();
  const tooltipRect = tooltip.getBoundingClientRect();

  let top = window.scrollY + rect.top - tooltipRect.height - 8; // 8px space above
  let left = window.scrollX + rect.left + rect.width / 2 - tooltipRect.width / 2;

  // Prevent tooltip from going off left edge
  if (left < 4) left = 4;
  // Prevent tooltip from going off right edge
  const maxLeft = window.scrollX + window.innerWidth - tooltipRect.width - 4;
  if (left > maxLeft) left = maxLeft;
  // If no space above, show below
  if (top < window.scrollY) {
    top = window.scrollY + rect.bottom + 8;
  }

  tooltip.style.top = top + "px";
  tooltip.style.left = left + "px";
}

// Remove the tooltip popup (explanation) if user clicks anywhere else
document.addEventListener("click", (e) => {
  const popup = document.querySelector(".phishing-popup");
  if (popup && !popup.contains(e.target) && !e.target.classList.contains("phishing-status")) {
    popup.remove();
  }
});

// Helper to create & show explanation popup
function createPopup(emailRow, status, explanation) {
  // Remove existing popup
  const existingPopup = document.querySelector(".phishing-popup");
  if (existingPopup) existingPopup.remove();

  const popup = document.createElement("div");
  popup.className = "phishing-popup";
  popup.style.position = "absolute";
  popup.style.background = "rgba(69, 42, 161, 0.39)";
  popup.style.backdropFilter = "blur(15px)";
  popup.style.border = "1px solid rgba(255, 255, 255, 0.1)";
  popup.style.padding = "16px";
  popup.style.borderRadius = "16px";
  popup.style.boxShadow = "0 12px 32px rgba(0, 212, 255, 0.2)";
  popup.style.zIndex = 10000;
  popup.style.maxWidth = "340px";
  popup.style.fontSize = "15px";
  popup.style.color = "#ffffff";
  popup.style.fontFamily = "'SF Pro Display', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";
  popup.style.transition = "opacity 0.3s ease, transform 0.3s ease";
  popup.style.transform = "translateY(5px)";
  popup.style.opacity = "0";

  setTimeout(() => {
    popup.style.opacity = "1";
    popup.style.transform = "translateY(0)";
  }, 10);



  // Title for the popup
  // Title with logo and label
const titleWrapper = document.createElement("div");
titleWrapper.style.display = "flex";
titleWrapper.style.alignItems = "center";
titleWrapper.style.marginBottom = "8px";

const logo = document.createElement("img");
logo.src = getExtensionURL("icons/logo.png"); // Path to your logo
logo.alt = "PhishEye Logo";
logo.style.width = "20px";
logo.style.height = "20px";
logo.style.marginRight = "8px";

const titleText = document.createElement("span");
titleText.textContent = "Phish Eye Report";
titleText.style.fontWeight = "bold";
titleText.style.fontSize = "16px";

titleWrapper.appendChild(logo);
titleWrapper.appendChild(titleText);
popup.appendChild(titleWrapper);


  // Explanation content
  const explanationEl = document.createElement("div");
  explanationEl.innerHTML = explanation;
  popup.appendChild(explanationEl);

  // Understood button to close popup
  const btn = document.createElement("button");
  btn.textContent = "Understood";
  btn.style.marginTop = "10px";
  btn.style.padding = "6px 12px";
  btn.style.border = "none";
  btn.style.backgroundColor = "#007bff";
  btn.style.color = "#fff";
  btn.style.borderRadius = "4px";
  btn.style.cursor = "pointer";

  btn.onclick = () => {
    popup.remove();
  };

  popup.appendChild(btn);

  document.body.appendChild(popup); // Append first so we can measure it
  const popupRect = popup.getBoundingClientRect();

  const rect = emailRow.getBoundingClientRect();
  const scrollX = window.scrollX;
  const scrollY = window.scrollY;

  let popupWidth = popupRect.width;
  let popupHeight = popupRect.height;

  // Initial position: right inside the emailRow
  let top = scrollY + rect.top + rect.height / 2 - popupHeight / 2;
  let left = scrollX + rect.left + rect.width - popupWidth - 10;

  // Prevent off-screen to the right
  const maxLeft = scrollX + window.innerWidth - popupWidth - 10;
  if (left + popupWidth > scrollX + window.innerWidth) {
    // Try placing to the left of the emailRow
    const leftAlt = scrollX + rect.left - popupWidth - 10;
    if (leftAlt >= scrollX) {
      left = leftAlt;
    } else {
      // If still doesn't fit, pin to right edge of screen
      left = maxLeft;
    }
  }

  // Prevent off-screen on left side
  if (left < scrollX + 10) {
    left = scrollX + 10;
  }

  // Prevent popup from going off the bottom
  const maxTop = scrollY + window.innerHeight - popupHeight - 10;
  if (top + popupHeight > scrollY + window.innerHeight) {
    top = maxTop;
  }

  // Prevent popup from going off the top
  if (top < scrollY + 10) {
    top = scrollY + 10;
  }

  popup.style.top = `${top}px`;
  popup.style.left = `${left}px`;

}


// Helper to add icon
// Helper to add icon
function addStatusIcon(emailRow, status = "pending") {
  if (emailRow.querySelector(".phishing-status")) return;

  const icon = document.createElement("img");
  icon.className = "phishing-status";
  icon.style.marginRight = "10px";
  icon.style.width = "16px";
  icon.style.height = "16px";
  icon.style.cursor = "pointer";

  // Use logo for all statuses (you can customize per status below)
  icon.src = getExtensionURL("icons/logo.png");
  icon.alt = status;
  icon.title = status;

  // Tooltip on hover
  icon.addEventListener("mouseenter", () => {
    showTooltip(icon, status);
  });
  icon.addEventListener("mouseleave", () => {
    removeTooltip();
  });

  // Handle click: fetch explanation from backend
  icon.addEventListener("click", (e) => {
    e.stopPropagation();
    e.preventDefault();
    removeTooltip();
    fetchExplanationAndShowPopup(emailRow, status);
  });

  const subjectCell = emailRow.querySelector("td:nth-child(6)");
  if (subjectCell) {
    subjectCell.prepend(icon);
  }
}



// Extract email preview
function extractEmailText(emailRow) {
  const subjectEl = emailRow.querySelector("span.bog");
  const snippetEl = emailRow.querySelector("span.y2");

  const subject = subjectEl?.innerText || "";
  const snippet = snippetEl?.innerText || "";

  return `${subject} ${snippet}`;
}


// Dummy explanation generator (replace with real API call or real data)
function getExplanationForEmail(status, emailText) {
  if (status === "phishing") {
    return `
      <p><strong>Suspicious words found:</strong> verify, suspended, account, click</p>
      <p>This email contains typical phishing phrases trying to steal your credentials.</p>
      <p><strong>Phishing confidence:</strong> 99.89%</p>
    `;
  } else if (status === "legit") {
    return `
      <p>No suspicious words detected.</p>
      <p>This email appears safe.</p>
      <p><strong>Legitimate confidence:</strong> 56.08%</p>
    `;
  }
  return "<p>Status unknown.</p>";
}

async function fetchExplanationAndShowPopup(emailRow, status) {
    const previewText = extractEmailText(emailRow);

    try {
        const response = await fetch("http://127.0.0.1:8000/predict", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ text: previewText })
        });

        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);

        const data = await response.json();

        // Build HTML explanation
        let explanationHtml = `
            <h2 style="margin-top: 0;">Prediction: <span style="color: ${data.prediction === "Phishing" ? "red" : "green"};">${data.prediction}</span></h2>
            <p><strong>Confidence:</strong></p>
            <ul>
                <li>✅ Legitimate: ${(data.confidence.Legitimate * 100).toFixed(2)}%</li>
                <li>❌ Phishing: ${(data.confidence.Phishing * 100).toFixed(2)}%</li>
            </ul>
            <p><strong>Top contributing words:</strong></p>
            <ul>
                ${data.top_contributing_words.map(w => `<li><strong>${w.word}</strong> (impact: ${w.impact.toFixed(4)})</li>`).join("")}
            </ul>
            <p>This email is flagged as <strong>${data.prediction}</strong> based on the presence of certain words and their influence on the prediction.</p>
        `;

        createPopup(emailRow, status, explanationHtml);

    } catch (error) {
        console.error("Error getting prediction from backend:", error);
        createPopup(emailRow, status, `<p style="color:red;">Could not connect to prediction server.</p>`);
    }
}



// Main scanner
// let lastScanCount = 0;

// function scanEmails() {
//   const emailRows = document.querySelectorAll("tr.zA");

//   if (emailRows.length === lastScanCount) return; // Skip if same number of emails
//   lastScanCount = emailRows.length;

//   emailRows.forEach((row) => {
//     if (row.querySelector(".phishing-status")) return;

//     const previewText = extractEmailText(row);
//     const lower = previewText.toLowerCase();

//     const isPhishing = lower.includes("verify") || lower.includes("suspended");
//     const status = isPhishing ? "phishing" : "legit";
//     const explanation = getExplanationForEmail(status, previewText);

//     addStatusIcon(row, status, explanation);
//   });
// }

function scanEmails() {
  const emailRows = document.querySelectorAll("tr.zA");
  emailRows.forEach((row) => {
    if (row.querySelector(".phishing-status")) return;
    const previewText = extractEmailText(row);
    const lower = previewText.toLowerCase();

    const isPhishing = lower.includes("verify") || lower.includes("suspended");
    const status = isPhishing ? "phishing" : "legit";
    const explanation = getExplanationForEmail(status, previewText);

    addStatusIcon(row, status, explanation);
  });
}



// Run every 3 seconds
setInterval(() => {
  if (window.location.href.includes("mail.google.com/mail/u/")) {
    scanEmails();
  }
}, 3000);
