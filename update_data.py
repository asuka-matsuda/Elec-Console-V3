import re
import os

def process_cable(path):
    with open(path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    content = re.sub(r'size:\s*"([0-9.]+)"', r'size: \1', content)
    content = re.sub(r'ampacity:\s*"([0-9.]+)"', r'ampacity: \1', content)
    content = re.sub(r'weight:\s*"([0-9.]+)"', r'weight: \1', content)
    content = re.sub(r'voltage:\s*"([0-9.]+)V"', r'voltage: \1', content)
    content = re.sub(r'baseTemp:\s*"([0-9.]+)℃"', r'baseTemp: \1', content)
    content = re.sub(r'maxTemp:\s*"([0-9.]+)℃"', r'maxTemp: \1', content)
    content = re.sub(r'resistance:\s*"([0-9.]+)"', r'resistance: \1', content)
    
    with open(path, 'w', encoding='utf-8') as f:
        f.write(content)

def process_drum(path):
    with open(path, 'r', encoding='utf-8') as f:
        content = f.read()
        
    keys = ['flange_diameter', 'barrel_diameter', 'outer_width', 'inner_width', 'shaft_hole', 'weight', 'max_winding_weight']
    for key in keys:
        content = re.sub(fr'{key}:\s*"([0-9.]+)"', fr'{key}: \1', content)
        
    with open(path, 'w', encoding='utf-8') as f:
        f.write(content)

def process_conduit(path):
    with open(path, 'r', encoding='utf-8') as f:
        content = f.read()
        
    keys = ['innerDiameter', 'outerDiameter', 'area', 'area32', 'area48']
    for key in keys:
        content = re.sub(fr'{key}:\s*"([0-9.]+)"', fr'{key}: \1', content)
        
    with open(path, 'w', encoding='utf-8') as f:
        f.write(content)

base_dir = r"c:\Users\松田飛鳥\OneDrive - Mat.Operate\デスクトップ\elec-console-v2\app\utils\data"
process_cable(os.path.join(base_dir, 'cableData.ts'))
process_drum(os.path.join(base_dir, 'drumData.ts'))
process_conduit(os.path.join(base_dir, 'conduitData.ts'))
print("Done")
