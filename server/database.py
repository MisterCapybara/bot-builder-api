import sqlite3
import json

DB_PATH = "leads.db"

def init_db():
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS leads (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            email TEXT NOT NULL,
            modules TEXT,
            db_type TEXT,
            pro_feature_vote TEXT,
            sean_ellis_vote TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    ''')
    conn.commit()
    conn.close()

def save_lead(email: str, modules: list, db_type: str, pro_feature: str, sean_ellis: str):
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    
    modules_str = json.dumps(modules)
    
    cursor.execute('''
        INSERT INTO leads (email, modules, db_type, pro_feature_vote, sean_ellis_vote)
        VALUES (?, ?, ?, ?, ?)
    ''', (email, modules_str, db_type, pro_feature, sean_ellis))
    
    conn.commit()
    conn.close()