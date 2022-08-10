let imageReload = setInterval(loadRandomBackgroundImage, 60000);
equipListeners();

function loadRandomBackgroundImage() {
    let randomNum = Math.round((Math.random() * 16) + 1);
    console.log('Random Number: ' + randomNum);
    document.querySelector('#alltainer').style.backgroundImage = "url('./images/background_" + randomNum + ".jpg')";
}

function togglePane(e) {
    let t = e.target.id.substring(12);
    console.log('Target: ' + t);
    let targetNode = document.querySelector('#'+t);
    console.log('Visibility: ' + targetNode.style.visibility);
    targetNode.style.visibility === 'visible' ? targetNode.style.visibility = 'hidden' : targetNode.style.visibility = 'visible';
}

function equipListeners() {
    let toggleNodes = document.querySelectorAll('.paneToggler');
    toggleNodes.forEach( (node) => { 
        node.addEventListener('click', togglePane);
     });
    console.log('Listeners equipped!');
}