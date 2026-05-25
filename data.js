/* ============================================================
   REFINER DATABASE
   ------------------------------------------------------------
   Each entry is a refining "recipe":
     output:  the resulting element/material
     outQty:  units produced per cycle
     inputs:  [{ name, qty }, ...]  ingredients consumed

   Add new recipes by appending objects to REFINER_DB below.
   ============================================================ */

const REFINER_DB = [
    // --- Nanite synthesis paths ---
    { output: "Nanite Cluster",     outQty: 15,  inputs: [{ name: "Salvaged Data", qty: 1 }] },
    { output: "Nanite Cluster",     outQty: 50,  inputs: [{ name: "Hadal Core",    qty: 1 }] },
    { output: "Nanite Cluster",     outQty: 50,  inputs: [{ name: "Larval Core",   qty: 1 }] },
    { output: "Nanite Cluster",     outQty: 1,   inputs: [{ name: "Platinum",      qty: 35 }] },
    { output: "Nanite Cluster",     outQty: 1,   inputs: [{ name: "Pugneum",       qty: 25 }] },

    // --- Curiosities & one-offs ---
    { output: "Gold",               outQty: 100, inputs: [{ name: "Living Pearl",   qty: 1 }] },
    { output: "Gold",               outQty: 1,   inputs: [{ name: "Hexite",         qty: 1 }] },
    { output: "Living Slime",       outQty: 50,  inputs: [{ name: "Hypnotic Eye",   qty: 1 }] },
    { output: "Sodium Nitrate",     outQty: 50,  inputs: [{ name: "Crystal Sulphide", qty: 1 }] },
    { output: "Condensed Carbon",   outQty: 1,   inputs: [{ name: "Cyto-Phosphate", qty: 1 }] },
    { output: "Glass",              outQty: 1,   inputs: [{ name: "Frost Crystal",  qty: 40 }] },
    { output: "Pyrite",             outQty: 1,   inputs: [{ name: "Gold",           qty: 1 }] },
    { output: "Faecium",            outQty: 1,   inputs: [{ name: "Mordite",        qty: 3 }] },
    { output: "Carbon",             outQty: 1,   inputs: [{ name: "Oxygen",         qty: 1 }] },

    // --- Di-hydrogen <-> Jelly ---
    { output: "Di-hydrogen Jelly",  outQty: 1,   inputs: [{ name: "Di-hydrogen",       qty: 30 }] },
    { output: "Di-hydrogen",        outQty: 40,  inputs: [{ name: "Di-hydrogen Jelly", qty: 1 }] },

    // --- Cobalt <-> Ionised Cobalt ---
    { output: "Ionised Cobalt",     outQty: 1,   inputs: [{ name: "Cobalt",         qty: 2 }] },
    { output: "Cobalt",             outQty: 2,   inputs: [{ name: "Ionised Cobalt", qty: 1 }] },

    // --- Carbon <-> Condensed Carbon ---
    { output: "Carbon",             outQty: 2,   inputs: [{ name: "Condensed Carbon", qty: 1 }] },
    { output: "Condensed Carbon",   outQty: 1,   inputs: [{ name: "Carbon",           qty: 2 }] },

    // --- Sodium <-> Sodium Nitrate ---
    { output: "Sodium Nitrate",     outQty: 1,   inputs: [{ name: "Sodium",         qty: 2 }] },
    { output: "Sodium",             outQty: 2,   inputs: [{ name: "Sodium Nitrate", qty: 1 }] },

    // --- Ferrite chain ---
    { output: "Pure Ferrite",       outQty: 1,   inputs: [{ name: "Ferrite Dust",       qty: 1 }] },
    { output: "Magnetised Ferrite", outQty: 1,   inputs: [{ name: "Pure Ferrite",       qty: 2 }] },
    { output: "Pure Ferrite",       outQty: 2,   inputs: [{ name: "Magnetised Ferrite", qty: 1 }] },

    // --- Chromatic Metal sources ---
    { output: "Chromatic Metal",    outQty: 1,   inputs: [{ name: "Cadmium", qty: 2 }] },
    { output: "Chromatic Metal",    outQty: 4,   inputs: [{ name: "Indium",  qty: 2 }] },
    { output: "Chromatic Metal",    outQty: 3,   inputs: [{ name: "Emeril",  qty: 2 }] },
    { output: "Chromatic Metal",    outQty: 1,   inputs: [{ name: "Copper",  qty: 2 }] },

    // --- Chlorine <-> Salt ---
    { output: "Chlorine",           outQty: 1,   inputs: [{ name: "Salt",     qty: 2 }] },
    { output: "Salt",               outQty: 2,   inputs: [{ name: "Chlorine", qty: 1 }] },

    // --- Multi-input recipes ---
    { output: "Deuterium",          outQty: 1,   inputs: [{ name: "Di-hydrogen", qty: 1 },  { name: "Tritium", qty: 1 }] },
    { output: "Condensed Carbon",   outQty: 5,   inputs: [{ name: "Carbon",      qty: 2 },  { name: "Oxygen",  qty: 2 }] },
    { output: "Ionised Cobalt",     outQty: 5,   inputs: [{ name: "Cobalt",      qty: 2 },  { name: "Oxygen",  qty: 2 }] },
    { output: "Warp Cell",          outQty: 1,   inputs: [{ name: "Condensed Carbon", qty: 25 }, { name: "Sodium",      qty: 10 }, { name: "Chromatic Metal", qty: 250 }] },
    { output: "Starship Launch Fuel", outQty: 1, inputs: [{ name: "Di-hydrogen",      qty: 10 }, { name: "Ferrite Dust", qty: 20 }, { name: "Sodium Nitrate",  qty: 5 }] }
];
