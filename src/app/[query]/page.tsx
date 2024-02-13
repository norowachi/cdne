import Fuse from "fuse.js";
import Image from "next/image";
import getConfig from "next/config";
import type { Metadata, ResolvingMetadata } from "next";
import { glob } from "glob";
import path from "path";
import { get } from "http";

export async function generateMetadata(
	{ params }: { params: { query: string } },
	_parent: ResolvingMetadata
): Promise<Metadata> {
	// read route params
	const query = params.query;

	const file = searchFiles(await getFiles(), query);

	return {
		title: file,
		description: null,
		openGraph: {
			images: `${window.origin}/assets/${file}`,
		},
		twitter: {
			title: file!,
			card: "summary_large_image",
			images: `${window.origin}/assets/${file}`,
		},
	};
}

export default async function FileSearch({
	params,
}: {
	params: { query: string };
}) {
	// somehow it needs this specified to work
	path.join(process.cwd(), "public", "assets");
	return (
		<p>
			<Image
				alt="image"
				src={"/assets/" + searchFiles(await getFiles(), params.query)}
				width="0"
				height="0"
				style={{ width: "auto", height: "auto" }}
			></Image>
		</p>
	);
}

async function getFiles() {
	const context = await glob(
		path.join(process.cwd(), "public", "assets") + "/*.{png,jpg,jpeg,gif,svg}"
	);
	const fileList = context.map((key) =>
		process.platform === "win32"
			? key.split("\\").pop()!
			: key.split("/").pop()!
	);

	return fileList;
}

function searchFiles(images: string[], userInput: string) {
	const fuse = new Fuse(images, {
		keys: ["item"],
		includeScore: true,
	});

	let closestMatch = null;
	// Try inline search
	const inlineMatch = findClosestMatch(images, userInput);

	if (inlineMatch) {
		closestMatch = inlineMatch;
	} else {
		// Fallback to fuzzy search
		const fuzzyMatches = fuse.search(userInput);
		if (fuzzyMatches.length > 0) {
			// Return the first fuzzy match as the closest match
			closestMatch = fuzzyMatches[0].item;
		} else {
			closestMatch = null;
		}
	}

	return closestMatch;
}

function findClosestMatch(availableImages: string[], query: string) {
	const matches = availableImages.filter((image: string) =>
		image.toLowerCase().includes(query.toLowerCase())
	);

	if (matches.length > 0) {
		// Return the first match as the closest match
		return matches[0];
	} else {
		return null;
	}
}
