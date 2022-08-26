/********************/
/* Global Variables */
/********************/

let settings = {
    language: 'en',
    useAcademicMode: true,
    useBackground: true,
    useAutoSave: true,
    autoSaveInterval: 45,
    saveTransient: false,
    showOrderButtons: true,
    showFormOnEmpty: true,
    useAltPubIcon: false,
    altPubIcon: '',
    useDynamicBackground: false,
    startCollapsed: false,
    showLastAdditions: true,
    showGaps: true,
    showLastQuotes: true,
    showLastNotes: true,
    backgroundInterval: 5,
    useFixedBackground: false,
    fixedBackground: '',
    useTransparency: true,
    inputFormat: '',
    outputFormat: '',
    serverURL: '',
    useLocalStorage: true,
    isFirstStart: true,
    sortOrderStock: 'alpha',
    sortOrderAuthors: 'alpha',
    sortOrderExport: 'alpha',
    displayStock: 'table',
    useScreensaver: true,
    screensaverActInterval: 2,
    screensaverChangeInterval: 1,
    screensaverQuotes: true,
    screensaverNotes: false,
    screensaverEffect: 'flicker-glow'
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
let screensaverInterval;

let authorsPane = document.querySelector('#authors');
let exportPane = document.querySelector('#export');
let stockPane = document.querySelector('#stock');


/*********************/
/* Class Definitions */
/*********************/

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
    books;

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
        this.books = options.books || [];

        authors.set(this.surname + ', ' + this.prename, this);
        localStorage.setItem('authors', JSON.stringify(Object.fromEntries(authors)));    
    }

    showDetails = () => {
        showAuthorDetailsDisplay();
        this.fillBooksArray();
        if (document.querySelector('#mainInputSearchResults')) {
            document.querySelector('#mainInputSearchResults').remove();
            document.querySelector('#mainInput').value = this.surname + ', ' + this.prename;
        }
        hideStartPage();
        document.querySelector('#authorName').innerHTML = this.prename + ' ' + this.surname;
        if (this.date_birth !== '' && this.date_death !== '') {
            document.querySelector('#authorDates').innerHTML = this.date_birth + ' - ' + this.date_death;
        } else if (this.date_birth !== '' && this.date_death === '') {
            document.querySelector('#authorDates').innerHTML = 'Born ' + this.date_birth;
        } else if (this.date_birth === '' && this.date_birth !== '') {
            document.querySelector('#authorDates').innerHTML = 'Died ' + this.date_death;
        } else {
            document.querySelector('#authorDates').innerHTML = 'Life dates unknown';
        }
        let titlesDisplay = document.querySelector('#authorsBooksList');
        titlesDisplay.innerHTML = '';

        let authorQuotes = [];
        let sortedBooksYear = [];
        this.books.forEach((book) => { 
            sortedBooksYear.push(books.get(book));
        });
        sortedBooksYear = sortedBooksYear.sort((a, b) => a.year - b.year);

        sortedBooksYear.forEach((book) => {
            let newDiv = document.createElement('div');
            
            newDiv.classList.add('authorBookItem');
            newDiv.innerHTML = book.year + ' - ' + book.title;
            newDiv.addEventListener('click', book.showDetails);
            titlesDisplay.appendChild(newDiv);

            book.quotes.forEach((quote) => {
                authorQuotes.push(quotes.get(quote).quote_text);
            });
        });

        let quotesDisplay = document.querySelector('#authorQuotesList');
        quotesDisplay.innerHTML = '';
        if (authorQuotes.length > 0) {
            authorQuotes.forEach((quote) => {
            let newDiv = document.createElement('div');
            newDiv.classList.add('quoteItem');
            newDiv.innerHTML = '&quot;' + quote + '&quot;';
            quotesDisplay.appendChild(newDiv);
        });
        } else {
            quotesDisplay.innerHTML = 'No quotes yet';
        }

    }

    fillBooksArray = () => {
        let authoredBooks = Array.from(books.values()).filter((book) => {
            if (book.author_prename === this.prename && book.author_surname === this.surname) {
                return true;
            } else {
                return false;
            }
        });
        
        authoredBooks.forEach((book) => {
            this.books.push(book.title);
        });
        this.books = Array.from(new Set(this.books));
        this.save();
    }

    save = () => {
        localStorage.setItem('authors', JSON.stringify(Object.fromEntries(authors)));    
    }
}

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
    tags_labels;
    date_added;
    authors;

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
            this.tags_labels = options.tags_labels || [];
            this.signatures = options.signatures || [];
            this.isbn = options.isbn || '';
            this.number_pages = options.number_pages || 0;
            this.language = options.language || 'Language Unknown';
            this.author_surname = options.author_surname || '';
            this.author_prename = options.author_prename || '';
            this.publisher_name = options.publisher_name || '';
            this.date_added = options.date_added || new Date();
            this.authors = options.authors || [];

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
            this.save();            
        }
    }

    showDetails = () => {
        prepareForDetailsView();
        clearSearchResults();
        clearMainFocus();
        /* this.repairTagsList(); */
        document.querySelector('#detailView').style.display = 'block flex';
        document.querySelector('#detailView').setAttribute('data-title', this.title);
        document.querySelector('#detailTitle').innerHTML = '&laquo; ' + this.title + ' &raquo;';
        if (this.subtitle !== '') {
            document.querySelector('#detailSubtitle').innerHTML = '&raquo; ' + this.subtitle + ' &laquo;';
        } else {
            document.querySelector('#detailSubtitle').innerHTML = '';
        }
        document.querySelector('#detailYear').textContent = this.year;
       
        let newAuthor = document.createElement('div');
        newAuthor.id = 'detailAuthor';
        newAuthor.classList.add('detailAuthorLink');
        newAuthor.addEventListener('click', authors.get(this.author_surname + ', ' + this.author_prename).showDetails);
        newAuthor.textContent = 'by ' + this.author_prename + ' ' + this.author_surname;
        document.querySelector('#detailAuthor').replaceWith(newAuthor);
        
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
        
        this.repairQuotesList();

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
                newDiv.id = 'quote-' + quoteObj.uid;
                newDiv.classList.add('quoteItem');
                newDiv.innerHTML = '&quot;' + quoteObj.quote_text + '&quot; <span class="quotePage">(page ' + quoteObj.page + ')</span>';
                newDiv.addEventListener('mouseenter', showQuoteActions);
                newDiv.addEventListener('mouseleave', hideQuoteActions);
                quotesList.appendChild(newDiv);
            });
        } else {
            quotesList.textContent = 'No Quotes yet';
        }

        if (this.tags_labels.length > 0) {
            this.tags_labels.forEach((tag) => {
                let tagObj = tags.get(tag);
                let newDiv = document.createElement('div');
                newDiv.classList.add('tagItem');
                newDiv.textContent = '#' + tagObj.label.toLowerCase();
                newDiv.addEventListener('click', tagObj.showDetails);
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
                tagDiv.setAttribute('data-tag-label', tag.label);
                tagDiv.addEventListener('click', this.addTag);
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
        if (e.target.classList.contains('tagListItem')) {
            let t = tags.get(e.target.getAttribute('data-tag-label'));
            this.tags.push(t.uid);
            this.tags_labels.push(t.label);
            t.countUp();
            t.addBook(this.uid);
        } else {
            let inputTag = document.querySelector('#addTagInput-' + this.uid).value;
            let newTag = new Tag(inputTag);
            this.tags.push(newTag.uid);
            this.tags_labels.push(newTag.label);
            newTag.countUp();
            newTag.addBook(this.uid);
        }
        this.tags = Array.from(new Set(this.tags));
        this.tags_labels = Array.from(new Set(this.tags_labels));
        this.save();
        document.querySelector('#tagForm-' + this.uid).remove();
        this.showDetails();
    }
    
    addQuote = (e) => {
        let title = document.querySelector('#addQuoteTitleInput-' + this.uid).value;
        let text = document.querySelector('#addQuoteTextArea-' + this.uid).value;
        let page = document.querySelector('#addQuotePageInput-' + this.uid).value;
        let newQuote = new Quote(text, { title: title, page: page, book_title: this.title, book_id: this.uid });
        this.quotes.push(newQuote.uid);
        this.save();
        document.querySelector('#quoteForm-' + this.uid).remove();
        this.showDetails();
    }

    repairQuotesList = () => {
        let quotesSet = new Set(this.quotes);
        quotesSet.forEach((quote) => {
            if (!quotes.get(quote)) {
                quotesSet.delete(quote);
            }
        });
        this.quotes = Array.from(quotesSet);
        this.save();
    }

    repairTagsList = () => {
        this.tags.forEach((tag) => {
            let t = tags.get(tag);
            this.tags_labels.push(t.label);
        });
        this.tags_labels = Array.from(new Set(this.tags_labels));
        this.save();
    }

    save = () => {
        books.set(this.title, this);
        localStorage.setItem('books', JSON.stringify(Object.fromEntries(books)));
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
        this.save();
    }

    save = () => {
        localStorage.setItem('collections', JSON.stringify(Object.fromEntries(collections)));
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
        this.places = Array.from(new Set(this.places));

        publishers.set(this.name, this);
        this.save();
    }

    save = () => {
        localStorage.setItem('publishers', JSON.stringify(Object.fromEntries(publishers)));
    }
}

class Quote {
    uid;
    book_id;
    book_title;
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
        this.book_title = options.book_title || '';
        this.date_added = options.date_added || Date.now();
        this.tags = options.tags || [];
        this.notes = options.notes || [];

        /* this.repairBookAttributes(); */
        quotes.set(this.uid, this);
        this.save();

    }

    delete = () => {
        quotes.delete(this.uid);
        this.save();
        showMessage('Quote has been deleted!');
        let book = document.querySelector('#detailView').getAttribute('data-title');
        books.get(book).showDetails();
    }

    save = () => {
        localStorage.setItem('quotes', JSON.stringify(Object.fromEntries(quotes)));
    }

    saveModalEdit = () => {
        this.quote_text = document.querySelector('#quoteEditInput-' + this.uid).value;
        this.save();
        document.querySelector('#quoteEdit-' + this.uid).remove();
        showMessage('Quote successfully edited!');
        let book = document.querySelector('#detailView').getAttribute('data-title');
        books.get(book).showDetails();
    }

    showEditModal = (e) => {
        let coords = e.currentTarget.getBoundingClientRect();

        let newDiv = document.createElement('div');
        newDiv.classList.add('modalEdit');
        newDiv.id = 'quoteEdit-' + this.uid;
        newDiv.style.left = coords.left - 250 + 'px';
        newDiv.style.top = coords.top + 20 + 'px';

        let newText = document.createElement('textarea');
        newText.value = this.quote_text;
        newText.id = 'quoteEditInput-' + this.uid;
        newText.classList.add('modalEditTextArea');
        newDiv.appendChild(newText);

        let saveBtn = document.createElement('button');
        saveBtn.textContent = 'Save';
        saveBtn.addEventListener('click', this.saveModalEdit);
        newDiv.appendChild(saveBtn);

        document.querySelector('body').appendChild(newDiv);
    }

    copyToClipboard = () => {
        navigator.clipboard.writeText(this.quote_text);
    }

    repairBookAttributes = () => {
        let cBook = Array.from(books.values()).filter((book) => book.quotes.indexOf(this.uid) > -1);
        console.log(cBook);
        this.book_id = cBook[0].uid;
        this.book_title = cBook[0].title;        
    }
}

