
import os
import re

def process_file(filepath):
    with open(filepath, 'r') as f:
        content = f.read()

    original_content = content
    
    # Replace rounded-[37.02px] with rounded-[40px] 
    content = content.replace('rounded-[37.02px]', 'rounded-[40px] ')
    
    # Replace rounded-[2.5rem] with rounded-[40px] 
    content = content.replace('rounded-[2.5rem]', 'rounded-[40px] ')
    
    # Regex for rounded-[...rem]
    # We want to replace anything around 2.5rem to 3.5rem with rounded-[40px] 
    def replace_rem(match):
        val = float(match.group(1))
        if 2.0 <= val <= 4.0:
            return "rounded-[40px] "
        return match.group(0)

    content = re.sub(r'rounded-\[([0-9.]+)rem\]', replace_rem, content)
    
    if content != original_content:
        with open(filepath, 'w') as f:
            f.write(content)
        print(f"Updated {filepath}")

root_dir = '/Users/naveentehrpariya/Office/SPENNYPIGGY/spennypiggy.co/resources/js/Pages'

for subdir, dirs, files in os.walk(root_dir):
    for file in files:
        if file.endswith('.jsx') or file.endswith('.js'):
            filepath = os.path.join(subdir, file)
            process_file(filepath)
