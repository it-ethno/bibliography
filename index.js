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

let authors = new Map();
let books = new Map();
let publishers = new Map();

/* Class Definitions */

class Book {
    uid;
    title;
    subtitle;
    author_id;
    author_name;
    author_prename;
    year;
    publisher_id;
    publisher_name;
    place;
    edition;
    is_anthology;
    notes;
    signatures;
    quotes;
    number_pages;
    isbn;
    language;
    link;

    constructor(title, options = {}) {
        if (books.has(title)) {
            return books.get(title);
        } else {    
            this.uid = uid();
            this.title = title;
            this.subtitle = options.subtitle || '';
            this.year = options.year || new Date().getFullYear();
            this.is_anthology = options.is_anthology || false;
            this.place = options.place || '';
            this.notes = [];
            this.quotes = [];
            this.signatures = [];
            this.isbn = options.isbn || '';
            this.number_pages = options.number_pages || 0;
            this.language = options.language || 'Language Unknown';
            this.author_name = options.surname;
            this.author_prename = options.prename;
            this.publisher_name = options.publisher;

            let author = (options.surname || '') + ', ' + (options.prename || '');
            if (author !== ', ') {
                if (!authors.has(author)) {
                    let a = new Author(options.surname, options.prename);
                    this.author_id = a.uid;
                } else {
                    this.author_id = authors.get(author).uid;
                }
            }

            if (!publishers.has(options.publisher)) {
                let p = new Publisher(options.publisher, this.place);
                this.publisher_id = p.uid;
            } else {
                this.publisher_id = publishers.get(options.publisher).uid;
            }

            books.set(this.title, this);
            localStorage.setItem('books', JSON.stringify(Object.fromEntries(books)));
        }
    }
}

class Author {
    uid;
    prename;
    surname;
    titles;
    date_birth;
    date_death;
    bio;
    notes;
    professorships;
    place;

    constructor(surname, prename) {
        this.uid = uid();
        this.surname = surname;
        this.prename = prename;
        authors.set(this.surname + ', ' + this.prename, this);
        localStorage.setItem('authors', JSON.stringify(Object.fromEntries(authors)));    
    }
}

class Library {
    uid;
    title;
    subtitle;
    geo_location;
    place_location;

    constructor(title, subtitle) {
        this.title = title;
        this.subtitle = subtitle;
        this.uid = uid();
    }

}

class Publisher {
    uid;
    name;
    places;
    date_foundation;
    founders;
    notes;

    constructor(name, place) {
        this.uid = uid();
        this.name = name;
        this.places = [];
        this.founders = [];
        this.notes = [];
        this.places.push(place);

        publishers.set(this.name, this);
        localStorage.setItem('publishers', JSON.stringify(Object.fromEntries(publishers)));
    }
}

class Citation {
    uid;
    book_id;
    page;
    citation_text;
    notes;
    date_added;

    constructor(quote, page, book_id) {
        this.citation_text = quote;
        this.page = page;
        this.book_id = book_id;
        this.date_added = Date.now();
        this.uid = uid();

    }
}


/* Functional Code */

const uid = () => {
    return (Date.now().toString(32) + Math.random().toString(16).replace(/\./g, '')).substring(0, 20);
}

let imageReload = setInterval(loadRandomBackgroundImage, 60000);

let authorsPane = document.querySelector('#authors');
let exportPane = document.querySelector('#export');
let stockPane = document.querySelector('#stock');

initializeApp();

function parseMainInput() {
    let input = document.querySelector('#mainInput').value;
    console.log('Eingabe: ' + input);
    let inputVals = input.split('.');
    
    let author = inputVals[0].split(',');
    let surname = author[0].trim();
    let prename = author[1].trim();
    let year = inputVals[1].trim();
    let title = inputVals[2].trim();
    let subtitle = '';
    if (title.indexOf(':') !== -1) {
        subtitle = title.substring(title.indexOf(':')+1).trim();
        title = title.substring(0, title.indexOf(':')).trim();
    }
    let publisher = inputVals[3].split(':');
    let location = publisher[0].trim();
    let pubName = publisher[1].trim();
    let book = new Book(title, {
        subtitle: subtitle,
        year: year,
        surname: surname,
        prename: prename,
        place: location,
        publisher: pubName
    });
    updateDisplay();

}

function updateDisplay() {
    updateAuthorsPane();
    updateStockPane();
    updateExportPane();
}

function updateAuthorsPane() {
    authorsPane.innerHTML = '';
    Array.from(authors.keys()).forEach(author => {
        let newDiv = document.createElement('div');
        newDiv.classList.add('authorsPaneItem');
        newDiv.textContent = author;
        authorsPane.appendChild(newDiv);
    });
}

function updateStockPane() {
    stockPane.innerHTML = '';
    Array.from(books.keys()).forEach(book => {
        let newDiv = document.createElement('div');
        newDiv.classList.add('stockPaneItem');
        newDiv.textContent = book;
        stockPane.appendChild(newDiv);
    });
}

function updateExportPane() {

}

