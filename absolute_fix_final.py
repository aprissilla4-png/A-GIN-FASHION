import re

def clean_branch(c):
    # Strip ALL existing top-level wrappers and fragments
    c = c.strip()
    
    # Remove all leading/trailing debris
    c = re.sub(r'^\s*(?:<>\s*|<div[^>]*>\s*|\(\s*)+', '', c)
    c = re.sub(r'(?:\s*</div>|\s*</>|\s*\)\s*)+$', '', c)

    # Balance remaining div tags using a stack
    stack_count = 0
    tokens = re.split(r'(</?div[^>]*>)', c)
    new_tokens = []
    for token in tokens:
        if token.startswith('<div'):
            stack_count += 1
            new_tokens.append(token)
        elif token.startswith('</div'):
            if stack_count > 0:
                stack_count -= 1
                new_tokens.append(token)
            else:
                # Orphan close, skip it
                pass
        else:
            new_tokens.append(token)
    
    c = "".join(new_tokens)
    if stack_count > 0:
        c += '</div>' * stack_count
        
    return '    <>\n      <div className="space-y-6 animate-fade-in">\n        ' + c + '\n      </div>\n    </>'

def absolute_fix_final():
    with open('src/components/AdminPanel.tsx', 'r') as f:
        content = f.read()

    # Find the entire ternary block from first check to last null
    start_pattern = r'\{adminTab === "marketing" \? \('
    end_pattern = r'\n  \) : null\}'
    
    match_start = re.search(start_pattern, content)
    
    all_ends = list(re.finditer(end_pattern, content))
    if not all_ends or not match_start:
        print("Ternary block markers not found")
        return
    match_end = all_ends[-1]

    before = content[:match_start.start()]
    ternary = content[match_start.start():match_end.end()]
    after = content[match_end.end():]
    
    # Split ternary into transitions and branches
    # Each transition looks like: ) : adminTab === "..." ? (
    parts = re.split(r'(\n  \) : adminTab === "[\w-]+" \? \()', ternary)
    
    new_ternary = '{adminTab === "marketing" ? (\n'
    first_content = parts[0].replace('{adminTab === "marketing" ? (', '')
    new_ternary += clean_branch(first_content)
    
    for i in range(1, len(parts), 2):
        transition = parts[i]
        branch_content = parts[i+1]
        if i+2 >= len(parts):
            branch_content = branch_content.replace('\n  ) : null}', '')
            
        new_ternary += transition + '\n' + clean_branch(branch_content)
        
    new_ternary += '\n  ) : null}'
    
    with open('src/components/AdminPanel.tsx', 'w') as f:
        f.write(before + new_ternary + after)

if __name__ == "__main__":
    absolute_fix_final()
