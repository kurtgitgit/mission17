// API Configuration
const API_BASE_URL = 'http://127.0.0.1:8000';

// DOM Elements
const dropZone = document.getElementById('dropZone');
const fileInput = document.getElementById('fileInput');
const browseBtn = document.getElementById('browseBtn');
const imagePreview = document.getElementById('imagePreview');
const previewImg = document.getElementById('previewImg');
const removeBtn = document.getElementById('removeBtn');
const dropZoneContent = document.querySelector('.drop-zone-content');
const labelSelect = document.getElementById('labelSelect');
const analyzeBtn = document.getElementById('analyzeBtn');
const btnText = document.querySelector('.btn-text');
const btnLoader = document.querySelector('.btn-loader');
const resultSection = document.getElementById('resultSection');
const resultCard = document.querySelector('.result-card');
const resultStatus = document.getElementById('resultStatus');
const resultTitle = document.getElementById('resultTitle');
const resultMessage = document.getElementById('resultMessage');
const resultDetails = document.getElementById('resultDetails');
const themeToggle = document.getElementById('themeToggle');

// State
let selectedFile = null;

// Theme Management
function initTheme() {
    const savedTheme = localStorage.getItem('theme') || 'light';
    document.documentElement.setAttribute('data-theme', savedTheme);
}

themeToggle.addEventListener('click', () => {
    const currentTheme = document.documentElement.getAttribute('data-theme');
    const newTheme = currentTheme === 'light' ? 'dark' : 'light';
    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem('theme', newTheme);
});

// File Upload Handling
browseBtn.addEventListener('click', () => fileInput.click());

fileInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file) handleFile(file);
});

// Drag and Drop
dropZone.addEventListener('dragover', (e) => {
    e.preventDefault();
    dropZone.classList.add('dragover');
});

dropZone.addEventListener('dragleave', () => {
    dropZone.classList.remove('dragover');
});

dropZone.addEventListener('drop', (e) => {
    e.preventDefault();
    dropZone.classList.remove('dragover');
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith('image/')) {
        handleFile(file);
    } else {
        showNotification('Please upload an image file', 'error');
    }
});

function handleFile(file) {
    selectedFile = file;
    const reader = new FileReader();
    
    reader.onload = (e) => {
        previewImg.src = e.target.result;
        dropZoneContent.style.display = 'none';
        imagePreview.style.display = 'block';
        analyzeBtn.disabled = false;
    };
    
    reader.readAsDataURL(file);
}

removeBtn.addEventListener('click', () => {
    selectedFile = null;
    fileInput.value = '';
    dropZoneContent.style.display = 'flex';
    imagePreview.style.display = 'none';
    analyzeBtn.disabled = true;
    resultSection.style.display = 'none';
});

// Label presets
const labelPresets = {
    default: [
        "cleaning environment",
        "planting trees",
        "people cleaning street",
        "waste segregation",
        "tree planting activity",
        "community cleanup",
        "recycling materials",
        "protecting wildlife",
        "forest conservation",
        "coastal cleanup"
    ],
    medical: [
        "medical mission",
        "health checkup",
        "vaccination program",
        "blood donation",
        "dental mission",
        "medical consultation",
        "first aid training",
        "health awareness seminar"
    ],
    education: [
        "teaching students",
        "reading program",
        "scholarship distribution",
        "school supplies donation",
        "tutorial session",
        "computer training",
        "skills workshop",
        "literacy program"
    ],
    infrastructure: [
        "road construction",
        "building repair",
        "bridge construction",
        "facility renovation",
        "infrastructure improvement",
        "construction work",
        "building maintenance",
        "community infrastructure"
    ],
    community: [
        "feeding program",
        "livelihood training",
        "community gathering",
        "sports activity",
        "cultural event",
        "community assembly",
        "youth program",
        "senior citizen activity"
    ],
    disaster: [
        "disaster relief",
        "evacuation assistance",
        "relief goods distribution",
        "rescue operation",
        "emergency response",
        "disaster preparedness",
        "relief packing",
        "emergency aid"
    ]
};

// Analyze Image
analyzeBtn.addEventListener('click', async () => {
    if (!selectedFile) return;

    // Show loading state
    btnText.style.display = 'none';
    btnLoader.style.display = 'flex';
    analyzeBtn.disabled = true;
    resultSection.style.display = 'none';

    try {
        const formData = new FormData();
        formData.append('file', selectedFile);

        // Add labels based on selected category
        const selectedCategory = labelSelect.value;
        if (selectedCategory !== 'default' && labelPresets[selectedCategory]) {
            const labels = labelPresets[selectedCategory].join(',');
            formData.append('labels', labels);
        }

        const response = await fetch(`${API_BASE_URL}/analyze-image`, {
            method: 'POST',
            body: formData
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        displayResults(data);

    } catch (error) {
        console.error('Error:', error);
        showNotification('Failed to analyze image. Make sure the API server is running.', 'error');
    } finally {
        btnText.style.display = 'inline';
        btnLoader.style.display = 'none';
        analyzeBtn.disabled = false;
    }
});

function displayResults(data) {
    resultSection.style.display = 'block';
    
    // Set card style based on result
    resultCard.className = 'result-card ' + (data.valid ? 'success' : 'error');
    
    // Set status indicator
    resultStatus.textContent = data.valid ? '✓' : '✕';
    
    // Set title and message
    resultTitle.textContent = data.valid ? 'Valid Image' : 'Invalid Image';
    resultMessage.textContent = data.message;
    
    // Build details
    const details = [];
    
    details.push({
        label: 'Authenticity Check',
        value: `${(data.deepfake_confidence * 100).toFixed(1)}% confidence`
    });
    
    if (data.sdg_label) {
        details.push({
            label: 'Detected Activity',
            value: data.sdg_label
        });
    }
    
    if (data.sdg_score !== null && data.sdg_score !== undefined) {
        details.push({
            label: 'Activity Confidence',
            value: `${(data.sdg_score * 100).toFixed(1)}%`
        });
    }
    
    resultDetails.innerHTML = details.map(detail => `
        <div class="detail-item">
            <span class="detail-label">${detail.label}</span>
            <span class="detail-value">${detail.value}</span>
        </div>
    `).join('');
    
    // Scroll to results
    resultSection.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.textContent = message;
    notification.style.cssText = `
        position: fixed;
        top: 24px;
        left: 50%;
        transform: translateX(-50%);
        background: ${type === 'error' ? '#dc3545' : '#198754'};
        color: white;
        padding: 12px 24px;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        z-index: 9999;
        font-size: 0.9375rem;
    `;
    
    document.body.appendChild(notification);
    
    setTimeout(() => notification.remove(), 3000);
}

// Initialize
initTheme();
