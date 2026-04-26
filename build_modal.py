# Step 1: read file
with open("mokha-suite PRO Vqr.html","r",encoding="utf-8") as fh:
    c = fh.read()

anchor = "{/* Feature 1 \u2014 Cinematic Theme Picker (floating) */}"
print("anchor found:", anchor in c)
