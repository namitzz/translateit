"""
Progress page - Track learning statistics and progress
"""

import streamlit as st
import sys
from pathlib import Path
from datetime import datetime, timedelta

sys.path.append(str(Path(__file__).parent.parent))

from utils.srs import SRSManager

st.set_page_config(page_title="Progress - SpanishVerb Tutor", page_icon="📊", layout="wide")

# Initialize
if 'srs' not in st.session_state:
    st.session_state.srs = SRSManager()

if 'user_progress' not in st.session_state:
    st.session_state.user_progress = {
        'verbs_learned': 0,
        'drills_completed': 0,
        'streak_days': 0,
        'level': 'A1',
        'study_history': []
    }

st.title("📊 Your Progress")
st.markdown("Track your learning journey")

# Overview metrics
st.markdown("### 📈 Overview")

col1, col2, col3, col4 = st.columns(4)

with col1:
    st.metric(
        "Verbs Learned",
        st.session_state.user_progress['verbs_learned'],
        delta=None
    )

with col2:
    st.metric(
        "Streak Days",
        st.session_state.user_progress['streak_days'],
        delta="🔥" if st.session_state.user_progress['streak_days'] > 0 else None
    )

with col3:
    st.metric(
        "Drills Completed",
        st.session_state.user_progress['drills_completed'],
        delta=None
    )

with col4:
    st.metric(
        "Current Level",
        st.session_state.user_progress['level'],
        delta=None
    )

st.markdown("---")

# Charts
col1, col2 = st.columns(2)

with col1:
    st.markdown("### 🎯 Learning Progress")
    
    # Progress towards mastery
    total_verbs = 190
    learned = st.session_state.user_progress['verbs_learned']
    percentage = round((learned / total_verbs) * 100)
    
    st.progress(percentage / 100)
    st.markdown(f"**{learned} / {total_verbs} verbs** ({percentage}%)")
    
    # Next milestone
    milestones = [25, 50, 100, 150, 190]
    next_milestone = next((m for m in milestones if m > learned), 190)
    remaining = next_milestone - learned
    
    st.info(f"🎯 Next milestone: {next_milestone} verbs ({remaining} to go!)")

with col2:
    st.markdown("### 📚 SRS Distribution")
    
    srs_stats = st.session_state.srs.get_statistics()
    
    if srs_stats['total_cards'] > 0:
        box_dist = srs_stats['box_distribution']
        
        # Create simple bar chart data
        chart_data = {
            'Box': [f"Box {i}" for i in range(1, 6)],
            'Cards': [box_dist.get(i, 0) for i in range(1, 6)]
        }
        
        st.bar_chart(chart_data, x='Box', y='Cards', use_container_width=True)
        
        st.markdown(f"**Total cards**: {srs_stats['total_cards']}")
        st.markdown(f"**Due for review**: {srs_stats['due_cards']}")
    else:
        st.info("No SRS cards yet. Complete some drills to add cards!")

st.markdown("---")

# Weak spots
st.markdown("### ⚠️ Focus Areas")

weak_verbs = st.session_state.srs.get_weak_verbs(5)

if weak_verbs:
    st.warning("These verbs need more practice:")
    
    cols = st.columns(5)
    for i, verb in enumerate(weak_verbs):
        with cols[i]:
            st.markdown(f"**{verb}**")
            mastery = st.session_state.srs.get_mastery_level(verb)
            st.progress(mastery)
            st.caption(f"{round(mastery * 100)}%")
else:
    st.success("Great job! No weak areas identified yet.")

st.markdown("---")

# Study schedule
st.markdown("### 📅 Study Schedule")

col1, col2 = st.columns(2)

with col1:
    st.markdown("#### Daily Goal")
    
    daily_minutes = st.slider("Minutes per day", 5, 60, 20, 5)
    
    verbs_per_session = daily_minutes // 2  # ~2 minutes per verb
    days_to_complete = round((190 - learned) / verbs_per_session)
    
    st.info(f"At {daily_minutes} minutes/day, you'll master all verbs in approximately **{days_to_complete} days**!")

with col2:
    st.markdown("#### Exam Preparation")
    
    exam_date = st.date_input("Exam date (optional)", value=None)
    
    if exam_date:
        days_until = (exam_date - datetime.now().date()).days
        
        if days_until > 0:
            verbs_remaining = 190 - learned
            verbs_per_day = round(verbs_remaining / days_until)
            
            st.warning(f"📆 {days_until} days until exam")
            st.info(f"Study **{verbs_per_day} verbs/day** to be ready!")
        else:
            st.error("Exam date has passed!")

st.markdown("---")

# Activity history
st.markdown("### 📜 Recent Activity")

if st.session_state.user_progress.get('study_history'):
    for entry in st.session_state.user_progress['study_history'][-10:]:
        st.text(f"{entry['date']}: {entry['activity']}")
else:
    st.info("No activity yet. Start practicing to see your history!")

# Export progress
st.markdown("---")
st.markdown("### 💾 Data Management")

col1, col2 = st.columns(2)

with col1:
    if st.button("📥 Export Progress", use_container_width=True):
        # Export data as CSV
        import csv
        import io
        
        output = io.StringIO()
        writer = csv.writer(output)
        
        writer.writerow(['Metric', 'Value'])
        writer.writerow(['Verbs Learned', st.session_state.user_progress['verbs_learned']])
        writer.writerow(['Drills Completed', st.session_state.user_progress['drills_completed']])
        writer.writerow(['Streak Days', st.session_state.user_progress['streak_days']])
        writer.writerow(['Level', st.session_state.user_progress['level']])
        
        st.download_button(
            "Download CSV",
            output.getvalue(),
            "progress.csv",
            "text/csv"
        )

with col2:
    if st.button("🔄 Reset Progress", use_container_width=True):
        if st.session_state.get('confirm_reset'):
            st.session_state.user_progress = {
                'verbs_learned': 0,
                'drills_completed': 0,
                'streak_days': 0,
                'level': 'A1',
                'study_history': []
            }
            st.session_state.srs = SRSManager()
            st.session_state['confirm_reset'] = False
            st.success("Progress reset!")
            st.rerun()
        else:
            st.session_state['confirm_reset'] = True
            st.warning("Click again to confirm reset")

# Tips and motivation
st.markdown("---")
st.markdown("### 💡 Tips for Success")

tips = [
    "🔥 Practice daily to maintain your streak!",
    "📚 Focus on your weak areas first",
    "🎯 Set realistic daily goals",
    "💪 Review SRS cards regularly",
    "🌟 Celebrate small wins!",
    "📖 Use verbs in real sentences",
    "🗣️ Practice pronunciation with TTS",
    "👥 Study with friends for motivation"
]

import random
st.info(random.choice(tips))

# Achievements (future feature placeholder)
st.markdown("---")
st.markdown("### 🏆 Achievements")

col1, col2, col3, col4 = st.columns(4)

with col1:
    if st.session_state.user_progress['verbs_learned'] >= 25:
        st.success("🥉 25 Verbs")
    else:
        st.caption("🔒 25 Verbs")

with col2:
    if st.session_state.user_progress['verbs_learned'] >= 50:
        st.success("🥈 50 Verbs")
    else:
        st.caption("🔒 50 Verbs")

with col3:
    if st.session_state.user_progress['verbs_learned'] >= 100:
        st.success("🥇 100 Verbs")
    else:
        st.caption("🔒 100 Verbs")

with col4:
    if st.session_state.user_progress['streak_days'] >= 7:
        st.success("🔥 7-Day Streak")
    else:
        st.caption("🔒 7-Day Streak")
