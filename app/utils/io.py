"""
I/O utilities for loading content data
"""

import csv
import json
from pathlib import Path
from typing import List, Dict


def get_content_dir() -> Path:
    """Get content directory path"""
    # Try app/content first, then fall back to ../content
    app_content = Path(__file__).parent.parent / "content"
    if app_content.exists():
        return app_content
    
    root_content = Path(__file__).parent.parent.parent / "content"
    if root_content.exists():
        return root_content
    
    raise FileNotFoundError("Content directory not found")


def load_csv(filename: str) -> List[Dict]:
    """Load CSV file and return list of dictionaries"""
    content_dir = get_content_dir()
    filepath = content_dir / filename
    
    if not filepath.exists():
        print(f"Warning: {filepath} not found")
        return []
    
    data = []
    with open(filepath, 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        for row in reader:
            data.append(row)
    
    return data


def load_json(filename: str) -> Dict:
    """Load JSON file"""
    content_dir = get_content_dir()
    filepath = content_dir / filename
    
    if not filepath.exists():
        print(f"Warning: {filepath} not found")
        return {}
    
    with open(filepath, 'r', encoding='utf-8') as f:
        return json.load(f)


def load_verbs() -> List[Dict]:
    """Load verbs from CSV"""
    return load_csv('verbs.csv')


def load_conjugations() -> List[Dict]:
    """Load conjugations from CSV"""
    return load_csv('conjugations.csv')


def load_patterns() -> Dict:
    """Load conjugation patterns from JSON"""
    return load_json('patterns.json')


def load_phrases() -> List[Dict]:
    """Load example phrases from CSV"""
    return load_csv('phrases.csv')


def load_prompts() -> Dict:
    """Load quiz prompts from JSON"""
    return load_json('prompts.json')


def save_csv(filename: str, data: List[Dict]):
    """Save data to CSV file"""
    if not data:
        return
    
    content_dir = get_content_dir()
    filepath = content_dir / filename
    
    fieldnames = data[0].keys()
    
    with open(filepath, 'w', encoding='utf-8', newline='') as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(data)
    
    print(f"✓ Saved {len(data)} rows to {filename}")


def save_json(filename: str, data: Dict):
    """Save data to JSON file"""
    content_dir = get_content_dir()
    filepath = content_dir / filename
    
    with open(filepath, 'w', encoding='utf-8') as f:
        json.dump(data, f, indent=2, ensure_ascii=False)
    
    print(f"✓ Saved to {filename}")


def export_to_csv(data: List[Dict], output_path: str):
    """Export data to CSV file at specified path"""
    if not data:
        return
    
    fieldnames = data[0].keys()
    
    with open(output_path, 'w', encoding='utf-8', newline='') as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(data)
    
    print(f"✓ Exported to {output_path}")


def import_from_csv(filepath: str) -> List[Dict]:
    """Import data from CSV file"""
    data = []
    
    with open(filepath, 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        for row in reader:
            data.append(row)
    
    print(f"✓ Imported {len(data)} rows from {filepath}")
    return data
