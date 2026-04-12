const fs = require('fs');
const html = fs.readFileSync('diag-dom.html', 'utf8');

// Find dialog and its inner text
const idx = html.indexOf('role="dialog"');
if (idx !== -1) {
    const substr = html.substring(Math.max(0, idx - 100), idx + 20000);
    // strip tags to see text
    const text = substr.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
    console.log("Dialog text roughly:", text.substring(0, 1000));
} else {
    console.log("No dialog found");
}
