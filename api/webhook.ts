import { VercelRequest, VercelResponse } from '@vercel/node'
import dispatch from '../src/dispatcher.js';
import { NotionEvent, NotionEventSchema } from '../src/types/notion.js';

export default async (req: VercelRequest, res: VercelResponse) => {
  try {
    const startTime = Date.now();

    console.log({
      time: new Date().toISOString(),
      url: req.url,
      method: req.method,
      body: req.body,
    })

    if (NotionEventSchema.safeParse(req.body).success) {
      await dispatch(req.body as NotionEvent)
    }

    const endTime = Date.now();
    console.log("Time taken: ", endTime - startTime, "ms")

    const name = req.query.name ?? 'World';
    res.status(200).json({ msg: `Hello ${name}!` });
  } catch (e) {
    console.error(e);
    const message = e instanceof Error ? e.message : String(e);
    res.status(500).json({ msg: message });
  }
}