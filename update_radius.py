
import os
import re

def process_file(filepath):
    with open(filepath, 'r') as f:
        content = f.read()

    # Regex to find rounded-[...px]
    # We want to replace it with rounded-[30px] md:rounded-[40px]  (which is 40px in config)
    # But we need to be careful not to break things.
    
    def replace_rounded(match):
        val_str = match.group(1)
        try:
            val = int(val_str)
            # If value is 0, keep it or rounded-none
            if val == 0:
                return "rounded-none"
            # If value is very small (e.g. < 5), maybe keep it?
            if val < 5:
                return match.group(0) # Keep as is
            
            # For everything else, user wants approx 40px consistency.
            return "rounded-[30px] md:rounded-[40px] "
        except ValueError:
            return match.group(0)

    new_content = re.sub(r'rounded-\[(\d+)px\]', replace_rounded, content)
    
    # Also replace rounded-[30px] md:rounded-[40px] , rounded-3xl with rounded-[30px] md:rounded-[40px]  to standardise usage?
    # Or just leave them since they map to the same 40px in config now.
    # Leaving them is safer to minimize diff, but standardising is cleaner.
    # User asked for "consistant" design, code consistency is a plus.
    # But let's stick to the visual request first. Config handles the visual.
    # So I only need to handle hardcoded values that ignore config.
    
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
