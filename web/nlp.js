// nlp.js - Natural Language Processing for intent detection

class NLP {
    constructor() {
        this.prompts = null;
        this.initialized = false;
    }

    async initialize() {
        if (this.initialized) return;
        
        try {
            this.prompts = await fetch('data/prompts.min.json').then(r => r.json());
            this.initialized = true;
            console.log('✓ NLP initialized');
        } catch (error) {
            console.error('Failed to initialize NLP:', error);
        }
    }

    // Detect user intent from message
    detectIntent(message) {
        const msg = message.toLowerCase().trim();
        
        // Define intent patterns
        const intents = {
            conjugate: this._matchConjugate(msg),
            quiz: this._matchQuiz(msg),
            example: this._matchExample(msg),
            translate: this._matchTranslate(msg),
            explain: this._matchExplain(msg),
            pronunciation: this._matchPronunciation(msg),
            help: this._matchHelp(msg)
        };

        // Find best matching intent
        let bestIntent = 'unknown';
        let bestScore = 0;
        let entities = {};

        for (const [intent, result] of Object.entries(intents)) {
            if (result.score > bestScore) {
                bestScore = result.score;
                bestIntent = intent;
                entities = result.entities || {};
            }
        }

        return {
            intent: bestIntent,
            confidence: bestScore,
            entities: entities,
            original: message
        };
    }

    // Match conjugation requests
    _matchConjugate(msg) {
        const keywords = ['conjugate', 'conjugation', 'form of', 'how to conjugate', 'conjugar'];
        const score = this._keywordScore(msg, keywords);
        
        if (score === 0) return { score: 0 };

        // Extract verb and tense
        const entities = this._extractVerbAndTense(msg);
        
        return {
            score: score,
            entities: entities
        };
    }

    // Match quiz requests
    _matchQuiz(msg) {
        const keywords = ['quiz', 'test', 'practice', 'drill', 'exercise', 'exam', 'prueba'];
        const score = this._keywordScore(msg, keywords);
        
        if (score === 0) return { score: 0 };

        const entities = {
            verbGroup: this._extractVerbGroup(msg),
            tense: this._extractTense(msg),
            difficulty: this._extractDifficulty(msg)
        };
        
        return {
            score: score,
            entities: entities
        };
    }

    // Match example/sentence requests
    _matchExample(msg) {
        const keywords = ['example', 'sentence', 'use', 'usage', 'context', 'ejemplo', 'frase'];
        const score = this._keywordScore(msg, keywords);
        
        if (score === 0) return { score: 0 };

        const entities = this._extractVerbAndTense(msg);
        
        return {
            score: score,
            entities: entities
        };
    }

    // Match translation requests
    _matchTranslate(msg) {
        const keywords = ['translate', 'how do you say', 'spanish for', 'in spanish', 'traducir'];
        const score = this._keywordScore(msg, keywords);
        
        if (score === 0) return { score: 0 };

        // Extract phrase to translate (often in quotes)
        const quoteMatch = msg.match(/['"]([^'"]+)['"]/);
        const phrase = quoteMatch ? quoteMatch[1] : msg.replace(/translate|how do you say|spanish for|in spanish/gi, '').trim();
        
        return {
            score: score,
            entities: { phrase: phrase }
        };
    }

    // Match explanation requests
    _matchExplain(msg) {
        const keywords = ['explain', 'what is', 'difference', 'why', 'when to use', 'explicar'];
        const score = this._keywordScore(msg, keywords);
        
        if (score === 0) return { score: 0 };

        const entities = {
            concept: msg.replace(/explain|what is|difference|why|when to use/gi, '').trim()
        };
        
        return {
            score: score,
            entities: entities
        };
    }

    // Match pronunciation requests
    _matchPronunciation(msg) {
        const keywords = ['pronounce', 'pronunciation', 'say', 'sound', 'how does it sound', 'pronunciar'];
        const score = this._keywordScore(msg, keywords);
        
        return {
            score: score,
            entities: {}
        };
    }

    // Match help requests
    _matchHelp(msg) {
        const keywords = ['help', 'how', 'can you', 'what can', 'ayuda'];
        const score = this._keywordScore(msg, keywords);
        
        return {
            score: score,
            entities: {}
        };
    }

    // Calculate keyword score
    _keywordScore(msg, keywords) {
        let score = 0;
        for (const keyword of keywords) {
            if (msg.includes(keyword)) {
                score += 1;
            }
        }
        return score > 0 ? score / keywords.length : 0;
    }

    // Extract verb from message
    _extractVerb(msg) {
        // Common Spanish verbs to look for
        const commonVerbs = [
            'ser', 'estar', 'tener', 'hacer', 'poder', 'decir', 'ir', 'ver', 'dar', 'saber',
            'querer', 'hablar', 'comer', 'vivir', 'estudiar', 'trabajar', 'escribir', 'leer',
            'venir', 'salir', 'pensar', 'poner', 'llegar', 'pasar', 'deber', 'buscar', 'encontrar'
        ];
        
        for (const verb of commonVerbs) {
            if (msg.includes(verb)) {
                return verb;
            }
        }
        
        // Try to find infinitive pattern (ends in ar, er, ir)
        const infinitiveMatch = msg.match(/\b(\w+[aei]r)\b/);
        return infinitiveMatch ? infinitiveMatch[1] : null;
    }

