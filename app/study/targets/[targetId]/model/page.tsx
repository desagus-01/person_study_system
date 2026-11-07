import Link from "next/link";
import { LearnerModelWorkspace } from "@/components/learner-model-workspace";

export const dynamic = "force-dynamic";

export default async function LearnerModelPage({ params }: { params: Promise<{ targetId: string }> }) {
	const { targetId } = await params;
	return (
		<div className="flex h-dvh min-h-0 flex-col">
			<header className="flex h-13 shrink-0 items-center justify-between border-b bg-card px-4">
				<div>
					<p className="font-title text-base text-foreground">Learner map</p>
					<p className="text-[11px] text-muted-foreground">Target {targetId}</p>
				</div>
				<Link href="/" className="rounded-lg px-3 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-accent hover:text-foreground">Back home</Link>
			</header>
			<main className="min-h-0 flex-1">
				<LearnerModelWorkspace targetId={targetId} />
			</main>
		</div>
	);
}
