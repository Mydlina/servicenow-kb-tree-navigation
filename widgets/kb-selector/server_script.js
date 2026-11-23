(function() {
	/*
	 * Widget: KB Selector
	 * Lists the active knowledge bases that hold at least one published article
	 * the current user can read. Each card opens the base in the tree page,
	 * on its first article (lowest number).
	 *
	 * Security: the check uses GlideRecordSecure on kb_knowledge, so knowledge
	 * user criteria apply. A base with no readable article is not listed.
	 * Performance: one setLimit(1) query per base. Fine for a few dozen bases;
	 * add caching beyond that.
	 */
	data.pageId = options.article_page || 'kb_tree_article';
	data.kbs = [];

	var kb = new GlideRecord('kb_knowledge_base');
	kb.addActiveQuery();
	kb.orderBy('title');
	kb.setLimit(100);
	kb.query();
	while (kb.next()) {
		var art = new GlideRecordSecure('kb_knowledge');
		art.addQuery('kb_knowledge_base', kb.getUniqueValue());
		art.addQuery('workflow_state', 'published');
		art.addQuery('latest', true);
		art.addQuery('active', true);
		art.orderBy('number');
		art.setLimit(1);
		art.query();
		if (!art.next())
			continue;
		data.kbs.push({
			id: kb.getUniqueValue(),
			title: kb.getDisplayValue('title'),
			description: kb.getValue('description') || '',
			firstArticle: art.getUniqueValue()
		});
	}
})();
