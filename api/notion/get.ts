import { VercelRequest, VercelResponse } from "@vercel/node";
import { getPage } from "../../src/platforms/notion/client.js";
import { PageObjectResponse } from "@notionhq/client";

export default async (req: VercelRequest, res: VercelResponse) => {
	try {
		const id: string = req.query.id as string;
		const page: PageObjectResponse = await getPage(id);

		let title, date;
		for (const prop of Object.values(page.properties)) {
			if (prop.type === "title") {
				title = prop.title.length > 0 ? prop.title.map(t => t.plain_text).join("") : undefined;
			}
			if (prop.type === "date") {
				date = prop.date;
			}
		}

		res.json({
			time: new Date().toISOString(),
			pageInfo: {
				id: page.id,
				deleted: page.in_trash,
				url: page.public_url,
				title: title,
				date: date,
			},
			origin: page,
		});
	} catch (e) {
		const message = e instanceof Error ? e.message : String(e);
		res.status(500).json({ err_msg: message, error: e });
	}
};
