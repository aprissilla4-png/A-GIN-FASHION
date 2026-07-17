import re

def re_balance(c):
    # Strip any number of </div> tags from the VERY end
    c = c.strip()
    while c.endswith('</div>'):
        c = c[:-6].strip()
        
    # Now count properly
    s = c.count('<div')
    e = c.count('</div')
    diff = s - e
    
    if diff > 0:
        # Need more closes
        c += '\n' + '    </div>' * diff
    elif diff < 0:
        # Need more opens
        c = '    <div>' * abs(diff) + c
    return c

def final_fix_all():
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
    
    # Marketing tab
    marketing = parts[0]
    marketing = re.sub(r'^\{adminTab === "marketing" \? \(\s*<>\s*', '', marketing)
    marketing = re.sub(r'\s*</>\s*$', '', marketing)
    new_ternary = '{adminTab === "marketing" ? (\n    <>\n' + re_balance(marketing) + '\n    </>\n'
    
    for i in range(1, len(parts), 2):
        name = parts[i]
        c = parts[i+1]
        c = re.sub(r'^<>\s*', '', c)
        c = re.sub(r'\s*</>\s*$', '', c)
        new_ternary += f'  ) : adminTab === "{name}" ? (\n    <>\n' + re_balance(c) + '\n    </>\n'
        
    new_ternary += '  ) : null}'
    
    with open('src/components/AdminPanel.tsx', 'w') as f:
        f.write(prefix + new_ternary + suffix)

final_fix_all()
