import re

def final_clean():
    with open('src/components/AdminPanel.tsx', 'r') as f:
        content = f.read()

    # Step 1: Fix transitions start
    # We look for the pattern: ) : adminTab === "..." ? (
    # and we want the next meaningful line to be <div className="space-y-6 animate-fade-in">
    # We strip all the junk in between.
    
    # First, handle the very first one: {adminTab === "marketing" ? (
    content = re.sub(r'\{adminTab === "marketing" \? \(\s*(?:<div[^>]*>|<div>|<>|\s)+', 
                     r'{adminTab === "marketing" ? (\n    <div className="space-y-6 animate-fade-in">\n', content)

    # Then all other transitions
    pattern_start = r'\) : adminTab === "([\w-]+)" \? \(\s*(?:<div[^>]*>|<div>|<>|\s|//.*|\n)+'
    content = re.sub(pattern_start, r') : adminTab === "\1" ? (\n    <div className="space-y-6 animate-fade-in">\n', content)
    
    # Step 2: Fix transitions end
    # Match any mess of </div> or </> right before a transition
    pattern_end = r'(?:</div>|</>|\s)+\s*\) : adminTab ==='
    content = re.sub(pattern_end, r'\n    </div>\n  ) : adminTab ===', content)
    
    pattern_final = r'(?:</div>|</>|\s)+\s*\) : null\}'
    content = re.sub(pattern_final, r'\n    </div>\n  ) : null}', content)

    with open('src/components/AdminPanel.tsx', 'w') as f:
        f.write(content)

final_clean()
