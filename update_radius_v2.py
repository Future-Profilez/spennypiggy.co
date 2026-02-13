
import os
import re

def process_file(filepath):
    with open(filepath, 'r') as f:
        content = f.read()

    # Regex to find rounded-[...px] or rounded-t-[...px] etc
    # We want to replace it with rounded-[30px] md:rounded-[40px]  (or rounded-t-xl)
    
    def replace_rounded(match):
        direction = match.group(1) or "" # e.g. "-t", "-bl", or empty
        val_str = match.group(2)
        try:
            val = int(val_str)
            if val == 0:
                return f"rounded{direction}-none"
            if val < 5:
                return match.group(0)
            
            # Use rounded-[30px] md:rounded-[40px]  (which is 40px)
            return f"rounded{direction}-xl"
        except ValueError:
            return match.group(0)

    # Regex explanation:
    # rounded           Match literal "rounded"
    # (-[a-z]{1,2})?    Match optional direction group (e.g. -t, -bl) captured in group 1
    # -\[(\d+)px\]      Match -[NUMBERpx] captured in group 2
    new_content = re.sub(r'rounded(-[a-z]{1,2})?-\[(\d+)px\]', replace_rounded, content)
    
    if new_content != content:
        with open(filepath, 'w') as f:
            f.write(new_content)
        print(f"Updated {filepath}")

root_dir = '/Users/naveentehrpariya/Office/SPENNYPIGGY/spennypiggy.co/resources/js'

for subdir, dirs, files in os.walk(root_dir):
    for file in files:
        if file.endswith('.jsx') or file.endswith('.js') or file.endswith('.tsx') or file.endswith('.ts'):
            filepath = os.path.join(subdir, file)
            process_file(filepath)
