// ===================================
// EDITIONS DATA
// ===================================
// Manual editions (curated newsletters)
const manualEditions = [
    {
        number: "3rd Edition",
        date: "December 5th, 2025",
        pdfUrl: "pdfs/goonzette-3rd-edition.pdf",
        description: "Featuring: The Bronian Trilogy analysis, Yeet Discord Weather Report, Overwatch Renaissance, Finch App invasion, and Minecraft Chronicles!"
    },
    {
        number: "2nd Edition",
        date: "November 10th, 2025",
        pdfUrl: "pdfs/goonzette-2nd-edition.pdf",
        description: "GoonerZ dominate in the rain! Plus: White Girl Fits competition, Mega Dimension Pokemon DLC, and the GIF Epidemic analysis."
    },
    {
        number: "1st Edition",
        date: "November 3rd, 2025",
        pdfUrl: "pdfs/goonzette-1st-edition.pdf",
        description: "The inaugural issue! Plank-Knat drama shakes Yeet to the core, game releases, and cultural commentary."
    },
];

// GitHub repository info for auto-generated PDFs
const GITHUB_REPO = 'gbigfire-hub/Goonzette_automation';
const GITHUB_BRANCH = 'main';
const GITHUB_PDF_PATH = 'pdfs';

let editions = [...manualEditions]; // Will be populated with auto-generated PDFs

// Load auto-generated daily PDFs from GitHub
async function loadDailyPDFs() {
    try {
        const response = await fetch(`https://api.github.com/repos/${GITHUB_REPO}/contents/${GITHUB_PDF_PATH}?ref=${GITHUB_BRANCH}`);
        if (!response.ok) {
            console.warn('Could not load daily PDFs from GitHub');
            return;
        }
        
        const files = await response.json();
        const dailyPDFs = files
            .filter(file => file.name.startsWith('goonzette-daily-') && file.name.endsWith('.pdf'))
            .map(file => {
                // Extract date from filename: goonzette-daily-2025-12-06.pdf
                const dateMatch = file.name.match(/goonzette-daily-(\d{4}-\d{2}-\d{2})\.pdf/);
                if (!dateMatch) return null;
                
                const dateStr = dateMatch[1];
                const date = new Date(dateStr);
                const formattedDate = date.toLocaleDateString('en-US', {
                    month: 'long',
                    day: 'numeric',
                    year: 'numeric'
                });
                
                return {
                    number: `Daily - ${formattedDate}`,
                    date: formattedDate,
                    pdfUrl: `https://raw.githubusercontent.com/${GITHUB_REPO}/${GITHUB_BRANCH}/${GITHUB_PDF_PATH}/${file.name}`,
                    description: "Automatically compiled from daily AI-generated articles",
                    timestamp: date.getTime(),
                    isDaily: true
                };
            })
            .filter(Boolean)
            .sort((a, b) => b.timestamp - a.timestamp); // Newest first
        
        // Combine manual and daily editions
        editions = [...dailyPDFs, ...manualEditions];
        
        console.log(`Loaded ${dailyPDFs.length} daily newsletters from GitHub`);
        
        // Re-render if already on page
        if (document.getElementById('editions-container')) {
            renderEditions();
        }
    } catch (error) {
        console.error('Error loading daily PDFs:', error);
    }
}

// ===================================
// PDF.js SETUP
// ===================================
pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';

// Store generated cover images
const coverImageCache = {};

// ===================================
// PDF COVER GENERATION
// ===================================
async function generateCoverImage(pdfUrl) {
    // Check cache first
    if (coverImageCache[pdfUrl]) {
        return coverImageCache[pdfUrl];
    }

    try {
        // Load the PDF
        const loadingTask = pdfjsLib.getDocument(pdfUrl);
        const pdf = await loadingTask.promise;
        
        // Get the first page
        const page = await pdf.getPage(1);
        
        // Set up canvas with appropriate scale
        const scale = 2.0; // Higher scale for better quality
        const viewport = page.getViewport({ scale: scale });
        
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        canvas.width = viewport.width;
        canvas.height = viewport.height;
        
        // Render the page
        const renderContext = {
            canvasContext: context,
            viewport: viewport
        };
        
        await page.render(renderContext).promise;
        
        // Convert to data URL
        const imageDataUrl = canvas.toDataURL('image/png');
        
        // Cache it
        coverImageCache[pdfUrl] = imageDataUrl;
        
        return imageDataUrl;
    } catch (error) {
        console.error('Error generating cover image:', error);
        // Return placeholder on error
        return generatePlaceholder();
    }
}

function generatePlaceholder() {
    // Create a simple placeholder canvas
    const canvas = document.createElement('canvas');
    canvas.width = 600;
    canvas.height = 800;
    const ctx = canvas.getContext('2d');
    
    // Purple gradient background
    const gradient = ctx.createLinearGradient(0, 0, 0, 800);
    gradient.addColorStop(0, '#663399');
    gradient.addColorStop(1, '#4a1f6b');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 600, 800);
    
    // Add text
    ctx.fillStyle = '#ffffff';
    ctx.font = 'italic 60px "Playfair Display", serif';
    ctx.textAlign = 'center';
    ctx.fillText('The Goonzette', 300, 400);
    
    return canvas.toDataURL('image/png');
}

// ===================================
// PDF VIEWER FUNCTIONS
// ===================================
function openPDFViewer(pdfUrl, title) {
    const modal = document.getElementById('pdf-modal');
    const iframe = document.getElementById('pdf-viewer');
    const modalTitle = document.getElementById('pdf-modal-title');
    const downloadLink = document.getElementById('pdf-download-link');
    
    // Set title
    modalTitle.textContent = title;
    
    // Set PDF source
    iframe.src = pdfUrl;
    
    // Set download link
    downloadLink.href = pdfUrl;
    downloadLink.download = pdfUrl.split('/').pop();
    
    // Show modal
    modal.style.display = 'block';
    
    // Prevent body scroll
    document.body.style.overflow = 'hidden';
}

