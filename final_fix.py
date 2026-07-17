import re

def final_fix():
    with open('src/components/AdminPanel.tsx', 'r') as f:
        lines = f.readlines()
    
    new_lines = []
    for line in lines:
        stripped = line.strip()
        if stripped.startswith(') : adminTab ===') or stripped == ') : null}':
            new_lines.append('        </div>\n')
            new_lines.append('      ' + stripped + '\n')
            if 'adminTab === "orders"' in stripped:
                new_lines.append('        <div className="space-y-6">\n')
        else:
            new_lines.append(line)

    with open('src/components/AdminPanel.tsx', 'w') as f:
        f.writelines(new_lines)

final_fix()
