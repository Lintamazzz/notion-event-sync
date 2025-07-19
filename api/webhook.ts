import { VercelRequest, VercelResponse } from '@vercel/node'
import dispatch from '../src/dispatcher.js';
import { NotionEvent, NotionEventSchema } from '../src/types/notion.js';

export default (req: VercelRequest, res: VercelResponse) => {
  try {
    console.log({
      time: new Date().toISOString(),
      url: req.url,
      method: req.method,
      body: req.body,
    })

    if (NotionEventSchema.safeParse(req.body).success) {
      dispatch(req.body as NotionEvent)
    }

    const name = req.query.name ?? 'World';
    res.status(200).json({ msg: `Hello ${name}!` });

  } catch (e) {
    console.error(e);
    const message = e instanceof Error ? e.message : String(e);
    res.status(500).json({ msg: message });
  }
}