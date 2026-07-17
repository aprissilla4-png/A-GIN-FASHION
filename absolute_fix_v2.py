import re

def fix_internal_balance(c):
    starts = c.count('<div')
    ends = c.count('</div')
    diff = starts - ends
    if diff > 0:
        c += '\n' + '</div>' * diff
    elif diff < 0:
        c = '<div>' * abs(diff) + c
    return c

def absolute_fix_v2():
    with open('src/components/AdminPanel.tsx', 'r') as f:
        content = f.read()

    match_start = re.search(r'\{adminTab === "marketing" \? \(', content)
    match_end = re.search(r'\) : null\}', content)
    
    if not match_start or not match_end:
        print("Could not find ternary block")
        return

    prefix = content[:match_start.start()]
    suffix = content[match_end.end():]
    ternary = content[match_start.start():match_end.end()]
    
    pattern = r'\) : adminTab === "([\w-]+)" \? \('
    parts = re.split(pattern, ternary)
    
    def clean(c, is_first=False):
    if is_first:
        c = re.sub(r'^\{adminTab === "marketing" \? \(', '', c)
    c = c.strip()
    
    # Remove all trailing </div>
    while c.endswith('</div>'):
        c = c[:-6].strip()
        
    # Remove all leading <div ...>
    while c.startswith('<div'):
        tag_end = c.find('>')
        if tag_end != -1:
            c = c[tag_end+1:].strip()
        else:
            break
            
    return c

def absolute_fix_v3():
    with open('src/components/AdminPanel.tsx', 'r') as f:
        content = f.read()

    match_start = re.search(r'\{adminTab === "marketing" \? \(', content)
    match_end = re.search(r'\) : null\}', content)
    
    if not match_start or not match_end:
        print("Could not find ternary block")
        return

    prefix = content[:match_start.start()]
    suffix = content[match_end.end():]
    ternary = content[match_start.start():match_end.end()]
    
    pattern = r'\) : adminTab === "([\w-]+)" \? \('
    parts = re.split(pattern, ternary)
    
    new_ternary = '{adminTab === "marketing" ? (\n'
    new_ternary += '    <div className="space-y-6">\n'
    new_ternary += clean(parts[0], True)
    new_ternary += '\n    </div>\n'
    
    for i in range(1, len(parts), 2):
        name = parts[i]
        content_branch = parts[i+1]
        new_ternary += f'  ) : adminTab === "{name}" ? (\n'
        new_ternary += '    <div className="space-y-6">\n'
        new_ternary += clean(content_branch)
        new_ternary += '\n    </div>\n'
        
    new_ternary += '  ) : null}'
    
    with open('src/components/AdminPanel.tsx', 'w') as f:
        f.write(prefix + new_ternary + suffix)

absolute_fix_v3()
