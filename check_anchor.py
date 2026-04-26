with open('mokha-suite PRO Vqr.html', 'r', encoding='utf-8') as f:
    content = f.read()
anchor = '{/* Feature 1 \u2014 Cinematic Theme Picker (floating) */}'
print('anchor found:', anchor in content)
