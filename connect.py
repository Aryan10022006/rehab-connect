import firebase_admin
from firebase_admin import credentials, firestore
import json
import datetime

cred = credentials.Certificate('grippyqc-b856a140307c.json')
firebase_admin.initialize_app(cred)
db = firestore.client()

def get_document_data(doc_ref):
    doc = doc_ref.get()
    data = doc.to_dict() or {}
    # Recursively get subcollections
    subcollections = {}
    for subcol in doc_ref.collections():
        subcollections[subcol.id] = {}
        for subdoc in subcol.stream():
            subcollections[subcol.id][subdoc.id] = get_document_data(subdoc.reference)
    if subcollections:
        data['_subcollections'] = subcollections
    return data

def get_collection_data(col_ref):
    collection_data = {}
    for doc in col_ref.stream():
        collection_data[doc.id] = get_document_data(doc.reference)
    return collection_data

def export_firestore():
    all_data = {}
    for col in db.collections():
        all_data[col.id] = get_collection_data(col)
    return all_data

class EnhancedJSONEncoder(json.JSONEncoder):
    def default(self, obj):
        # Handle Firestore timestamp
        if isinstance(obj, datetime.datetime):
            return obj.isoformat()
        # Handle other types as needed (e.g., bytes)
        return super().default(obj)

if __name__ == "__main__":
    data = export_firestore()
    with open('firestore_full_export.json', 'w', encoding='utf-8') as f:
        json.dump(data, f, indent=2, ensure_ascii=False, cls=EnhancedJSONEncoder)
    print("Exported full Firestore database to firestore_full_export.json")