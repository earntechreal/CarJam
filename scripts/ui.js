/* scripts/ui.js */

// Helper to get URL parameters
function getQueryParam(param) {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get(param);
}

// Update the "Level X" text in game.html
function updateLevelDisplay() {
    const levelNum = getQueryParam('level') || 1;
    const displayElement = document.getElementById('current-level-num');
    if (displayElement) {
        displayElement.innerText = levelNum;
    }
    return parseInt(levelNum);
}

// Update the "Back" button to go to levels.html
document.addEventListener('DOMContentLoaded', () => {
    const backBtn = document.getElementById('btn-back');
    if(backBtn) {
        backBtn.onclick = () => window.location.href = 'levels.html';
    }
});