#!/usr/bin/env python3
"""Regenerates scripts/install.js from the widget sources in widgets/.
Run from the repository root:  python3 tools/build_install.py"""
import json, pathlib

ROOT = pathlib.Path(__file__).resolve().parent.parent

def widget(folder, name, wid, desc):
    d = ROOT / 'widgets' / folder
    return {
        'name': name, 'id': wid, 'description': desc,
        'script': (d / 'server_script.js').read_text(),
        'client_script': (d / 'client_controller.js').read_text(),
        'template': (d / 'template.html').read_text(),
        'css': (d / 'style.scss').read_text(),
        'option_schema': json.dumps(json.loads((d / 'option_schema.json').read_text())),
    }

tree = widget('kb-tree-navigation', 'KB Tree Navigation', 'kb-tree-navigation',
              'Documentation-style tree navigation (categories and articles) for one knowledge base.')
sel = widget('kb-selector', 'KB Selector', 'kb-selector',
             'Lists the knowledge bases the user can read and opens them in the tree navigation page.')
node = (ROOT / 'widgets/kb-tree-navigation/ng-templates/kbtree-node.html').read_text()

template = (ROOT / 'tools/install.template.js').read_text()
out = (template
       .replace('/*@TREE_WIDGET@*/null', json.dumps(tree, indent=1))
       .replace('/*@SELECTOR_WIDGET@*/null', json.dumps(sel, indent=1))
       .replace('/*@TREE_NODE_TEMPLATE@*/null', json.dumps(node)))
(ROOT / 'scripts/install.js').write_text(out)
print('scripts/install.js written')
