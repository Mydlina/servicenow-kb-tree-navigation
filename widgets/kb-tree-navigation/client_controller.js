api.controller = function() {
	/* KB Tree Navigation - client controller.
	   When no article branch is open, expand the first level. */
	var c = this;
	var anyOpen = false;
	angular.forEach(c.data.tree, function(n) { if (n.open) anyOpen = true; });
	if (!anyOpen)
		angular.forEach(c.data.tree, function(n) { n.open = true; });
};
