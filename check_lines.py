
def check_line_by_line(file_path):
    with open(file_path, 'r') as f:
        lines = f.readlines()
    
    balance = 0
    for i, line in enumerate(lines):
        starts = line.count('<div')
        ends = line.count('</div')
        if 'adminTab ===' in line and '?' in line:
            print(f"Balance BEFORE tab start (line {i+1}): {balance}")
        balance += starts
        balance -= ends
        if 'adminTab ===' in line and '?' in line:
            print(f"Balance AFTER tab start (line {i+1}): {balance}")
    print(f"Final balance: {balance}")

check_line_by_line('src/components/AdminPanel.tsx')