function maximizePane(e) {
    let target = document.querySelector('#' + e.target.id.substring(16));
    e.target.classList.remove('fa-expand');
    e.target.classList.add('fa-compress');
    e.target.removeEventListener('click', maximizePane);
    e.target.addEventListener('click', minimizePane);
    target.style.top = '0px';
    target.style.right = '0px';
    target.style.bottom = '0px';
    target.style.left = '0px';
    target.style.height = '100%';
    target.style.width = '100%';
    target.style.borderRadius = '15px';
    target.style.backgroundColor = 'rgba(240, 240, 240, 0.98)';
    target.style.zIndex = '10';
}

function minimizePane(e) {
    let target = document.querySelector('#' + e.target.id.substring(16));
    e.target.classList.remove('fa-compress');
    e.target.classList.add('fa-expand');
    e.target.removeEventListener('click', minimizePane);
    e.target.addEventListener('click', maximizePane);
    target.style.zIndex = '1';
    switch(target.id) {
        case 'authorsPane':
            target.style.top = '0px';
            target.style.right = '';
            target.style.bottom = '0px';
            target.style.left = '0px';
            target.style.height = '';
            target.style.width = '20%';
            target.style.borderRadius = '0 15px 15px 0';
            target.style.backgroundColor = 'rgba(240, 240, 240, 1.0)';
            break;
        case 'stockPane':
            target.style.top = '';
            target.style.right = '20%';
            target.style.bottom = '0px';
            target.style.left = '20%';
            target.style.height = '';
            target.style.width = '';
            target.style.borderRadius = '15px 15px 0 0';
            target.style.backgroundColor = 'rgba(240, 240, 240, 1.0)';
            break;
        case 'exportPane':
            target.style.top = '0px';
            target.style.right = '0px';
            target.style.bottom = '0px';
            target.style.left = '';
            target.style.height = '';
            target.style.width = '20%';
            target.style.borderRadius = '15px 0 0 15px';
            target.style.backgroundColor = 'rgba(240, 240, 240, 1.0)';
            break;
    }
}

function showLastAdditions() {
    Array.from(books).forEach((book) => {
        let newDiv = document.createElement('div');
        newDiv.classList.add('lastAdditionsItem');
        newDiv.textContent = book[1].author_name + ', ' + book[1].author_prename + '. ' + book[1].year + '. ' + book[1].title + '. ' + book[1].place;
        document.querySelector('#latestAdditions').appendChild(newDiv);
    })
}

function observeMainInput(e) {
    if (e.keyCode === 13) {
        parseMainInput();
    }
    /* TODO Parse input and reflect current progress in Standard Format String below mainInput (green coloring) */
}

function loadRandomBackgroundImage() {
    document.querySelector('#alltainer').style.backgroundImage = "url('./images/background_" + Math.round((Math.random() * 15) + 1) + ".jpg')";
}

function togglePane(e) {
    let targetNode = document.querySelector('#' + e.target.id.substring(12));
    targetNode.style.visibility === 'visible' ? targetNode.style.visibility = 'hidden' : targetNode.style.visibility = 'visible';
}

function equipListeners() {
    document.querySelectorAll('.paneToggler').forEach( (node) => { node.addEventListener('click', togglePane); });
    document.querySelectorAll('.configuratorToggler').forEach( (node) => { node.addEventListener('click', toggleConfigurator); });
    document.querySelectorAll('.maximizePaneToggler').forEach( (node) => { node.addEventListener('click', maximizePane); });
    document.querySelector('#settingsToggler').addEventListener('click', toggleSettings);
    document.querySelector('#closeSettings').addEventListener('click', toggleSettings);
    document.querySelector('#mainInput').addEventListener('keydown', observeMainInput);
}

function toggleSettings() {
    let settings = document.querySelector('#settings');
    settings.style.visibility === 'visible' ? settings.style.visibility = 'hidden' : settings.style.visibility = 'visible';
}

function toggleConfigurator() {
    let configurator = document.querySelector('#formatConfigurator');
    configurator.style.visibility === 'visible' ? configurator.style.visibility = 'hidden' : configurator.style.visibility = 'visible';
}

function handleSettingsChange(e) {
    switch(e.target.id) {

    }
}

function exportLocalDataToJsonFile() {
    
}

function initializeApp() {
    initializeLocalStorage();
    equipListeners();
    updateDisplay();
    showLastAdditions();
}

function initializeLocalStorage() {
    if (!localStorage.getItem('settings')) {
        populateLocalStorage();
    } else {
        loadLocalStorage();
    }
}

function populateLocalStorage() {
    localStorage.setItem('settings', JSON.stringify(settings));
    localStorage.setItem('books', JSON.stringify(Object.fromEntries(books)));
    localStorage.setItem('authors', JSON.stringify(Object.fromEntries(authors)));
    localStorage.setItem('publishers', JSON.stringify(Object.fromEntries(publishers)));
}

function loadLocalStorage() {
    settings = JSON.parse(localStorage.getItem('settings'));
    books = new Map(Object.entries(JSON.parse(localStorage.getItem('books'))));
    authors = new Map(Object.entries(JSON.parse(localStorage.getItem('authors'))));
    publishers = new Map(Object.entries(JSON.parse(localStorage.getItem('publishers'))));
}