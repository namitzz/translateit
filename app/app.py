"""
SpanishVerb Tutor - Streamlit App
Main entry point with home page
"""

import streamlit as st
import sys
from pathlib import Path

# Add utils to path
sys.path.append(str(Path(__file__).parent))

from utils.engine import VerbEngine
from utils.srs import SRSManager
from utils.io import load_verbs, load_conjugations, load_patterns, load_phrases

# Page config
st.set_page_config(
    page_title="SpanishVerb Tutor",
    page_icon="📚",
    layout="wide",
    initial_sidebar_state="expanded"
)

# Custom CSS
st.markdown("""
<style>
    .main-header {
        text-align: center;
        padding: 2rem 0;
        background: linear-gradient(135deg, #4A90E2 0%, #50C878 100%);
        color: white;
        border-radius: 10px;
        margin-bottom: 2rem;
    }
    .feature-card {
        padding: 1.5rem;
        background: #f8f9fa;
        border-radius: 8px;
        border-left: 4px solid #4A90E2;
        margin-bottom: 1rem;
    }
    .stat-box {
        text-align: center;
        padding: 1rem;
        background: white;
        border-radius: 8px;
        box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }
    .stat-value {
        font-size: 2rem;
        font-weight: bold;
        color: #4A90E2;
    }
</style>
""", unsafe_allow_html=True)

# Initialize session state
if 'engine' not in st.session_state:
    st.session_state.engine = VerbEngine()
    st.session_state.srs = SRSManager()
    
if 'user_progress' not in st.session_state:
    st.session_state.user_progress = {
        'verbs_learned': 0,
        'drills_completed': 0,
        'streak_days': 0,
        'level': 'A1'
    }

# Sidebar
with st.sidebar:
    st.image("web/assets/logo.svg", width=100)
    st.title("SpanishVerb Tutor")
    st.markdown("---")
    
    # User progress
    st.subheader("Your Progress")
    col1, col2 = st.columns(2)
    with col1:
        st.metric("Verbs Learned", st.session_state.user_progress['verbs_learned'])
    with col2:
        st.metric("Streak", f"{st.session_state.user_progress['streak_days']} days")
    
    st.metric("Drills Done", st.session_state.user_progress['drills_completed'])
    
    st.markdown("---")
    
    # Settings
    st.subheader("Settings")
    level = st.selectbox("Your Level", ["A1", "A2", "B1"], 
                         index=["A1", "A2", "B1"].index(st.session_state.user_progress['level']))
    st.session_state.user_progress['level'] = level
    
    tts_enabled = st.checkbox("Enable Text-to-Speech", value=True)
    llm_enabled = st.checkbox("LLM Assistance (Optional)", value=False)
    
    if llm_enabled:
        llm_endpoint = st.text_input("LLM Endpoint", placeholder="http://localhost:11434")

# Main content
st.markdown("""
<div class="main-header">
    <h1>🇪🇸 SpanishVerb Tutor</h1>
    <p>Master Spanish verb conjugations with interactive practice</p>
</div>
""", unsafe_allow_html=True)

# Welcome message
st.markdown("""
Welcome to **SpanishVerb Tutor**! This app helps you learn and master Spanish verb conjugations
through interactive chatting, quizzes, and spaced repetition practice.

### 🎯 What You Can Do:
""")

col1, col2, col3 = st.columns(3)

with col1:
    st.markdown("""
    <div class="feature-card">
        <h3>💬 Chat & Learn</h3>
        <p>Ask questions about verbs, get conjugations, and see usage examples in context.</p>
    </div>
    """, unsafe_allow_html=True)

with col2:
    st.markdown("""
    <div class="feature-card">
        <h3>🎯 Practice Drills</h3>
        <p>Take quizzes with multiple choice, fill-in-the-blank, and error correction questions.</p>
    </div>
    """, unsafe_allow_html=True)

with col3:
    st.markdown("""
    <div class="feature-card">
        <h3>📊 Track Progress</h3>
        <p>Monitor your learning with statistics, streaks, and personalized weak spot analysis.</p>
    </div>
    """, unsafe_allow_html=True)

# Quick stats
st.markdown("### 📈 Today's Stats")
col1, col2, col3, col4 = st.columns(4)

with col1:
    st.markdown("""
    <div class="stat-box">
        <div class="stat-value">190</div>
        <div>Total Verbs</div>
    </div>
    """, unsafe_allow_html=True)

with col2:
    st.markdown(f"""
    <div class="stat-box">
        <div class="stat-value">{st.session_state.user_progress['verbs_learned']}</div>
        <div>Learned</div>
    </div>
    """, unsafe_allow_html=True)

with col3:
    st.markdown(f"""
    <div class="stat-box">
        <div class="stat-value">{st.session_state.user_progress['drills_completed']}</div>
        <div>Drills</div>
    </div>
    """, unsafe_allow_html=True)

with col4:
    st.markdown(f"""
    <div class="stat-box">
        <div class="stat-value">{st.session_state.user_progress['streak_days']}</div>
        <div>Day Streak</div>
    </div>
    """, unsafe_allow_html=True)

# Getting started
st.markdown("---")
st.markdown("### 🚀 Getting Started")
st.info("""
**First time here?** Navigate using the sidebar to:
1. **Chat** - Ask questions and get instant verb help
2. **Drills** - Practice with interactive quizzes
3. **Decks** - Create custom study decks
4. **Progress** - View detailed statistics and weak areas
""")

# Quick actions
st.markdown("### ⚡ Quick Actions")
col1, col2, col3 = st.columns(3)

with col1:
    if st.button("🎯 Start Quick Quiz", use_container_width=True):
        st.switch_page("pages/02_Drills.py")

with col2:
    if st.button("💬 Chat with Tutor", use_container_width=True):
        st.switch_page("pages/01_Chat.py")

with col3:
    if st.button("📊 View Progress", use_container_width=True):
        st.switch_page("pages/04_Progress.py")

# Footer
st.markdown("---")
st.markdown("""
<div style="text-align: center; color: #7F8C8D; padding: 2rem 0;">
    <p>Made with ❤️ for Spanish learners | <a href="https://github.com/namitzz/translateit">GitHub</a></p>
    <p><small>Works fully offline after first load • PWA available at GitHub Pages</small></p>
</div>
""", unsafe_allow_html=True)
