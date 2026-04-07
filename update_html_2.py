import glob

html_files = glob.glob('public/**/*.html', recursive=True)

for file_path in html_files:
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()

    # Add spinning phosphor icon to Loading text
    content = content.replace('Loading...</p>', '<i class="ph ph-spinner ph-spin"></i> Loading...</p>')
    
    # Avoid replacing nested tables twice if run multiple times, but this is simple enough
    content = content.replace('<table>', '<table class="styled-table">')

    # Convert attendance alerts to badges/fancy alerts
    content = content.replace('alert alert-warning', 'alert alert-warning badge-warning')

    with open(file_path, 'w', encoding='utf-8') as f:
        f.write(content)

print("UI Enhancements Applied")
