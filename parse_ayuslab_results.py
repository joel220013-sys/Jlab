import re

with open('C:/Users/User/.gemini/antigravity-ide/brain/11fd5cf4-d20b-4ae8-9f05-6d6914e60bc5/scratch/result_entry.html', 'r', encoding='utf-8', errors='ignore') as f:
    html = f.read()
    print("result_entry.html length:", len(html))
    # Look for table headers or parameter rows
    for match in re.finditer(r'<tr[^>]*>.*?</tr>', html, re.DOTALL):
        row = match.group(0)
        if 'unit' in row.lower() or 'reference' in row.lower() or 'range' in row.lower() or 'mg/dl' in row.lower():
            # strip tags
            text = re.sub(r'<[^>]+>', ' | ', row)
            text = ' '.join(text.split())
            print(text[:150])
