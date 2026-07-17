import re

def get_balanced_branch(c, is_first=False):
    if is_first:
        c = re.sub(r'^\{adminTab === "marketing" \? \(', '', c)
    c = c.strip()
    
    # Remove any ) from the end that might have been caught by split
    if c.endswith(')'):
        c = c[:-1].strip()

    # Calculate internal balance of the core content
    starts = c.count('<div')
    ends = c.count('</div')
    diff = starts - ends
    
    if diff > 0:
        # Too many opens, add closes
        c += '\n' + '</div>' * diff
    elif diff < 0:
        # Too many closes, add opens
        c = '<div>' * abs(diff) + c
        
    # Now wrap it in exactly ONE div to be sure
    return '    <div className="space-y-6 animate-fade-in">\n' + c + '\n    </div>'

def rewrite_admin_perfectly():
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
    
    pattern = r'\s*\) : adminTab === "([\w-]+)" \? \(\s*'
    parts = re.split(pattern, ternary)
    
    new_ternary = '{adminTab === "marketing" ? (\n'
    new_ternary += get_balanced_branch(parts[0], True)
    
    for i in range(1, len(parts), 2):
        name = parts[i]
        content_branch = parts[i+1]
        new_ternary += f'\n  ) : adminTab === "{name}" ? (\n'
        new_ternary += get_balanced_branch(content_branch)
        
    new_ternary += '\n  ) : null}'
    
    with open('src/components/AdminPanel.tsx', 'w') as f:
        f.write(prefix + new_ternary + suffix)

rewrite_admin_perfectly()
