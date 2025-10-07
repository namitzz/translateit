"""
Verb conjugation engine for Python/Streamlit
"""

import json
from pathlib import Path
from typing import Dict, List, Optional, Tuple


class VerbEngine:
    def __init__(self, content_dir: str = "content"):
        self.content_dir = Path(content_dir)
        self.verbs: List[Dict] = []
        self.conjugations: Dict[str, str] = {}
        self.patterns: Dict = {}
        self.initialized = False
        
    def initialize(self):
        """Load all verb data"""
        if self.initialized:
            return
            
        try:
            from .io import load_verbs, load_conjugations, load_patterns
            
            self.verbs = load_verbs()
            conjugations_list = load_conjugations()
            self.patterns = load_patterns()
            
            # Build conjugations lookup
            for conj in conjugations_list:
                key = f"{conj['infinitive']}:{conj['tense']}:{conj['person']}"
                self.conjugations[key] = conj['form']
            
            self.initialized = True
            print(f"✓ VerbEngine initialized with {len(self.verbs)} verbs")
        except Exception as e:
            print(f"Failed to initialize VerbEngine: {e}")
            raise
    
    def get_verb(self, infinitive: str) -> Optional[Dict]:
        """Get verb by infinitive"""
        if not self.initialized:
            self.initialize()
        
        infinitive = infinitive.lower()
        for verb in self.verbs:
            if verb['infinitive'] == infinitive:
                return verb
        return None
    
    def get_verbs(self, **filters) -> List[Dict]:
        """Get verbs with filters"""
        if not self.initialized:
            self.initialize()
        
        result = list(self.verbs)
        
        if 'group' in filters:
            result = [v for v in result if v.get('group') == filters['group']]
        if 'irregular' in filters:
            is_irregular = 'yes' if filters['irregular'] else 'no'
            result = [v for v in result if v.get('irregular') == is_irregular]
        if 'tags' in filters:
            tags = filters['tags'].split(',')
            result = [v for v in result if any(tag in v.get('tags', '') for tag in tags)]
        
        return result
    
    def conjugate(self, infinitive: str, tense: str, person: Optional[str] = None) -> Dict:
        """Conjugate a verb"""
        if not self.initialized:
            self.initialize()
        
        verb = self.get_verb(infinitive)
        if not verb:
            return None
        
        if person:
            form = self._conjugate_form(verb, tense, person)
            return {
                'form': form,
                'verb': verb,
                'tense': tense,
                'person': person
            }
        
        # All persons
        persons = self.patterns['persons']
        forms = {}
        for p in persons:
            forms[p] = self._conjugate_form(verb, tense, p)
        
        return {
            'forms': forms,
            'verb': verb,
            'tense': tense
        }
    
    def _conjugate_form(self, verb: Dict, tense: str, person: str) -> str:
        """Get conjugated form for specific verb/tense/person"""
        # Check for override
        key = f"{verb['infinitive']}:{tense}:{person}"
        if key in self.conjugations:
            return self.conjugations[key]
        
        # Generate from patterns
        return self._generate_conjugation(verb, tense, person)
    
    def _generate_conjugation(self, verb: Dict, tense: str, person: str) -> str:
        """Generate conjugation using patterns"""
        infinitive = verb['infinitive']
        ending = infinitive[-2:]
        stem = infinitive[:-2]
        
        # Get regular ending
        regular_endings = self.patterns['regular_endings'].get(ending, {})
        if tense not in regular_endings:
            return infinitive
        
        ending_suffix = regular_endings[tense].get(person, '')
        
        # For future/conditional, use full infinitive
        if tense in ['futuro', 'condicional']:
            return infinitive + ending_suffix
        
        # Apply stem changes for present tense
        if tense in ['presente', 'presente_subjuntivo']:
            stem = self._apply_stem_change(stem, verb, person)
        
        # Apply spelling changes
        stem = self._apply_spelling_changes(stem, verb, tense, person, ending)
        
        return stem + ending_suffix
    
    def _apply_stem_change(self, stem: str, verb: Dict, person: str) -> str:
        """Apply stem changes (e→ie, o→ue, etc.)"""
        affected_persons = ['yo', 'tú', 'él', 'ellos']
        if person not in affected_persons:
            return stem
        
        infinitive = verb['infinitive']
        
        # e → ie
        if infinitive in ['pensar', 'querer', 'sentir', 'empezar', 'comenzar', 'cerrar',
                         'despertar', 'recomendar', 'entender', 'perder']:
            import re
            return re.sub(r'e([^e]*)$', r'ie\1', stem)
        
        # o → ue
        if infinitive in ['poder', 'volver', 'dormir', 'encontrar', 'contar', 'costar',
                         'mostrar', 'probar', 'recordar', 'mover', 'doler']:
            import re
            return re.sub(r'o([^o]*)$', r'ue\1', stem)
        
        # e → i
        if infinitive in ['pedir', 'servir', 'seguir', 'conseguir']:
            import re
            return re.sub(r'e([^e]*)$', r'i\1', stem)
        
        # u → ue (jugar only)
        if infinitive == 'jugar':
            return stem.replace('u', 'ue', 1)
        
        return stem
    
    def _apply_spelling_changes(self, stem: str, verb: Dict, tense: str, 
                                person: str, ending: str) -> str:
        """Apply orthographic spelling changes"""
        infinitive = verb['infinitive']
        
        # c → qu before e
        if infinitive.endswith('car') and tense == 'pretérito' and person == 'yo':
            return stem[:-1] + 'qu'
        
        # g → gu before e
        if infinitive.endswith('gar') and tense == 'pretérito' and person == 'yo':
            return stem[:-1] + 'gu'
        
        # z → c before e
        if infinitive.endswith('zar') and tense == 'pretérito' and person == 'yo':
            return stem[:-1] + 'c'
        
        # cer/cir → zco
        if (infinitive.endswith('cer') or infinitive.endswith('cir')) and \
           tense == 'presente' and person == 'yo':
            if len(stem) > 0 and stem[-1] in 'aeiou':
                return stem + 'z'
        
        # guir → go
        if infinitive.endswith('guir') and tense == 'presente' and person == 'yo':
            return stem[:-1]
        
        return stem
    
    def get_tense_info(self, tense: str) -> Dict:
        """Get tense label and explanation"""
        return {
            'label': self.patterns.get('tense_labels', {}).get(tense, tense),
            'explanation': self.patterns.get('tense_explanations', {}).get(tense, '')
        }
    
    def get_person_label(self, person: str) -> str:
        """Get person label in English"""
        return self.patterns.get('person_labels', {}).get(person, person)
    
    def get_random_verbs(self, count: int, **filters) -> List[Dict]:
        """Get random verbs with optional filters"""
        import random
        verbs = self.get_verbs(**filters)
        random.shuffle(verbs)
        return verbs[:min(count, len(verbs))]
    
    def validate_conjugation(self, infinitive: str, tense: str, person: str, 
                           user_answer: str) -> Dict:
        """Validate user's conjugation answer"""
        verb = self.get_verb(infinitive)
        if not verb:
            return {'correct': False, 'expected': '', 'provided': user_answer}
        
        correct = self._conjugate_form(verb, tense, person)
        normalized = user_answer.strip().lower()
        
        return {
            'correct': normalized == correct.lower(),
            'expected': correct,
            'provided': user_answer
        }
