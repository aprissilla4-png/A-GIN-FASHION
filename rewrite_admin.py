import re

def rewrite_admin_panel():
    with open('src/components/AdminPanel.tsx', 'r') as f:
        content = f.read()

    # Step 0: Fix some messed up strings first to avoid regex issues
    # Like ) : adminTab === ... ? (  appearing twice or being broken
    
    # Find the start and end of the ternary
    match_start = re.search(r'\{adminTab === "marketing" \? \(', content)
    match_end = re.search(r'\) : null\}', content)
    
    if not match_start or not match_end:
        print("Could not find ternary block")
        return

    start_idx = match_start.start()
    end_idx = match_end.end()
    
    # Ternary content
    ternary = content[start_idx:end_idx]
    
    # Split into branches
    # Branches are separated by ) : adminTab === "..." ? (
    # We use a pattern that matches the transition precisely
    pattern = r'\) : adminTab === "([\w-]+)" \? \('
    
    parts = re.split(pattern, ternary)
    
    # parts[0] is the first branch (marketing) content (including the start string)
    # parts[1] is the next tab name
    # parts[2] is the next tab content
    # ...
    
    def clean_branch(c):
        # Remove the starting {adminTab === ... ? ( if it's the first part
        c = re.sub(r'^\{adminTab === "marketing" \? \(', '', c)
        # Remove any stray </div> tags from the VERY end of the branch
        # but also remove the ) if it's there (since we split by the transition)
        c = c.strip()
        while c.endswith('</div>'):
            c = c[:-6].strip()
        return c

    new_ternary = '{adminTab === "marketing" ? (\n'
    new_ternary += '  <div className="space-y-6">\n'
    new_ternary += clean_branch(parts[0])
    new_ternary += '\n  </div>\n'
    
    for i in range(1, len(parts), 2):
        name = parts[i]
        branch_content = parts[i+1]
        
        new_ternary += f') : adminTab === "{name}" ? (\n'
        new_ternary += '  <div className="space-y-6">\n'
        new_ternary += clean_branch(branch_content)
        new_ternary += '\n  </div>\n'
        
    new_ternary += ') : null}'
    
    # Replace in original content
    new_content = content[:start_idx] + new_ternary + content[end_idx:]
    
    with open('src/components/AdminPanel.tsx', 'w') as f:
        f.write(new_content)

rewrite_admin_panel()
