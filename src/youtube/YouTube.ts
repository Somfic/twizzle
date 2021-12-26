import { youtube } from 'scrape-youtube';
import consola from 'consola';
import { Video } from 'scrape-youtube/lib/interface';

class YouTubeSearcher {
	async query(query: string): Promise<Video[]> {
		// try {
		// 	const params = new URLSearchParams();
		// 	params.append('part', 'snippet');
		// 	params.append('q', query);
		// 	params.append('type', 'video');
		// 	params.append('maxResults', '5');
		// 	params.append('key', process.env.YOUTUBE_TOKEN);
		// 	params.append('topicId', '/m/04rlf');

		// 	const response = await axios.get(
		// 		'https://www.googleapis.com/youtube/v3/search',
		// 		{
		// 			params,
		// 		}
		// 	);

		// 	let results: YouTubeSearchResult[] = [];

		// 	for (let index = 0; index < response.data.items.length; index++) {
		// 		const item = response.data.items[index];

		// 		let result = new YouTubeSearchResult();

		// 		result.id = item.id.videoId;
		// 		result.channelId = item.snippet.channelId;
		// 		result.title = item.snippet.title;
		// 		result.description = item.snippet.description;
		// 		result.url = `https://www.youtube.com/watch?v=${item.id.videoId}`;
		// 		result.thumbnailUrl = item.snippet.thumbnails['high'].url;
		// 		result.channelTitle = item.snippet.channelTitle;

		// 		results.push(result);
		// 	}

		// 	return results;
		// } catch (error) {
		// 	consola.error(error.message);
		// 	return [];
		// }

        consola.debug(`Scraping YouTube for ${query}`);

        return (await youtube.search(query)).videos;
	}
}

export { YouTubeSearcher };

export class YouTubeSearchResult {
	id: string;
	channelId: string;
	title: string;
	description: string;
	url: string;
	thumbnailUrl: string;
	channelTitle: string;
}
