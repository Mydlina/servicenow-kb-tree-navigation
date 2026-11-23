(function() {
	/*
	 * Widget: KB Tree Navigation
	 * Builds the category > sub-category > article tree of one knowledge base
	 * and highlights the article currently displayed on the page.
	 *
	 * URL parameters: kb_id, sys_kb_id or sysparm_article (article number).
	 * Options:        kb_id (fallback), article_page, home_page.
	 *
	 * Security: articles are read with GlideRecordSecure, so read ACLs and the
	 * knowledge user criteria (Can Read / Cannot Read) decide what is listed.
	 * Categories are read with GlideRecord: empty categories are dropped below,
	 * so a user never sees a category that holds no article they can read.
	 */
	data.kbId = $sp.getParameter('kb_id') || options.kb_id || '';
	data.pageId = options.article_page || 'kb_tree_article';
	data.homePage = options.home_page || 'kb_tree_home';
	data.currentId = '';
	data.tree = [];
	data.rootArticles = [];

	var sysKbId = $sp.getParameter('sys_kb_id') || '';
	var number = $sp.getParameter('sysparm_article') || '';

	// 1. Current article (to highlight it and open its branch)
	if (sysKbId || number) {
		var cur = new GlideRecordSecure('kb_knowledge');
		if (sysKbId) {
			cur.addQuery('sys_id', sysKbId);
		} else {
			cur.addQuery('number', number);
			cur.addQuery('workflow_state', 'published');
			cur.addQuery('latest', true);
			if (data.kbId)
				cur.addQuery('kb_knowledge_base', data.kbId); // article numbers can repeat across bases
		}
		cur.setLimit(1);
		cur.query();
		if (cur.next()) {
			data.currentId = cur.getUniqueValue();
			data.currentArticleId = cur.getValue('article_id');
			if (!data.kbId)
				data.kbId = cur.getValue('kb_knowledge_base');
		}
	}
	if (!data.kbId)
		return;

	var kb = new GlideRecord('kb_knowledge_base');
	if (kb.get(data.kbId))
		data.kbTitle = kb.getDisplayValue('title');

	// 2. Categories of the knowledge base: breadth-first walk, one query per level
	var nodes = {};
	var rootNodes = [];
	var parents = [data.kbId];
	var depth = 0;
	while (parents.length && depth < 8) {
		var cat = new GlideRecord('kb_category');
		cat.addQuery('parent_id', 'IN', parents.join(','));
		cat.addActiveQuery();
		cat.orderBy('label');
		cat.query();
		var next = [];
		while (cat.next()) {
			var id = cat.getUniqueValue();
			var node = { id: id, label: cat.getDisplayValue('label'), children: [], articles: [] };
			nodes[id] = node;
			var parentId = cat.getValue('parent_id');
			if (nodes[parentId])
				nodes[parentId].children.push(node);
			else
				rootNodes.push(node);
			next.push(id);
		}
		parents = next;
		depth++;
	}

	// 3. Published articles the user can read, in one query
	var art = new GlideRecordSecure('kb_knowledge');
	art.addQuery('kb_knowledge_base', data.kbId);
	art.addQuery('workflow_state', 'published');
	art.addQuery('latest', true);
	art.addQuery('active', true);
	art.orderBy('number');
	art.setLimit(1000);
	art.query();
	while (art.next()) {
		var a = {
			id: art.getUniqueValue(),
			label: art.getValue('short_description'),
			current: art.getUniqueValue() == data.currentId ||
				(!!data.currentArticleId && art.getValue('article_id') == data.currentArticleId)
		};
		var catId = art.getValue('kb_category');
		if (catId && nodes[catId])
			nodes[catId].articles.push(a);
		else
			data.rootArticles.push(a);
	}

	// 4. Open the branch of the current article and drop empty categories
	function finalize(node) {
		var open = false;
		var count = node.articles.length;
		for (var i = 0; i < node.articles.length; i++)
			if (node.articles[i].current) open = true;
		var kept = [];
		for (var j = 0; j < node.children.length; j++) {
			var child = node.children[j];
			finalize(child);
			if (child.count > 0) {
				kept.push(child);
				count += child.count;
				if (child.open) open = true;
			}
		}
		node.children = kept;
		node.count = count;
		node.open = open;
	}
	for (var k = 0; k < rootNodes.length; k++) {
		finalize(rootNodes[k]);
		if (rootNodes[k].count > 0)
			data.tree.push(rootNodes[k]);
	}
})();