    // Extract tense from message
    _extractTense(msg) {
        const tensePatterns = {
            'presente': ['present', 'presente', 'now'],
            'pretérito': ['preterite', 'pretérito', 'past', 'simple past', 'pasado'],
            'imperfecto': ['imperfect', 'imperfecto', 'was/were -ing'],
            'futuro': ['future', 'futuro', 'will'],
            'condicional': ['conditional', 'condicional', 'would'],
            'presente_perfecto': ['present perfect', 'presente perfecto', 'have/has'],
            'presente_subjuntivo': ['subjunctive', 'subjuntivo']
        };
        
        for (const [tense, patterns] of Object.entries(tensePatterns)) {
            for (const pattern of patterns) {
                if (msg.includes(pattern)) {
                    return tense;
                }
            }
        }
        
        return 'presente'; // Default to present
    }

    // Extract person from message
    _extractPerson(msg) {
        const personPatterns = {
            'yo': ['i', 'yo', 'first person singular'],
            'tú': ['you informal', 'tú', 'tu', 'second person singular'],
            'él': ['he', 'she', 'él', 'ella', 'usted', 'third person singular'],
            'nosotros': ['we', 'nosotros', 'first person plural'],
            'vosotros': ['you all', 'vosotros', 'second person plural'],
            'ellos': ['they', 'ellos', 'ustedes', 'third person plural']
        };
        
        for (const [person, patterns] of Object.entries(personPatterns)) {
            for (const pattern of patterns) {
                if (msg.includes(pattern)) {
                    return person;
                }
            }
        }
        
        return null; // No specific person
    }

    // Extract verb and tense together
    _extractVerbAndTense(msg) {
        return {
            verb: this._extractVerb(msg),
            tense: this._extractTense(msg),
            person: this._extractPerson(msg)
        };
    }

    // Extract verb group (-ar, -er, -ir)
    _extractVerbGroup(msg) {
        if (msg.includes('-ar') || msg.includes('ar verbs')) return 'ar';
        if (msg.includes('-er') || msg.includes('er verbs')) return 'er';
        if (msg.includes('-ir') || msg.includes('ir verbs')) return 'ir';
        if (msg.includes('irregular')) return 'irregular';
        return null;
    }

    // Extract difficulty level
    _extractDifficulty(msg) {
        if (msg.includes('a1') || msg.includes('beginner')) return 'A1';
        if (msg.includes('a2') || msg.includes('elementary')) return 'A2';
        if (msg.includes('b1') || msg.includes('intermediate')) return 'B1';
        return null;
    }

    // Generate response based on intent
    generateResponse(intent, entities) {
        switch (intent.intent) {
            case 'conjugate':
                return this._generateConjugateResponse(entities);
            case 'quiz':
                return this._generateQuizResponse(entities);
            case 'example':
                return this._generateExampleResponse(entities);
            case 'explain':
                return this._generateExplainResponse(entities);
            case 'help':
                return this._generateHelpResponse();
            default:
                return this.prompts?.help_texts?.no_match || "I didn't understand that. Try asking about conjugations, quizzes, or examples!";
        }
    }

    _generateConjugateResponse(entities) {
        if (!entities.verb) {
            return "Which verb would you like me to conjugate? Try: 'conjugate hablar in present'";
        }
        return null; // Will be handled by app.js with verbEngine
    }

    _generateQuizResponse(entities) {
        return null; // Will be handled by app.js
    }

    _generateExampleResponse(entities) {
        if (!entities.verb) {
            return "Which verb would you like to see used in a sentence?";
        }
        return null; // Will be handled by app.js
    }

    _generateExplainResponse(entities) {
        // Common explanations
        const explanations = {
            'ser vs estar': 'Both mean "to be" but:\n• SER: permanent characteristics, identity, origin, time\n• ESTAR: location, temporary states, conditions\n\nExamples:\n• Soy estudiante (I am a student - identity)\n• Estoy cansado (I am tired - temporary state)',
            
            'preterite vs imperfect': 'Both are past tenses but:\n• PRETERITE: completed actions with specific timeframe\n• IMPERFECT: ongoing actions, habits, descriptions in the past\n\nExamples:\n• Comí pizza ayer (I ate pizza yesterday - completed)\n• Comía pizza todos los días (I used to eat pizza every day - habit)',
            
            'subjunctive': 'The subjunctive mood expresses:\n• Wishes, desires (Quiero que...)\n• Doubt, uncertainty (Dudo que...)\n• Emotions (Me alegro que...)\n• Hypothetical situations\n\nExample: Espero que tengas un buen día (I hope you have a good day)'
        };
        
        const concept = entities.concept?.toLowerCase() || '';
        for (const [key, value] of Object.entries(explanations)) {
            if (concept.includes(key) || key.includes(concept)) {
                return value;
            }
        }
        
        return `I can explain common concepts like "ser vs estar", "preterite vs imperfect", or "subjunctive". What would you like to know about?`;
    }

    _generateHelpResponse() {
        return this.prompts?.help_texts?.welcome || 
            "I can help you with:\n• Conjugating verbs\n• Practicing with quizzes\n• Seeing usage examples\n• Explaining grammar concepts\n\nJust ask!";
    }
}

// Create global instance
const nlp = new NLP();
