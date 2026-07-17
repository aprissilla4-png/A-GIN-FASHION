
import re

def check_jsx_balance(file_path):
    with open(file_path, 'r') as f:
        content = f.read()
    
    # Simple regex to find tags
    tags = re.findall(r'<([a-zA-Z0-9]+)|</([a-zA-Z0-9]+)>', content)
    
    stack = []
    line_numbers = content.split('\n')
    
    for tag in tags:
        start_tag, end_tag = tag
        if start_tag:
            # Skip self-closing tags (this is a bit naive)
            # Find the full tag to check for />
            tag_pattern = r'<' + start_tag + r'[^>]*>'
            # This is hard because of multi-line tags.
            pass
    
    # Better: just count <div and </div
    div_starts = content.count('<div')
    div_ends = content.count('</div')
    print(f"div starts: {div_starts}, div ends: {div_ends}")
    
    # Count ternary parts
    ternary_starts = content.count('? (')
    ternary_ends = content.count(') :')
    print(f"ternary starts: {ternary_starts}, ternary ends: {ternary_ends}")

check_jsx_balance('src/components/AdminPanel.tsx')
