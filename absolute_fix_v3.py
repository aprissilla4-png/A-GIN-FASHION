import re

def clean(c, is_first=False):
    if is_first:
        c = re.sub(r'^\{adminTab === "marketing" \? \(', '', c)
    c = c.strip()
    
    changed = True
    while changed:
        old_c = c
        c = c.strip()
        c = re.sub(r'^<>\s*', '', c)
        c = re.sub(r'\s*</>$', '', c)
        if c.startswith('<div'):
            tag_end = c.find('>')
            if tag_end != -1:
                tag = c[:tag_end+1]
                # Match <div or <div with space, but not <divSomething (component)
                if tag.startswith('<div ') or tag == '<div>':
                    c = c[tag_end+1:].strip()
        
        while c.endswith('</div>'):
            c = c[:-6].strip()
            
        if c == old_c:
            changed = False
            
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
    
    pattern = r'\s*\) : adminTab === "([\w-]+)" \? \(\s*'
    parts = re.split(pattern, ternary)
    
    # Log tabs found
    found_tabs = parts[1::2]
    print(f"Found tabs: {found_tabs}")
    
    new_ternary = '{adminTab === "marketing" ? (\n'
    new_ternary += '    <>\n'
    new_ternary += clean(parts[0], True)
    new_ternary += '\n    </>\n'
    
    for i in range(1, len(parts), 2):
        name = parts[i]
        content_branch = parts[i+1]
        new_ternary += f'  ) : adminTab === "{name}" ? (\n'
        new_ternary += '    <>\n'
        new_ternary += clean(content_branch)
        new_ternary += '\n    </>\n'
        
    new_ternary += '  ) : null}'
    
    with open('src/components/AdminPanel.tsx', 'w') as f:
        f.write(prefix + new_ternary + suffix)

absolute_fix_v3()
