import re

def get_clean_content(c):
    # Remove the start string if it's there
    c = re.sub(r'^\{adminTab === "marketing" \? \(', '', c).strip()
    
    # Aggressively remove leading <div tags
    while c.startswith('<div'):
        tag_end = c.find('>')
        if tag_end != -1:
            c = c[tag_end+1:].strip()
        else:
            break
            
    # Aggressively remove trailing </div> tags
    while c.endswith('</div>'):
        c = c[:-6].strip()
        
    return c

def fix_admin_properly():
    with open('src/components/AdminPanel.tsx', 'r') as f:
        content = f.read()

    # Find the start and end of the ternary
    match_start = re.search(r'\{adminTab === "marketing" \? \(', content)
    match_end = re.search(r'\) : null\}', content)
    
    if not match_start or not match_end:
        print("Could not find ternary block")
        return

    start_idx = match_start.start()
    end_idx = match_end.end()
    
    ternary = content[start_idx:end_idx]
    
    pattern = r'\) : adminTab === "([\w-]+)" \? \('
    parts = re.split(pattern, ternary)
    
    new_ternary = '{adminTab === "marketing" ? (\n'
    new_ternary += '  <div className="space-y-6">\n'
    new_ternary += get_clean_content(parts[0])
    new_ternary += '\n  </div>\n'
    
    for i in range(1, len(parts), 2):
        name = parts[i]
        branch_content = parts[i+1]
        
        new_ternary += f') : adminTab === "{name}" ? (\n'
        new_ternary += '  <div className="space-y-6">\n'
        new_ternary += get_clean_content(branch_content)
        new_ternary += '\n  </div>\n'
        
    new_ternary += ') : null}'
    
    new_content = content[:start_idx] + new_ternary + content[end_idx:]
    
    with open('src/components/AdminPanel.tsx', 'w') as f:
        f.write(new_content)

fix_admin_properly()
