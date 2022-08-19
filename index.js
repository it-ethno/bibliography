/* Global Variables */

let settings = {
    language: 'en',
    useBackground: true,
    backgroundInterval: 5,
    useFixedBackground: false,
    fixedBackground: '',
    useTransparency: true,
    useAcademicMode: true,
    inputFormat: '',
    outputFormat: '',
    serverURL: '',
    useLocalStorage: true,
    isFirstStart: true,
    autoSaveInterval: 60,
    sortOrderStock: 'alpha',
    displayStock: 'table'
};

let authors = new Map();
let books = new Map();
let publishers = new Map();
let quotes = new Map();
let notes = new Map();
let signatures = new Map();
let tags = new Map();
let collections = new Map();

let transientSelection = new Set();
let lastSave = new Date();

let imageReload = setInterval(loadRandomBackgroundImage, 60000 * settings.backgroundInterval);
let autoSave = setInterval(exportLocalDataToJsonFile, 60000 * settings.autoSaveInterval);

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
    tags;
    date_added;

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
            this.edition = options.edition || '';
            this.notes = options.notes || [];
            this.quotes = options.quotes || [];
            this.tags = options.tags || [];
            this.signatures = options.signatures || [];
            this.isbn = options.isbn || '';
            this.number_pages = options.number_pages || 0;
            this.language = options.language || 'Language Unknown';
            this.author_surname = options.author_surname || '';
            this.author_prename = options.author_prename || '';
            this.publisher_name = options.publisher_name || '';
            this.date_added = options.date_added || new Date();

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

    showDetails = () => {
        prepareForDetailsView();
        document.querySelector('#detailTitle').innerHTML = '&laquo; ' + this.title + ' &raquo;';
        if (this.subtitle !== '') {
            document.querySelector('#detailSubtitle').innerHTML = '&raquo; ' + this.subtitle + ' &laquo;';
        } else {
            document.querySelector('#detailSubtitle').innerHTML = '';
        }
        document.querySelector('#detailYear').textContent = this.year;
        document.querySelector('#detailAuthor').textContent = 'by ' + this.author_prename + ' ' + this.author_surname;
        document.querySelector('#detailPublisher').textContent = this.publisher_name;
        document.querySelector('#detailPlace').textContent = this.place;
        
        let signList = document.querySelector('#signaturesList');
        signList.textContent = '';
        let notesList = document.querySelector('#notesList');
        notesList.textContent = '';
        let tagsList = document.querySelector('#tagsList');
        tagsList.textContent = '';
        let quotesList = document.querySelector('#quotesList');
        quotesList.textContent = '';

        let formerPluses = document.querySelectorAll('.detailAction');
        formerPluses.forEach((node) => { node.remove(); });

        let signPlus = document.createElement('i');
        signPlus.classList.add('fa-solid');
        signPlus.classList.add('fa-square-plus');
        signPlus.classList.add('detailAction');
        signPlus.addEventListener('click', this.addSignatureForm);
        document.querySelector('#signaturesHeader').appendChild(signPlus);

        let notePlus = document.createElement('i');
        notePlus.classList.add('fa-solid');
        notePlus.classList.add('fa-square-plus');
        notePlus.classList.add('detailAction');
        notePlus.addEventListener('click', this.addNoteForm);
        document.querySelector('#notesHeader').appendChild(notePlus);

        let tagPlus = document.createElement('i');
        tagPlus.classList.add('fa-solid');
        tagPlus.classList.add('fa-square-plus');
        tagPlus.classList.add('detailAction');
        tagPlus.addEventListener('click', this.addTagForm);
        document.querySelector('#tagsHeader').appendChild(tagPlus);        
        
        let quotePlus = document.createElement('i');
        quotePlus.classList.add('fa-solid');
        quotePlus.classList.add('fa-square-plus');
        quotePlus.classList.add('detailAction');
        quotePlus.addEventListener('click', this.addQuoteForm);
        document.querySelector('#quotesHeader').appendChild(quotePlus);        
        

        if (this.signatures.length > 0) {
            this.signatures.forEach((sign) => {
                let signObj = signatures.get(sign);
                let newDiv = document.createElement('div');
                newDiv.classList.add('signatureItem');
                newDiv.textContent = signObj.label;
                signList.appendChild(newDiv);
            });
        } else {
            signList.textContent = 'No Signatures yet';
        }

        if (this.notes.length > 0) {
            this.notes.forEach((note) => {
                let noteObj = notes.get(note);
                let newDiv = document.createElement('div');
                newDiv.classList.add('noteItem');
                newDiv.textContent = noteObj.note_text;
                notesList.appendChild(newDiv);
            });
        } else {
            notesList.textContent = 'No Notes yet';
        }

        if (this.quotes.length > 0) {
            this.quotes.forEach((quote) => {
                let quoteObj = quotes.get(quote);
                let newDiv = document.createElement('div');
                newDiv.classList.add('quoteItem');
                newDiv.innerHTML = '&quot;' + quoteObj.quote_text + '&quot; <span class="quotePage">(page ' + quoteObj.page + ')</span>';
                quotesList.appendChild(newDiv);
            });
        } else {
            quotesList.textContent = 'No Quotes yet';
        }

        if (this.tags.length > 0) {
            this.tags.forEach((tag) => {
                let tagObj = tags.get(tag);
                let newDiv = document.createElement('div');
                newDiv.classList.add('tagItem');
                newDiv.textContent = tagObj.label;
                tagsList.appendChild(newDiv);
            });
        } else {
            tagsList.textContent = 'No Tags yet';
        }
    }

    addSignatureForm = (e) => {
        if (!document.querySelector('.addSignatureForm')) {
            let plusPosition = e.target.getBoundingClientRect();
            let newDiv = document.createElement('div');
            newDiv.id = 'signatureForm-' + this.uid;
            newDiv.classList.add('addSignatureForm');
            newDiv.style.top = plusPosition.top - 12 + 'px';
            newDiv.style.left = plusPosition.left + 20 + 'px';
            let newLabel = document.createElement('label');
            newLabel.textContent = 'New Signature: ';
            newDiv.appendChild(newLabel);
            let newInput = document.createElement('input');
            newInput.type = 'text';
            newInput.classList.add('addSignatureInput');
            newInput.id = 'addSignatureInput-' + this.uid;
            newDiv.appendChild(newInput);
            let newBtn = document.createElement('button');
            newBtn.type = 'button';
            newBtn.classList.add('addSignatureBtn');
            newBtn.textContent = 'Add';
            newBtn.addEventListener('click', this.addSignature);
            newDiv.appendChild(newBtn);
            document.querySelector('#alltainer').appendChild(newDiv);
        } else {
            document.querySelector('.addSignatureForm').remove();
        }

    }

    addNoteForm = (e) => {
        if (!document.querySelector('.addNoteForm')) {
            let plusPosition = e.target.getBoundingClientRect();
            let newDiv = document.createElement('div');
            newDiv.id = 'noteForm-' + this.uid;
            newDiv.classList.add('addNoteForm');
            newDiv.style.top = plusPosition.top - 15 + 'px';
            newDiv.style.left = plusPosition.left + 20 + 'px';
            let newLabel = document.createElement('label');
            newLabel.textContent = 'New Note: ';
            newLabel.classList.add('labelBlock');
            newDiv.appendChild(newLabel);
            let newInput = document.createElement('input');
            newInput.type = 'text';
            newInput.classList.add('addNoteTitleInput');
            newInput.id= 'addNoteTitleInput-' + this.uid;
            newInput.placeholder = 'Some Title (optional!)';
            newDiv.appendChild(newInput);
            let newTextArea = document.createElement('textarea');
            newTextArea.classList.add('addNoteTextArea');
            newTextArea.id = 'addNoteTextArea-' + this.uid;
            newTextArea.placeholder = 'The Content of your new note for this book';
            newDiv.appendChild(newTextArea);
            let newBtn = document.createElement('button');
            newBtn.type = 'button';
            newBtn.classList.add('addNoteBtn');
            newBtn.textContent = 'Add Note';
            newBtn.addEventListener('click', this.addNote);
            newDiv.appendChild(newBtn);
            document.querySelector('#alltainer').appendChild(newDiv); 
        } else {
            document.querySelector('.addNoteForm').remove();
        }
        
    }

    addTagForm = (e) => {
        if (!document.querySelector('.addTagForm')) {
            let plusPosition = e.target.getBoundingClientRect();
            let newDiv = document.createElement('div');
            newDiv.id = 'tagForm-' + this.uid;
            newDiv.classList.add('addTagForm');
            newDiv.style.top = plusPosition.top - 15 + 'px';
            newDiv.style.left = plusPosition.left + 20 + 'px';
            
            let topline = document.createElement('div');
            topline.classList.add('flextainer');
            let newIcon = document.createElement('i');
            newIcon.classList.add('fa-solid');
            newIcon.classList.add('fa-hashtag');
            newIcon.classList.add('labelInlineLeft');
            topline.appendChild(newIcon);
            let newInput = document.createElement('input');
            newInput.type = 'text';
            newInput.classList.add('addTagInput');
            newInput.id= 'addTagInput-' + this.uid;
            topline.appendChild(newInput);
            let newBtn = document.createElement('button');
            newBtn.type = 'button';
            newBtn.classList.add('addTagBtn');
            newBtn.textContent = 'Add';
            newBtn.addEventListener('click', this.addTag);
            topline.appendChild(newBtn);

            let closeBtn = document.createElement('i');
            closeBtn.classList.add('fa-solid');
            closeBtn.classList.add('fa-square-xmark');
            closeBtn.classList.add('closeBtn');
            closeBtn.addEventListener('click', () => { document.querySelector('#tagForm-' + this.uid).remove(); });
            topline.appendChild(closeBtn);
            newDiv.appendChild(topline);

            let commonTags = [...tags.values()].sort((a, b) => a.label.localeCompare(b.label));
            console.log(commonTags);
            let knownTagsDiv = document.createElement('div');
            knownTagsDiv.classList.add('knownTagsList');
            commonTags.forEach((tag) => {
                let tagDiv = document.createElement('div');
                tagDiv.classList.add('tagListItem');
                tagDiv.textContent = tag.label;
                knownTagsDiv.appendChild(tagDiv);
            })
            newDiv.appendChild(knownTagsDiv);

            document.querySelector('#alltainer').appendChild(newDiv);
        } else {
            document.querySelector('.addTagForm').remove();
        }
        
    }

    addQuoteForm = (e) => {
        if (!document.querySelector('.addQuoteForm')) {
            let plusPosition = e.target.getBoundingClientRect();
            let newDiv = document.createElement('div');
            newDiv.id = 'quoteForm-' + this.uid;
            newDiv.classList.add('addQuoteForm');
            newDiv.style.top = plusPosition.top - 15 + 'px';
            newDiv.style.left = plusPosition.left + 20 + 'px';
            let newLabel = document.createElement('label');
            newLabel.textContent = 'New Quote: ';
            newLabel.classList.add('labelBlock');
            newDiv.appendChild(newLabel);
            let newInput = document.createElement('input');
            newInput.type = 'text';
            newInput.classList.add('addQuoteTitleInput');
            newInput.id = 'addQuoteTitleInput-' + this.uid;
            newInput.placeholder = 'Some Title (optional!)';
            newDiv.appendChild(newInput);
            let newTextArea = document.createElement('textarea');
            newTextArea.classList.add('addQuoteTextArea');
            newTextArea.id = 'addQuoteTextArea-' + this.uid;
            newTextArea.placeholder = 'Your new Quote from this book';
            newDiv.appendChild(newTextArea);
            let newPage = document.createElement('input');
            newPage.type = 'number';
            newPage.id = 'addQuotePageInput-' + this.uid;
            newPage.classList.add('addQuotePageInput');
            newPage.placeholder = 'Page Number';
            newDiv.appendChild(newPage); 
            let newBtn = document.createElement('button');
            newBtn.type = 'button';
            newBtn.classList.add('addQuoteBtn');
            newBtn.textContent = 'Add Quote';
            newBtn.addEventListener('click', this.addQuote);
            newDiv.appendChild(newBtn);
            document.querySelector('#alltainer').appendChild(newDiv);
        } else {
            document.querySelector('.addQuoteForm').remove();
        }
        
    }
    
    addSignature = (e) => {
        let inputSign = document.querySelector('#addSignatureInput-' + this.uid).value;
        let newSign = new Signature(inputSign);
        this.signatures.push(newSign.uid);
        this.save();
        document.querySelector('#signatureForm-' + this.uid).remove();
        this.showDetails();
    }

    addNote = (e) => {
        let title = document.querySelector('#addNoteTitleInput-' + this.uid).value;
        let text = document.querySelector('#addNoteTextArea-' + this.uid).value;
        let newNote = new Note(text, { title: title });
        this.notes.push(newNote.uid);
        this.save();
        document.querySelector('#noteForm-' + this.uid).remove();
        this.showDetails();
    }

    addTag = (e) => {
        let inputTag = document.querySelector('#addTagInput-' + this.uid).value;
        console.log(inputTag);
        let newTag = new Tag(inputTag);
        this.tags.push(newTag.uid);
        this.save();
        document.querySelector('#tagForm-' + this.uid).remove();
        this.showDetails();
    }
    
    addQuote = (e) => {
        let title = document.querySelector('#addQuoteTitleInput-' + this.uid).value;
        let text = document.querySelector('#addQuoteTextArea-' + this.uid).value;
        let page = document.querySelector('#addQuotePageInput-' + this.uid).value;
        let newQuote = new Quote(text, { title: title, page: page });
        this.quotes.push(newQuote.uid);
        this.save();
        document.querySelector('#quoteForm-' + this.uid).remove();
        this.showDetails();
    }

    save = () => {
        console.log('Saving...');
        books.set(this.title, this);
        localStorage.setItem('books', JSON.stringify(Object.fromEntries(books)));
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
    tags;
    professorships;
    place;
    date_added;

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
        this.date_added = options.date_added || new Date();
        this.tags = options.tags || [];

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
    tags;
    date_added;

    constructor(name, place, options = {}) {
        this.uid = options.uid || uid();
        this.name = name;
        this.places = options.places || [];
        this.founders = options.founders || [];
        this.notes = options.notes || [];
        this.tags = options.tags || [];

        this.places.push(place);

        publishers.set(this.name, this);
        localStorage.setItem('publishers', JSON.stringify(Object.fromEntries(publishers)));
    }
}

