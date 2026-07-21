import { writeFileSync } from 'node:fs';
import { env } from 'node:process';
import { format } from 'oxfmt';

export const jsonToCodeblock = (json: unknown) =>
	'```json\n' + JSON.stringify(json, null, '\t') + '\n```';

export const createIssue = async (title: string, content: string | string[], path: string) => {
	const { code: body } = await format(
		'issue.md',
		typeof content === 'string' ? content : content.join('\n\n'),
	);

	if (env['GITHUB_ACTIONS'] !== 'true') {
		writeFileSync(path, `# ${title}\n\n${body}`);
		return;
	}

	const response = await fetch(`https://api.github.com/repos/${env['GITHUB_REPOSITORY']}/issues`, {
		method: 'POST',
		headers: {
			'Authorization': `Bearer ${env['GITHUB_TOKEN']}`,
			'Accept': 'application/vnd.github+json',
			'Content-Type': 'application/json',
		},
		body: JSON.stringify({ title, body }),
	});

	if (!response.ok) {
		console.error(await response.text());
		throw new Error(`${response.status} ${response.statusText}`);
	}
};
