/* Global Variables */

let settings = {
    language: 'en',
    useBackground: true,
    changeInterval: 1,
    useFixedBackground: false,
    fixedBackground: '',
    inputFormat: '',
    outputFormat: '',
    serverURL: '',
    useLocalStorage: true
};

let authors = new Map();
let books = new Map();
let publishers = new Map();

let imageReload = setInterval(loadRandomBackgroundImage, 60000);

let authorsPane = document.querySelector('#authors');
let exportPane = document.querySelector('#export');
let stockPane = document.querySelector('#stock');


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
            this.uid = options.uid || uid();
            this.title = title;
            this.subtitle = options.subtitle || '';
            this.year = options.year || new Date().getFullYear();
            this.is_anthology = options.is_anthology || false;
            this.place = options.place || '';
            this.notes = options.notes || [];
            this.quotes = options.quotes || [];
            this.signatures = options.signatures || [];
            this.isbn = options.isbn || '';
            this.number_pages = options.number_pages || 0;
            this.language = options.language || 'Language Unknown';
            this.author_surname = options.author_surname || '';
            this.author_prename = options.author_prename || '';
            this.publisher_name = options.publisher_name || '';

            let author = (options.author_surname || '') + ', ' + (options.author_prename || '');
            if (author !== ', ') {
                if (!authors.has(author)) {
                    let a = new Author(options.author_surname, options.author_prename);
                    this.author_id = a.uid;
                } else {
                    this.author_id = authors.get(author).uid;
                }
            }

            if (!publishers.has(options.publisher_name)) {
                let p = new Publisher(options.publisher_name, this.place);
                this.publisher_id = p.uid;
            } else {
                this.publisher_id = publishers.get(options.publisher_name).uid;
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

    constructor(surname, prename, options = {}) {
        this.uid = options.uid || uid();
        this.titles = options.titles || [];
        this.date_birth = options.date_birth || '';
        this.date_death = options.date_death || '';
        this.bio = options.bio || '';
        this.notes = options.notes || [];
        this.professorships = options.professorships || [];
        this.place = options.place || '';
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

    constructor(name, place, options = {}) {
        this.uid = options.uid || uid();
        this.name = name;
        this.places = options.places || [];
        this.founders = options.founders || [];
        this.notes = options.notes || [];

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

    constructor(quote, page, book_id, options = {}) {
        this.uid = options.uid || uid();
        this.citation_text = quote;
        this.page = page;
        this.book_id = book_id;
        this.date_added = options.date_added || Date.now();
        this.notes = options.notes || [];
    }
}


/* Functional Code */

const uid = () => { return (Date.now().toString(32) + Math.random().toString(16).replace(/\./g, '')).substring(0, 20); }


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
        author_surname: surname,
        author_prename: prename,
        place: location,
        publisher_name: pubName
    });
    
    updateDisplay();

}

function updateDisplay() {
    updateAuthorsPane();
    updateStockPane();
    updateExportPane();
    showLastAdditions();
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
    let table = document.createElement('table');
    table.classList.add('stockTable');
    table.setAttribute('cellspacing', '0');
    table.setAttribute('cellpadding', '0');
    
    let headerRow = document.createElement('tr');
    
    let headerTitle = document.createElement('th');
    headerTitle.textContent = 'Title';
    headerRow.appendChild(headerTitle);

    let headerYear = document.createElement('th');
    headerYear.textContent = 'Year';
    headerYear.classList.add('stockColYear');
    headerRow.appendChild(headerYear);
    
    let headerAuthor = document.createElement('th');
    headerAuthor.textContent = 'Author';
    headerRow.appendChild(headerAuthor);

    let headerPlace = document.createElement('th');
    headerPlace.textContent = 'Place';
    headerRow.appendChild(headerPlace);

    let headerPublisher = document.createElement('th');
    headerPublisher.textContent = 'Publisher';
    headerRow.appendChild(headerPublisher);

    let headerActions = document.createElement('th');
    headerActions.classList.add('tableHeaderRight');
    headerActions.textContent = 'Actions';
    headerRow.appendChild(headerActions);

    table.appendChild(headerRow);
    stockPane.appendChild(table);

    Array.from(books).forEach(book => {
        let bookRow = document.createElement('tr');
        bookRow.classList.add('stockRow');

        let bookTitle = document.createElement('td');
        bookTitle.textContent = book[0];
        bookRow.appendChild(bookTitle);

        let bookYear = document.createElement('td');
        bookYear.classList.add('stockColYear');
        bookYear.textContent = book[1].year;
        bookRow.appendChild(bookYear);

        let bookAuthor = document.createElement('td');
        bookAuthor.textContent = book[1].author_surname + ', ' + book[1].author_prename;
        bookRow.appendChild(bookAuthor);

        let bookPlace = document.createElement('td');
        bookPlace.textContent = book[1].place;
        bookRow.appendChild(bookPlace);

        let bookPublisher = document.createElement('td');
        bookPublisher.textContent = book[1].publisher_name;
        bookRow.appendChild(bookPublisher);

        let bookActions = document.createElement('td');
        bookActions.classList.add('stockColActions');

        let bookTrash = document.createElement('i');
        bookTrash.classList.add('fa-solid');
        bookTrash.classList.add('fa-trash-can');
        bookTrash.classList.add('action');
        bookTrash.title = "Delete '" + book[0] + "'";
        bookTrash.id = 'delBtn-' + book[0];
        bookTrash.addEventListener('click', deleteBook);
        bookActions.appendChild(bookTrash);
        bookRow.appendChild(bookActions);
        table.appendChild(bookRow);
    });
}

