import csv
import re

def extract_pincode(address):
    if not address:
        return ""
    match = re.search(r"\b\d{6}\b", address)
    return match.group(0) if match else ""

with open('clinics_for_upload.csv', newline='', encoding='utf-8') as infile, \
     open('clinics_for_upload_with_pincode.csv', 'w', newline='', encoding='utf-8') as outfile:
    reader = csv.DictReader(infile)
    fieldnames = reader.fieldnames + ['pincode'] if 'pincode' not in reader.fieldnames else reader.fieldnames
    writer = csv.DictWriter(outfile, fieldnames=fieldnames)
    writer.writeheader()
    for row in reader:
        if not row.get('pincode'):
            row['pincode'] = extract_pincode(row.get('address', ''))
        writer.writerow(row)

print("Pincode extraction complete. Output: clinics_for_upload_with_pincode.csv")