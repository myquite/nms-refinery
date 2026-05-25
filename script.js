/* ============================================================
   REFINER MATRIX — Search & Render Logic
   ------------------------------------------------------------
   Depends on: REFINER_DB (loaded from data.js)

   Architecture:
     - search(query)           pure: returns { asInput, asOutput }
     - render(state)           writes DOM
     - element creation uses createElement (no string HTML),
       which fixes the XSS/quote-breakage in the original onclick.
   ============================================================ */

(function () {
    'use strict';

    // ---------- DOM refs (cached once) ----------
    const els = {
        searchInput:    document.getElementById('search-input'),
        searchBtn:      document.getElementById('search-btn'),
        holoPanels:     document.querySelector('.holo-panels'),
        welcome:        document.getElementById('welcome-message'),
        errorMsg:       document.getElementById('error-message'),
        errorQuery:     document.querySelector('.error-query'),
        inputResults:   document.getElementById('input-results'),
        outputResults:  document.getElementById('output-results'),
        autocomplete:   document.getElementById('autocomplete-list'),
        ghostText:      document.getElementById('ghost-text'),
    };

    // ---------- Autocomplete ----------
    // Build sorted list of every unique ingredient/output name in the DB.
    const allNames = [...new Set(
        REFINER_DB.flatMap(r => [r.output, ...r.inputs.map(i => i.name)])
    )].sort();

    let acIndex = -1;       // currently highlighted suggestion
    let ghostMatch = null;   // current ghost-text completion target
    let typedQuery = '';     // what the user actually typed (preserved across arrow keys)

    function setGhost(name) {
        if (!typedQuery || !name) {
            els.ghostText.textContent = '';
            ghostMatch = null;
            return;
        }
        // Show typed portion (invisible, same color as input) + remaining portion (faded)
        els.ghostText.textContent = typedQuery + name.slice(typedQuery.length);
        ghostMatch = name;
    }

    function showSuggestions(query) {
        const q = query.trim().toLowerCase();
        typedQuery = query.trim();
        els.autocomplete.replaceChildren();
        acIndex = -1;

        if (!q) {
            els.autocomplete.classList.add('hidden');
            setGhost(null);
            return;
        }

        const matches = allNames.filter(n => n.toLowerCase().includes(q));
        if (matches.length === 0) {
            els.autocomplete.classList.add('hidden');
            setGhost(null);
            return;
        }

        matches.forEach(name => {
            const li = el('li', 'ac-item', name);
            li.dataset.value = name;
            els.autocomplete.appendChild(li);
        });
        els.autocomplete.classList.remove('hidden');

        // Auto-highlight the best prefix match in the dropdown
        const prefixIdx = matches.findIndex(n => n.toLowerCase().startsWith(q));
        if (prefixIdx >= 0) {
            highlightItem(prefixIdx);
        } else {
            setGhost(null);
        }
    }

    function pickSuggestion(name) {
        els.autocomplete.classList.add('hidden');
        els.ghostText.textContent = '';
        ghostMatch = null;
        typedQuery = '';
        searchFor(name);
    }

    function highlightItem(idx) {
        const items = els.autocomplete.children;
        if (!items.length) return;
        acIndex = ((idx % items.length) + items.length) % items.length;
        Array.from(items).forEach((li, i) =>
            li.classList.toggle('ac-active', i === acIndex));
        items[acIndex].scrollIntoView({ block: 'nearest' });

        // Update ghost text to match the highlighted item
        setGhost(items[acIndex].dataset.value);
    }

    // ---------- Search ----------
    // Pure function: takes a query, returns matching recipes split by role.
    //
    // FIX #2 (latent bug): the original used substring matching for everything,
    // so clicking "Carbon" also surfaced "Condensed Carbon" recipes in the same
    // bucket — conflating two distinct elements. We now do exact (case-insensitive)
    // match by default, and fall back to substring only when the typed query
    // doesn't exact-match anything (so partial typing like "ferr" still works).
    function search(rawQuery) {
        const query = rawQuery.trim().toLowerCase();
        if (!query) return null;

        const exactInput  = REFINER_DB.filter(r => r.inputs.some(i => i.name.toLowerCase() === query));
        const exactOutput = REFINER_DB.filter(r => r.output.toLowerCase() === query);

        if (exactInput.length || exactOutput.length) {
            return { asInput: exactInput, asOutput: exactOutput, mode: 'exact' };
        }

        // Fallback: partial typing
        const fuzzyInput  = REFINER_DB.filter(r => r.inputs.some(i => i.name.toLowerCase().includes(query)));
        const fuzzyOutput = REFINER_DB.filter(r => r.output.toLowerCase().includes(query));
        return { asInput: fuzzyInput, asOutput: fuzzyOutput, mode: 'fuzzy' };
    }

    // ---------- DOM helpers ----------
    // FIX #1 (latent bug): the original built HTML via string concatenation and
    // embedded ingredient names into an inline onclick="quickSearch('...')".
    // Any name containing an apostrophe (e.g. "Pilot's Glass") would break the
    // attribute and silently corrupt the page. Using createElement + event
    // delegation removes the injection surface entirely.

    function el(tag, className, text) {
        const node = document.createElement(tag);
        if (className) node.className = className;
        if (text != null) node.textContent = text;
        return node;
    }

    // Build the "3x Carbon + 2x Oxygen" cell content as real DOM nodes.
    function renderInputsCell(inputs) {
        const frag = document.createDocumentFragment();
        inputs.forEach((ing, idx) => {
            frag.appendChild(el('span', 'qty', `${ing.qty}x`));
            frag.appendChild(document.createTextNode(' '));

            const link = el('span', 'ingredient-link', ing.name);
            link.dataset.ingredient = ing.name;     // delegation hook
            frag.appendChild(link);

            if (idx < inputs.length - 1) {
                frag.appendChild(document.createTextNode(' + '));
            }
        });
        return frag;
    }

    function renderOutputCell(recipe, { linkOutput }) {
        const td = el('td', 'output-cell');
        td.appendChild(el('span', 'qty', `${recipe.outQty}x`));
        td.appendChild(document.createTextNode(' '));

        if (linkOutput) {
            const link = el('span', 'ingredient-link', recipe.output);
            link.dataset.ingredient = recipe.output;
            td.appendChild(link);
        } else {
            td.appendChild(document.createTextNode(recipe.output));
        }
        return td;
    }

    function renderEmptyRow(tbody, message) {
        const tr = el('tr');
        const td = el('td', 'no-results', message);
        td.colSpan = 2;
        tr.appendChild(td);
        tbody.appendChild(tr);
    }

    function renderRecipeRows(tbody, recipes, opts) {
        recipes.forEach((recipe, i) => {
            const tr = el('tr');
            tr.classList.add('stream-in');
            tr.style.animationDelay = `${1.4 + i * 0.04}s`;

            const inputsTd = el('td');
            inputsTd.appendChild(renderInputsCell(recipe.inputs));
            tr.appendChild(inputsTd);

            tr.appendChild(renderOutputCell(recipe, opts));

            tbody.appendChild(tr);
        });
    }

    // ---------- Top-level render ----------
    function triggerScreenAnimations() {
        const screens = els.holoPanels.querySelectorAll('.holo-screen');
        screens.forEach(screen => {
            // Reset animation
            screen.classList.remove('materializing');
            void screen.offsetWidth; // force reflow
            screen.classList.add('materializing');

            // Inject scan bar
            const bezel = screen.querySelector('.screen-bezel');
            const oldBar = bezel.querySelector('.scan-bar');
            if (oldBar) oldBar.remove();
            const bar = document.createElement('div');
            bar.className = 'scan-bar';
            bezel.appendChild(bar);
            // Clean up after animation
            bar.addEventListener('animationend', () => bar.remove());
        });
    }

    function render(result) {
        els.welcome.classList.add('hidden');
        els.errorMsg.classList.add('hidden');
        els.holoPanels.classList.remove('hidden');

        els.inputResults.replaceChildren();
        els.outputResults.replaceChildren();

        triggerScreenAnimations();

        if (result.asInput.length === 0) {
            renderEmptyRow(els.inputResults, 'No synthesis blueprints utilize this element.');
        } else {
            // In the "used as input" panel, the output column is clickable
            // (so you can pivot to "what makes that?").
            renderRecipeRows(els.inputResults, result.asInput, { linkOutput: true });
        }

        if (result.asOutput.length === 0) {
            renderEmptyRow(els.outputResults, 'No processing paths generate this element.');
        } else {
            // In the "produced as output" panel, the output is the thing
            // you just searched for, so leave it as plain text.
            renderRecipeRows(els.outputResults, result.asOutput, { linkOutput: false });
        }
    }

    // ---------- Controller ----------
    function showError(query) {
        els.welcome.classList.add('hidden');
        els.holoPanels.classList.add('hidden');
        els.errorMsg.classList.add('hidden');

        // Re-trigger animation
        void els.errorMsg.offsetWidth;
        els.errorMsg.classList.remove('hidden');
        els.errorQuery.textContent = '> ' + query;
    }

    function blurOnMobile() {
        if ('ontouchstart' in window) els.searchInput.blur();
    }

    function runSearch(query) {
        const result = search(query);

        if (result === null) {
            els.searchInput.focus();
            els.searchInput.placeholder = '!! NO INPUT DETECTED — ENTER ELEMENT NAME ...';
            return;
        }

        // No matches at all — show error state
        if (result.asInput.length === 0 && result.asOutput.length === 0) {
            showError(query);
            blurOnMobile();
            return;
        }

        render(result);
        blurOnMobile();
    }

    function searchFor(name) {
        els.searchInput.value = name;
        runSearch(name);
    }

    // ---------- Event wiring ----------
    els.searchBtn.addEventListener('click', () => {
        els.autocomplete.classList.add('hidden');
        els.ghostText.textContent = '';
        ghostMatch = null;
        runSearch(els.searchInput.value);
    });

    els.searchInput.addEventListener('input', () => showSuggestions(els.searchInput.value));

    els.searchInput.addEventListener('keydown', (e) => {
        const items = els.autocomplete.children;
        if (e.key === 'Tab' && ghostMatch) {
            e.preventDefault();
            els.searchInput.value = ghostMatch;
            typedQuery = ghostMatch;
            els.ghostText.textContent = '';
            ghostMatch = null;
            showSuggestions(els.searchInput.value);
            return;
        } else if (e.key === 'ArrowDown' && items.length) {
            e.preventDefault();
            highlightItem(acIndex + 1);
        } else if (e.key === 'ArrowUp' && items.length) {
            e.preventDefault();
            highlightItem(acIndex - 1);
        } else if (e.key === 'Enter') {
            if (acIndex >= 0 && items[acIndex]) {
                e.preventDefault();
                pickSuggestion(items[acIndex].dataset.value);
            } else {
                els.autocomplete.classList.add('hidden');
                runSearch(els.searchInput.value);
            }
        } else if (e.key === 'Escape') {
            els.autocomplete.classList.add('hidden');
        }
    });

    els.autocomplete.addEventListener('click', (e) => {
        const item = e.target.closest('.ac-item');
        if (item) pickSuggestion(item.dataset.value);
    });

    // Close autocomplete when clicking outside
    document.addEventListener('click', (e) => {
        if (!els.searchInput.contains(e.target) && !els.autocomplete.contains(e.target)) {
            els.autocomplete.classList.add('hidden');
        }
    });

    // One delegated listener handles every ingredient link, present or future.
    // No inline handlers, no name-escaping concerns.
    els.holoPanels.addEventListener('click', (e) => {
        const link = e.target.closest('.ingredient-link');
        if (link && link.dataset.ingredient) {
            searchFor(link.dataset.ingredient);
        }
    });
})();
