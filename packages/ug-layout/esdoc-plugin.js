const fs = require('fs');

const handlers = {
  file: handleFileTag
};

exports.onHandleTag = function(event) {
  for (const tag of event.data.tag) {
    if (handlers.hasOwnProperty(tag.kind)) {
      handlers[tag.kind](tag);
    }
  }
}

function handleFileTag(tag) {
  const path = tag.name.replace('docs/', 'src/').replace(/\.js$/, '.ts');
  const contents = fs.readFileSync(path, 'utf8');

  // Add TypeScript source instead of compiled source. Line numbers will be off but it's a small trade off.
  tag.content = contents;
}