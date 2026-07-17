import re

def clean_mess():
    with open('src/components/AdminPanel.tsx', 'r') as f:
        content = f.read()

    # Step 1: Clean the transitions
    # Match any number of </div> tags (possibly on multiple lines) followed by the transition
    # The regex \s*</div> is one </div> with any preceding whitespace.
    # (\s*</div>)+ matches one or more of these.
    # We replace them with exactly one </div>
    
    pattern1 = r'(\s*</div>)+\s*\n*\s*\n*(\s*)\) : adminTab ==='
    content = re.sub(pattern1, r'\n        </div>\n      ) : adminTab ===', content)
    
    pattern2 = r'(\s*</div>)+\s*\n*\s*\n*(\s*)\) : null\}'
    content = re.sub(pattern2, r'\n        </div>\n      ) : null}', content)

    # Step 2: Clean the branch starts
    # Some branches have double <div className="space-y-6">
    pattern3 = r'(\s*<div className="space-y-6">)\s*\n*\s*\n*(\s*)<div className="space-y-6">'
    content = re.sub(pattern3, r'\n      <div className="space-y-6">', content)

    with open('src/components/AdminPanel.tsx', 'w') as f:
        f.write(content)

clean_mess()
