let settings = {
    language: 'en',
    useBackground: true,
    changeInterval: 1,
    useFixedBackground: false,
    fixedBackground: '',
    inputFormat: '',
    outputFormat: '',
    serverURL: ''
};

let imageReload = setInterval(loadRandomBackgroundImage, 60000);
equipListeners();

function loadRandomBackgroundImage() {
    document.querySelector('#alltainer').style.backgroundImage = "url('./images/background_" + Math.round((Math.random() * 15) + 1) + ".jpg')";
}

function togglePane(e) {
    let targetNode = document.querySelector('#' + e.target.id.substring(12));
    targetNode.style.visibility === 'visible' ? targetNode.style.visibility = 'hidden' : targetNode.style.visibility = 'visible';
}

function equipListeners() {
    document.querySelectorAll('.paneToggler').forEach( (node) => { node.addEventListener('click', togglePane); });
    document.querySelector('#settingsToggler').addEventListener('click', toggleSettings);
    document.querySelector('#closeSettings').addEventListener('click', toggleSettings);
}

function toggleSettings() {
    let settings = document.querySelector('#settings');
    settings.style.visibility === 'visible' ? settings.style.visibility = 'hidden' : settings.style.visibility = 'visible';
}

function handleSettingsChange(e) {
    switch(e.target.id) {

    }
}

function exportLocalDataToJsonFile() {
    
}