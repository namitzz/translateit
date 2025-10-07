"""
Decks page - Create and manage custom study decks
"""

import streamlit as st
import sys
from pathlib import Path

sys.path.append(str(Path(__file__).parent.parent))

from utils.engine import VerbEngine
from utils.io import export_to_csv, import_from_csv

st.set_page_config(page_title="Decks - SpanishVerb Tutor", page_icon="📚", layout="wide")

# Initialize
if 'engine' not in st.session_state:
    st.session_state.engine = VerbEngine()
    st.session_state.engine.initialize()

if 'custom_decks' not in st.session_state:
    st.session_state.custom_decks = []

st.title("📚 Study Decks")
st.markdown("Create custom decks for focused practice")

# Tabs
tab1, tab2, tab3 = st.tabs(["Browse Verbs", "Create Deck", "Import/Export"])

with tab1:
    st.subheader("Browse All Verbs")
    
    # Filters
    col1, col2, col3 = st.columns(3)
    
    with col1:
        group_filter = st.selectbox("Verb Group", ["All", "ar", "er", "ir", "irregular"])
    
    with col2:
        tag_filter = st.selectbox("Tags", ["All", "basic", "common", "core"])
    
    with col3:
        irregular_filter = st.selectbox("Type", ["All", "Regular", "Irregular"])
    
    # Build filter dict
    filters = {}
    if group_filter != "All":
        filters['group'] = group_filter
    if tag_filter != "All":
        filters['tags'] = tag_filter
    if irregular_filter == "Regular":
        filters['irregular'] = False
    elif irregular_filter == "Irregular":
        filters['irregular'] = True
    
    # Get verbs
    verbs = st.session_state.engine.get_verbs(**filters)
    
    st.markdown(f"**Found {len(verbs)} verbs**")
    
    # Display verbs in table
    if verbs:
        # Convert to display format
        verb_data = []
        for verb in verbs:
            verb_data.append({
                "Infinitive": verb['infinitive'],
                "English": verb['english'],
                "Group": verb['group'],
                "Irregular": "Yes" if verb['irregular'] == 'yes' else "No",
                "Tags": verb['tags']
            })
        
        st.dataframe(verb_data, use_container_width=True, height=400)
        
        # Export button
        if st.button("📥 Export to CSV"):
            import tempfile
            with tempfile.NamedTemporaryFile(mode='w', delete=False, suffix='.csv') as f:
                export_to_csv(verb_data, f.name)
                with open(f.name, 'r') as file:
                    st.download_button(
                        "Download CSV",
                        file.read(),
                        "verbs.csv",
                        "text/csv"
                    )

with tab2:
    st.subheader("Create Custom Deck")
    
    deck_name = st.text_input("Deck Name", placeholder="e.g., 'Common -ar verbs'")
    
    # Verb selection
    st.markdown("**Select Verbs**")
    
    col1, col2 = st.columns(2)
    
    with col1:
        select_by = st.radio("Select by", ["Individual", "Filter"])
    
    if select_by == "Individual":
        all_verbs = st.session_state.engine.get_verbs()
        verb_options = [f"{v['infinitive']} ({v['english']})" for v in all_verbs]
        selected_verbs = st.multiselect("Choose verbs", verb_options)
    else:
        with col2:
            deck_group = st.selectbox("Group", ["ar", "er", "ir", "irregular"], key="deck_group")
        
        deck_tags = st.multiselect("Tags", ["basic", "common", "core"])
        
        filters = {'group': deck_group}
        if deck_tags:
            filters['tags'] = ','.join(deck_tags)
        
        filtered_verbs = st.session_state.engine.get_verbs(**filters)
        st.info(f"This will include {len(filtered_verbs)} verbs")
    
    # Tense selection
    st.markdown("**Select Tenses**")
    tenses = st.multiselect(
        "Choose tenses",
        ['presente', 'pretérito', 'imperfecto', 'futuro', 'condicional', 'presente_subjuntivo'],
        default=['presente']
    )
    
    if st.button("Create Deck", type="primary"):
        if not deck_name:
            st.error("Please enter a deck name")
        elif not tenses:
            st.error("Please select at least one tense")
        else:
            deck = {
                'name': deck_name,
                'verbs': selected_verbs if select_by == "Individual" else [v['infinitive'] for v in filtered_verbs],
                'tenses': tenses,
                'created': st.session_state.get('deck_count', 0) + 1
            }
            st.session_state.custom_decks.append(deck)
            st.session_state['deck_count'] = st.session_state.get('deck_count', 0) + 1
            st.success(f"✅ Created deck '{deck_name}' with {len(deck['verbs'])} verbs!")
    
    # Display existing decks
    if st.session_state.custom_decks:
        st.markdown("---")
        st.markdown("### Your Decks")
        
        for i, deck in enumerate(st.session_state.custom_decks):
            with st.expander(f"{deck['name']} ({len(deck['verbs'])} verbs)"):
                st.write(f"**Tenses**: {', '.join(deck['tenses'])}")
                st.write(f"**Verbs**: {', '.join(deck['verbs'][:10])}{' ...' if len(deck['verbs']) > 10 else ''}")
                
                col1, col2 = st.columns(2)
                with col1:
                    if st.button("🎯 Practice", key=f"practice_{i}"):
                        st.session_state['practice_deck'] = deck
                        st.switch_page("pages/02_Drills.py")
                
                with col2:
                    if st.button("🗑️ Delete", key=f"delete_{i}"):
                        st.session_state.custom_decks.pop(i)
                        st.rerun()

with tab3:
    st.subheader("Import/Export Decks")
    
    st.markdown("### Export Deck")
    st.markdown("Download your custom decks as CSV files to share or backup.")
    
    if st.session_state.custom_decks:
        deck_to_export = st.selectbox(
            "Select deck to export",
            [deck['name'] for deck in st.session_state.custom_decks]
        )
        
        if st.button("📤 Export Deck"):
            deck = next(d for d in st.session_state.custom_decks if d['name'] == deck_to_export)
            
            # Convert to CSV format
            csv_data = "infinitive,tenses\n"
            for verb in deck['verbs']:
                csv_data += f"{verb},\"{','.join(deck['tenses'])}\"\n"
            
            st.download_button(
                "Download Deck CSV",
                csv_data,
                f"{deck_to_export}.csv",
                "text/csv"
            )
    else:
        st.info("No custom decks created yet")
    
    st.markdown("---")
    st.markdown("### Import Deck")
    st.markdown("Upload a CSV file to import a custom deck.")
    
    uploaded_file = st.file_uploader("Choose CSV file", type=['csv'])
    
    if uploaded_file:
        import csv
        import io
        
        content = uploaded_file.read().decode('utf-8')
        reader = csv.DictReader(io.StringIO(content))
        
        verbs = []
        tenses_set = set()
        
        for row in reader:
            verbs.append(row['infinitive'])
            if 'tenses' in row:
                tenses_set.update(row['tenses'].split(','))
        
        st.write(f"Found {len(verbs)} verbs")
        
        import_name = st.text_input("Deck name", value="Imported Deck")
        
        if st.button("Import"):
            deck = {
                'name': import_name,
                'verbs': verbs,
                'tenses': list(tenses_set) if tenses_set else ['presente'],
                'created': st.session_state.get('deck_count', 0) + 1
            }
            st.session_state.custom_decks.append(deck)
            st.session_state['deck_count'] = st.session_state.get('deck_count', 0) + 1
            st.success(f"✅ Imported deck '{import_name}'!")
            st.rerun()
