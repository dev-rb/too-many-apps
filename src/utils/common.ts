export function cx(...args: any[]) {
	const className = args
		.flat()
		.filter(Boolean)
		.join(' ')
		.trim()
		.replaceAll(/\s+/g, ' ');
	if (!className) {
		return;
	}
	return className;
}
