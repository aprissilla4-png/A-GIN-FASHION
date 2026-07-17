import re

def fix_admin_panel():
    with open('src/components/AdminPanel.tsx', 'r') as f:
        content = f.read()

    # Step 1: Strip all existing </div> tags that are right before transitions
    # We look for </div> followed by whitespace/newlines and then ) : adminTab === or ) : null}
    content = re.sub(r'(\s*</div>)+\s*\n*\s*\n*(\s*)\) : adminTab ===', r'\n\2) : adminTab ===', content)
    content = re.sub(r'(\s*</div>)+\s*\n*\s*\n*(\s*)\) : null}', r'\n\2) : null}', content)

    lines = content.splitlines(keepends=True)
    new_lines = []
    balance = 0
    in_ternary = False
    
    for i, line in enumerate(lines):
        # Check if this line is a transition
        if 'adminTab ===' in line and '?' in line and ')' in line:
            if in_ternary:
                # Close all divs opened in the previous branch
                # We want balance to be 1 (the root div)
                while balance > 1:
                    new_lines.append('        </div>\n')
                    balance -= 1
            in_ternary = True
            
        new_lines.append(line)
        balance += line.count('<div')
        balance -= line.count('</div')
        
        if ') : null}' in line:
            # End of ternary
            while balance > 1:
                new_lines.append('        </div>\n')
                balance -= 1
            in_ternary = False

    with open('src/components/AdminPanel.tsx', 'w') as f:
        f.writelines(new_lines)

fix_admin_panel()
