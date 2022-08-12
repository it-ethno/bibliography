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
    year;
    publisher_id;
    place;
    edition;
    is_anthology;
    notes;
    signatures;
    quotes;
    number_pages;
    isbn;
    language;

    constructor(title, options = {}) {
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
equipListeners();

let authorsPane = document.querySelector('#authors');
let exportPane = document.querySelector('#export');
let stockPane = document.querySelector('#stock');

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

function observeMainInput(e) {
    console.log(e.key);
    if (e.keyCode === 13) {
        parseMainInput();
    }
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
    document.querySelector('#settingsToggler').addEventListener('click', toggleSettings);
    document.querySelector('#closeSettings').addEventListener('click', toggleSettings);
    document.querySelector('#mainInput').addEventListener('keydown', observeMainInput);
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