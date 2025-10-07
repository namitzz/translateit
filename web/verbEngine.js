// verbEngine.js - Spanish verb conjugation engine

class VerbEngine {
    constructor() {
        this.verbs = [];
        this.conjugations = new Map();
        this.patterns = null;
        this.initialized = false;
    }

    async initialize() {
        if (this.initialized) return;
        
        try {
            // Load all data files
            const [verbsData, conjugationsData, patternsData] = await Promise.all([
                fetch('data/verbs.min.json').then(r => r.json()),
                fetch('data/conjugations.min.json').then(r => r.json()),
                fetch('data/patterns.min.json').then(r => r.json())
            ]);

            this.verbs = verbsData;
            this.patterns = patternsData;
            
            // Build conjugations map for quick lookup
            conjugationsData.forEach(conj => {
                const key = `${conj.infinitive}:${conj.tense}:${conj.person}`;
                this.conjugations.set(key, conj.form);
            });

            this.initialized = true;
            console.log(`✓ VerbEngine initialized with ${this.verbs.length} verbs`);
        } catch (error) {
            console.error('Failed to initialize VerbEngine:', error);
            throw error;
        }
    }

    // Get verb by infinitive
    getVerb(infinitive) {
        return this.verbs.find(v => v.infinitive === infinitive.toLowerCase());
    }

    // Get all verbs by filter
    getVerbs(filter = {}) {
        let result = [...this.verbs];
        
        if (filter.group) {
            result = result.filter(v => v.group === filter.group);
        }
        if (filter.irregular !== undefined) {
            result = result.filter(v => (v.irregular === 'yes') === filter.irregular);
        }
        if (filter.tags) {
            result = result.filter(v => filter.tags.split(',').some(tag => v.tags.includes(tag)));
        }
        
        return result;
    }

    // Conjugate a verb
    conjugate(infinitive, tense, person = null) {
        const verb = this.getVerb(infinitive);
        if (!verb) {
            return null;
        }

        // If person is specified, return single conjugation
        if (person) {
            return {
                form: this._conjugateForm(verb, tense, person),
                verb: verb,
                tense: tense,
                person: person
            };
        }

        // Return all persons
        const persons = this.patterns.persons;
        const result = {};
        persons.forEach(p => {
            result[p] = this._conjugateForm(verb, tense, p);
        });

        return {
            forms: result,
            verb: verb,
            tense: tense
        };
    }

    // Internal: conjugate a specific form
    _conjugateForm(verb, tense, person) {
        // Check if we have an override in conjugations data
        const key = `${verb.infinitive}:${tense}:${person}`;
        if (this.conjugations.has(key)) {
            return this.conjugations.get(key);
        }

        // Generate using patterns
        return this._generateConjugation(verb, tense, person);
    }

    // Generate conjugation using patterns
    _generateConjugation(verb, tense, person) {
        const infinitive = verb.infinitive;
        const ending = infinitive.slice(-2);
        
        // Get the stem (remove ending)
        let stem = infinitive.slice(0, -2);
        
        // Get regular ending for this group/tense/person
        const regularEndings = this.patterns.regular_endings[ending];
        if (!regularEndings || !regularEndings[tense]) {
            return infinitive; // Fallback
        }
        
        const endingSuffix = regularEndings[tense][person];
        
        // Apply stem changes if needed
        if (tense === 'presente' || tense === 'presente_subjuntivo') {
            stem = this._applyStemChange(stem, verb, person);
        }
        
        // Apply spelling changes
        stem = this._applySpellingChanges(stem, verb, tense, person, ending);
        
        // For future and conditional, use full infinitive as stem
        if (tense === 'futuro' || tense === 'condicional') {
            return infinitive + endingSuffix;
        }
        
        return stem + endingSuffix;
    }

