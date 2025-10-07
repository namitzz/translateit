// app.js - Main application logic

class SpanishVerbApp {
    constructor() {
        this.state = {
            user: {
                level: null,
                examDate: null,
                dailyMinutes: null,
                progress: {
                    verbsLearned: 0,
                    streakDays: 0,
                    totalDrills: 0,
                    weakSpots: []
                },
                srsBoxes: {} // Leitner boxes for SRS
            },
            currentDrill: null,
            phrases: [],
            chatHistory: []
        };
        
        this.drillMode = 'quick_5';
    }

    async initialize() {
        console.log('Initializing SpanishVerb Tutor...');
        
        try {
            // Initialize all engines
            await Promise.all([
                verbEngine.initialize(),
                nlp.initialize(),
                tts.initialize(),
                this.loadPhrases()
            ]);

            // Load user data
            this.loadUserData();

            // Setup UI event listeners
            this.setupEventListeners();

            // Check if first time user
            if (!this.state.user.level) {
                this.showSetupWizard();
            } else {
                this.updateUI();
                this.sendBotMessage(nlp.prompts?.help_texts?.welcome || 'Welcome back! How can I help you today?');
            }

            // Register service worker
            this.registerServiceWorker();

            // Check for install prompt
            this.setupInstallPrompt();

            console.log('✓ App initialized successfully');
        } catch (error) {
            console.error('Failed to initialize app:', error);
            this.showError('Failed to load app. Please refresh the page.');
        }
    }

    async loadPhrases() {
        try {
            this.state.phrases = await fetch('data/phrases.min.json').then(r => r.json());
        } catch (error) {
            console.error('Failed to load phrases:', error);
            this.state.phrases = [];
        }
    }