function deleteBook(e) {
    books.delete(e.target.id.substring(7));
    saveBooksToLocalStorage();
    updateDisplay();
}

function saveBooksToLocalStorage() {
    localStorage.setItem('books', JSON.stringify(Object.fromEntries(books)));
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
    document.querySelector('#latestAdditions').innerHTML = '';
    Array.from(books).forEach((book) => {
        let newDiv = document.createElement('div');
        newDiv.classList.add('lastAdditionsItem');
        newDiv.textContent = book[1].author_surname + ', ' + book[1].author_prename + '. ' + book[1].year + '. ' + book[1].title + '. ' + book[1].place + ': ' + book[1].publisher_name + '.';
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
    console.log(targetNode.style.opacity);
    (targetNode.style.opacity === '0' || targetNode.style.opacity === '') ? targetNode.style.opacity = '1' : targetNode.style.opacity = '0';
}

function equipListeners() {
    document.querySelectorAll('.paneToggler').forEach( (node) => { node.addEventListener('click', togglePane); });
    document.querySelectorAll('.configuratorToggler').forEach( (node) => { node.addEventListener('click', toggleConfigurator); });
    document.querySelectorAll('.maximizePaneToggler').forEach( (node) => { node.addEventListener('click', maximizePane); });
    document.querySelector('#settingsToggler').addEventListener('click', toggleSettings);
    document.querySelector('#closeSettings').addEventListener('click', toggleSettings);
    document.querySelector('#mainInput').addEventListener('keydown', observeMainInput);
    document.querySelector('#mainInput').addEventListener('focus', mainInputFocus);
    document.querySelector('#mainInput').addEventListener('blur', mainInputBlur);
    document.querySelector('#directExportLink').addEventListener('click', exportLocalDataToJsonFile);
    document.querySelector('#localPurgeBtn').addEventListener('click', purgeLocalStorage);
    document.querySelector('#importFileInput').addEventListener('change', importDataFile);
}

function mainInputFocus() {
    let mainInputClue = document.querySelector('#mainInputClue');
    mainInputClue.style.color = 'rgba(30, 30, 30, 1.0)';
    mainInputClue.classList.add('shake-horizontal');
}

function mainInputBlur() {    
    let mainInputClue = document.querySelector('#mainInputClue');
    mainInputClue.classList.remove('shake-horizontal');
    mainInputClue.style.color = 'rgba(100, 100, 100, 0.5)';
}

function toggleSettings() {
    let settings = document.querySelector('#settings');
    settings.style.visibility === 'visible' ? settings.style.visibility = 'hidden' : settings.style.visibility = 'visible';
    document.querySelector('#numbersPurge').innerHTML = 'Clicking the purge button will delete <em>' + books.size + ' books</em>, <em>' + authors.size + ' authors</em>, and <em>' + publishers.size + ' publishers</em>!!!';
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
    booksStr = JSON.stringify(Object.fromEntries(books));
    rightNow = new Date();
    filename = 'books-' + (rightNow.getMonth()+1) + '-' + rightNow.getDate() + '-' + rightNow.getFullYear() + '--' + rightNow.getHours() + '-' + rightNow.getMinutes() + '.json';
    booksUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(booksStr);
    let ghostLink = document.createElement('a');
    ghostLink.setAttribute('href', booksUri);
    ghostLink.setAttribute('download', filename);
    ghostLink.click();
}

function importDataFile(e) {
    let files = e.target.files;
    let reader = new FileReader();
    reader.onload = createBooksFromFile;
    reader.readAsText(files[0]);
}

function createBooksFromFile(e) {
    let importedBooks = new Map(Object.entries(JSON.parse(e.target.result)));
    Array.from(importedBooks).forEach((book) => { books.set(book[0], new Book(book[0], book[1])); });
    console.log('JSON Data successfully imported! ' + books.size + ' Books added.');
    updateDisplay();
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
    /* TODO Some attributes of the settings object need to be transformed to their original form before persistence! */
    
    /* The JSON stringify method stripped our class instances of their methods so we have to re-construct them! */
    persistedBooks = new Map(Object.entries(JSON.parse(localStorage.getItem('books'))));
    persistedAuthors = new Map(Object.entries(JSON.parse(localStorage.getItem('authors'))));
    persistedPublishers = new Map(Object.entries(JSON.parse(localStorage.getItem('publishers'))));

    books = new Map();
    authors = new Map();
    publishers = new Map();

    Array.from(persistedBooks).forEach((book) => { books.set(book[0], new Book(book[0], book[1])); });
    Array.from(persistedAuthors).forEach((author) => { authors.set(author[0], new Author(author[1].surname, author[1].prename, author[1])); });
    Array.from(persistedPublishers).forEach((publisher) => { publishers.set(publisher[0], new Publisher(publisher[1].name, publisher[1].places[0], publisher[1])); });
    /* End Instances Reconstruction */

}

function purgeLocalStorage() {
    books = new Map();
    authors = new Map();
    publishers = new Map();

    localStorage.setItem('books', JSON.stringify(Object.fromEntries(books)));
    localStorage.setItem('authors', JSON.stringify(Object.fromEntries(authors)));
    localStorage.setItem('publishers', JSON.stringify(Object.fromEntries(publishers)));
    updateDisplay();
}