    // Apply stem changes (e→ie, o→ue, e→i, u→ue)
    _applyStemChange(stem, verb, person) {
        // Only affect stressed syllables (yo, tú, él, ellos)
        const affectedPersons = ['yo', 'tú', 'él', 'ellos'];
        if (!affectedPersons.includes(person)) {
            return stem;
        }

        // Check verb for stem change patterns
        const infinitive = verb.infinitive;
        
        // e → ie verbs (pensar, querer, sentir)
        if (['pensar', 'querer', 'sentir', 'empezar', 'comenzar', 'cerrar', 
             'despertar', 'recomendar', 'sentar', 'entender', 'perder'].includes(infinitive)) {
            return stem.replace(/e([^e]*)$/, 'ie$1');
        }
        
        // o → ue verbs (poder, volver, dormir)
        if (['poder', 'volver', 'dormir', 'encontrar', 'contar', 'costar', 
             'mostrar', 'probar', 'recordar', 'mover', 'doler'].includes(infinitive)) {
            return stem.replace(/o([^o]*)$/, 'ue$1');
        }
        
        // e → i verbs (pedir, servir)
        if (['pedir', 'servir', 'seguir', 'conseguir', 'repetir'].includes(infinitive)) {
            return stem.replace(/e([^e]*)$/, 'i$1');
        }
        
        // u → ue (jugar only)
        if (infinitive === 'jugar') {
            return stem.replace(/u/, 'ue');
        }
        
        return stem;
    }

    // Apply spelling changes (c→qu, g→gu, z→c, etc.)
    _applySpellingChanges(stem, verb, tense, person, ending) {
        const infinitive = verb.infinitive;
        
        // c → qu before e (buscar, tocar, sacar)
        if (infinitive.endsWith('car') && (tense === 'pretérito' && person === 'yo')) {
            return stem.slice(0, -1) + 'qu';
        }
        
        // g → gu before e (llegar, pagar, jugar)
        if (infinitive.endsWith('gar') && (tense === 'pretérito' && person === 'yo')) {
            return stem.slice(0, -1) + 'gu';
        }
        
        // z → c before e (empezar, comenzar, almorzar)
        if (infinitive.endsWith('zar') && (tense === 'pretérito' && person === 'yo')) {
            return stem.slice(0, -1) + 'c';
        }
        
        // cer/cir → zco (conocer, parecer)
        if ((infinitive.endsWith('cer') || infinitive.endsWith('cir')) && 
            tense === 'presente' && person === 'yo') {
            // Check if preceded by vowel
            const beforeC = stem.slice(-2, -1);
            if ('aeiou'.includes(beforeC)) {
                return stem + 'z';
            }
        }
        
        // guir → go (seguir, conseguir)
        if (infinitive.endsWith('guir') && tense === 'presente' && person === 'yo') {
            return stem.slice(0, -1);
        }
        
        return stem;
    }

    // Get verb group (ar, er, ir)
    getVerbGroup(infinitive) {
        const verb = this.getVerb(infinitive);
        return verb ? verb.group : null;
    }

    // Check if verb is irregular
    isIrregular(infinitive) {
        const verb = this.getVerb(infinitive);
        return verb ? verb.irregular === 'yes' : false;
    }

    // Get random verbs
    getRandomVerbs(count, filter = {}) {
        const verbs = this.getVerbs(filter);
        const shuffled = verbs.sort(() => 0.5 - Math.random());
        return shuffled.slice(0, Math.min(count, shuffled.length));
    }

    // Get tense information
    getTenseInfo(tense) {
        return {
            label: this.patterns.tense_labels[tense] || tense,
            explanation: this.patterns.tense_explanations[tense] || ''
        };
    }

    // Get person label
    getPersonLabel(person) {
        return this.patterns.person_labels[person] || person;
    }

    // Get all available tenses
    getTenses() {
        return this.patterns.tenses;
    }

    // Get all persons
    getPersons() {
        return this.patterns.persons;
    }

    // Validate a conjugation
    validateConjugation(infinitive, tense, person, userAnswer) {
        const correct = this._conjugateForm(this.getVerb(infinitive), tense, person);
        const normalized = userAnswer.trim().toLowerCase();
        return {
            correct: normalized === correct.toLowerCase(),
            expected: correct,
            provided: userAnswer
        };
    }

    // Get verb by English meaning
    findByEnglish(english) {
        const search = english.toLowerCase();
        return this.verbs.filter(v => 
            v.english.toLowerCase().includes(search)
        );
    }

    // Export conjugation table as text
    exportConjugationTable(infinitive, tense) {
        const result = this.conjugate(infinitive, tense);
        if (!result) return null;

        let table = `${result.verb.infinitive} (${result.verb.english}) - ${this.getTenseInfo(tense).label}\n`;
        table += '-'.repeat(50) + '\n';
        
        this.patterns.persons.forEach(person => {
            const label = this.getPersonLabel(person);
            const form = result.forms[person];
            table += `${label.padEnd(20)} | ${form}\n`;
        });
        
        return table;
    }
}

// Create global instance
const verbEngine = new VerbEngine();