    // Setup all event listeners
    setupEventListeners() {
        // Chat input
        const chatInput = document.getElementById('chat-input');
        const sendBtn = document.getElementById('send-btn');
        
        sendBtn.addEventListener('click', () => this.handleUserMessage());
        chatInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.handleUserMessage();
            }
        });

        // Quick action buttons
        document.querySelectorAll('.quick-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const action = e.target.dataset.action;
                this.handleQuickAction(action);
            });
        });

        // Drill mode selector
        document.querySelectorAll('.mode-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                document.querySelectorAll('.mode-btn').forEach(b => b.classList.remove('active'));
                e.target.classList.add('active');
                this.drillMode = e.target.dataset.mode;
            });
        });

        // Start drill button
        const startDrillBtn = document.getElementById('start-drill-btn');
        if (startDrillBtn) {
            startDrillBtn.addEventListener('click', () => this.startDrill());
        }

        // Settings
        document.getElementById('settings-btn').addEventListener('click', () => {
            document.getElementById('settings-modal').classList.remove('hidden');
        });

        document.getElementById('close-settings').addEventListener('click', () => {
            document.getElementById('settings-modal').classList.add('hidden');
        });

        // Theme toggle
        document.getElementById('theme-toggle').addEventListener('change', (e) => {
            document.documentElement.setAttribute('data-theme', e.target.checked ? 'dark' : 'light');
            localStorage.setItem('theme', e.target.checked ? 'dark' : 'light');
        });

        // Dyslexia font toggle
        document.getElementById('dyslexia-toggle').addEventListener('change', (e) => {
            document.body.classList.toggle('dyslexia-font', e.target.checked);
            localStorage.setItem('dyslexiaFont', e.target.checked);
        });

        // TTS toggle
        document.getElementById('tts-toggle').addEventListener('change', (e) => {
            tts.setEnabled(e.target.checked);
            localStorage.setItem('ttsEnabled', e.target.checked);
        });

        // LLM toggle
        document.getElementById('llm-toggle').addEventListener('change', (e) => {
            document.getElementById('llm-config').style.display = e.target.checked ? 'block' : 'none';
            localStorage.setItem('llmEnabled', e.target.checked);
        });

        // Reset progress
        document.getElementById('reset-progress').addEventListener('click', () => {
            if (confirm('Are you sure you want to reset all your progress?')) {
                this.resetProgress();
            }
        });

        // Export data
        document.getElementById('export-data').addEventListener('click', () => {
            this.exportProgress();
        });
    }

    // Show setup wizard
    showSetupWizard() {
        const wizard = document.getElementById('setup-wizard');
        wizard.classList.remove('hidden');

        // Step 1: Level selection
        document.querySelectorAll('#wizard-step-1 .btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.state.user.level = e.target.dataset.level;
                document.getElementById('wizard-step-1').classList.add('hidden');
                document.getElementById('wizard-step-2').classList.remove('hidden');
            });
        });

        // Step 2: Exam date (optional)
        document.getElementById('exam-date').addEventListener('change', (e) => {
            this.state.user.examDate = e.target.value;
            document.getElementById('wizard-step-2').classList.add('hidden');
            document.getElementById('wizard-step-3').classList.remove('hidden');
        });

        document.getElementById('skip-date').addEventListener('click', () => {
            document.getElementById('wizard-step-2').classList.add('hidden');
            document.getElementById('wizard-step-3').classList.remove('hidden');
        });

        // Step 3: Daily minutes
        document.querySelectorAll('#wizard-step-3 .btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.state.user.dailyMinutes = parseInt(e.target.dataset.minutes);
                document.getElementById('wizard-step-3').classList.add('hidden');
                document.getElementById('wizard-complete').classList.remove('hidden');
            });
        });

        // Complete
        document.getElementById('start-learning').addEventListener('click', () => {
            wizard.classList.add('hidden');
            this.saveUserData();
            this.updateUI();
            this.sendBotMessage(nlp.prompts?.help_texts?.welcome || 'Welcome! Let\'s start learning!');
        });
    }

    // Handle user message
    handleUserMessage() {
        const input = document.getElementById('chat-input');
        const message = input.value.trim();
        
        if (!message) return;

        // Display user message
        this.sendUserMessage(message);
        input.value = '';

        // Process message
        this.processUserMessage(message);
    }

    async processUserMessage(message) {
        // Detect intent
        const intent = nlp.detectIntent(message);
        console.log('Detected intent:', intent);

        // Handle based on intent
        switch (intent.intent) {
            case 'conjugate':
                await this.handleConjugateIntent(intent.entities);
                break;
            case 'quiz':
                this.handleQuizIntent(intent.entities);
                break;
            case 'example':
                this.handleExampleIntent(intent.entities);
                break;
            case 'explain':
                this.handleExplainIntent(intent.entities);
                break;
            case 'translate':
                this.handleTranslateIntent(intent.entities);
                break;
            case 'help':
                this.sendBotMessage(nlp._generateHelpResponse());
                break;
            default:
                this.sendBotMessage(nlp.prompts?.help_texts?.no_match || 'I\'m not sure what you mean. Try asking about conjugations or quizzes!');
        }
    }

    // Handle conjugation request
    async handleConjugateIntent(entities) {
        if (!entities.verb) {
            this.sendBotMessage("Which verb would you like me to conjugate? For example: 'conjugate hablar in present'");
            return;
        }

        const verb = verbEngine.getVerb(entities.verb);
        if (!verb) {
            this.sendBotMessage(`I don't recognize the verb "${entities.verb}". Please check the spelling.`);
            return;
        }

        const tense = entities.tense || 'presente';
        const result = verbEngine.conjugate(verb.infinitive, tense, entities.person);

        if (!result) {
            this.sendBotMessage(`Sorry, I couldn't conjugate ${verb.infinitive}.`);
            return;
        }

        // Build response
        const tenseInfo = verbEngine.getTenseInfo(tense);
        let response = `<strong>${verb.infinitive}</strong> (${verb.english}) - ${tenseInfo.label}\n\n`;
        
        if (entities.person) {
            // Single person
            response += `${verbEngine.getPersonLabel(entities.person)}: <strong>${result.form}</strong>`;
            
            // Add pronounce button
            const container = document.createElement('div');
            container.innerHTML = response;
            const pronounceBtn = tts.createPronounceButton(result.form);
            container.appendChild(pronounceBtn);
            
            this.sendBotMessage(container);
        } else {
            // Full conjugation table
            response += '<table class="conjugation-table">';
            for (const [person, form] of Object.entries(result.forms)) {
                response += `<tr><td>${verbEngine.getPersonLabel(person)}</td><td><strong>${form}</strong></td></tr>`;
            }
            response += '</table>';
            response += `\n<em>${tenseInfo.explanation}</em>`;
            
            this.sendBotMessage(response);
        }
    }

    // Handle quiz request
    handleQuizIntent(entities) {
        this.sendBotMessage("Great! I'll start a quiz for you. Check out the Practice Drills panel on the right →");
        // Could automatically start drill here
        this.startDrill();
    }

    // Handle example request
    handleExampleIntent(entities) {
        if (!entities.verb) {
            this.sendBotMessage("Which verb would you like to see in a sentence?");
            return;
        }

        const verb = verbEngine.getVerb(entities.verb);
        if (!verb) {
            this.sendBotMessage(`I don't recognize the verb "${entities.verb}".`);
            return;
        }

        // Find phrases for this verb
        const phrases = this.state.phrases.filter(p => p.infinitive === verb.infinitive);
        
        if (phrases.length === 0) {
            this.sendBotMessage(`I don't have example sentences for "${verb.infinitive}" yet.`);
            return;
        }

        // Pick random phrases
        const examples = phrases.sort(() => 0.5 - Math.random()).slice(0, 3);
        let response = `Here are some examples using <strong>${verb.infinitive}</strong> (${verb.english}):\n\n`;
        
        examples.forEach((ex, i) => {
            response += `${i + 1}. <strong>${ex.spanish_sentence}</strong>\n`;
            response += `   <em>${ex.translation}</em>\n\n`;
        });

        this.sendBotMessage(response);
    }

    // Handle explanation request
    handleExplainIntent(entities) {
        const response = nlp._generateExplainResponse(entities);
        this.sendBotMessage(response);
    }

    // Handle translation request
    handleTranslateIntent(entities) {
        this.sendBotMessage("Translation feature coming soon! For now, I can help with conjugations and examples.");
    }

    // Handle quick actions
    handleQuickAction(action) {
        switch (action) {
            case 'conjugate':
                document.getElementById('chat-input').value = 'conjugate ';
                document.getElementById('chat-input').focus();
                break;
            case 'sentence':
                document.getElementById('chat-input').value = 'use  in a sentence';
                document.getElementById('chat-input').focus();
                break;
            case 'quiz':
                this.startDrill();
                break;
            case 'pronounce':
                this.sendBotMessage('Type a Spanish word or phrase and I\'ll pronounce it for you!');
                break;
        }
    }

    // Start drill
    startDrill() {
        const mode = this.drillMode;
        let questionCount = 5;
        
        if (mode === 'exam_20') questionCount = 20;
        if (mode === 'custom') questionCount = 10; // Default for custom

        // Generate questions
        const questions = this.generateQuestions(questionCount);
        
        this.state.currentDrill = {
            mode: mode,
            questions: questions,
            currentIndex: 0,
            answers: [],
            startTime: Date.now()
        };

        this.showDrillQuestion();
    }

    // Generate quiz questions
    generateQuestions(count) {
        const questions = [];
        const verbs = verbEngine.getRandomVerbs(count, { tags: 'basic,common,core' });
        const tenses = ['presente', 'pretérito', 'imperfecto'];
        const persons = verbEngine.getPersons();

        for (let i = 0; i < count; i++) {
            const verb = verbs[i % verbs.length];
            const tense = tenses[Math.floor(Math.random() * tenses.length)];
            const person = persons[Math.floor(Math.random() * persons.length)];

            const correct = verbEngine.conjugate(verb.infinitive, tense, person);
            
            // Generate wrong options
            const options = [correct.form];
            while (options.length < 4) {
                const randomPerson = persons[Math.floor(Math.random() * persons.length)];
                const wrongForm = verbEngine.conjugate(verb.infinitive, tense, randomPerson).form;
                if (!options.includes(wrongForm)) {
                    options.push(wrongForm);
                }
            }

            // Shuffle options
            options.sort(() => 0.5 - Math.random());

            questions.push({
                type: 'multiple_choice',
                verb: verb.infinitive,
                verbEnglish: verb.english,
                tense: tense,
                person: person,
                question: `What is the ${verbEngine.getTenseInfo(tense).label} form of "${verb.infinitive}" (${verb.english}) for ${verbEngine.getPersonLabel(person)}?`,
                options: options,
                correct: correct.form
            });
        }

        return questions;
    }

    // Show current drill question
    showDrillQuestion() {
        const drill = this.state.currentDrill;
        if (!drill || drill.currentIndex >= drill.questions.length) {
            this.showDrillResults();
            return;
        }

        const question = drill.questions[drill.currentIndex];
        const drillContent = document.getElementById('drill-content');
        
        let html = `
            <div class="drill-question">
                <div class="question-counter">Question ${drill.currentIndex + 1} of ${drill.questions.length}</div>
                <div class="question-text">${question.question}</div>
                <div class="drill-options">
        `;

        question.options.forEach((option, i) => {
            html += `<button class="option-btn" data-option="${option}">${option}</button>`;
        });

        html += `
                </div>
                <div class="drill-actions">
                    <button class="btn" id="skip-question">Skip</button>
                </div>
            </div>
        `;

        drillContent.innerHTML = html;

        // Add event listeners
        document.querySelectorAll('.option-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.submitAnswer(e.target.dataset.option);
            });
        });

        document.getElementById('skip-question').addEventListener('click', () => {
            this.submitAnswer(null);
        });
    }

    // Submit drill answer
    submitAnswer(answer) {
        const drill = this.state.currentDrill;
        const question = drill.questions[drill.currentIndex];
        
        const isCorrect = answer === question.correct;
        drill.answers.push({
            question: question,
            userAnswer: answer,
            correct: isCorrect
        });

        // Visual feedback
        if (answer) {
            const selectedBtn = document.querySelector(`[data-option="${answer}"]`);
            if (selectedBtn) {
                selectedBtn.classList.add(isCorrect ? 'correct' : 'incorrect');
            }
        }

        // Show correct answer briefly if wrong
        if (!isCorrect && answer) {
            const correctBtn = document.querySelector(`[data-option="${question.correct}"]`);
            if (correctBtn) {
                correctBtn.classList.add('correct');
            }
            setTimeout(() => this.nextQuestion(), 1500);
        } else {
            setTimeout(() => this.nextQuestion(), 500);
        }
    }

    // Move to next question
    nextQuestion() {
        this.state.currentDrill.currentIndex++;
        this.showDrillQuestion();
    }

    // Show drill results
    showDrillResults() {
        const drill = this.state.currentDrill;
        const correct = drill.answers.filter(a => a.correct).length;
        const total = drill.answers.length;
        const percentage = Math.round((correct / total) * 100);
        const timeElapsed = Math.round((Date.now() - drill.startTime) / 1000);

        // Update progress
        this.state.user.progress.totalDrills++;
        this.state.user.progress.verbsLearned = Math.max(
            this.state.user.progress.verbsLearned,
            drill.answers.filter(a => a.correct).map(a => a.question.verb).filter((v, i, arr) => arr.indexOf(v) === i).length
        );

        // Identify weak spots
        const weakVerbs = drill.answers.filter(a => !a.correct).map(a => a.question.verb);
        this.state.user.progress.weakSpots = [...new Set([...this.state.user.progress.weakSpots, ...weakVerbs])].slice(0, 5);

        this.saveUserData();
        this.updateUI();

        // Show results
        document.getElementById('drill-content').classList.add('hidden');
        const resultsDiv = document.getElementById('drill-results');
        resultsDiv.classList.remove('hidden');

        document.getElementById('score-display').textContent = `${correct}/${total}`;
        document.getElementById('time-display').textContent = `${Math.floor(timeElapsed / 60)}:${(timeElapsed % 60).toString().padStart(2, '0')}`;

        // Show weak areas
        const weakAreas = document.getElementById('weak-areas');
        if (weakVerbs.length > 0) {
            weakAreas.innerHTML = '<h4>Review These:</h4>' + weakVerbs.map(v => `<span class="chip">${v}</span>`).join(' ');
        } else {
            weakAreas.innerHTML = '<h4>🎉 Perfect score!</h4>';
        }

        // Result action buttons
        document.getElementById('retry-drill').addEventListener('click', () => {
            this.startDrill();
            resultsDiv.classList.add('hidden');
            document.getElementById('drill-content').classList.remove('hidden');
        });

        document.getElementById('new-drill').addEventListener('click', () => {
            this.state.currentDrill = null;
            resultsDiv.classList.add('hidden');
            document.getElementById('drill-content').classList.remove('hidden');
            document.getElementById('drill-content').innerHTML = `
                <div class="drill-start">
                    <p>Select a test mode and click Start to begin practicing!</p>
                    <button id="start-drill-btn" class="btn btn-primary btn-large">Start Drill</button>
                </div>
            `;
            document.getElementById('start-drill-btn').addEventListener('click', () => this.startDrill());
        });

        document.getElementById('export-results').addEventListener('click', () => {
            this.exportDrillResults(drill);
        });

        // Send congratulatory message
        const message = percentage >= 80 ? '¡Excelente! Great job!' : percentage >= 60 ? 'Good work! Keep practicing!' : 'Keep going! Practice makes perfect!';
        this.sendBotMessage(`${message} You scored ${correct}/${total} (${percentage}%)`);
    }

    // Export drill results
    exportDrillResults(drill) {
        const csv = ['Question,Your Answer,Correct Answer,Result\n'];
        drill.answers.forEach(a => {
            csv.push(`"${a.question.question}","${a.userAnswer || 'Skipped'}","${a.question.correct}",${a.correct ? 'Correct' : 'Incorrect'}\n`);
        });

        const blob = new Blob(csv, { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `drill-results-${Date.now()}.csv`;
        a.click();
    }

    // Send user message to chat
    sendUserMessage(text) {
        const messagesDiv = document.getElementById('chat-messages');
        const messageDiv = document.createElement('div');
        messageDiv.className = 'message user';
        messageDiv.innerHTML = `
            <div class="message-avatar">U</div>
            <div class="message-bubble">
                <p class="message-text">${this.escapeHtml(text)}</p>
            </div>
        `;
        messagesDiv.appendChild(messageDiv);
        messagesDiv.scrollTop = messagesDiv.scrollHeight;
        
        this.state.chatHistory.push({ role: 'user', content: text });
    }

    // Send bot message to chat
    sendBotMessage(content) {
        const messagesDiv = document.getElementById('chat-messages');
        const messageDiv = document.createElement('div');
        messageDiv.className = 'message bot';
        
        const bubble = document.createElement('div');
        bubble.className = 'message-bubble';
        
        if (typeof content === 'string') {
            bubble.innerHTML = `<p class="message-text">${content.replace(/\n/g, '<br>')}</p>`;
        } else {
            bubble.appendChild(content);
        }
        
        messageDiv.innerHTML = '<div class="message-avatar">🤖</div>';
        messageDiv.appendChild(bubble);
        
        messagesDiv.appendChild(messageDiv);
        messagesDiv.scrollTop = messagesDiv.scrollHeight;
        
        this.state.chatHistory.push({ role: 'bot', content: typeof content === 'string' ? content : content.outerHTML });
    }

    // Update UI with current state
    updateUI() {
        // Update progress
        document.getElementById('verbs-learned').textContent = this.state.user.progress.verbsLearned;
        document.getElementById('streak-days').textContent = this.state.user.progress.streakDays;
        document.getElementById('total-drills').textContent = this.state.user.progress.totalDrills;

        // Update progress ring
        const percentage = Math.min(Math.round((this.state.user.progress.verbsLearned / 200) * 100), 100);
        document.getElementById('progress-percent').textContent = `${percentage}%`;
        
        const circle = document.getElementById('progress-circle');
        const circumference = 2 * Math.PI * 52;
        const offset = circumference - (percentage / 100) * circumference;
        circle.style.strokeDashoffset = offset;

        // Update weak spots
        const weakSpotsDiv = document.getElementById('weak-spots-chips');
        if (this.state.user.progress.weakSpots.length > 0) {
            weakSpotsDiv.innerHTML = this.state.user.progress.weakSpots.map(v => `<span class="chip">${v}</span>`).join('');
        } else {
            weakSpotsDiv.innerHTML = '<em style="color: var(--text-secondary);">No weak spots yet!</em>';
        }

        // Update settings
        const theme = localStorage.getItem('theme') || 'light';
        document.getElementById('theme-toggle').checked = theme === 'dark';
        document.documentElement.setAttribute('data-theme', theme);

        const dyslexiaFont = localStorage.getItem('dyslexiaFont') === 'true';
        document.getElementById('dyslexia-toggle').checked = dyslexiaFont;
        document.body.classList.toggle('dyslexia-font', dyslexiaFont);

        const ttsEnabled = localStorage.getItem('ttsEnabled') !== 'false';
        document.getElementById('tts-toggle').checked = ttsEnabled;
        tts.setEnabled(ttsEnabled);
    }

    // Save user data to localStorage
    saveUserData() {
        localStorage.setItem('spanishVerbUser', JSON.stringify(this.state.user));
        
        // Update streak
        const lastVisit = localStorage.getItem('lastVisit');
        const today = new Date().toDateString();
        
        if (lastVisit !== today) {
            const yesterday = new Date(Date.now() - 86400000).toDateString();
            if (lastVisit === yesterday) {
                this.state.user.progress.streakDays++;
            } else if (lastVisit !== null) {
                this.state.user.progress.streakDays = 1;
            }
            localStorage.setItem('lastVisit', today);
        }
    }

    // Load user data from localStorage
    loadUserData() {
        const saved = localStorage.getItem('spanishVerbUser');
        if (saved) {
            try {
                const parsed = JSON.parse(saved);
                this.state.user = { ...this.state.user, ...parsed };
            } catch (error) {
                console.error('Failed to parse user data:', error);
            }
        }
    }

    // Reset all progress
    resetProgress() {
        this.state.user = {
            level: null,
            examDate: null,
            dailyMinutes: null,
            progress: {
                verbsLearned: 0,
                streakDays: 0,
                totalDrills: 0,
                weakSpots: []
            },
            srsBoxes: {}
        };
        localStorage.removeItem('spanishVerbUser');
        localStorage.removeItem('lastVisit');
        this.updateUI();
        this.showSetupWizard();
    }

    // Export progress as CSV
    exportProgress() {
        const data = this.state.user;
        const csv = [
            'Metric,Value\n',
            `Level,${data.level || 'Not set'}\n`,
            `Exam Date,${data.examDate || 'Not set'}\n`,
            `Daily Minutes,${data.dailyMinutes || 'Not set'}\n`,
            `Verbs Learned,${data.progress.verbsLearned}\n`,
            `Streak Days,${data.progress.streakDays}\n`,
            `Total Drills,${data.progress.totalDrills}\n`,
            `Weak Spots,"${data.progress.weakSpots.join(', ')}"\n`
        ];

        const blob = new Blob(csv, { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `spanish-verb-progress-${Date.now()}.csv`;
        a.click();
    }

    // Register service worker for PWA
    async registerServiceWorker() {
        if ('serviceWorker' in navigator) {
            try {
                await navigator.serviceWorker.register('service-worker.js');
                console.log('✓ Service worker registered');
            } catch (error) {
                console.error('Service worker registration failed:', error);
            }
        }
    }

    // Setup install prompt
    setupInstallPrompt() {
        let deferredPrompt;
        const installBtn = document.getElementById('install-btn');

        window.addEventListener('beforeinstallprompt', (e) => {
            e.preventDefault();
            deferredPrompt = e;
            installBtn.classList.remove('hidden');

            installBtn.addEventListener('click', async () => {
                if (deferredPrompt) {
                    deferredPrompt.prompt();
                    const { outcome } = await deferredPrompt.userChoice;
                    console.log(`User response: ${outcome}`);
                    deferredPrompt = null;
                    installBtn.classList.add('hidden');
                }
            });
        });
    }

    // Show error message
    showError(message) {
        this.sendBotMessage(`❌ Error: ${message}`);
    }

    // Escape HTML
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}

// Initialize app when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    const app = new SpanishVerbApp();
    app.initialize();
});