class Signature {
    uid;
    label;
    library_name;
    library_id;
    notes;
    tags;
    date_added;

    constructor(label, options = {}) {
        this.uid = options.uid || uid();
        this.label = label;
        this.library_name = options.library_name || '';
        this.library_id = options.library_id || '';
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
    uses_count;
    uses_book;
    uses_authors;

    constructor(label, options = {}) {
        this.uid = options.uid || uid();
        this.label = label;
        this.description = options.description || '';
        this.date_added = options.date_added || new Date();
        this.uses_count = options.uses_count || 1;
        this.uses_book = options.uses_book || [];
        this.uses_authors = options.uses_authors || [];

        /* this.repairCounts(); */
        /* tags.set(this.uid, this); */
        tags.set(this.label, this);
        this.save();
    }

    save = () => {
        localStorage.setItem('tags', JSON.stringify(Object.fromEntries(tags)));
    }

    showDetails = () => {
        clearMainFocus();
        clearSearchResults();
        document.querySelector('#tagView').style.display = 'block flex';
        document.querySelector('#tagName').textContent = '#' + this.label.toLowerCase();
        document.querySelector('#tagCount').textContent = this.uses_count + ' uses';
        let listDiv = document.querySelector('#tagUsesTitlesList');
        listDiv.innerHTML = '';
        this.uses_book.forEach((book) => {
            let b = books.get(book);
            let newDiv = document.createElement('div');
            newDiv.classList.add('tagDetailsTitleItem');
            newDiv.addEventListener('click', b.showDetails);

            let newTit = document.createElement('div');
            newTit.classList.add('tagDetailsListTitle');
            newTit.textContent = b.title;
            newDiv.appendChild(newTit);

            let newAut = document.createElement('div');
            newAut.classList.add('tagDetailsListAuthor');
            newAut.textContent = 'by ' + b.author_prename + ' ' + b.author_surname;
            newDiv.appendChild(newAut);

            listDiv.appendChild(newDiv);
        });
    }

    countUp = () => {
        this.uses_count += 1;
        this.save();
    }

    countDown = () => {
        this.uses_count -= 1;
        this.save();
    }

    addAuthor = (authorId) => {
        this.uses_authors.push(authorId);
        this.uses_authors = Array.from(new Set(this.uses_authors));
    }

    addBook = (bookId) => {
        this.uses_book.push(bookId);
        this.uses_book = Array.from(new Set(this.uses_book));
        this.save();
    }

    removeBook = (bookId) => {
        let bs = new Set(this.uses_book);
        bs.delete(bookId);
        this.uses_book = Array.from(bs);
        this.save();
    }

    repairCounts = () => {
        this.uses_count = 0;
        this.uses_book = [];
        this.uses_authors = [];

        let b = Array.from(books.values());
        let a = Array.from(authors.values());
        b.forEach((book) => {
            if (book.tags.indexOf(this.uid) > -1) {
                this.addBook(book.title);
                this.countUp();
            }
        });
        a.forEach((author) => {
            if (author.tags.indexOf(this.uid) > -1) {
                this.addAuthor(author.prename + ' ' + author.surname);
                this.countUp();
            }
        });
    }
}


/*******************/
/* Functional Code */
/*******************/

/* Universal Id Function used with every instance of every class in the instance field uid */
const uid = () => { return (Date.now().toString(32) + Math.random().toString(16).replace(/\./g, '')).substring(0, 20); }

/* Entry Point */
initializeApp();

function changeInType(e) {
    switch (e.target.value) {
        case 'journal':
            break;
        case 'wiki':
            break;
        case 'anthology':
            break;
        case 'dictionay':
            break;
        case 'encyclopedia':
            break;
        
    }
}

function changeTitleType(e) {
    switch (e.target.value) {
        case 'article':
            document.querySelector('#newFormInSection').style.display = 'block flex';
            document.querySelector('#newFormPubSection').style.display = 'none';
            break;
        case 'book':
            document.querySelector('#newFormInSection').style.display = 'none';
            document.querySelector('#newFormPubSection').style.display = 'block flex';
            break;
        case 'blogentry':
            break;
        case 'online':
            break;
        case 'podcast':
            break;
        case 'video':
            break;
    }
}

function clearMainFocus() {
    document.querySelectorAll('.mainFocusView').forEach((node) => node.style.display = 'none');
}

function clearSearchResults() {
    if (document.querySelector('#mainInputSearchResults')) {
        document.querySelector('#mainInputSearchResults').remove();
    }
}

function constructStartPage() {
    let sp = document.querySelector('#startPage');
    let coords = sp.getBoundingClientRect();
    
    sp.style.height = window.innerHeight - coords.top - 50 + 'px';
    if (settings.startCollapsed) {

    }
    
    if (settings.showLastAdditions) {
        showLastAdditions();
    }

    if (settings.showGaps) {

    }

    if (settings.showLastQuotes) {
        showLastQuotes();
    }

    if (settings.showLastNotes) {
        showLastNotes();
    }
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

    let importedCollections = new Map(Object.entries(JSON.parse(importData[7])));
    Array.from(importedCollections).forEach((coll) => { collections.set(coll[0], new Collection(coll[1].title, coll[1])); });
    console.log(importedCollections);
    console.log('JSON Data successfully imported! ' + books.size + ' Books added.');
    updateDisplay();
    
}

function createBookFromForm(e) {
    e.preventDefault();

}

function createNewCollection(e) {
    let name = document.querySelector('#stockPane-newCollectionInput').value;
    let c = new Collection(name, { titles: Array.from(transientSelection) });
    document.querySelector('#stockPane-newCollectionModal').remove();
    showMessage('A new collection named "' + name + '" has been created!');
}

function createScreensaverQuote(text) {
    let wordsDiv = document.createElement('div');
    wordsDiv.classList.add('screenSaverWords');
    
    let words = text.split(' ');
    let numberLetters = text.length;

    let timing = ['ease', 'ease-in', 'ease-out', 'ease-in-out', 'linear'];
    let sizeFactor = 150 / numberLetters;

    words.forEach((word) => {
        let wordDiv = document.createElement('div');
        wordDiv.classList.add('screenSaverWord');
        
        let wordN = (Math.random() * 0.7) + 2.0;
        let wordD = Math.random() * 0.2;
        let wordT = Math.round(Math.random() * 3);

        Array.from(word).forEach((letter) => {
            let letterChar = document.createElement('div');
            letterChar.classList.add('screenSaverLetter');
            if (numberLetters > 150) {
                letterChar.style.fontSize = Math.round(((Math.random() * 200) + 400) * sizeFactor) + '%';
            } else {
                letterChar.style.fontSize = Math.round((Math.random() * 200) + (400)) + '%';
            }
            let n = (wordN + (Math.random() * 0.15)).toFixed(2);
            let m = Math.round((Math.random() * 25) + 230);
            let o = (Math.random() * 0.40)+ 0.60;
            let t = wordT + Math.round(Math.random());
            let d = (wordD + (Math.random() * 0.1)).toFixed(2);
            
            letterChar.style.color = `rgba(${m}, ${m}, ${m}, ${o})`;
            letterChar.style.animation = `text-flicker-in-glow ${n}s ${timing[t]} ${d}s both`;
            letterChar.textContent = letter;
            wordDiv.appendChild(letterChar);
            
        });

        wordsDiv.appendChild(wordDiv);
    });

    return wordsDiv;
}

function createSearchResultsDisplay() {
    if (!document.querySelector('#mainInputSearchResults')) {
        let coords = document.querySelector('#mainInput').getBoundingClientRect();
        let newDiv = document.createElement('div');
        newDiv.id = 'mainInputSearchResults';
        newDiv.style.top = coords.top + 30 + 'px';
        newDiv.style.left = coords.left + 'px';

        let newH = document.createElement('div');
        newH.textContent = 'Search Results';
        newH.classList.add('searchResultsHeader');
        newDiv.appendChild(newH);

        let newAuthors = document.createElement('div');
        
        let newAuthorsH = document.createElement('div');
        newAuthorsH.textContent = 'Authors';
        newAuthorsH.classList.add('searchResultsCategory');
        newAuthors.appendChild(newAuthorsH);

        let newAuthorsList = document.createElement('div');
        newAuthorsList.id = 'mainInputSearchResults-Authors';
        newAuthors.appendChild(newAuthorsList);
        newDiv.appendChild(newAuthors);

        let newTitles = document.createElement('div');
        
        let newTitlesH = document.createElement('div');
        newTitlesH.textContent = 'Titles';
        newTitlesH.classList.add('searchResultsCategory');
        newAuthors.appendChild(newTitlesH);

        let newTitlesList = document.createElement('div');
        newTitlesList.id = 'mainInputSearchResults-Titles';
        newTitles.appendChild(newTitlesList);
        newDiv.appendChild(newTitles);

        let newTags = document.createElement('div');
        
        let newTagsH = document.createElement('div');
        newTagsH.textContent = 'Tags';
        newTagsH.classList.add('searchResultsCategory');
        newTags.appendChild(newTagsH);

        let newTagsList = document.createElement('div');
        newTagsList.id = 'mainInputSearchResults-Tags';
        newTags.appendChild(newTagsList);
        newDiv.appendChild(newTags);

        let newQuotes = document.createElement('div');
        
        let newQuotesH = document.createElement('div');
        newQuotesH.textContent = 'Quotes';
        newQuotesH.classList.add('searchResultsCategory');
        newQuotes.appendChild(newQuotesH);

        let newQuotesList = document.createElement('div');
        newQuotesList.id = 'mainInputSearchResults-Quotes';
        newQuotes.appendChild(newQuotesList);
        newDiv.appendChild(newQuotes);

        document.querySelector('body').appendChild(newDiv);
    }
    
}

function deleteBook(e) {
    e.preventDefault();
    books.delete(e.target.id.substring(7));
    saveBooksToLocalStorage();
    updateDisplay();
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

function equipListeners() {
    document.querySelectorAll('.paneToggler').forEach( (node) => { node.addEventListener('click', togglePane); });
    document.querySelectorAll('.configuratorToggler').forEach( (node) => { node.addEventListener('click', toggleConfigurator); });
    document.querySelectorAll('.maximizePaneToggler').forEach( (node) => { node.addEventListener('click', maximizePane); });
    document.querySelector('#settingsToggler').addEventListener('click', toggleSettings);
    document.querySelector('#closeSettings').addEventListener('click', toggleSettings);
    
    document.querySelector('#mainInput').addEventListener('input', observeMainInput);
    document.querySelector('#mainInput').addEventListener('focus', mainInputFocus);
    document.querySelector('#mainInput').addEventListener('blur', mainInputBlur);

    document.querySelector('#directExportLink').addEventListener('click', exportLocalDataToJsonFile);
    document.querySelector('#localPurgeBtn').addEventListener('click', purgeLocalStorage);
    document.querySelector('#importFileInput').addEventListener('change', importDataFile);
    document.querySelector('#screensaverBtn').addEventListener('click', toggleFullScreenSaver);
    document.querySelector('#detailToggleFull').addEventListener('click', maximizeMainContent);

    document.querySelector('#authorsPane-sortAlpha').addEventListener('click', setOrder);
    document.querySelector('#authorsPane-sortAlphaReverse').addEventListener('click', setOrder);
    document.querySelector('#authorsPane-sortOrderAdded').addEventListener('click', setOrder);
    document.querySelector('#authorsPane-sortOrderAddedReverse').addEventListener('click', setOrder);
    document.querySelector('#authorsPane-listCardlets').addEventListener('click', setListType);
    document.querySelector('#authorsPane-listTable').addEventListener('click', setListType);

    document.querySelector('#exportPane-sortAlpha').addEventListener('click', setOrder);
    document.querySelector('#exportPane-sortAlphaReverse').addEventListener('click', setOrder);
    document.querySelector('#exportPane-sortOrderAdded').addEventListener('click', setOrder);
    document.querySelector('#exportPane-sortOrderAddedReverse').addEventListener('click', setOrder);
    document.querySelector('#exportPane-listCardlets').addEventListener('click', setListType);
    document.querySelector('#exportPane-listTable').addEventListener('click', setListType);

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

    document.querySelector('body').addEventListener('mousemove', resetScreenSaverInterval);
    document.querySelector('body').addEventListener('keydown', resetScreenSaverInterval);

    document.querySelector('#mainInterface').addEventListener('dblclick', putMainInterfaceBack);
    document.querySelector('#exportPane-exportPDF').addEventListener('click', exportPDF);
    document.querySelector('#newFormPlus').addEventListener('click', showNewTitleForm);

    document.querySelector('#newType').addEventListener('click', changeTitleType);

    document.querySelectorAll('.settingsSectionsItem').forEach((node) => { node.addEventListener('click', showSettingsTab); });
    document.querySelectorAll('.settingsSetting').forEach((node) => { node.addEventListener('change', handleSettingsChange); });
}

function exitFullscreenSaver() {
    document.querySelector('body').removeEventListener('mousemove', exitFullscreenSaver);
    if (document.fullscreenElement) { document.exitFullscreen(); }
    document.querySelector('.screensaver').remove();
    clearInterval(screensaverInterval);
    screensaverInterval = '';
    screensaverInterval = setInterval(toggleFullScreenSaver, Number.parseInt(60000 * settings.screensaverActInterval));
    document.querySelector('body').addEventListener('mousemove', resetScreenSaverInterval);
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
    let CollStr = JSON.stringify(Object.fromEntries(collections));

    exportData.push(booksStr);
    exportData.push(authorsStr);
    exportData.push(pubsStr);
    exportData.push(quotesStr);
    exportData.push(notesStr);
    exportData.push(tagsStr);
    exportData.push(signStr);
    exportData.push(CollStr);

    let expStr = JSON.stringify(exportData);

    rightNow = new Date();
    filename = 'bibliography-data-' + (rightNow.getMonth()+1) + '-' + rightNow.getDate() + '-' + rightNow.getFullYear() + '-' + rightNow.getHours().toString().padStart(2, '0') + '-' + rightNow.getMinutes().toString().padStart(2, '0') + '.json';
    booksUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(expStr);
    let ghostLink = document.createElement('a');
    ghostLink.setAttribute('href', booksUri);
    ghostLink.setAttribute('download', filename);
    ghostLink.click();
}

function exportPDF() {
    console.log('HI! from export!');
    let ex = document.querySelector('#export').cloneNode(true);

    let doc = document.createElement('div');
    doc.classList.add('exportDoc');

    let h = document.createElement('h1');
    h.textContent = 'Bibliography';
    h.classList.add('exportHeader');
    doc.appendChild(h);
    doc.appendChild(ex);
    
    let worker = html2pdf().from(doc).save('bibliography.pdf');
    
}

function exportSelectedTitles(e) {
    if (transientSelection.size > 0) {

    } else {
        showMessage('The export could not be started, because there were no titles selected!');
    }
}

function getBrowserName() {
    let userAgent = navigator.userAgent;
    let browserName;
         
    if(userAgent.match(/chrome|chromium|crios/i)){
            browserName = "Chrome";
    } else if (userAgent.match(/firefox|fxios/i)){
            browserName = "Firefox";
    }  else if (userAgent.match(/safari/i)){
            browserName = "Safari";
    } else if (userAgent.match(/opr\//i)){
            browserName = "Opera";
    } else if (userAgent.match(/edg/i)){
            browserName = "Edge";
    } else {
            browserName="No browser detection";
    }
    return browserName;
}

function handleSettingsChange(e) {
    console.log('HI! from handleSettingsChange!');

    switch(e.target.id) {
        case 'languageSelect':
            settings.language = e.target.value;
            break;
        case 'useScientific':
            settings.useAcademicMode = e.target.checked;
            break;
        case 'useAutoSave':
            settings.useAutoSave = e.target.checked;
            break;
        case 'autoSaveInterval':
            settings.autoSaveInterval = Number.parseInt(e.target.value);
            break;
        case 'saveTransient':
            settings.saveTransient = e.target.checked;
            break;
        case 'showOrderButtons':
            settings.showOrderButtons = e.target.checked;
            break;
        case 'showFormOnEmpty':
            settings.showFormOnEmpty = e.target.checked;
            break;
        case 'useTransparency':
            settings.useTransparency = e.target.checked;
            break;
        case 'useAlternativePublisherIcon':
            settings.useAltPubIcon = e.target.checked;
            if (settings.useAltPubIcon) {
                document.querySelector('#altPubIcons').style.display = 'block flex';
                uncheckAllAltIcons();
                switch (settings.altPubIcon) {
                    case '':
                        break;
                    case 'fa-person-military-rifle':
                        document.querySelector('#useRifleIcon').checked = true;
                        break;
                    case 'fa-people-robbery':
                        document.querySelector('#useRobberyIcon').checked = true;
                        break;
                    case 'fa-person-harassing':
                        document.querySelector('#useHarassingIcon').checked = true;
                        break;
                    case 'fa-face-grin-hearts':
                        document.querySelector('#useGrinIcon').checked = true;
                        break;
                    case 'fa-heart':
                        document.querySelector('#useHeartIcon').checked = true;
                        break;
                    case 'fa-cow':
                        document.querySelector('#useCowIcon').checked = true;
                        break;
                    case 'fa-hand-spock':
                        document.querySelector('#useSpockIcon').checked = true;
                        break;
                }
            } else {
                document.querySelector('#altPubIcons').style.display = 'none';
            }
            setPubIcon();
            break;
        case 'useRifleIcon':
            if (e.target.checked) {
                uncheckAllAltIcons();
                e.target.checked = true;
                settings.altPubIcon = 'fa-person-military-rifle';
            } else {
                settings.altPubIcon = '';
            }
            setPubIcon();
            break;
        case 'useRobberyIcon':
            if (e.target.checked) {
                uncheckAllAltIcons();
                e.target.checked = true;
                settings.altPubIcon = 'fa-people-robbery';
            } else {
                settings.altPubIcon = '';
            }
            setPubIcon();
            break;
        case 'useHarassingIcon':
            if (e.target.checked) {
                uncheckAllAltIcons();
                e.target.checked = true;
                settings.altPubIcon = 'fa-person-harassing';
            } else {
                settings.altPubIcon = '';
            }
            setPubIcon();           
            break;
        case 'useGrinIcon':
            if (e.target.checked) {
                uncheckAllAltIcons();
                e.target.checked = true;
                settings.altPubIcon = 'fa-face-grin-hearts';
            } else {
                settings.altPubIcon = '';
            }
            setPubIcon();
            break;
        case 'useHeartIcon':
            if (e.target.checked) {
                uncheckAllAltIcons();
                e.target.checked = true;
                settings.altPubIcon = 'fa-heart';
            } else {
                settings.altPubIcon = '';
            }
            setPubIcon();
            break;
        case 'useCowIcon':
            if (e.target.checked) {
                uncheckAllAltIcons();
                e.target.checked = true;
                settings.altPubIcon = 'fa-cow';
            } else {
                settings.altPubIcon = '';
            }
            setPubIcon();
            break;
        case 'useSpockIcon':
            if (e.target.checked) {
                uncheckAllAltIcons();
                e.target.checked = true;
                settings.altPubIcon = 'fa-hand-spock';
            } else {
                settings.altPubIcon = '';
            }
            setPubIcon();
            break;
        case 'useBackground':
            settings.useBackground = e.target.checked;
            break;
        case 'useFixedBackground':
            settings.useFixedBackground = e.target.checked;
            break;
        case 'useDynamicBackground':
            settings.useDynamicBackground = e.target.checked;
            break;
        case 'startWithCollapsed':
            settings.startCollapsed = e.target.checked;
            break;
        case 'showLastAdditions':
            settings.showLastAdditions = e.target.checked;
            break;
        case 'showGaps':
            settings.showGaps = e.target.checked;
            break;
        case 'showLastQuotes':
            settings.showLastQuotes = e.target.checked;
            break;
        case 'showLastNotes':
            settings.showLastNotes = e.target.checked;
            break;
        case 'useScreensaver':
            settings.useScreensaver = e.target.checked;
            break;
        case 'useQuotes':
            settings.screensaverQuotes = e.target.checked;
            break;
        case 'useNotes':
            settings.screensaverNotes = e.target.checked;
            break;
        case 'screensaverActivateInterval':
            settings.screensaverActInterval = Number.parseInt(e.target.value);
            break;
        case 'screensaverChangeInterval':
            settings.screensaverChangeInterval = Number.parseFloat(e.target.value);
            break;
        case 'screensaverEffect':
            settings.screensaverEffect = e.target.value;
            break;    
    }

    saveSettings();
}

function hideQuoteActions(e) {
    e.currentTarget.querySelector('.quoteActions').remove();
}

function hideStartPage() {
    document.querySelector('#startPage').style.display = 'none';
}

function importDataFile(e) {
    let files = e.target.files;
    let reader = new FileReader();
    reader.onload = createBooksFromFile;
    reader.readAsText(files[0]);
}

function initializeApp() {
    initializeLocalStorage();
    initializeSettingsInputs();
    initializeScreensaver();
    equipListeners();
    updateDisplay();
    
    constructStartPage();
    
}

function initializeLocalStorage() {
    if (!localStorage.getItem('settings')) {
        populateLocalStorage();
    } else {
        loadLocalStorage();
    }
}

function initializeSettingsInputs() {
    document.querySelector('#languageSelect').value = settings.language;
    document.querySelector('#useScientific').checked = settings.useAcademicMode;
    document.querySelector('#useAutoSave').checked = settings.useAutoSave;
    document.querySelector('#autoSaveInterval').value = settings.autoSaveInterval.toString();
    document.querySelector('#saveTransient').checked = settings.saveTransient;
    document.querySelector('#showOrderButtons').checked = settings.showOrderButtons;
    document.querySelector('#showFormOnEmpty').checked = settings.showFormOnEmpty;
    document.querySelector('#useTransparency').checked = settings.useTransparency;
    document.querySelector('#useAlternativePublisherIcon').checked = settings.useAltPubIcon;
    /* TODO Check the correct icon according to read settings */
    document.querySelector('#useBackground').checked = settings.useBackground;
    document.querySelector('#useFixedBackground').checked = settings.useFixedBackground;
    document.querySelector('#useDynamicBackground').checked = settings.useDynamicBackground;
    document.querySelector('#startWithCollapsed').checked = settings.startCollapsed;
    document.querySelector('#showLastAdditions').checked = settings.showLastAdditions;
    document.querySelector('#showGaps').checked = settings.showGaps;
    document.querySelector('#showLastQuotes').checked = settings.showLastQuotes;
    document.querySelector('#showLastNotes').checked = settings.showLastNotes;
    document.querySelector('#useScreensaver').checked = settings.useScreensaver;
    document.querySelector('#useQuotes').checked = settings.screensaverQuotes;
    document.querySelector('#useNotes').checked = settings.screensaverNotes;
    document.querySelector('#screensaverActivateInterval').value = settings.screensaverActInterval.toString();
    document.querySelector('#screensaverChangeInterval').value = settings.screensaverChangeInterval.toString();
    document.querySelector('#screensaverEffect').value = settings.screensaverEffect;
}

function initializeScreensaver() {
    screensaverInterval = setInterval(toggleFullScreenSaver, Number.parseInt(60000 * settings.screensaverActInterval));
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

function loadRandomBackgroundImage() {
    document.querySelector('#alltainer').style.backgroundImage = "url('./images/background_" + Math.round((Math.random() * 15) + 1) + ".jpg')";
}

function mainInputBlur() {    
    let mainInputClue = document.querySelector('#mainInputClue');
    mainInputClue.classList.remove('shake-horizontal');
    mainInputClue.style.color = 'rgba(100, 100, 100, 0.5)';
    
}

function mainInputFocus() {
    let mainInputClue = document.querySelector('#mainInputClue');
    mainInputClue.style.color = 'rgba(30, 30, 30, 1.0)';
    mainInputClue.classList.add('shake-horizontal');
    let input = document.querySelector('#mainInput').value;
    if (input.length > 0) {
        createSearchResultsDisplay();
        searchAuthors(input.toLowerCase());
        searchBooks(input.toLowerCase());
        searchTags(input.toLowerCase());
        searchQuotes(input.toLowerCase());
    }
}

function maximizeMainContent(e) {
    let main = document.querySelector('#mainFocusContent');
    let sp = document.querySelector('#startPage');
    sp.style.height = '100%';
    let coords = main.getBoundingClientRect();

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
    let sp = document.querySelector('#startPage');
    let spCo = sp.getBoundingClientRect();
    sp.style.height = window.innerHeight - spCo.top - 50 + 'px';    
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

function observeMainInput(e) {
    if (e.keyCode === 13) {
        parseMainInput();
    }
    let input = document.querySelector('#mainInput').value;
    console.log(input);
    if (input.length > 0) {
        createSearchResultsDisplay();
        searchAuthors(input.toLowerCase());
        searchBooks(input.toLowerCase());
        searchTags(input.toLowerCase());
        searchQuotes(input.toLowerCase());
    } else {
        if (document.querySelector('#mainInputSearchResults')) {
            document.querySelector('#mainInputSearchResults').remove();
        }
    }
    /* TODO Parse input and reflect current progress in Standard Format String below mainInput (green coloring) */
}

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

function prepareForDetailsView() {
    let mainInterface = document.querySelector('#mainInterface');
    let mainTitle = document.querySelector('#mainTitle');
    let settings = document.querySelector('#settingsToggler');
    let latestAdds = document.querySelector('#latestAdditions');
    let details = document.querySelector('#detailView');

    document.querySelector('#authorView').style.display = 'none';
    document.querySelector('#startPage').style.display = 'none';
    
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
    details.style.display = 'block flex';
}

function purgeLocalStorage() {
    books = new Map();
    authors = new Map();
    publishers = new Map();
    quotes = new Map();
    notes = new Map();
    signatures = new Map();
    tags = new Map();
    collections = new Map();

    localStorage.setItem('books', JSON.stringify(Object.fromEntries(books)));
    localStorage.setItem('authors', JSON.stringify(Object.fromEntries(authors)));
    localStorage.setItem('publishers', JSON.stringify(Object.fromEntries(publishers)));
    localStorage.setItem('quotes', JSON.stringify(Object.fromEntries(publishers)));
    localStorage.setItem('notes', JSON.stringify(Object.fromEntries(publishers)));
    localStorage.setItem('signatures', JSON.stringify(Object.fromEntries(publishers)));
    localStorage.setItem('tags', JSON.stringify(Object.fromEntries(publishers)));
    localStorage.setItem('collections', JSON.stringify(Object.fromEntries(publishers)));

    updateDisplay();
}

function putMainInterfaceBack() {
    let mainInterface = document.querySelector('#mainInterface');
    let mainTitle = document.querySelector('#mainTitle');
    let settings = document.querySelector('#settingsToggler');
    let latestAdds = document.querySelector('#latestAdditions');
    let details = document.querySelector('#detailView');

    mainInterface.style.marginTop = '15vh';
    mainInterface.style.padding = '20px';
    
    settings.style.marginTop = '15px';

    mainTitle.style.opacity = '1';
    mainTitle.style.height = 'auto';
    mainTitle.style.visibility = 'visible';

    latestAdds.style.opacity = '1';
    latestAdds.style.visibility = 'visible';
    
    details.style.opacity = '0';
    details.style.visibility = 'hidden';
    details.style.display = 'none';

}

function requestFull() {
    if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen().catch((err) => console.log(err.message));
    }
}

function resetScreenSaverInterval() {
    clearInterval(screensaverInterval);
    screensaverInterval = setInterval(toggleFullScreenSaver, Number.parseInt(60000 * settings.screensaverActInterval));
    console.log('HI! from reset!');
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
        displayStock: 'table',
        sortOrderAuthors: 'alpha',
        sortOrderExport: 'alpha'
    };
    saveSettings();
}

function saveAll() {

}

function saveBooksToLocalStorage() {
    localStorage.setItem('books', JSON.stringify(Object.fromEntries(books)));
}

function saveSettings() {
    localStorage.setItem('settings', JSON.stringify(settings));
}

function searchAuthors(str) {
    let resultsDiv = document.querySelector('#mainInputSearchResults-Authors');
    resultsDiv.innerHTML = '';
    let names = Array.from(authors.keys());
    
    let results = [];
    names.forEach((name) => {
        if (name.toLowerCase().indexOf(str) > -1) {
            results.push(name);
        }
    });
    if (results.length > 0) {
        results.sort().forEach((result) => {
            let newDiv = document.createElement('div');
            newDiv.textContent = result;
            newDiv.classList.add('searchResultItem');
            newDiv.addEventListener('click', authors.get(result).showDetails);
            resultsDiv.appendChild(newDiv);
        });
    } else {
        let newDiv = document.createElement('div');
        newDiv.textContent = 'No Authors found';
        newDiv.classList.add('searchResultItem');
        resultsDiv.appendChild(newDiv);
    }
    
}

function searchBooks(str) {
    let resultsDiv = document.querySelector('#mainInputSearchResults-Titles');
    resultsDiv.innerHTML = '';
    let names = Array.from(books.keys());
    
    let results = [];
    names.forEach((name) => {
        if (name.toLowerCase().indexOf(str) > -1) {
            results.push(name);
        }
    });
    if (results.length > 0) {
        results.sort().forEach((result) => {
            let newDiv = document.createElement('div');
            newDiv.textContent = result;
            newDiv.classList.add('searchResultItem');
            newDiv.addEventListener('click', books.get(result).showDetails);
            resultsDiv.appendChild(newDiv);
        });
    } else {
        let newDiv = document.createElement('div');
        newDiv.textContent = 'No Titles found';
        newDiv.classList.add('searchResultItem');
        resultsDiv.appendChild(newDiv);
    }   
}

function searchQuotes(str) {
    let resultsDiv = document.querySelector('#mainInputSearchResults-Quotes');
    resultsDiv.innerHTML = '';
    let names = Array.from(quotes.values()).map((quote) => [quote.quote_text, quote.book_title]);
      
    let results = [];

    names.forEach((name) => {
        if (name[0].toLowerCase().indexOf(str) > -1) {
            results.push(name);
        }
    });
    if (results.length > 0) {
        results.forEach((result) => {
            let newDiv = document.createElement('div');
            if (result[0].length > 80) {
                newDiv.textContent = result[0].substring(0, 80) + ' ...';
            } else {
                newDiv.textContent = result[0];
            }  
            
            newDiv.classList.add('searchResultItem');
            newDiv.addEventListener('click', books.get(result[1]).showDetails);
            resultsDiv.appendChild(newDiv);
        });
    } else {
        let newDiv = document.createElement('div');
        newDiv.textContent = 'No Quotes found';
        newDiv.classList.add('searchResultItem');
        resultsDiv.appendChild(newDiv);
    }   
}

function searchTags(str) {
    let resultsDiv = document.querySelector('#mainInputSearchResults-Tags');
    resultsDiv.innerHTML = '';
    let names = Array.from(tags.values()).map((tag) => tag.label);
    
    let results = [];
    names.forEach((name) => {
        if (name.toLowerCase().indexOf(str) > -1) {
            results.push(name);
        }
    });
    if (results.length > 0) {
        results.forEach((result) => {
            let newDiv = document.createElement('div');
            newDiv.textContent = result;
            newDiv.classList.add('searchResultItem');
            newDiv.addEventListener('click', tags.get(result).showDetails);
            resultsDiv.appendChild(newDiv);
        });
    } else {
        let newDiv = document.createElement('div');
        newDiv.textContent = 'No Tags found';
        newDiv.classList.add('searchResultItem');
        resultsDiv.appendChild(newDiv);
    }  
}

function serialDeleteBooks(e) {
    let n = transientSelection.size;
    Array.from(transientSelection).forEach((book) => { books.delete(book); });
    showMessage(n + ' books have been deleted');
}

function setAuthorsOrderIcon () {
    let orderIcons = document.querySelectorAll('.authorsOrderIcon');
    orderIcons.forEach((icon) => { icon.classList.remove('selected'); });
    switch (settings.sortOrderAuthors) {
        case 'alpha':
            document.querySelector('#authorsPane-sortAlpha').classList.add('selected');
            break;
        case 'alpha-reverse':
            document.querySelector('#authorsPane-sortAlphaReverse').classList.add('selected');
            break;
        case 'added':
            document.querySelector('#authorsPane-sortOrderAdded').classList.add('selected');
            break;
        case 'added-reverse':
            document.querySelector('#authorsPane-sortOrderAddedReverse').classList.add('selected');
            break;
    }
    saveSettings();
}

function setExportOrderIcon() {
    let orderIcons = document.querySelectorAll('.exportOrderIcon');
    orderIcons.forEach((icon) => { icon.classList.remove('selected'); });
    switch (settings.sortOrderExport) {
        case 'alpha':
            document.querySelector('#exportPane-sortAlpha').classList.add('selected');
            break;
        case 'alpha-reverse':
            document.querySelector('#exportPane-sortAlphaReverse').classList.add('selected');
            break;
        case 'added':
            document.querySelector('#exportPane-sortOrderAdded').classList.add('selected');
            break;
        case 'added-reverse':
            document.querySelector('#exportPane-sortOrderAddedReverse').classList.add('selected');
            break;
    }
    saveSettings();
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
    let orderIcons;
    let targetPane;
    if (e.target.id.indexOf('stockPane') > -1) {
        orderIcons = document.querySelectorAll('.orderIcon');
        console.log('index of stock found!');
        targetPane = 'Stock';
    } else if (e.target.id.indexOf('authorsPane') > -1) {
        orderIcons = document.querySelectorAll('.authorsOrderIcon');
        console.log('index of authors found!');
        targetPane = 'Authors';
    } else if (e.target.id.indexOf('exportPane') > -1) {
        orderIcons = document.querySelectorAll('.exportOrderIcon');
        console.log('index of export found!');
        targetPane = 'Export';
    } else {
        orderIcons = [];
    }

    orderIcons.forEach((icon) => { icon.classList.remove('selected'); });
    e.target.classList.add('selected');

    let orderType = e.target.id.slice(e.target.id.indexOf('-')+1);

    switch (orderType) {
        case 'sortAlpha':
            settings['sortOrder'+targetPane] = 'alpha';
            break;
        case 'sortAlphaReverse':
            settings['sortOrder'+targetPane] = 'alpha-reverse';
            break;
        case 'sortOrderAdded':
            settings['sortOrder'+targetPane] = 'added';
            break;
        case 'sortOrderAddedReverse':
            settings['sortOrder'+targetPane] = 'added-reverse';
            break;
    }
    saveSettings();
    
    switch (targetPane) {
        case 'Stock':
            updateStockPane();
            break;
        case 'Authors':
            updateAuthorsPane();
            break;
        case 'Export':
            updateExportPane();
            break;
    }
    
}

function setPubIcon() {
    let n = document.querySelector('#authorsPane-publisherTab');
    n.classList.remove('fa-book-open-reader', 'fa-person-military-rifle', 'fa-people-robbery', 'fa-person-harassing', 'fa-face-grin-hearts', 'fa-heart', 'fa-cow', 'fa-hand-spock');

    if (settings.useAltPubIcon) {
        if (settings.altPubIcon !== '') {
            n.classList.add(settings.altPubIcon);
        } else {
            n.classList.add('fa-book-open-reader');
        }
    } else {
        n.classList.add('fa-book-open-reader');
    }
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

function showAuthorDetailsDisplay() {
    document.querySelector('#detailView').style.display = 'none';
    document.querySelector('#latestAdditions').style.display = 'none';
    document.querySelector('#authorView').style.visibility = 'visible';
    document.querySelector('#authorView').style.display = 'block flex';    
}

function showDBSetup() {
    let newDiv = document.createElement('div');
    newDiv.id = 'stockDBSetup';
    newDiv.classList.add('fullscreenDialogTop');
    newDiv.style.backgroundColor = 'rgba(250, 250, 250, 0.9)';

    let newHeader = document.createElement('h1');
    newHeader.textContent = 'Data Storage Setup';
    newHeader.classList.add('dbSettingsHeader');
    newDiv.appendChild(newHeader);

    let newInnerDiv = document.createElement('div');
    newInnerDiv.classList.add('fullwindowInnerDiv');
    newDiv.appendChild(newInnerDiv);

    let newKnown = document.createElement('h2');
    newKnown.textContent = 'Known Sources';
    newKnown.classList.add('dbOptionsHeader');
    newKnown.style.marginTop = '0px';
    newInnerDiv.appendChild(newKnown);

    let newDataSources = document.createElement('div');
    newDataSources.classList.add('dbDataSources');
    newInnerDiv.appendChild(newDataSources);

    let newDBItem = document.createElement('div');
    newDBItem.classList.add('dbItem');
    newDataSources.appendChild(newDBItem);
    
    let newDBInfo = document.createElement('div');
    newDBInfo.classList.add('dbInfo');
    newDBItem.appendChild(newDBInfo);

    let newDBIcon = document.createElement('i');
    newDBIcon.classList.add('fa-solid');
    newDBIcon.classList.add('fa-database');
    newDBIcon.classList.add('dbItemIcon');
    newDBInfo.appendChild(newDBIcon);

    let newName = document.createElement('div');
    newName.classList.add('dbName');
    newName.textContent = 'Local Storage';
    newDBInfo.appendChild(newName);

    let newBrowserDetails = document.createElement('div');
    newBrowserDetails.classList.add('dbDetails');
    newBrowserDetails.textContent = getBrowserName();
    newDBInfo.appendChild(newBrowserDetails);

    let newSize = document.createElement('div');
    newSize.classList.add('dbDetails');
    let lcsizeBytes = new Blob(Object.values(localStorage)).size; 
    let kbSize = ((lcsizeBytes * 2) / 1024).toFixed(0) + 'kb / ~10.240kb';
    newSize.textContent = kbSize;
    newDBInfo.appendChild(newSize);

    let newDescription = document.createElement('div');
    newDescription.classList.add('dbDescription');
    newDescription.textContent = 'Local Storage is specific to a single browser installation. You should always use the auto save feature, when using this type of storage!';
    newDBInfo.appendChild(newDescription);

    let newActions = document.createElement('div');
    newActions.classList.add('dbActions');

    let newImport = document.createElement('i');
    newImport.classList.add('fa-solid');
    newImport.classList.add('fa-file-import');    
    newImport.classList.add('dbActionIcon');
    newImport.title = 'Import data from a file';
    newActions.appendChild(newImport);

    let newExport = document.createElement('i');
    newExport.classList.add('fa-solid');
    newExport.classList.add('fa-file-export');    
    newExport.classList.add('dbActionIcon');
    newExport.title = 'Export data to a file';
    newActions.appendChild(newExport);

    newDBItem.appendChild(newActions);

    let newOptionsArrow = document.createElement('i');
    newOptionsArrow.classList.add('fa-solid');
    newOptionsArrow.classList.add('fa-arrow-down');
    newOptionsArrow.classList.add('dbOptionsArrow');
    newInnerDiv.appendChild(newOptionsArrow);

    let newOptionsHeader = document.createElement('h2');
    newOptionsHeader.classList.add('dbOptionsHeader');
    newOptionsHeader.textContent = 'Options Available';
    newInnerDiv.appendChild(newOptionsHeader);

    let newOptionsAvailable = document.createElement('div');
    newOptionsAvailable.classList.add('dbOptionsAvailable');
    newInnerDiv.appendChild(newOptionsAvailable);


    let newOptionInstall = document.createElement('div');
    newOptionInstall.classList.add('dbItem');
    newOptionsAvailable.appendChild(newOptionInstall);

    let newInstallInfo = document.createElement('div');
    newInstallInfo.classList.add('dbInfo');
    newOptionInstall.appendChild(newInstallInfo);

    let newInstallIcon = document.createElement('i');
    newInstallIcon.classList.add('fa-solid');
    newInstallIcon.classList.add('fa-download');
    newInstallIcon.classList.add('dbItemIcon');
    newInstallInfo.appendChild(newInstallIcon);

    let newInstallName = document.createElement('div');
    newInstallName.classList.add('dbOptionName');
    newInstallName.textContent = 'Install Bibliography locally';
    newInstallInfo.appendChild(newInstallName);

    let newInstallDesc = document.createElement('div');
    newInstallDesc.classList.add('dbDescription');
    newInstallDesc.textContent = 'You can install the whole Bibliography app locally. This will give you your own save data storage independent from any browser or server';
    newInstallInfo.appendChild(newInstallDesc);

    let newInstallActions = document.createElement('div');
    newInstallActions.classList.add('dbActions');

    let newInstallCheck = document.createElement('i');
    newInstallCheck.classList.add('fa-solid');
    newInstallCheck.classList.add('fa-check');    
    newInstallCheck.classList.add('dbActionIcon');
    newInstallCheck.title = 'Install Bibliography locally';
    newInstallActions.appendChild(newInstallCheck);

    let newInstallQuest = document.createElement('i');
    newInstallQuest.classList.add('fa-solid');
    newInstallQuest.classList.add('fa-circle-question');    
    newInstallQuest.classList.add('dbActionIcon');
    newInstallQuest.title = 'Detailed information on installing Bibliography';
    newInstallActions.appendChild(newInstallQuest);

    newOptionInstall.appendChild(newInstallActions);


    let newOptionUpgrade = document.createElement('div');
    newOptionUpgrade.classList.add('dbItem');
    newOptionsAvailable.appendChild(newOptionUpgrade);

    let newUpgradeInfo = document.createElement('div');
    newUpgradeInfo.classList.add('dbInfo');
    newOptionUpgrade.appendChild(newUpgradeInfo);

    let newUpgradeIcon = document.createElement('i');
    newUpgradeIcon.classList.add('fa-solid');
    newUpgradeIcon.classList.add('fa-database');
    newUpgradeIcon.classList.add('dbItemIcon');
    newUpgradeInfo.appendChild(newUpgradeIcon);

    let newUpgradeName = document.createElement('div');
    newUpgradeName.classList.add('dbOptionName');
    newUpgradeName.textContent = 'Upgrade Local Storage to IndexedDB';
    newUpgradeInfo.appendChild(newUpgradeName);

    let newUpgradeDesc = document.createElement('div');
    newUpgradeDesc.classList.add('dbDescription');
    newUpgradeDesc.textContent = 'Your Local Storage can be upgraded to an IndexedDB. This will give you more memory and activate some additional features.';
    newUpgradeInfo.appendChild(newUpgradeDesc);

    let newUpgradeActions = document.createElement('div');
    newUpgradeActions.classList.add('dbActions');

    let newUpgradeCheck = document.createElement('i');
    newUpgradeCheck.classList.add('fa-solid');
    newUpgradeCheck.classList.add('fa-check');    
    newUpgradeCheck.classList.add('dbActionIcon');
    newUpgradeCheck.title = 'Upgrade the data storage inside this browser to IndexedDB';
    newUpgradeActions.appendChild(newUpgradeCheck);

    let newUpgradeQuest = document.createElement('i');
    newUpgradeQuest.classList.add('fa-solid');
    newUpgradeQuest.classList.add('fa-circle-question');    
    newUpgradeQuest.classList.add('dbActionIcon');
    newUpgradeQuest.title = 'Detailed information on storage inside the browser';
    newUpgradeActions.appendChild(newUpgradeQuest);

    newOptionUpgrade.appendChild(newUpgradeActions);


    let newOptionAddServer = document.createElement('div');
    newOptionAddServer.classList.add('dbItem');
    newOptionsAvailable.appendChild(newOptionAddServer);

    let newAddInfo = document.createElement('div');
    newAddInfo.classList.add('dbInfo');
    newOptionAddServer.appendChild(newAddInfo);

    let newAddIcon = document.createElement('i');
    newAddIcon.classList.add('fa-solid');
    newAddIcon.classList.add('fa-server');
    newAddIcon.classList.add('dbItemIcon');
    newAddInfo.appendChild(newAddIcon);

    let newAddName = document.createElement('div');
    newAddName.classList.add('dbOptionName');
    newAddName.textContent = 'Add a new Server';
    newAddInfo.appendChild(newAddName);

    let newAddDesc = document.createElement('div');
    newAddDesc.classList.add('dbDescription');
    newAddDesc.textContent = 'Your can add a new local or remote bibliography server for data storage. This can be anonymous or with user credentials.';
    newAddInfo.appendChild(newAddDesc);

    let newAddActions = document.createElement('div');
    newAddActions.classList.add('dbActions');

    let newAddPlus = document.createElement('i');
    newAddPlus.classList.add('fa-solid');
    newAddPlus.classList.add('fa-square-plus');    
    newAddPlus.classList.add('dbActionIcon');
    newAddPlus.title = 'Add a new Server';
    newAddActions.appendChild(newAddPlus);

    let newAddQuest = document.createElement('i');
    newAddQuest.classList.add('fa-solid');
    newAddQuest.classList.add('fa-circle-question');    
    newAddQuest.classList.add('dbActionIcon');
    newAddQuest.title = 'Detailed information on bibliography servers';
    newAddActions.appendChild(newAddQuest);

    newOptionAddServer.appendChild(newAddActions);

    document.querySelector('body').appendChild(newDiv);
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

function showLastAdditions() {
    let latestAdds = document.querySelector('#latestAdditionsList');
    latestAdds.innerHTML = '';

    let latest5 = Array.from(books).reverse().slice(0, 5);
    latest5.forEach((book) => {
        let newDiv = document.createElement('div');
        newDiv.classList.add('lastAdditionsItem');
        newDiv.textContent = book[1].author_surname + ', ' + book[1].author_prename + '. ' + book[1].year + '. ' + book[1].title + '. ' + book[1].place + ': ' + book[1].publisher_name + '.';
        latestAdds.appendChild(newDiv);
    })
}

function showLastNotes() {
    let lastNotes = Array.from(notes.values()).sort((a, b) => a.date_added - b.date_added).reverse().slice(0, 5);
    let ln = document.querySelector('#latestNotesList');
    ln.innerHTML = '';
    lastNotes.forEach((note) => {
        let newDiv = document.createElement('div');
        newDiv.classList.add('latestNotesItem');
        newDiv.innerHTML = note.note_text;
        ln.appendChild(newDiv);        
    });
}

function showLastQuotes() {
    let lastQuotes = Array.from(quotes.values()).sort((a, b) => a.date_added - b.date_added).reverse().slice(0, 5);
    let lqDiv = document.querySelector('#latestQuotesList');
    lqDiv.innerHTML = '';

    lastQuotes.forEach((quote) => {
        let newDiv = document.createElement('div');
        newDiv.classList.add('latestQuotesItem');
        newDiv.innerHTML = '&laquo; ' + quote.quote_text + ' &raquo;';
        lqDiv.appendChild(newDiv);
    });
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

function showNewTagInput(e) {

}

function showNewTitleForm() {
    let formDis = document.querySelector('#newBookView');
    document.querySelector('#detailView').style.display = 'none';
    document.querySelector('#authorView').style.display = 'none';
    document.querySelector('#latestAdditions').style.display = 'none';
    formDis.style.display = 'block flex';
}

function showQuoteActions(e) {
    let newDiv = document.createElement('div');
    newDiv.classList.add('quoteActions');
    let quoteId = e.currentTarget.id.substring(6);
    let quote = quotes.get(quoteId);

    let newClipboard = document.createElement('i');
    newClipboard.classList.add('fa-solid', 'fa-clipboard', 'quoteAction');
    newClipboard.addEventListener('click', quote.copyToClipboard);
    newDiv.appendChild(newClipboard);
    
    let newEdit = document.createElement('i');
    newEdit.classList.add('fa-solid', 'fa-pen', 'quoteAction');
    newEdit.addEventListener('click', quote.showEditModal);
    newDiv.appendChild(newEdit);

    let newTrash = document.createElement('i');
    newTrash.classList.add('fa-solid', 'fa-trash-can', 'quoteAction');
    newTrash.addEventListener('click', quote.delete);
    newDiv.appendChild(newTrash);

    e.currentTarget.appendChild(newDiv);
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

function showSettingsTab(e) {
    let selectedSec = document.querySelector('.settingsSectionsItemSelected');
    selectedSec.classList.remove('settingsSectionsItemSelected');
    e.target.classList.add('settingsSectionsItemSelected');
    let secTabs = document.querySelectorAll('.settingsSectionDiv');
    secTabs.forEach((node) => { node.classList.remove('settingsSectionDivSelected'); node.style.display = 'none'; });
    switch (e.target.id) {
        case 'sectionsList-display':
            document.querySelector('#settingsListDisplay').style.display = 'block';
            break;
        case 'sectionsList-formats':
            document.querySelector('#settingsListFormats').style.display = 'block';
            break;
        case 'sectionsList-export':
            document.querySelector('#settingsListExport').style.display = 'block';
            break;
        case 'sectionsList-storage':
            document.querySelector('#settingsListStorage').style.display = 'block';
            break;
        case 'sectionsList-management':
            document.querySelector('#settingsListManagement').style.display = 'block';
            break;
    }
}

function showStockSettings(e) {
    console.log('HI! from showStockSettings!');
    if (!document.querySelector('#stockPaneSettingsDialog')) {
        let coords = e.target.getBoundingClientRect();
        console.log(coords);
        let newDiv = document.createElement('div');
        newDiv.classList.add('paneSettingsDialog');
        newDiv.id = 'stockPaneSettingsDialog';
        
        if (coords.top > 150) {
            newDiv.style.top = coords.top - 100 + 'px';
        } else {
            newDiv.style.top = coords.top + 5 + 'px';
        }
        
        newDiv.style.left = coords.left - 235 + 'px';

        let newHeader = document.createElement('h3');
        newHeader.textContent = 'Stock Pane Settings';
        newHeader.classList.add('paneSettingsH3');
        newDiv.appendChild(newHeader);

        let tableSettingsHeader = document.createElement('h4');
        tableSettingsHeader.textContent = 'Table View';
        tableSettingsHeader.classList.add('paneSettingsH4');
        newDiv.appendChild(tableSettingsHeader);

        let tableCols = ['subtitle', 'year', 'author', 'place', 'publisher', 'signatures', 'tags', 'notes', 'quotes'];

        tableCols.forEach((col) => {
            let newitemDiv = document.createElement('div');
            newitemDiv.classList.add('paneSettingsItem');
            
            let newCheck = document.createElement('input');
            newCheck.type = 'checkbox';
            newCheck.id = 'stockPaneTable-' + col;
            newitemDiv.appendChild(newCheck);

            let newLabel = document.createElement('label');
            newLabel.for = 'stockPaneTable-' + col;
            newLabel.textContent = 'Show ' + col + ' column';
            newLabel.classList.add('labelInlineRight');
            newitemDiv.appendChild(newLabel);
            newDiv.appendChild(newitemDiv);
        });

        document.querySelector('body').appendChild(newDiv);
    } else {
        document.querySelector('#stockPaneSettingsDialog').remove();
    }
    
}

function startBookSlideshow(e) {
    if (transientSelection.size > 0) {

    } else {
        showMessage('The book slideshow could not be started, because there were no titles selected!');
    }
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

function toggleConfigurator() {
    let configurator = document.querySelector('#formatConfigurator');
    configurator.style.visibility === 'visible' ? configurator.style.visibility = 'hidden' : configurator.style.visibility = 'visible';
}

function toggleFullScreenSaver() {
    /* requestFull(); */

    let num = Math.round(Math.random() * (quotes.size - 1));
    let cites = Array.from(quotes);

    if (document.querySelector('.screensaver')) {
        document.querySelector('.screensaver').remove();
    }

    let screensaverDiv = document.createElement('div');
    screensaverDiv.classList.add('screensaver');
    
    let letterContainer = document.createElement('div');
    letterContainer.classList.add('screensaver-lettercontainer');

    let text = cites[num][1].quote_text;
    
    letterContainer.appendChild(createScreensaverQuote(text));

    screensaverDiv.appendChild(letterContainer);

    document.querySelector('body').appendChild(screensaverDiv);
    /* document.querySelector('body').addEventListener('keydown', (e) => {
        if (e.code === 'Space') { toggleFullScreenSaver(); }
    }); */

    document.querySelector('body').removeEventListener('mousemove', resetScreenSaverInterval);
    document.querySelector('body').addEventListener('mousemove', exitFullscreenSaver);
    /*
    if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen();
    } else if (document.exitFullscreen) {
        document.exitFullscreen();
    }
    */
    
    clearInterval(screensaverInterval);
    screensaverInterval = '';
    screensaverInterval = setInterval(toggleFullScreenSaver, Number.parseInt(60000 * settings.screensaverChangeInterval));
}

function toggleMainInterfacePosition(e) {
    let mi = document.querySelector('#mainInterface');
    let coords = mi.getBoundingClientRect();
    console.log(coords);
}

function togglePane(e) {
    let targetNode = document.querySelector('#' + e.target.id.substring(12));
    targetNode.style.visibility === 'visible' ? targetNode.style.visibility = 'hidden' : targetNode.style.visibility = 'visible';
    (targetNode.style.opacity === '0' || targetNode.style.opacity === '') ? targetNode.style.opacity = '1' : targetNode.style.opacity = '0';
    if (settings.useAltPubIcon) {
        setPubIcon();
    }
}

function toggleSettings() {
    let settingsDiv = document.querySelector('#settings');
    settingsDiv.style.visibility === 'visible' ? settingsDiv.style.visibility = 'hidden' : settingsDiv.style.visibility = 'visible';
    document.querySelector('#numbersPurge').innerHTML = 'Clicking the purge button will delete <em>' + books.size + ' books</em>, <em>' + authors.size + ' authors</em>, and <em>' + publishers.size + ' publishers</em>!!!';
    document.querySelector('#localDataList-books').textContent = books.size.toString().padStart(3, '0');
    document.querySelector('#localDataList-authors').textContent = authors.size.toString().padStart(3, '0');
    document.querySelector('#localDataList-publishers').textContent = publishers.size.toString().padStart(3, '0');
    document.querySelector('#localDataList-quotes').textContent = quotes.size.toString().padStart(3, '0');
    document.querySelector('#localDataList-notes').textContent = notes.size.toString().padStart(3, '0');
    document.querySelector('#localDataList-tags').textContent = tags.size.toString().padStart(3, '0');
    document.querySelector('#localDataList-collections').textContent = collections.size.toString().padStart(3, '0');
    document.querySelector('#localDataList-signatures').textContent = signatures.size.toString().padStart(3, '0');

    if (settings.useAltPubIcon) {
        document.querySelector('#altPubIcons').style.display = 'block flex';
    }
}

function uncheckAllAltIcons() {
    let altChecks = document.querySelectorAll('.altPubIconCheck');
    altChecks.forEach((check) => check.checked = false );
}

function updateAuthorsPane() {
    authorsPane.innerHTML = '';
    setAuthorsOrderIcon();
    let sortedAuthors;

    switch (settings.sortOrderAuthors) {
        case 'alpha':
            sortedAuthors = Array.from(authors).sort((a, b) => a[0].localeCompare(b[0]));
            break;
        case 'alpha-reverse':
            sortedAuthors = Array.from(authors).sort((a, b) => a[0].localeCompare(b[0])).reverse();
            break;
        case 'added':
            sortedAuthors = Array.from(authors);
            break;
        case 'added-reverse':
            sortedAuthors = Array.from(authors).reverse();
            break;
    }

    sortedAuthors.forEach(author => {
        let newDiv = document.createElement('div');
        newDiv.classList.add('authorsPaneItem');
        newDiv.addEventListener('click', author[1].showDetails);
        newDiv.textContent = author[0];
        authorsPane.appendChild(newDiv);
    });
}

function updateDisplay() {
    updateAuthorsPane();
    updateStockPane();
    updateExportPane();
}

function updateExportPane() {
    let exportList = document.querySelector('#export');
    exportList.innerHTML = '';
    setExportOrderIcon();
    let sortedSelection;

    switch (settings.sortOrderExport) {
        case 'alpha':
            sortedSelection = Array.from(transientSelection).sort((a, b) => {
                let titleA = books.get(a);
                let titleB = books.get(b);
                let authorA = titleA.author_surname + ', ' + titleA.author_prename;
                let authorB = titleB.author_surname + ', ' + titleB.author_prename;
                return authorA.localeCompare(authorB);
            });
            break;
        case 'alpha-reverse':
            sortedSelection = Array.from(transientSelection).sort((a, b) => {
                let titleA = books.get(a);
                let titleB = books.get(b);
                let authorA = titleA.author_surname + ', ' + titleA.author_prename;
                let authorB = titleB.author_surname + ', ' + titleB.author_prename;
                return authorA.localeCompare(authorB);
            }).reverse();
            break;
        case 'added':
            sortedSelection = Array.from(transientSelection);
            break;
        case 'added-reverse':
            sortedSelection = Array.from(transientSelection).reverse();
            break;
    }

    sortedSelection.forEach((item) => {
        let book = books.get(item);
        let newDiv = document.createElement('div');
        newDiv.classList.add('exportListItem');
        newDiv.innerHTML = book.author_surname + ', ' + book.author_prename + '. ' + book.year + '. ' + book.title + '. ' + book.place + ': ' + book.publisher_name + '.';
        exportList.appendChild(newDiv);
    });
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
