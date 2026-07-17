import re

def fix_branch_balance(c):
    # Strip start string if it's there
    c = re.sub(r'^\{adminTab === "marketing" \? \(', '', c).strip()
    
    # Calculate internal balance
    starts = c.count('<div')
    ends = c.count('</div')
    balance = starts - ends
    
    if balance > 0:
        # Too many starts, add ends
        c = c + '\n' + '        </div>' * balance
    elif balance < 0:
        # Too many ends, add starts
        # We wrap it in a div to compensate
        c = '<div className="space-y-6">\n' * abs(balance) + c
        
    return c

def fix_admin_perfectly():
    with open('src/components/AdminPanel.tsx', 'r') as f:
        content = f.read()

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
    
    # parts[0] is marketing
    # parts[1], parts[2] are name, content
    
    new_ternary = '{adminTab === "marketing" ? (\n'
    new_ternary += '  <div className="space-y-6">\n'
    new_ternary += fix_branch_balance(parts[0])
    new_ternary += '\n  </div>\n'
    
    for i in range(1, len(parts), 2):
        name = parts[i]
        branch_content = parts[i+1]
        
        new_ternary += f') : adminTab === "{name}" ? (\n'
        new_ternary += '  <div className="space-y-6">\n'
        new_ternary += fix_branch_balance(branch_content)
        new_ternary += '\n  </div>\n'
        
    new_ternary += ') : null}'
    
    new_content = content[:start_idx] + new_ternary + content[end_idx:]
    
    with open('src/components/AdminPanel.tsx', 'w') as f:
        f.write(new_content)

fix_admin_perfectly()