class Quote {
    uid;
    book_id;
    page;
    quote_text;
    notes;
    tags;
    date_added;

    constructor(quote, options = {}) {
        this.uid = options.uid || uid();
        this.quote_text = quote;
        this.page = options.page || 'unknown';
        this.book_id = options.book_id || 'unknown';
        this.date_added = options.date_added || Date.now();
        this.tags = options.tags || [];
        this.notes = options.notes || [];

        quotes.set(this.uid, this);
        localStorage.setItem('quotes', JSON.stringify(Object.fromEntries(quotes)));

    }
}

class Note {
    uid;
    title;
    note_text;
    tags;
    parent_id;
    date_added;

    constructor(text, options = {}) {
        this.uid = options.uid || uid();
        this.note_text = text;
        this.title = options.title || '';
        this.parent_id = options.parent_id || '';
        this.tags = options.tags || [];
        this.date_added = options.date_added || new Date();

        notes.set(this.uid, this);
        localStorage.setItem('notes', JSON.stringify(Object.fromEntries(notes)));
    }
}

class Signature {
    uid;
    label;
    notes;
    tags;
    date_added;

    constructor(label, options = {}) {
        this.uid = options.uid || uid();
        this.label = label;
        this.notes = options.notes || [];
        this.tags = options.tags || [];
        this.date_added = options.date_added || new Date();

        signatures.set(this.uid, this);
        localStorage.setItem('signatures', JSON.stringify(Object.fromEntries(signatures)));
    }
}

