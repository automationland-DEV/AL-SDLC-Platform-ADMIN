const fs = require('fs');
const path = require('path');

const pages = [
  'users/UserNewPage.tsx',
  'users/UserEditPage.tsx',
  'users/UserImportPage.tsx',
  'users/UserDetailPage.tsx',
  'workspaces/WorkspaceNewPage.tsx',
  'workspaces/WorkspaceEditPage.tsx',
  'workspaces/WorkspaceDetailPage.tsx',
  'documents/DocNewPage.tsx',
  'documents/DocUploadPage.tsx',
  'documents/DocEditPage.tsx',
  'documents/DocDetailPage.tsx',
  'channels/ChannelDetailPage.tsx'
];

const basePath = path.join(process.cwd(), 'src', 'pages', 'admin');

pages.forEach(file => {
  const fullPath = path.join(basePath, file);
  if (!fs.existsSync(fullPath)) return;
  
  let content = fs.readFileSync(fullPath, 'utf8');
  let originalContent = content;

  // 1. Change max-w-2xl or max-w-3xl or max-w-lg to max-w-4xl
  content = content.replace(/className="max-w-(2xl|3xl|lg|xl)/g, 'className="max-w-4xl');
  content = content.replace(/className='max-w-(2xl|3xl|lg|xl)/g, 'className=\'max-w-4xl');

  // 2. Add actions prop to PageHeader
  if (content.includes('<PageHeader') && !content.includes('actions={')) {
    const actionBlock = `actions={
          <Button variant="secondary" onClick={() => navigate(-1)} className="px-4">
            {language === 'vi' ? 'Quay lại' : 'Go Back'}
          </Button>
        }`;
        
    // Insert before />
    content = content.replace(/(<PageHeader[^>]+?)(>|\/>)/, (match, p1, p2) => {
      if (p1.endsWith('/>')) {
        return p1.slice(0, -2) + '\n        ' + actionBlock + '\n      />';
      }
      return p1 + '\n        ' + actionBlock + '\n      ' + p2;
    });
  }

  if (content !== originalContent) {
    fs.writeFileSync(fullPath, content);
    console.log('Updated ' + file);
  }
});
