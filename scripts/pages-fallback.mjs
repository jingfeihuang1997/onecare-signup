// GitHub Pages has no rewrite rules. It serves 404.html for any path it does not know,
// so a copy of index.html there lets deep links such as /a/signup/vaccines load the app.
import { copyFileSync } from 'node:fs';

copyFileSync('dist/index.html', 'dist/404.html');
console.log('dist/404.html written');
