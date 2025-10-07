"""
Chat page - Interactive verb tutor chatbot
"""

import streamlit as st
import sys
from pathlib import Path

sys.path.append(str(Path(__file__).parent.parent))

from utils.engine import VerbEngine
from utils.io import load_phrases

st.set_page_config(page_title="Chat - SpanishVerb Tutor", page_icon="💬", layout="wide")

# Initialize
if 'engine' not in st.session_state:
    st.session_state.engine = VerbEngine()
    st.session_state.engine.initialize()

if 'chat_history' not in st.session_state:
    st.session_state.chat_history = []
    st.session_state.chat_history.append({
        'role': 'assistant',
        'content': '¡Hola! I\'m your Spanish verb tutor. Ask me about conjugations, see examples, or start a quiz! Try: "conjugate hablar in present"'
    })

if 'phrases' not in st.session_state:
    st.session_state.phrases = load_phrases()

# Page header
st.title("💬 Chat with Your Tutor")
st.markdown("Ask questions about verbs, conjugations, and usage!")

# Chat interface
st.markdown("---")

# Display chat history
for message in st.session_state.chat_history:
    with st.chat_message(message['role']):
        st.markdown(message['content'])

# Chat input
if prompt := st.chat_input("Ask me anything... e.g., 'conjugate ser in present'"):
    # Add user message
    st.session_state.chat_history.append({'role': 'user', 'content': prompt})
    
    with st.chat_message('user'):
        st.markdown(prompt)
    
    # Process and respond
    response = process_message(prompt, st.session_state.engine, st.session_state.phrases)
    
    st.session_state.chat_history.append({'role': 'assistant', 'content': response})
    
    with st.chat_message('assistant'):
        st.markdown(response)
    
    st.rerun()

# Sidebar with quick actions
with st.sidebar:
    st.subheader("Quick Actions")
    
    if st.button("🎯 Start Quiz", use_container_width=True):
        st.switch_page("pages/02_Drills.py")
    
    if st.button("📊 View Progress", use_container_width=True):
        st.switch_page("pages/04_Progress.py")
    
    st.markdown("---")
    st.subheader("Example Questions")
    st.markdown("""
    - conjugate hablar in present
    - quiz me on -ar verbs
    - use tener in a sentence
    - explain ser vs estar
    - show me poder conjugation
    """)


def process_message(message: str, engine: VerbEngine, phrases: list) -> str:
    """Process user message and generate response"""
    msg = message.lower().strip()
    
    # Detect intent
    if any(word in msg for word in ['conjugate', 'conjugation', 'form of']):
        return handle_conjugate(msg, engine)
    elif any(word in msg for word in ['example', 'sentence', 'use']):
        return handle_example(msg, engine, phrases)
    elif any(word in msg for word in ['quiz', 'test', 'practice']):
        return "Great! Let me start a quiz for you. Check out the **Drills** page from the sidebar! 🎯"
    elif any(word in msg for word in ['explain', 'what is', 'difference']):
        return handle_explain(msg)
    else:
        return """I can help you with:
- **Conjugate verbs**: "conjugate hablar in present"
- **See examples**: "use ser in a sentence"
- **Start quizzes**: "quiz me on -ar verbs"
- **Explain concepts**: "explain ser vs estar"

What would you like to learn?"""


def handle_conjugate(msg: str, engine: VerbEngine) -> str:
    """Handle conjugation request"""
    # Extract verb
    verbs = ['ser', 'estar', 'tener', 'hacer', 'poder', 'ir', 'ver', 'dar', 'saber', 'querer',
             'hablar', 'comer', 'vivir', 'estudiar', 'trabajar', 'escribir', 'leer']
    
    verb = None
    for v in verbs:
        if v in msg:
            verb = v
            break
    
    if not verb:
        return "Which verb would you like me to conjugate? Try: 'conjugate hablar in present'"
    
    # Extract tense
    tense = 'presente'
    if 'preterite' in msg or 'pretérito' in msg or 'past' in msg:
        tense = 'pretérito'
    elif 'imperfect' in msg or 'imperfecto' in msg:
        tense = 'imperfecto'
    elif 'future' in msg or 'futuro' in msg:
        tense = 'futuro'
    
    # Conjugate
    result = engine.conjugate(verb, tense)
    
    if not result:
        return f"Sorry, I couldn't conjugate {verb}."
    
    # Build response
    tense_info = engine.get_tense_info(tense)
    response = f"**{result['verb']['infinitive']}** ({result['verb']['english']}) - {tense_info['label']}\n\n"
    
    for person, form in result['forms'].items():
        label = engine.get_person_label(person)
        response += f"- **{label}**: {form}\n"
    
    response += f"\n*{tense_info['explanation']}*"
    
    return response


def handle_example(msg: str, engine: VerbEngine, phrases: list) -> str:
    """Handle example sentence request"""
    # Extract verb
    verbs = ['ser', 'estar', 'tener', 'hacer', 'poder', 'ir', 'ver', 'dar', 'saber', 'querer',
             'hablar', 'comer', 'vivir', 'estudiar', 'trabajar', 'escribir', 'leer']
    
    verb = None
    for v in verbs:
        if v in msg:
            verb = v
            break
    
    if not verb:
        return "Which verb would you like to see in a sentence?"
    
    # Find phrases
    verb_phrases = [p for p in phrases if p['infinitive'] == verb]
    
    if not verb_phrases:
        return f"I don't have example sentences for '{verb}' yet."
    
    # Show 3 random examples
    import random
    examples = random.sample(verb_phrases, min(3, len(verb_phrases)))
    
    response = f"**Examples using {verb}**:\n\n"
    for i, ex in enumerate(examples, 1):
        response += f"{i}. **{ex['spanish_sentence']}**\n"
        response += f"   *{ex['translation']}*\n\n"
    
    return response


def handle_explain(msg: str) -> str:
    """Handle explanation request"""
    if 'ser' in msg and 'estar' in msg:
        return """**Ser vs Estar** - Both mean "to be" but:

**SER** - Permanent characteristics, identity, origin, time
- Soy estudiante (I am a student - identity)
- Es de España (He's from Spain - origin)
- Son las tres (It's three o'clock - time)

**ESTAR** - Location, temporary states, conditions
- Estoy en casa (I'm at home - location)
- Está cansado (He's tired - temporary state)
- Estamos contentos (We're happy - condition)

**Remember**: "For how you feel or where you are, always use estar!"
"""
    
    elif 'preterite' in msg or 'imperfect' in msg:
        return """**Preterite vs Imperfect** - Both are past tenses but:

**PRETERITE** - Completed actions with specific timeframe
- Comí pizza ayer (I ate pizza yesterday)
- Fui al cine (I went to the cinema)

**IMPERFECT** - Ongoing actions, habits, descriptions in past
- Comía pizza todos los días (I used to eat pizza every day)
- Iba al cine los sábados (I used to go to the cinema on Saturdays)

**Remember**: Preterite = completed action, Imperfect = ongoing/habitual
"""
    
    else:
        return """I can explain:
- **Ser vs Estar**: "explain ser vs estar"
- **Preterite vs Imperfect**: "explain preterite vs imperfect"

What would you like to know about?"""
