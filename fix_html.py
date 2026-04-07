import glob
import re

admin_files = glob.glob('public/admin/*.html')
hod_files = glob.glob('public/hod/*.html')

# Admin cleanup
for f in admin_files:
    with open(f, 'r', encoding='utf-8') as file:
        content = file.read()
    
    # Remove assignments link
    if '<a href="assignments.html"' in content:
        content = re.sub(r'<a href="assignments\.html"[^>]*>Assignments</a>\n*\s*', '', content)
    
    # Remove checkRole script we added earlier
    script_pattern = r'<script>\s*\(async function checkRole\(\)[\s\S]*?\)\(\);\s*</script>'
    content = re.sub(script_pattern, '', content)
    
    with open(f, 'w', encoding='utf-8') as file:
        file.write(content)

# HOD specific changes
for f in hod_files:
    with open(f, 'r', encoding='utf-8') as file:
        content = file.read()
    
    # Update portal text
    content = content.replace('Admin Portal', 'HOD Portal')
    content = content.replace('Admin Dashboard', 'HOD Dashboard')
    content = content.replace('Admin', 'HOD')
    
    # Update API calls (e.g api('admin/dashboard') -> api('hod/dashboard'))
    content = content.replace("api('admin/", "api('hod/")
    content = content.replace('api("admin/', 'api("hod/')
    
    # Clean up any checkRole scripts inherited from Admin dir
    script_pattern = r'<script>\s*\(async function checkRole\(\)[\s\S]*?\)\(\);\s*</script>'
    content = re.sub(script_pattern, '', content)

    with open(f, 'w', encoding='utf-8') as file:
        file.write(content)

print("HTML cleanup complete!")
