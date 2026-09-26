# HSC Physics Solver — Modules 5–8

A locally-run website that solves calculation questions from **NSW HSC Physics (Stage 6 Syllabus, 2017)**, Year 12 Modules 5–8, and shows full HSC-style working.

- **Deterministic engine:** every number is calculated by code from a formula database (163 relationships, each with explicit rearrangements for every variable). No AI and no paid API are needed.
- **Smart Solver:** paste a worded question. It finds the module and topic, extracts the quantities and units, matches them to variables, works out what is being asked, chains the formulas together, and reports anything missing instead of guessing.
- **Full HSC working:** Given → unit conversions → formula → rearrangement → substitution → answer, with a unit/dimension check, significant figures, equivalent units and a separate direction section. A **Quick** mode is also available.

## Running it

Requires Node.js 18 or later.

```bash
npm install
npm run dev        # opens http://localhost:5173
```

Other scripts:

```bash
npm test           # 827 automated tests (vitest)
npm run build      # type-check + production build into dist/
npm run preview    # serve the production build
```

Everything works offline, with two exceptions:
- **Screenshot OCR** (tesseract.js) downloads its English language data the first time you use it.
- The optional **AI diagram reader** needs your own Anthropic API key and an internet connection.

## What's in the app

| Area | Contents |
|---|---|
| **Smart Solver** | Free-text questions, multi-part questions (“calculate X and Y”), “show that” checks, particles (proton/electron/α/neutron/positron), Earth data from the data sheet, question-supplied constants (e.g. `g = 10 m/s²`) override the data sheet, plus screenshot OCR and an optional AI diagram reader |
| **Topic calculators** | 56 linked “calculation types”; any variable can be the unknown. “Find everything” lists every quantity that follows from the data |
| **Tools & graphs** | Projectile analyser and trajectory; 2D force resultant; beam/moments equilibrium; direction engine (right-hand palm rule, F = qv×B, F = Il×B, F = qE, Lenz's law, parallel wires); black-body curves; γ against v/c; g against r; orbit speed/period against altitude; decay curve; E against r; charged-particle deflection path; F꜀ against r and v; K_max against f with a least-squares fit to find h and φ from data; EM spectrum classifier; hydrogen energy-level diagram; grating orders (exact vs small-angle); binding energy; reaction Q-value with A/Z checks; decay-equation balancer; quark composition and conservation-law checker |
| **Reference** | Searchable formula library (variables, SI units, rearrangements, assumptions, restrictions, when to use / not use, derivations, examples, source); unit converter; constants (NESA data sheet values, clearly separated from flagged reference values); smart formula detection (`symbol = value` lines); an auto-generated **HSC coverage matrix**; sources and method |

Settings in the top bar: significant figures (Auto / 2 / 3 / 4 / full precision), Quick or Full HSC working, and light or dark theme. The layout is tuned for a 14″ 1920×1200 laptop and also works on tablets and phones.

## Calculations supported

**Module 5 — Advanced Mechanics:**
- SUVAT and component projectiles: horizontal, angled, cliff and target-height launches; time of flight, maximum height, range, impact speed and angle, launch angle(s) for a range.
- Uniform circular motion (a꜀, F꜀, v = 2πr/T, ω, f), banked tracks and conical pendulums, vertical circles (top/bottom forces, minimum speed).
- Universal gravitation, g = GM/r², weight, altitude → radius, U = −GMm/r, ΔU between radii, escape velocity.
- Orbital speed, Kepler's third law (absolute and two-orbit ratio), geostationary orbits, K, U and E = −GMm/2r, energy to change orbit.
- Vector components and resultants, inclines, F = ma, work, kinetic energy, ΔU = mgΔh, power.
- Torque (τ = rF sin θ, r⊥) and moment equilibrium.

**Module 6 — Electromagnetism:**
- Electric fields: E = V/d, F = qE, a = qE/m, W = qV = qEd, speed from an accelerating voltage, deflection between plates, Coulomb's law.
- Magnetic fields: F = qvB sin θ, r = mv/qB, period, velocity selector, mass spectrometer chains.
- Motor effect: F = lIB sin θ, F/l = μ₀I₁I₂/2πr, B around a wire and inside a solenoid, torque on a coil (τ = nIAB sin θ, with angle-to-plane conversion), DC motor back emf.
- Induction: flux, Faraday's law (as magnitude + Lenz direction), moving rods (ε = Blv), generator average emf (peak emf as an extension).
- Transformers: ideal, efficiency, transmission-line losses.

**Module 7 — The Nature of Light:**
- v = fλ, c = fλ, refraction (n = c/v, Snell's law, critical angle, λ in a medium).
- Double slit and gratings (d sin θ = mλ, dark fringes, y = L tan θ, small-angle spacing with a validity check, lines/mm → d, highest order), Malus' law including unpolarised light.
- Wien's law.
- Photon energy, photon rate and photon momentum.
- Photoelectric effect (K_max, φ, f₀, λ₀, stopping voltage, maximum electron speed).
- Special relativity: γ, time dilation, length contraction (proper vs measured identified explicitly), relativistic momentum, E = mc², journey distances and times in each frame.

**Module 8 — From the Universe to the Atom:**
- Stellar temperature (Wien) and mass converted per second from luminosity.
- Rydberg equation (emission and absorption) and energy-level transitions.
- Thomson's q/m, Millikan's oil drop and number of electrons, Chadwick collisions.
- de Broglie wavelength (from v, p, K or an accelerating voltage), Bohr quantisation and standing waves.
- Mass defect, binding energy (Δmc² and 931.5 MeV/u), binding energy per nucleon, reaction energy, and fissions per second for a given power.
- Decay law, half-lives, decay constant and activity; carbon dating.
- Standard Model: quark charges and conservation checks.

Extension relationships that are **not** required HSC content (Stefan–Boltzmann, Hubble's law and redshift, relativistic kinetic energy, peak generator emf) are always labelled “Extension”.

## Architecture

```
src/engine/   dimensions, quantities, units (prefixes, sci-notation), expression parser
              (evaluate + LaTeX + dimensional analysis), sig figs, chain solver, direction engine
src/data/     NESA constants, formula database (m5–m8), scenarios (linked calculation types),
              periodic table, reference nuclide masses
src/nlp/      question normalisation + quantity extraction, smart solver, optional vision reader
src/ui/       React UI (App shell, pages, calculators, solution panel, tools, SVG graphs)
src/tests/    automated tests
```

- Every formula has a source classification: NESA formulae sheet, Syllabus, Derived, HSC exam application, Year 11 prerequisite, or Extension.
- The chain solver works forward from the known data, pruning to the steps the answer needs. It defers square-root rearrangements where the sign is ambiguous, picks the physically meaningful root and reports the rejected ones, and checks over-specified data for consistency.
- Assumptions such as “perpendicular” are only used when a problem cannot be solved without them, and they are always printed.

## Tests (827 passing)

- **Formula database:** every rearrangement of every formula is checked automatically by dimensional analysis and by random numeric round-trips.
- **Multi-step chains, units, parsing and sig figs:** includes the reference cases from the brief: proton qvB, λ = 500 nm → f → E, γ at 0.80c, orbital speed, and 120 g → 15 g after 3 half-lives.
- **120 HSC-style worded questions** across Modules 5–8 (three audit batches), with answers checked against independently computed values.
- **Physical validation:** v ≥ c, sin θ > 1, total internal reflection, below-threshold light, negative masses and temperatures, efficiency above 100%, growing decay, non-integer quantum numbers, inconsistent data.
- **UI smoke tests** render every page and calculator in jsdom.

## Limitations

- **Formula sheet content was entered from knowledge, not downloaded.** The NESA website was blocked by the build environment's network policy, so the official PDFs could not be fetched. The formula and constant lists were compiled from the content of the NESA syllabus, formulae/data sheet and past papers as known at build time. Check them against your printed data sheet: the Constants page shows every value exactly as used.
- **The Smart Solver is rule-based.** It handles standard HSC phrasing well (tested on 120 questions). Unusual wording can map a value to the wrong variable, so always check the “Interpretation” table. You can switch the calculation type, or use the topic calculator instead.
- **Multi-part questions stay within one calculation type.** A part that needs a different calculation type has to be solved separately.
- **Diagrams and graphs are not read without the optional AI reader.** OCR reads text only; values that appear only in a diagram must be typed or confirmed. Reading data off a printed graph is not automated, apart from the photoelectric data-fit tool, which takes typed data points.
- **Directions are only worked out when stated.** Direction reasoning uses the directions given in the text (or confirmed from a diagram); otherwise it explains the rule to apply.
- **Proper vs measured quantities in relativity questions** are identified from wording (“at rest”, “on board”, “observer on Earth”). The working always states which one was used, so check it.
- **Descriptive and explanation questions** (the non-numerical parts of HSC papers) are out of scope.
