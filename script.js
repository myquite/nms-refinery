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
        results:        document.getElementById('results-container'),
        welcome:        document.getElementById('welcome-message'),
        inputResults:   document.getElementById('input-results'),
        outputResults:  document.getElementById('output-results'),
    };

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
        recipes.forEach(recipe => {
            const tr = el('tr');

            const inputsTd = el('td');
            inputsTd.appendChild(renderInputsCell(recipe.inputs));
            tr.appendChild(inputsTd);

            tr.appendChild(renderOutputCell(recipe, opts));

            tbody.appendChild(tr);
        });
    }

    // ---------- Top-level render ----------
    function render(result) {
        els.welcome.classList.add('hidden');
        els.results.classList.remove('hidden');

        els.inputResults.replaceChildren();
        els.outputResults.replaceChildren();

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
    function runSearch(query) {
        const result = search(query);

        // FIX #3 (UX quick win): empty input used to silently do nothing.
        // Give the user feedback instead.
        if (result === null) {
            els.searchInput.focus();
            els.searchInput.placeholder = '!! NO INPUT DETECTED — ENTER ELEMENT NAME ...';
            return;
        }
        render(result);
    }

    function searchFor(name) {
        els.searchInput.value = name;
        runSearch(name);
    }

    // ---------- Event wiring ----------
    els.searchBtn.addEventListener('click', () => runSearch(els.searchInput.value));

    els.searchInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') runSearch(els.searchInput.value);
    });

    // One delegated listener handles every ingredient link, present or future.
    // No inline handlers, no name-escaping concerns.
    els.results.addEventListener('click', (e) => {
        const link = e.target.closest('.ingredient-link');
        if (link && link.dataset.ingredient) {
            searchFor(link.dataset.ingredient);
        }
    });
})();
