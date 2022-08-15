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