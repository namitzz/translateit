"""
Drills page - Interactive practice quizzes
"""

import streamlit as st
import sys
from pathlib import Path
import random
from datetime import datetime

sys.path.append(str(Path(__file__).parent.parent))

from utils.engine import VerbEngine
from utils.srs import SRSManager

st.set_page_config(page_title="Drills - SpanishVerb Tutor", page_icon="🎯", layout="wide")

# Initialize
if 'engine' not in st.session_state:
    st.session_state.engine = VerbEngine()
    st.session_state.engine.initialize()

if 'srs' not in st.session_state:
    st.session_state.srs = SRSManager()

if 'drill_state' not in st.session_state:
    st.session_state.drill_state = {
        'active': False,
        'mode': 'quick_5',
        'questions': [],
        'current_index': 0,
        'answers': [],
        'start_time': None
    }

# Page header
st.title("🎯 Practice Drills")
st.markdown("Test your knowledge with interactive quizzes!")

# Drill mode selection
if not st.session_state.drill_state['active']:
    st.markdown("### Select Drill Mode")
    
    col1, col2, col3 = st.columns(3)
    
    with col1:
        if st.button("⚡ Quick 5", use_container_width=True, type="primary"):
            start_drill('quick_5', 5)
            st.rerun()
    
    with col2:
        if st.button("📝 Exam 20", use_container_width=True):
            start_drill('exam_20', 20)
            st.rerun()
    
    with col3:
        if st.button("🎲 Custom", use_container_width=True):
            start_drill('custom', 10)
            st.rerun()
    
    st.markdown("---")
    st.info("""
    **Quick 5**: 5 random questions for quick practice
    
    **Exam 20**: 20 questions simulating a real test
    
    **Custom**: Create your own test with specific verbs and tenses
    """)

# Active drill
elif st.session_state.drill_state['active']:
    drill = st.session_state.drill_state
    
    if drill['current_index'] < len(drill['questions']):
        show_question(drill)
    else:
        show_results(drill)

# Sidebar
with st.sidebar:
    st.subheader("Drill Stats")
    
    if st.session_state.drill_state['active']:
        drill = st.session_state.drill_state
        st.metric("Questions", f"{drill['current_index']}/{len(drill['questions'])}")
        
        correct = sum(1 for a in drill['answers'] if a['correct'])
        st.metric("Correct", f"{correct}/{len(drill['answers'])}")
        
        if st.button("❌ End Drill", use_container_width=True):
            st.session_state.drill_state['active'] = False
            st.rerun()
    else:
        st.metric("Total Drills", st.session_state.user_progress['drills_completed'])
    
    st.markdown("---")
    st.subheader("Tips")
    st.markdown("""
    - Read questions carefully
    - Take your time
    - Review mistakes
    - Practice regularly!
    """)


def start_drill(mode: str, count: int):
    """Start a new drill"""
    engine = st.session_state.engine
    
    # Generate questions
    questions = []
    verbs = engine.get_random_verbs(count, tags='basic,common,core')
    tenses = ['presente', 'pretérito', 'imperfecto']
    persons = engine.patterns['persons']
    
    for verb in verbs:
        tense = random.choice(tenses)
        person = random.choice(persons)
        
        correct_answer = engine.conjugate(verb['infinitive'], tense, person)
        
        # Generate wrong options
        options = [correct_answer['form']]
        while len(options) < 4:
            random_person = random.choice(persons)
            wrong_form = engine.conjugate(verb['infinitive'], tense, random_person)
            if wrong_form and wrong_form['form'] not in options:
                options.append(wrong_form['form'])
        
        random.shuffle(options)
        
        tense_info = engine.get_tense_info(tense)
        person_label = engine.get_person_label(person)
        
        questions.append({
            'verb': verb['infinitive'],
            'verb_english': verb['english'],
            'tense': tense,
            'tense_label': tense_info['label'],
            'person': person,
            'person_label': person_label,
            'question': f"What is the {tense_info['label']} form of '{verb['infinitive']}' ({verb['english']}) for {person_label}?",
            'options': options,
            'correct': correct_answer['form']
        })
    
    st.session_state.drill_state = {
        'active': True,
        'mode': mode,
        'questions': questions,
        'current_index': 0,
        'answers': [],
        'start_time': datetime.now()
    }


def show_question(drill: dict):
    """Display current question"""
    question = drill['questions'][drill['current_index']]
    
    st.markdown(f"### Question {drill['current_index'] + 1} of {len(drill['questions'])}")
    st.markdown(f"**{question['question']}**")
    
    st.markdown("---")
    
    # Options
    col1, col2 = st.columns(2)
    
    for i, option in enumerate(question['options']):
        with col1 if i % 2 == 0 else col2:
            if st.button(option, key=f"option_{i}", use_container_width=True):
                submit_answer(drill, option)
                st.rerun()
    
    st.markdown("---")
    
    # Skip button
    if st.button("⏭️ Skip Question", use_container_width=True):
        submit_answer(drill, None)
        st.rerun()


def submit_answer(drill: dict, answer: str):
    """Submit and validate answer"""
    question = drill['questions'][drill['current_index']]
    
    is_correct = answer == question['correct'] if answer else False
    
    drill['answers'].append({
        'question': question,
        'user_answer': answer,
        'correct': is_correct
    })
    
    drill['current_index'] += 1
    
    # Update user progress if drill complete
    if drill['current_index'] >= len(drill['questions']):
        st.session_state.user_progress['drills_completed'] += 1


def show_results(drill: dict):
    """Show drill results"""
    correct = sum(1 for a in drill['answers'] if a['correct'])
    total = len(drill['answers'])
    percentage = round((correct / total) * 100) if total > 0 else 0
    
    time_elapsed = (datetime.now() - drill['start_time']).total_seconds()
    minutes = int(time_elapsed // 60)
    seconds = int(time_elapsed % 60)
    
    st.success("🎉 Drill Complete!")
    
    # Results summary
    col1, col2, col3 = st.columns(3)
    
    with col1:
        st.metric("Score", f"{correct}/{total}")
    
    with col2:
        st.metric("Percentage", f"{percentage}%")
    
    with col3:
        st.metric("Time", f"{minutes}:{seconds:02d}")
    
    st.markdown("---")
    
    # Performance message
    if percentage >= 80:
        st.success("¡Excelente! Great job! 🌟")
    elif percentage >= 60:
        st.info("Good work! Keep practicing! 💪")
    else:
        st.warning("Keep going! Practice makes perfect! 📚")
    
    # Show mistakes
    mistakes = [a for a in drill['answers'] if not a['correct']]
    if mistakes:
        st.markdown("### Review These")
        
        for i, mistake in enumerate(mistakes, 1):
            q = mistake['question']
            with st.expander(f"Question {i}: {q['verb']} ({q['tense_label']})"):
                st.markdown(f"**Question**: {q['question']}")
                st.markdown(f"**Your answer**: {mistake['user_answer'] or 'Skipped'}")
                st.markdown(f"**Correct answer**: ✅ {q['correct']}")
    
    st.markdown("---")
    
    # Action buttons
    col1, col2, col3 = st.columns(3)
    
    with col1:
        if st.button("🔄 Try Again", use_container_width=True):
            start_drill(drill['mode'], len(drill['questions']))
            st.rerun()
    
    with col2:
        if st.button("🆕 New Drill", use_container_width=True):
            st.session_state.drill_state['active'] = False
            st.rerun()
    
    with col3:
        if st.button("📊 View Progress", use_container_width=True):
            st.switch_page("pages/04_Progress.py")
