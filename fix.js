const fs = require('fs');
const p = require('path');

function walk(d) {
  fs.readdirSync(d).forEach(f => {
    const fp = p.join(d, f);
    if (fs.statSync(fp).isDirectory()) {
      walk(fp);
    } else if (fp.endsWith('.tsx') || fp.endsWith('.ts')) {
      let c = fs.readFileSync(fp, 'utf8');
      const orig = c;
      c = c.replace(/\\`/g, '`').replace(/\\\$/g, '$');
      if (c !== orig) {
        fs.writeFileSync(fp, c);
        console.log('Fixed', fp);
      }
    }
  });
}

walk('d:/sql/client/src');
walk('d:/sql/server/src');
