/* This file contains blocks of code saved for later use */

/* Old code for creating the stock view */
let newDiv = document.createElement('div');
newDiv.classList.add('flextainer');
let newActDiv = document.createElement('div');
let newTitleDiv = document.createElement('div');
newTitleDiv.textContent = book[0];
newDiv.appendChild(newTitleDiv);
newActDiv.classList.add('flexRightItem');
let newTrash = document.createElement('i');
newTrash.classList.add('fa-solid');
newTrash.classList.add('fa-trash-can');
newTrash.classList.add('action');
newTrash.title = "Delete '" + book[0] + "'";
newTrash.id = 'delBtn-' + book[0];
newTrash.addEventListener('click', deleteBook);
newActDiv.appendChild(newTrash);
newDiv.classList.add('stockPaneItem');
newDiv.appendChild(newActDiv);
stockPane.appendChild(newDiv);

/* Old screensaver constructor */
console.log(text);
Array.from(text).forEach((letter) => {
    let letterChar = document.createElement('div');
    letterChar.classList.add('screenSaverLetter');
    letterChar.style.fontSize = Math.round((Math.random() * 200) + 400) + '%';
    if (letter === ' ') { letterChar.style.marginRight = '30px'; }
    let n = ((Math.random() * 1.5) + 2.0).toFixed(2);
    let m = Math.round((Math.random() * 25) + 230);
    let o = (Math.random() * 0.45)+ 0.55;
    let t = Math.round(Math.random() * 4);
    let d = (Math.random() * Math.random() * 0.9).toFixed(2);
    letterChar.style.color = `rgba(${m}, ${m}, ${m}, ${o})`;
    letterChar.style.animation = `text-flicker-in-glow ${n}s ${timing[t]} ${d}s both`;
    letterChar.textContent = letter;
    letterContainer.appendChild(letterChar);
});

/* Old number of letters word in screensaver */
let note = '(' + numberLetters + ')';
let noteDiv = document.createElement('div');
noteDiv.classList.add('screenSaverWord');
Array.from(note).forEach((letter) => {
    let letterChar = document.createElement('div');
    letterChar.classList.add('screenSaverLetter');
    letterChar.style.fontSize = '250%';
    let n = (Math.random() * 4).toFixed(2);
    let m = Math.round((Math.random() * 25) + 210);
    let o = (Math.random() * 0.45)+ 0.55;
    let t = Math.round(Math.random()* 4);
    let d = (Math.random() * 0.6).toFixed(2);
    console.log('n:' + n + ' - d: ' + d);
    letterChar.style.color = `rgba(${m}, ${m}, ${m}, ${o})`;
    letterChar.style.animation = `text-flicker-in-glow ${n}s ${timing[t]} ${d}s both`;
    letterChar.textContent = letter;
    noteDiv.appendChild(letterChar);
});
wordsDiv.appendChild(noteDiv);
