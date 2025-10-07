"""
Spaced Repetition System (SRS) Manager using Leitner boxes
"""

from datetime import datetime, timedelta
from typing import Dict, List
import json


class SRSManager:
    """Leitner-style spaced repetition system"""
    
    def __init__(self):
        self.boxes = {
            1: [],  # Daily review
            2: [],  # Every 2 days
            3: [],  # Every 4 days
            4: [],  # Every 7 days
            5: []   # Every 14 days
        }
        self.box_intervals = {
            1: 1,
            2: 2,
            3: 4,
            4: 7,
            5: 14
        }
        
    def add_card(self, verb: str, tense: str, person: str, box: int = 1):
        """Add a card to a box"""
        card = {
            'verb': verb,
            'tense': tense,
            'person': person,
            'next_review': datetime.now().isoformat(),
            'correct_count': 0,
            'total_attempts': 0
        }
        
        if box in self.boxes:
            self.boxes[box].append(card)
    
    def get_due_cards(self, box: int = None) -> List[Dict]:
        """Get cards due for review"""
        now = datetime.now()
        due_cards = []
        
        boxes_to_check = [box] if box else list(self.boxes.keys())
        
        for b in boxes_to_check:
            for card in self.boxes[b]:
                next_review = datetime.fromisoformat(card['next_review'])
                if next_review <= now:
                    due_cards.append({**card, 'box': b})
        
        return due_cards
    
    def process_answer(self, card: Dict, correct: bool):
        """Process answer and move card to appropriate box"""
        box = card.get('box', 1)
        
        # Update statistics
        card['total_attempts'] += 1
        if correct:
            card['correct_count'] += 1
        
        # Remove from current box
        self.boxes[box] = [c for c in self.boxes[box] 
                          if not (c['verb'] == card['verb'] and 
                                 c['tense'] == card['tense'] and 
                                 c['person'] == card['person'])]
        
        # Determine new box
        if correct:
            new_box = min(box + 1, 5)
        else:
            new_box = max(box - 1, 1)
        
        # Calculate next review date
        interval_days = self.box_intervals[new_box]
        card['next_review'] = (datetime.now() + timedelta(days=interval_days)).isoformat()
        
        # Add to new box
        self.boxes[new_box].append(card)
        
        return new_box
    
    def get_mastery_level(self, verb: str) -> float:
        """Get mastery level for a verb (0-1)"""
        total_correct = 0
        total_attempts = 0
        
        for box in self.boxes.values():
            for card in box:
                if card['verb'] == verb:
                    total_correct += card['correct_count']
                    total_attempts += card['total_attempts']
        
        if total_attempts == 0:
            return 0.0
        
        return total_correct / total_attempts
    
    def get_weak_verbs(self, count: int = 5) -> List[str]:
        """Get verbs with lowest mastery"""
        verb_scores = {}
        
        for box in self.boxes.values():
            for card in box:
                verb = card['verb']
                if verb not in verb_scores:
                    verb_scores[verb] = {'correct': 0, 'total': 0}
                
                verb_scores[verb]['correct'] += card['correct_count']
                verb_scores[verb]['total'] += card['total_attempts']
        
        # Calculate mastery scores
        weak_verbs = []
        for verb, stats in verb_scores.items():
            if stats['total'] > 0:
                mastery = stats['correct'] / stats['total']
                weak_verbs.append((verb, mastery))
        
        # Sort by mastery (lowest first)
        weak_verbs.sort(key=lambda x: x[1])
        
        return [v[0] for v in weak_verbs[:count]]
    
    def get_statistics(self) -> Dict:
        """Get overall SRS statistics"""
        total_cards = sum(len(box) for box in self.boxes.values())
        due_cards = len(self.get_due_cards())
        
        box_distribution = {
            box: len(cards) for box, cards in self.boxes.items()
        }
        
        return {
            'total_cards': total_cards,
            'due_cards': due_cards,
            'box_distribution': box_distribution
        }
    
    def export_data(self) -> str:
        """Export SRS data as JSON"""
        return json.dumps(self.boxes, indent=2)
    
    def import_data(self, data: str):
        """Import SRS data from JSON"""
        try:
            imported = json.loads(data)
            # Convert keys to integers
            self.boxes = {int(k): v for k, v in imported.items()}
        except Exception as e:
            print(f"Failed to import SRS data: {e}")
