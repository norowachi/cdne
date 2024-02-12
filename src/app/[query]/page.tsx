import Fuse from "fuse.js";
import Image from "next/image";
import type { Metadata, ResolvingMetadata } from "next";
import { glob } from "glob";

export async function generateMetadata(
	{ params }: { params: { query: string } },
	_parent: ResolvingMetadata
): Promise<Metadata> {
	// read route params
	const query = params.query;

	const fileList = await getFiles();
	const file = searchFiles(fileList, query);
	return {
		title: file,
		openGraph: {
			images: `/assets/${file}`,
		},
		twitter: {
			title: file!,
			card: "summary_large_image",
			images: `/assets/${file}`,
		},
	};
}

export default async function FileSearch({
	params,
}: {
	params: { query: string };
}) {
	return (
		<Image
			alt="image"
			src={"/assets/" + searchFiles(await getFiles(), params.query)}
			width="0"
			height="0"
			style={{ width: "auto", height: "auto" }}
		></Image>
	);
}

async function getFiles() {
	const context = await glob("./././public/assets/*.{png,jpg,jpeg,gif,svg}");
	const fileList = context.map((key) =>
		key.replace(/public\/assets\/|public\\assets\\/, "")
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
