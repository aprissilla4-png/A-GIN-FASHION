import re

def absolute_fix():
    with open('src/components/AdminPanel.tsx', 'r') as f:
        content = f.read()

    # Find the start and end of the ternary
    match_start = re.search(r'\{adminTab === "marketing" \? \(', content)
    match_end = re.search(r'\) : null\}', content)
    
    if not match_start or not match_end:
        print("Could not find ternary block")
        return

    prefix = content[:match_start.start()]
    suffix = content[match_end.end():]
    ternary = content[match_start.start():match_end.end()]
    
    # Split the ternary into branches
    # Each branch starts with adminTab === "..." ? (
    # and ends before the next ) : adminTab ===
    
    branches = []
    # Use a regex that matches the transition but keeps the name
    pattern = r'\) : adminTab === "([\w-]+)" \? \('
    
    parts = re.split(pattern, ternary)
    # parts[0] is "{adminTab === 'marketing' ? (" + marketing_content
    # parts[1] is "dashboard"
    # parts[2] is dashboard_content
    # ...
    
    def clean_and_balance(c, is_first=False):
        if is_first:
            c = re.sub(r'^\{adminTab === "marketing" \? \(', '', c)
        
        c = c.strip()
        # Remove all existing top-level wrappers and trailing closing divs
        # but keep the core content.
        # This is a bit hard, so let's just count balance and fix it.
        
        # Remove ALL leading <div and trailing </div first to reset
        while c.startswith('<div'):
            tag_end = c.find('>')
            if tag_end != -1:
                c = c[tag_end+1:].strip()
            else:
                break
        while c.endswith('</div>'):
            c = c[:-6].strip()
            
        # Now we have the core content. It might still be unbalanced if there were nested divs.
        starts = c.count('<div')
        ends = c.count('</div')
        balance = starts - ends
        
        if balance > 0:
            c = c + '\n' + '        </div>' * balance
        elif balance < 0:
            c = '      <div className="space-y-6">\n' * abs(balance) + c
            
        return c

    new_ternary = '{adminTab === "marketing" ? (\n'
    new_ternary += '    <div className="space-y-6">\n'
    new_ternary += clean_and_balance(parts[0], True)
    new_ternary += '\n    </div>\n'
    
    for i in range(1, len(parts), 2):
        name = parts[i]
        content_branch = parts[i+1]
        new_ternary += f'  ) : adminTab === "{name}" ? (\n'
        new_ternary += '    <div className="space-y-6">\n'
        new_ternary += clean_and_balance(content_branch)
        new_ternary += '\n    </div>\n'
        
    new_ternary += '  ) : null}'
    
    with open('src/components/AdminPanel.tsx', 'w') as f:
        f.write(prefix + new_ternary + suffix)

absolute_fix()
