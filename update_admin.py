import glob

html_files = glob.glob('public/admin/*.html')

script_to_inject = """
    <script>
        (async function checkRole() {
            try {
                const res = await api('auth/me');
                if (res.user.role !== 'hod') {
                    const assignLink = document.querySelector('a[href="assignments.html"]');
                    if (assignLink) assignLink.style.display = 'none';
                    if (window.location.pathname.endsWith('assignments.html')) {
                        window.location.href = 'dashboard.html';
                    }
                }
            } catch(e) {}
        })();
    </script>
"""

for file_path in html_files:
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()

    if 'checkRole()' not in content:
        content = content.replace('<script src="../js/api.js"></script>', '<script src="../js/api.js"></script>' + script_to_inject)

    with open(file_path, 'w', encoding='utf-8') as f:
        f.write(content)

print("Admin pages updated for HOD role check!")
