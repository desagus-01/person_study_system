import { learnerModelHttp } from "@/src/server";

export const dynamic = "force-dynamic";

type Context = { params: Promise<{ targetId: string }> };

async function jsonBody(request: Request): Promise<{ ok: true; value: unknown } | { ok: false; response: Response }> {
	try {
		return { ok: true, value: await request.json() };
	} catch {
		return { ok: false, response: Response.json({ error: "Invalid JSON body." }, { status: 400 }) };
	}
}

export async function GET(_request: Request, { params }: Context) {
	const { targetId } = await params;
	return learnerModelHttp.read(targetId);
}

/** Apply one validated semantic create/revise action. */
export async function PATCH(request: Request, { params }: Context) {
	const body = await jsonBody(request);
	if (!body.ok) return body.response;
	const { targetId } = await params;
	return learnerModelHttp.change(targetId, body.value);
}

/** Replace the target's presentation-only concept positions. */
export async function PUT(request: Request, { params }: Context) {
	const body = await jsonBody(request);
	if (!body.ok) return body.response;
	const { targetId } = await params;
	return learnerModelHttp.changeLayout(targetId, body.value);
}