function closePDFViewer() {
    const modal = document.getElementById('pdf-modal');
    const iframe = document.getElementById('pdf-viewer');
    
    // Hide modal
    modal.style.display = 'none';
    
    // Clear iframe
    iframe.src = '';
    
    // Restore body scroll
    document.body.style.overflow = 'auto';
}

// Close modal when clicking outside
window.onclick = function(event) {
    const modal = document.getElementById('pdf-modal');
    if (event.target === modal) {
        closePDFViewer();
    }
}

// Close modal with Escape key
document.addEventListener('keydown', function(event) {
    if (event.key === 'Escape') {
        closePDFViewer();
    }
});

// ===================================
// DISPLAY FUNCTIONS
// ===================================

async function displayLatestEdition() {
    const latestContainer = document.getElementById('latest-edition-content');
    
    if (editions.length === 0) {
        latestContainer.innerHTML = `
            <div class="empty-state">
                <p>No editions published yet. Check back soon!</p>
            </div>
        `;
        return;
    }

    const latest = editions[0];
    
    // Show loading placeholder first
    latestContainer.innerHTML = `
        <div class="edition-featured">
            <div class="edition-cover cover-loading">
                <div style="width: 100%; height: 600px; display: flex; align-items: center; justify-content: center;">
                    <div class="loading-spinner"></div>
                </div>
            </div>
            <div class="edition-details">
                <div class="edition-number">${latest.number}</div>
                <div class="edition-date">${latest.date}</div>
                ${latest.description ? `<p class="edition-description">${latest.description}</p>` : ''}
                <button class="btn-primary" onclick="openPDFViewer('${latest.pdfUrl}', 'The Goonzette - ${latest.number}')">Read Latest Edition</button>
            </div>
        </div>
    `;
    
    // Generate cover image
    const coverImage = await generateCoverImage(latest.pdfUrl);
    
    // Update with actual cover
    latestContainer.innerHTML = `
        <div class="edition-featured">
            <div class="edition-cover">
                <img src="${coverImage}" alt="${latest.number} Cover">
            </div>
            <div class="edition-details">
                <div class="edition-number">${latest.number}</div>
                <div class="edition-date">${latest.date}</div>
                ${latest.description ? `<p class="edition-description">${latest.description}</p>` : ''}
                <button class="btn-primary" onclick="openPDFViewer('${latest.pdfUrl}', 'The Goonzette - ${latest.number}')">Read Latest Edition</button>
            </div>
        </div>
    `;
}

async function displayArchive(editionsToDisplay = editions) {
    const gridContainer = document.getElementById('editions-grid');
    
    if (editionsToDisplay.length === 0) {
        gridContainer.innerHTML = `
            <div class="empty-state" style="grid-column: 1/-1;">
                <p>No editions found matching your search.</p>
            </div>
        `;
        return;
    }

    // Show loading placeholders
    gridContainer.innerHTML = editionsToDisplay.map(edition => `
        <div class="edition-card">
            <div class="edition-card-cover cover-loading">
                <div style="width: 100%; height: 400px; display: flex; align-items: center; justify-content: center;">
                    <div class="loading-spinner"></div>
                </div>
                <div class="pdf-badge">PDF</div>
            </div>
            <div class="edition-card-info">
                <div class="edition-card-number">${edition.number}</div>
                <div class="edition-card-date">${edition.date}</div>
                <button class="btn-secondary" onclick="openPDFViewer('${edition.pdfUrl}', 'The Goonzette - ${edition.number}')">View Edition</button>
            </div>
        </div>
    `).join('');
    
    // Generate all cover images
    const cards = gridContainer.querySelectorAll('.edition-card');
    for (let i = 0; i < editionsToDisplay.length; i++) {
        const edition = editionsToDisplay[i];
        const card = cards[i];
        const coverContainer = card.querySelector('.edition-card-cover');
        
        const coverImage = await generateCoverImage(edition.pdfUrl);
        
        coverContainer.innerHTML = `
            <img src="${coverImage}" alt="${edition.number} Cover">
            <div class="pdf-badge">PDF</div>
        `;
        coverContainer.classList.remove('cover-loading');
        
        // Add click handler to whole card
        card.style.cursor = 'pointer';
        card.onclick = function(e) {
            // Don't trigger if clicking the button
            if (e.target.tagName !== 'BUTTON') {
                openPDFViewer(edition.pdfUrl, `The Goonzette - ${edition.number}`);
            }
        };
    }
}

// ===================================
// SEARCH FUNCTIONALITY
// ===================================

function setupSearch() {
    const searchInput = document.getElementById('search-input');
    
    searchInput.addEventListener('input', (e) => {
        const searchTerm = e.target.value.toLowerCase();
        
        const filteredEditions = editions.filter(edition => {
            return edition.number.toLowerCase().includes(searchTerm) ||
                   edition.date.toLowerCase().includes(searchTerm) ||
                   (edition.description && edition.description.toLowerCase().includes(searchTerm));
        });
        
        displayArchive(filteredEditions);
    });
}

// ===================================
// INITIALIZE ON PAGE LOAD
// ===================================

document.addEventListener('DOMContentLoaded', async () => {
    displayLatestEdition();
    displayArchive();
    setupSearch();
    
    // Load auto-generated daily PDFs from GitHub
    await loadDailyPDFs();
});