class Tag {
    uid;
    label;
    description;
    date_added;

    constructor(label, options = {}) {
        this.uid = options.uid || uid();
        this.label = label;
        this.description = options.description || '';
        this.date_added = options.date_added || new Date();

        tags.set(this.uid, this);
        localStorage.setItem('tags', JSON.stringify(Object.fromEntries(tags)));
    }
}

class Collection {
    uid;
    title;
    books;
    titles;
    tags;
    notes;
    authors;
    
    constructor(title, options = {}) {
        this.uid = options.uid || uid();
        this.title = title;
        this.books = options.books || [];
        this.titles = options.titles || [];
        this.tags = options.tags || [];
        this.notes = options.notes || [];
        this.authors = options.authors || [];

        collections.set(this.title, this);
        localStorage.setItem('collections', JSON.stringify(Object.fromEntries(collections)));
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
    book.showDetails();
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

function toggleAllCheckboxes(e) {
    let nodes = document.querySelectorAll('.checkItem');
    if (e.target.checked) {
        nodes.forEach((node) => {
            node.checked = true;
            transientSelection.add(node.id.substring(9)); 
         });
    } else {
        nodes.forEach((node) => {
            node.checked = false; 
         });
         transientSelection.clear();
    }
    updateExportPane();
}

function toggleCheckbox(e) {
    e.stopImmediatePropagation();
    if (e.target.checked) {
        transientSelection.add(e.target.id.substring(9));
    } else {
        transientSelection.delete(e.target.id.substring(9));
    }
    updateExportPane();
}

function updateStockPane() {
    document.querySelector('#stockNumberTitles').textContent = books.size + ' Titles';
    document.querySelector('#stockLastSaved').textContent = Math.abs(Math.round(((lastSave.getTime() - new Date().getTime()) / 1000) / 60));
    stockPane.innerHTML = '';
    let table = document.createElement('table');
    table.classList.add('stockTable');
    table.setAttribute('cellspacing', '0');
    table.setAttribute('cellpadding', '0');
    
    let headerRow = document.createElement('tr');
    headerRow.classList.add('tableHeaderRow');
    
    let headerCheck = document.createElement('th');
    headerCheck.classList.add('stockColCheck');
    headerCheck.title = 'Select all items';
    let allCheck = document.createElement('input');
    allCheck.type = 'checkbox';
    allCheck.checked = false;
    allCheck.addEventListener('click', toggleAllCheckboxes);
    headerCheck.appendChild(allCheck);
    headerRow.appendChild(headerCheck);

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
    
    setStockOrderIcon();

    let sortedBooks;
    

    switch (settings.sortOrderStock) {
        case 'alpha':
            sortedBooks = Array.from(books).sort((a, b) => a[1].title.localeCompare(b[1].title));
            break;
        case 'alpha-reverse':
            sortedBooks = Array.from(books).sort((a, b) => a[1].title.localeCompare(b[1].title)).reverse();
            break;
        case 'added':
            sortedBooks = Array.from(books);
            break;
        case 'added-reverse':
            sortedBooks = Array.from(books).reverse();
            break;
    }

    sortedBooks.forEach(book => {
        let bookRow = document.createElement('tr');
        bookRow.classList.add('stockRow');
        bookRow.addEventListener('click', book[1].showDetails);

        let bookCheck = document.createElement('td');
        bookCheck.classList.add('stockColCheckItem');
        let checkBook = document.createElement('input');
        checkBook.type = 'checkbox';
        transientSelection.has(book[1].title) ? checkBook.checked = true : checkBook.checked = false;
        checkBook.classList.add('checkItem');
        checkBook.id = 'checkbox-' + book[1].title;
        checkBook.addEventListener('click', toggleCheckbox);
        bookCheck.appendChild(checkBook);
        bookRow.appendChild(bookCheck);

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

function setStockOrderIcon() {
    let orderIcons = document.querySelectorAll('.orderIcon');
    orderIcons.forEach((icon) => { icon.classList.remove('selected'); });
    switch (settings.sortOrderStock) {
        case 'alpha':
            document.querySelector('#stockPane-sortAlpha').classList.add('selected');
            break;
        case 'alpha-reverse':
            document.querySelector('#stockPane-sortAlphaReverse').classList.add('selected');
            break;
        case 'added':
            document.querySelector('#stockPane-sortOrderAdded').classList.add('selected');
            break;
        case 'added-reverse':
            document.querySelector('#stockPane-sortOrderAddedReverse').classList.add('selected');
            break;
    }
}

function prepareForDetailsView() {
    let mainInterface = document.querySelector('#mainInterface');
    let mainTitle = document.querySelector('#mainTitle');
    let settings = document.querySelector('#settingsToggler');
    let latestAdds = document.querySelector('#latestAdditions');
    let details = document.querySelector('#detailView');

    mainInterface.style.marginTop = '0px';
    mainInterface.style.padding = '10px';
    
    settings.style.marginTop = '0px';

    mainTitle.style.opacity = '0';
    mainTitle.style.height = '0';
    mainTitle.style.visibility = 'collapse';

    latestAdds.style.opacity = '0';
    latestAdds.style.visibility = 'collapse';
    
    
    details.style.opacity = '1';
    details.style.visibility = 'visible';
}

function deleteBook(e) {
    e.preventDefault();
    books.delete(e.target.id.substring(7));
    saveBooksToLocalStorage();
    updateDisplay();
}

function saveBooksToLocalStorage() {
    localStorage.setItem('books', JSON.stringify(Object.fromEntries(books)));
}

function updateExportPane() {
    let exportList = document.querySelector('#export');
    exportList.innerHTML = '';

    transientSelection.forEach((item) => {
        let book = books.get(item);
        let newDiv = document.createElement('div');
        newDiv.classList.add('exportListItem');
        newDiv.innerHTML = book.author_surname + ', ' + book.author_prename + '. ' + book.year + '. ' + book.title + '. ' + book.place + ': ' + book.publisher_name + '.';
        exportList.appendChild(newDiv);
    });
}

function maximizeMainContent(e) {
    let main = document.querySelector('#mainFocusContent');
    let coords = main.getBoundingClientRect();
    console.log(coords);

    main.style.position = 'fixed';
    main.style.zIndex = '2';
    main.style.top = '0px';
    main.style.right = '0px';
    main.style.bottom = '0px';
    main.style.left = '0px';
    main.style.width = '100%';
    main.style.height = '100%';
    e.target.classList.remove('fa-expand');
    e.target.classList.add('fa-compress');
    e.target.removeEventListener('click', maximizeMainContent);
    e.target.addEventListener('click', minimizeMainContent);
     
}

function minimizeMainContent(e) {
    let main = document.querySelector('#mainFocusContent');
    main.style.position = 'relative';
    main.style.top = '';
    main.style.right = '';
    main.style.bottom = '';
    main.style.left = '';
    main.style.width = '60%';
    main.style.height = '50%';
    e.target.classList.remove('fa-compress');
    e.target.classList.add('fa-expand');
    e.target.removeEventListener('click', minimizeMainContent);
    e.target.addEventListener('click', maximizeMainContent);    
}

function maximizePane(e) {
    e.stopImmediatePropagation();
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
    let latestAdds = document.querySelector('#latestAdditions');
    latestAdds.innerHTML = '';
    let newHeader = document.createElement('h2');
    newHeader.textContent = 'Last Book Additions';
    latestAdds.appendChild(newHeader);
    let latest5 = Array.from(books).reverse().slice(0, 5);
    latest5.forEach((book) => {
        let newDiv = document.createElement('div');
        newDiv.classList.add('lastAdditionsItem');
        newDiv.textContent = book[1].author_surname + ', ' + book[1].author_prename + '. ' + book[1].year + '. ' + book[1].title + '. ' + book[1].place + ': ' + book[1].publisher_name + '.';
        latestAdds.appendChild(newDiv);
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
    document.querySelector('#screensaverBtn').addEventListener('click', toggleFullScreenSaver);
    document.querySelector('#detailToggleFull').addEventListener('click', maximizeMainContent);

    document.querySelector('#stockPane-createCollection').addEventListener('click', showNewCollectionForm);
    document.querySelector('#stockPane-watchSlideshow').addEventListener('click', startBookSlideshow);
    document.querySelector('#stockPane-exportItems').addEventListener('click', exportSelectedTitles);
    document.querySelector('#stockPane-deleteItems').addEventListener('click', showSerialDeleteWarning);
    document.querySelector('#stockPane-sortAlpha').addEventListener('click', setOrder);
    document.querySelector('#stockPane-sortAlphaReverse').addEventListener('click', setOrder);
    document.querySelector('#stockPane-sortOrderAdded').addEventListener('click', setOrder);
    document.querySelector('#stockPane-sortOrderAddedReverse').addEventListener('click', setOrder);
    document.querySelector('#stockPane-listCardlets').addEventListener('click', setListType);
    document.querySelector('#stockPane-listTable').addEventListener('click', setListType);
    document.querySelector('#fullscreenToggler-stockPane').addEventListener('click', showFullscreenStock);
    document.querySelector('#stockPane-configureDBs').addEventListener('click', showDBSetup);
    document.querySelector('#stockPane-togglePaneSettings').addEventListener('click', showStockSettings);

}

function setListType(e) {
    let typeIcons = document.querySelectorAll('.listTypeIcon');
    typeIcons.forEach((icon) => { icon.classList.remove('selected'); });

    switch (e.target.id) {
        case 'stockPane-listCardlets':
            settings.displayStock = 'cardlets';
            break;
        case 'stockPane-listTable':
            settings.displayStock = 'table';
            break;
    }

    e.target.classList.add('selected');
    saveSettings();
    updateStockPane();
}

function setOrder(e) {
    let orderIcons = document.querySelectorAll('.orderIcon');
    orderIcons.forEach((icon) => { icon.classList.remove('selected'); });

    switch (e.target.id) {
        case 'stockPane-sortAlpha':
            settings.sortOrderStock = 'alpha';
            break;
        case 'stockPane-sortAlphaReverse':
            settings.sortOrderStock = 'alpha-reverse';
            break;
        case 'stockPane-sortOrderAdded':
            settings.sortOrderStock = 'added';
            break;
        case 'stockPane-sortOrderAddedReverse':
            settings.sortOrderStock = 'added-reverse';
            break;
    }
    saveSettings();
    e.target.classList.add('selected');
    updateStockPane();
}

function saveSettings() {
    localStorage.setItem('settings', JSON.stringify(settings));
}

function resetSettings() {
    settings = {
        language: 'en',
        useBackground: true,
        backgroundInterval: 5,
        useFixedBackground: false,
        fixedBackground: '',
        useTransparency: true,
        useAcademicMode: true,
        inputFormat: '',
        outputFormat: '',
        serverURL: '',
        useLocalStorage: true,
        isFirstStart: true,
        autoSaveInterval: 60,
        sortOrderStock: 'alpha',
        displayStock: 'table'
    };
    saveSettings();
}

function showFullscreenStock() {
    console.log('HI! from showFullscreenStock!');
    document.documentElement.requestFullscreen();

    let maxIcon = document.querySelector('#maximizeToggler-stockPane');
    let fullIcon = document.querySelector('#fullscreenToggler-stockPane');
    let stockPane = document.querySelector('#stockPane');

    maxIcon.classList.remove('fa-expand');
    maxIcon.classList.add('fa-compress');
    maxIcon.removeEventListener('click', maximizePane);
    maxIcon.addEventListener('click', minimizePane);

    fullIcon.classList.remove('fa-maximize');
    fullIcon.classList.add('fa-minimize');
    fullIcon.removeEventListener('click', showFullscreenStock);
    fullIcon.addEventListener('click', endFullscreenStock);

    stockPane.style.top = '0px';
    stockPane.style.right = '0px';
    stockPane.style.bottom = '0px';
    stockPane.style.left = '0px';
    stockPane.style.height = '100%';
    stockPane.style.width = '100%';
    stockPane.style.borderRadius = '15px';
    stockPane.style.backgroundColor = 'rgba(240, 240, 240, 0.98)';
    stockPane.style.zIndex = '10';
}

function endFullscreenStock() {
    console.log('HI! from endFullscreen!');
    document.exitFullscreen();

    let maxIcon = document.querySelector('#maximizeToggler-stockPane');
    let fullIcon = document.querySelector('#fullscreenToggler-stockPane');
    let stockPane = document.querySelector('#stockPane');

    maxIcon.classList.remove('fa-compress');
    maxIcon.classList.add('fa-expand');
    maxIcon.removeEventListener('click', minimizePane);
    maxIcon.addEventListener('click', maximizePane);

    fullIcon.classList.remove('fa-minimize');
    fullIcon.classList.add('fa-maximize');
    fullIcon.removeEventListener('click', endFullscreenStock);
    fullIcon.addEventListener('click', showFullscreenStock);

    stockPane.style.top = '';
    stockPane.style.right = '20%';
    stockPane.style.bottom = '0px';
    stockPane.style.left = '20%';
    stockPane.style.height = '';
    stockPane.style.width = '';
    stockPane.style.borderRadius = '15px 15px 0 0';
    stockPane.style.backgroundColor = 'rgba(240, 240, 240, 1.0)';
}

function showStockSettings() {
    console.log('HI! from showStockSettings!');
}

function showDBSetup() {
    console.log('HI! from showDBSetup!');
}

function startBookSlideshow(e) {
    if (transientSelection.size > 0) {

    } else {
        showMessage('The book slideshow could not be started, because there were no titles selected!');
    }
}

function exportSelectedTitles(e) {
    if (transientSelection.size > 0) {

    } else {
        showMessage('The export could not be started, because there were no titles selected!');
    }
}

function showSerialDeleteWarning(e) {
    if (transientSelection.size > 0) {
        let newDiv = document.createElement('div');
        newDiv.classList.add('fullscreenDialog');
        newDiv.id = 'stockPane-serialDeleteDialog';

        let newInnerDiv = document.createElement('div');
        newInnerDiv.classList.add('fullscreenDialogInner');
        newDiv.appendChild(newInnerDiv);

        let newH = document.createElement('h1');
        newH.classList.add('fullscreenWarning');
        newH.textContent = 'WARNING!';
        newInnerDiv.appendChild(newH);

        let newDesc = document.createElement('p');
        newDesc.classList.add('fullscreenDescription');
        newDesc.textContent = 'You are about to DELETE ' + transientSelection.size + ' titles FOREVER!';
        newInnerDiv.appendChild(newDesc);

        let newH2 = document.createElement('h2');
        newH2.classList.add('fullscreenRequest');
        newH2.textContent = 'Are you really sure you wanna do this???';
        newInnerDiv.appendChild(newH2);

        let newCount = document.createElement('p');
        newCount.textContent = 'Titles to be deleted';
        newCount.classList.add('fullscreenListHeader');
        newCount.classList.add('fullscreenUnderline');
        newInnerDiv.appendChild(newCount);

        let newList = document.createElement('ol');
        newList.classList.add('fullscreenList');
        newInnerDiv.appendChild(newList);

        Array.from(transientSelection).forEach((item) => {
            let newItem = document.createElement('li');
            newItem.textContent = item;
            newList.appendChild(newItem);
        });

        let newBtnCancel = document.createElement('button');
        newBtnCancel.textContent = 'Forget it - Do not do it!';
        newBtnCancel.classList.add('fullscreenBtnCancel');
        newBtnCancel.addEventListener('click', () => { document.querySelector('#stockPane-serialDeleteDialog').remove(); });
        newDiv.appendChild(newBtnCancel);

        let newBtnOk = document.createElement('button');
        newBtnOk.textContent = 'OK - DO IT!';
        newBtnOk.classList.add('fullscreenBtnOk');
        newBtnOk.addEventListener('click', serialDeleteBooks);
        newDiv.appendChild(newBtnOk);

        document.querySelector('body').appendChild(newDiv);
    } else {
        showMessage('The fire-dumpster could not be activated, because there were no titles selected!');
    }
}

function showMessage(message) {
    let date = new Date().toLocaleTimeString().replaceAll(':', '-');
    let newDiv = document.createElement('div');
    newDiv.classList.add('screenMessage');
    newDiv.id = 'message-' + date;
    newDiv.style.left = (window.innerWidth / 2 - 150) + 'px';
    let innerDiv = document.createElement('div');
    innerDiv.textContent = message;
    newDiv.appendChild(innerDiv);

    let closeBtn = document.createElement('i');
    closeBtn.classList.add('fa-solid');
    closeBtn.classList.add('fa-square-xmark');
    closeBtn.addEventListener('click', () => { document.querySelector('#message-' + date). remove(); });
    newDiv.appendChild(closeBtn);

    document.querySelector('body').appendChild(newDiv);
}

function serialDeleteBooks(e) {
    let n = transientSelection.size;
    Array.from(transientSelection).forEach((book) => { books.delete(book); });
    showMessage(n + ' books have been deleted');
}

function showNewCollectionForm(e) {
    if (transientSelection.size > 0) {
        let coords = e.target.getBoundingClientRect();

        let newDiv = document.createElement('div');
        newDiv.classList.add('modalDialog');
        newDiv.id = 'stockPane-newCollectionModal';
        newDiv.style.top = coords.top + 30 + 'px';
        newDiv.style.left = coords.left - 50 + 'px';

        let newInput = document.createElement('input');
        newInput.type = 'text';
        newInput.placeholder = 'A Name for your new Collection';
        newInput.id = 'stockPane-newCollectionInput';
        newDiv.appendChild(newInput);

        let newBtn = document.createElement('button');
        newBtn.type = 'button';
        newBtn.textContent = 'Create';
        newBtn.addEventListener('click', createNewCollection);
        newDiv.appendChild(newBtn);
        
        document.querySelector('body').appendChild(newDiv);
    } else {
        showMessage('A Collection could not be created, because there were no titles selected!');
    }

}

function createNewCollection(e) {
    let name = document.querySelector('#stockPane-newCollectionInput').value;
    let c = new Collection(name, { titles: Array.from(transientSelection) });
    document.querySelector('#stockPane-newCollectionModal').remove();
    showMessage('A new collection named "' + name + '" has been created!');
}

function showNewTagInput(e) {

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
    let exportData = [];
    let booksStr = JSON.stringify(Object.fromEntries(books));
    let authorsStr = JSON.stringify(Object.fromEntries(authors));
    let pubsStr = JSON.stringify(Object.fromEntries(publishers));
    let quotesStr = JSON.stringify(Object.fromEntries(quotes));
    let notesStr = JSON.stringify(Object.fromEntries(notes));
    let tagsStr = JSON.stringify(Object.fromEntries(tags));
    let signStr = JSON.stringify(Object.fromEntries(signatures));

    exportData.push(booksStr);
    exportData.push(authorsStr);
    exportData.push(pubsStr);
    exportData.push(quotesStr);
    exportData.push(notesStr);
    exportData.push(tagsStr);
    exportData.push(signStr);

    let expStr = JSON.stringify(exportData);

    rightNow = new Date();
    filename = 'books-' + (rightNow.getMonth()+1) + '-' + rightNow.getDate() + '-' + rightNow.getFullYear() + '--' + rightNow.getHours() + '-' + rightNow.getMinutes() + '.json';
    booksUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(expStr);
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
    let importData = JSON.parse(e.target.result);
    console.log(importData);

    let importedBooks = new Map(Object.entries(JSON.parse(importData[0])));
    console.log(importedBooks);
    Array.from(importedBooks).forEach((book) => { books.set(book[0], new Book(book[0], book[1])); });

    let importedAuthors = new Map(Object.entries(JSON.parse(importData[1])));
    Array.from(importedAuthors).forEach((author) => { authors.set(author[0], new Author(author[1].surname, author[1].prename, author[1])); });
    console.log(importedAuthors);

    let importedPublishers = new Map(Object.entries(JSON.parse(importData[2])));
    Array.from(importedPublishers).forEach((pub) => { publishers.set(pub[0], new Publisher(pub[0], pub[1].place, pub[1])); });
    console.log(importedPublishers);
    
    let importedQuotes = new Map(Object.entries(JSON.parse(importData[3])));
    Array.from(importedQuotes).forEach((quote) => { quotes.set(quote[0], new Quote(quote[1].quote_text, quote[1])); });
    console.log(importedQuotes);

    let importedNotes = new Map(Object.entries(JSON.parse(importData[4])));
    Array.from(importedNotes).forEach((note) => { notes.set(note[0], new Note(note[1].note_text, note[1])); });
    console.log(importedNotes);

    let importedTags = new Map(Object.entries(JSON.parse(importData[5])));
    Array.from(importedTags).forEach((tag) => { tags.set(tag[0], new Tag(tag[1].label, tag[1])); });
    console.log(importedTags);

    let importedSignatures = new Map(Object.entries(JSON.parse(importData[6])));
    Array.from(importedSignatures).forEach((sign) => { signatures.set(sign[0], new Signature(sign[1].label, sign[1])); });
    console.log(importedSignatures);

    console.log('JSON Data successfully imported! ' + books.size + ' Books added.');
    updateDisplay();
    
}

function toggleFullScreenSaver() {
    if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen();
    }
    
    let num = Math.round(Math.random() * (quotes.size - 1));
    let cites = Array.from(quotes);

    if (document.querySelector('.screensaver')) {
        document.querySelector('.screensaver').remove();
    }

    let screensaver = document.createElement('div');
    screensaver.classList.add('screensaver');
    
    let letterContainer = document.createElement('div');
    letterContainer.classList.add('screensaver-lettercontainer');

    let text = cites[num][1].quote_text;
    console.log(text);
    Array.from(text).forEach((letter) => {
        let letterChar = document.createElement('div');
        letterChar.classList.add('screenSaverLetter');
        letterChar.style.fontSize = Math.round((Math.random() * 200) + 200) + '%';
        if (letter === ' ') { letterChar.style.marginRight = '30px'; }
        let n = Math.round(Math.random() * 4);
        letterChar.style.animation = 'text-flicker-in-glow ' + n + 's linear both';
        letterChar.textContent = letter;
        letterContainer.appendChild(letterChar);
    });

    screensaver.appendChild(letterContainer);

    document.querySelector('body').appendChild(screensaver);
    document.querySelector('body').addEventListener('keydown', (e) => {
        if (e.code === 'Space') { toggleFullScreenSaver(); }
    });
    /*
    if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen();
    } else if (document.exitFullscreen) {
        document.exitFullscreen();
    }
    */

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
    localStorage.setItem('quotes', JSON.stringify(Object.fromEntries(quotes)));
    localStorage.setItem('notes', JSON.stringify(Object.fromEntries(notes)));
    localStorage.setItem('signatures', JSON.stringify(Object.fromEntries(signatures)));
    localStorage.setItem('tags', JSON.stringify(Object.fromEntries(tags)));
    localStorage.setItem('collections', JSON.stringify(Object.fromEntries(collections)));
}

function loadLocalStorage() {
    settings = JSON.parse(localStorage.getItem('settings'));
    
    /* Some attributes of the settings object need to be transformed to their original form after persisting them! */
    /* settings.useBackground = settings.useBackground === 'true';
    settings.useFixedBackground = settings.useFixedBackground === 'true';
    settings.useTransparency = settings.useTransparency === 'true';
    settings.useAcademicMode = settings.useAcademicMode === 'true';
    settings.useLocalStorage = settings.useLocalStorage === 'true';
    settings.isFirstStart = settings.isFirstStart === 'true';
    */
    /* The JSON stringify method stripped our class instances of their methods so we have to re-construct them! */
    persistedBooks = new Map(Object.entries(JSON.parse(localStorage.getItem('books'))));
    persistedAuthors = new Map(Object.entries(JSON.parse(localStorage.getItem('authors'))));
    persistedPublishers = new Map(Object.entries(JSON.parse(localStorage.getItem('publishers'))));
    persistedQuotes = new Map(Object.entries(JSON.parse(localStorage.getItem('quotes'))));
    persistedNotes = new Map(Object.entries(JSON.parse(localStorage.getItem('notes'))));
    persistedSignatures = new Map(Object.entries(JSON.parse(localStorage.getItem('signatures'))));
    persistedTags = new Map(Object.entries(JSON.parse(localStorage.getItem('tags'))));
    persistedCollections = new Map(Object.entries(JSON.parse(localStorage.getItem('collections'))));

    books = new Map();
    authors = new Map();
    publishers = new Map();
    quotes = new Map();
    notes = new Map();
    signatures = new Map();
    tags = new Map();
    collections = new Map();

    Array.from(persistedBooks).forEach((book) => { books.set(book[0], new Book(book[0], book[1])); });
    Array.from(persistedAuthors).forEach((author) => { authors.set(author[0], new Author(author[1].surname, author[1].prename, author[1])); });
    Array.from(persistedPublishers).forEach((publisher) => { publishers.set(publisher[0], new Publisher(publisher[1].name, publisher[1].places[0], publisher[1])); });
    Array.from(persistedQuotes).forEach((quote) => { quotes.set(quote[0], new Quote(quote[1].quote_text, quote[1])); });
    Array.from(persistedNotes).forEach((note) => { notes.set(note[0], new Note(note[1].note_text, note[1])); });
    Array.from(persistedSignatures).forEach((signature) => { signatures.set(signature[0], new Signature(signature[1].label, signature[1])); });
    Array.from(persistedTags).forEach((tag) => { tags.set(tag[0], new Tag(tag[1].label, tag[1])); });
    Array.from(persistedCollections).forEach((collection) => { collections.set(collection[0], new Collection(collection[1].title, collection[1])); });
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