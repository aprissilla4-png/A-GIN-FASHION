
import re

def fix_admin_panel(file_path):
    with open(file_path, 'r') as f:
        content = f.read()
    
    # Find the main expression starting at line 1644 (approx)
    # The expression is like {adminTab === "marketing" ? ( ... ) : adminTab === "dashboard" ? ( ... ) : ... : null}
    
    # Split by ") : adminTab ==="
    parts = re.split(r'\) : adminTab ===', content)
    
    new_parts = []
    
    for i, part in enumerate(parts):
        if i == 0:
            # First part has the start {adminTab === "marketing" ? (
            new_parts.append(part)
            continue
            
        # Each part (except first and last) starts with " "name" ? ( " and ends before the next transition
        # We need to count divs in the PREVIOUS part (excluding the transition start)
        # Actually, let's just count the balance in the whole accumulated content so far
        
        current_content = ") : adminTab ===".join(new_parts)
        
        balance = current_content.count('<div') - current_content.count('</div')
        
        # We want balance to be 1 (the outer div)
        if balance > 1:
            missing = balance - 1
            # Add missing divs to the end of the previous part
            new_parts[-1] = new_parts[-1] + '\n' + '        </div>' * missing
            
        new_parts.append(part)
        
    # Handle the last part which ends with ") : null}"
    last_parts = re.split(r'\) : null\}', new_parts[-1])
    if len(last_parts) == 2:
        current_content = ") : adminTab ===".join(new_parts[:-1]) + ") : adminTab ===" + last_parts[0]
        balance = current_content.count('<div') - current_content.count('</div')
        if balance > 1:
            missing = balance - 1
            new_parts[-1] = last_parts[0] + '\n' + '        </div>' * missing + '\n) : null}' + last_parts[1]
    
    with open(file_path, 'w') as f:
        f.write(") : adminTab ===".join(new_parts))

fix_admin_panel('src/components/AdminPanel.tsx')
