with open('C:/Users/User/.gemini/antigravity-ide/brain/11fd5cf4-d20b-4ae8-9f05-6d6914e60bc5/scratch/ajax_result_entry.js', 'r', encoding='utf-8', errors='ignore') as f:
    lines = f.readlines()
    print("Total lines in ajax_result_entry.js:", len(lines))
    for i, l in enumerate(lines[:100]):
        print(f"{i+1}: {l.rstrip()}")
